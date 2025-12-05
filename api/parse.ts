import type { VercelRequest, VercelResponse } from "@vercel/node";
import { loadPub } from "meeting-schedules-parser/dist/node/index.js";
import { createHash } from "crypto";
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

function generateCacheKey(url: string): string {
  return createHash("md5").update(url).digest("hex");
}

const JW_CDN = "https://b.jw-cdn.org/apis/pub-media/GETPUBMEDIALINKS?";

async function getPubUrl(
  lang: string,
  pub: string,
  issue: string,
): Promise<string> {
  const url =
    JW_CDN +
    new URLSearchParams({
      langwritten: lang,
      pub,
      output: "json",
      issue,
    });

  const res = await fetch(url);

  if (res.status !== 200) {
    throw new Error("Publication not found");
  }

  const result: any = await res.json();

  const files = result.files[lang];

  if (files.EPUB && files.EPUB.length > 0) {
    return files.EPUB[0].file.url;
  }

  if (files.JWPUB && files.JWPUB.length > 0) {
    return files.JWPUB[0].file.url;
  }

  throw new Error("No file found");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, date, lang, pub, issue } = req.query;

    let fileUrl = typeof url === "string" ? url : undefined;

    if (!fileUrl) {
      if (!lang || !pub) {
        return res.status(400).json({
          error: "Missing required parameters: url or (lang and pub)",
          example:
            "/api/parse?url=https://example.com/file.jwpub&date=2024-11-04 or /api/parse?lang=E&pub=mwb&issue=202411&date=2024-11-04",
        });
      }

      const langStr = typeof lang === "string" ? lang : "E";
      const pubStr = typeof pub === "string" ? pub : "mwb";

      let issueStr: string;

      if (issue && typeof issue === "string") {
        issueStr = issue;
      } else {
        const referenceDate =
          date && typeof date === "string" ? new Date(date) : new Date();
        const refDate = new Date(referenceDate);

        if (pubStr === "mwb") {
          let currentMonth = refDate.getMonth() + 1;
          const monthOdd = currentMonth % 2 === 0 ? false : true;
          let monthMwb = monthOdd ? currentMonth : currentMonth - 1;

          if (monthMwb <= 0) {
            monthMwb = 12;
            refDate.setFullYear(refDate.getFullYear() - 1);
          }

          const currentYear = refDate.getFullYear();
          issueStr = currentYear + String(monthMwb).padStart(2, "0");
        } else if (pubStr === "w") {
          const currentYear = refDate.getFullYear();
          const currentMonth = refDate.getMonth() + 1;
          issueStr = currentYear + String(currentMonth).padStart(2, "0");
        } else {
          return res
            .status(400)
            .json({ error: "Invalid pub type. Use 'mwb' or 'w'" });
        }
      }

      try {
        fileUrl = await getPubUrl(langStr, pubStr, issueStr);
      } catch (error: any) {
        return res.status(404).json({
          error: "Failed to fetch publication",
          message: error.message,
        });
      }
    }

    if (!fileUrl || typeof fileUrl !== "string") {
      return res.status(400).json({
        error: "Missing required parameter: url",
        example:
          "/api/parse?url=https://example.com/file.jwpub&date=2024-11-04",
      });
    }

    const cacheKey = generateCacheKey(fileUrl);

    const cached = memoryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log("Cache hit:", cacheKey);

      if (date && typeof date === "string") {
        const filteredData = filterByDate(cached.data, date);
        return res.status(200).json({
          cached: true,
          data: filteredData,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
        });
      }

      return res.status(200).json({
        cached: true,
        data: cached.data,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
      });
    }

    console.log("Cache miss, parsing file:", fileUrl);

    const parsedData = await loadPub({ url: fileUrl });

    memoryCache.set(cacheKey, {
      data: parsedData,
      timestamp: Date.now(),
    });

    if (date && typeof date === "string") {
      const filteredData = filterByDate(parsedData, date);
      return res.status(200).json({
        cached: false,
        data: filteredData,
      });
    }

    return res.status(200).json({
      cached: false,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Error parsing file:", error);
    return res.status(500).json({
      error: "Failed to parse file",
      message: error.message,
    });
  }
}

function filterByDate(data: any[], dateStr: string): any[] {
  const targetDate = new Date(dateStr);

  return data.filter((item) => {
    if (item.mwb_week_date) {
      const weekStart = new Date(item.mwb_week_date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return targetDate >= weekStart && targetDate <= weekEnd;
    }

    if (item.w_study_date) {
      const weekStart = new Date(item.w_study_date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return targetDate >= weekStart && targetDate <= weekEnd;
    }

    return false;
  });
}
