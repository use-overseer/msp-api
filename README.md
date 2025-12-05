# Meeting Schedules Parser Public API 

> (msp-api)

**Meeting Schedules Parser Public API** is a lightweight HTTP service that parses **JWPUB** and **EPUB** files containing meeting schedules.

It includes an integrated caching system and an optional interactive frontend.

The sole purpose of **msp-api** is to make the functionality of [Meeting Schedules Parser](https://www.npmjs.com/package/meeting-schedules-parser) accessible to other development environments — such as **Python**, **Go**, or any language that does not use **Node.js** directly.

## Usage Examples

### Get Current Meeting Workbook (MWB) Data

To fetch the JSON data for the current Meeting Workbook (mwb) in English:

**Request:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=E&pub=mwb"
```

**Response:**
```json
{
  "cached": false,
  "data": [
    {
      "mwb_week_date": "2024/11/04",
      "mwb_week_date_locale": "NOVEMBER 4-10",
      "mwb_weekly_bible_reading": "PSALM 105",
      "mwb_song_first": 3,
      "mwb_song_middle": 124,
      "mwb_song_last": 97,
      "mwb_opening_comments": "Let Us Pray",
      "mwb_chairman": "",
      "mwb_treasures_part1": "Treasure from God's Word: Psalms",
      "mwb_treasures_part1_time": 10,
      "mwb_treasures_part1_theme": "What Can We Learn from Psalms?",
      "mwb_treasures_part2": "Spiritual Gems",
      "mwb_treasures_part2_time": 10,
      "mwb_treasures_part3": "Bible Reading",
      "mwb_treasures_part3_time": 4,
      "mwb_treasures_part3_theme": "Psalm 105",
      "mwb_apply_yourself_part1": "Apply Yourself to the Field Ministry",
      "mwb_apply_yourself_part1_time": 15,
      "mwb_apply_yourself_part2": "Living as Christians",
      "mwb_apply_yourself_part2_time": 15,
      "mwb_apply_yourself_part2_theme": "How Can We Remain Loyal?",
      "mwb_living_part1": "",
      "mwb_living_part1_time": 0,
      "mwb_living_part2": "",
      "mwb_living_part2_time": 0,
      "mwb_living_part3": "",
      "mwb_living_part3_time": 0,
      "mwb_concluding_comments": "",
      "mwb_concluding_comments_time": 3,
      "mwb_song_conclude": "",
      "mwb_song_conclude_index": 0,
      "mwb_prayer_conclude": "",
      "mwb_lc_count": "",
      "mwb_lc_part_number": "",
      "mwb_lc_display_name": "",
      "week_date": "2024/11/04"
    },
    // ... more weeks
  ]
}
```

### Filter by Specific Date

You can filter the results to a specific week by providing a `date` parameter in `YYYY-MM-DD` format. This works for both Meeting Workbook (`mwb`) and Watchtower Study (`w`) publications, narrowing down to the week that includes the provided date.

**Example for Meeting Workbook (mwb):**
**Request:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=E&pub=mwb&date=2024-11-04"
```

**Example for Watchtower Study (w):**
**Request:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=S&pub=w&issue=202508&date=2025-10-18"
```

### Get Current Watchtower Study (W) Data

To fetch the JSON data for the current Watchtower Study (w) in Spanish:

**Request:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=S&pub=w"
```

**Response:**
```json
{
  "cached": false,
  "data": [
    {
      "w_study_date": "2025/10/01",
      "w_study_date_locale": "OCTUBRE 2025",
      "w_study_title": "Cómo fortaleces tu fe en la resurrección",
      // ... more fields
    }
  ]
}
```

### Specify a Specific Issue

Publications are often released in advance. For example, the August 2025 Watchtower edition may contain study articles for October 2025. To fetch data for a specific publication issue, use the `issue` parameter in `YYYYMM` format.

**Example for a specific Watchtower issue:**
**Request:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=S&pub=w&issue=202508"
```

**Combined with date filtering:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=S&pub=w&issue=202508&date=2025-10-18"
```

### Language Codes

The API supports multiple languages using standard JW.org language codes:

- `E`: English
- `S`: Spanish
- `X`: Portuguese
- `T`: Chinese (Traditional)
- `Z`: Chinese (Simplified)
- `F`: French
- `G`: German
- `I`: Italian
- And many more (see `/api/info` for the full list)

**Example with different language:**
```bash
curl "https://msp-api.useoverseer.org/api/parse?lang=F&pub=mwb"
```

### Credits

msp-api is built upon the [Meeting Schedules Parser](https://www.npmjs.com/package/meeting-schedules-parser) library.
All credit for the core parsing logic belongs to its original authors.
