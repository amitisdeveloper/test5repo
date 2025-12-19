const axios = require("axios");
const cheerio = require("cheerio");
const dayjs = require("dayjs");
const fs = require("fs-extra");

const BASE_URL = "https://delhi-bazar.com";
const START_YEAR = 2021;
const CREATED_BY = "692b8304eebc2d966faecbcc";
const OUTPUT_FILE = "delhi-bazar-results.json";

// Map column headers → required game names
const GAME_MAP = {
  "DELHI BAZAR": "Delhi Bazar",
  "SHRI GANESH": "Shri Ganesh",
  "FARIDABAD": "Faridabad",
  "GHAZIABAD": "Ghaziabad",
  "GALI": "Gali",
  "DISAWAR": "Disawar"
};

async function fetchMonth(year, month) {
  // Example URL pattern (may need adjustment if site differs)
  const url = `${BASE_URL}/chart.php?year=${year}&month=${month}`;
  const { data } = await axios.get(url, { timeout: 20000 });
  return cheerio.load(data);
}

async function scrape() {
  const results = [];
  const now = dayjs();

  for (let year = START_YEAR; year <= now.year(); year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === now.year() && month > now.month() + 1) break;

      console.log(`Scraping ${year}-${month.toString().padStart(2, "0")}`);

      let $;
      try {
        $ = await fetchMonth(year, month);
      } catch (err) {
        console.error(`Failed ${year}-${month}`, err.message);
        continue;
      }

      const headers = [];
      $("table thead th").each((i, el) => {
        headers.push($(el).text().trim().toUpperCase());
      });

      $("table tbody tr").each((_, row) => {
        const cells = $(row).find("td");
        const day = $(cells[0]).text().trim();

        if (!day || isNaN(day)) return;

        Object.entries(GAME_MAP).forEach(([header, gamename]) => {
          const index = headers.indexOf(header);
          if (index === -1) return;

          const rawValue = $(cells[index]).text().trim();
          const publishedNumber = rawValue || "-";

          const publishDate = dayjs
            .utc(`${year}-${month}-${day} 17:00`)
            .toISOString();

          results.push({
            gamename,
            publishDate,
            publishedNumber,
            createdBy: CREATED_BY
          });
        });
      });
    }
  }

  await fs.writeJson(OUTPUT_FILE, results, { spaces: 2 });
  console.log(`✅ Done. Saved ${results.length} records to ${OUTPUT_FILE}`);
}

scrape();
