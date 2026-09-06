// ID таблиц (НЕ ключи — это публичные ID, часть URL)
export const SPREADSHEET_ID = "16-b4LC_n2g1pq2fVGkUJyRsq9xklzlRpIwVH5Gv3C4U";
export const COPY_SPREADSHEET_ID =
  "1NrxkJzDIC4S7Epv8wo8jDyqF6Vfvfok7Kf0EJL8tomA";

// Имена листов
export const GAMES_SHEET_NAME = "Все рогалики";
export const GAMES_GID = "0";
export const COLLECTIONS_SHEET_NAME = "Подборки от Тиана";
export const SCHEDULE_SHEET_NAME = "Расписание";

// Ключ Sheets API (опционально; читается из окружения)
export const SHEETS_API_KEY =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_SHEETS_API_KEY) ||
  (typeof process !== "undefined" && process.env?.VITE_SHEETS_API_KEY) || "";

// Прямые URL без ключа
export const GAMES_URL =
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv&gid=${GAMES_GID}`;
export const COLLECTIONS_URL =
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COLLECTIONS_SHEET_NAME)}`;
export const SCHEDULE_URL =
  `https://docs.google.com/spreadsheets/d/${COPY_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SCHEDULE_SHEET_NAME)}`;

// Sheets API (для гиперссылок)
export const COPY_SHEETS_API_VALUES_URL = (range) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${COPY_SPREADSHEET_ID}/values/${encodeURIComponent(`${GAMES_SHEET_NAME}!${range}`)}?key=${SHEETS_API_KEY}&valueRenderOption=FORMULA`;
export const SHEETS_API_VALUES_URL = (range) =>
  `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(`${GAMES_SHEET_NAME}!${range}`)}?key=${SHEETS_API_KEY}&valueRenderOption=FORMULA`;

// Google Apps Script — приёмник формы расписания (проксируется через /api/schedule)
export const SCHEDULE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyrQYM-AifKnglwo2P7-pDnjkmf2eNz9_0z_DEQ21Iht5mR_4Ipf3sfH3M_I6AqxfcY/exec";
