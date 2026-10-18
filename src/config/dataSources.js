// ID таблиц (НЕ ключи — это публичные ID, часть URL)
export const SPREADSHEET_ID = "16-b4LC_n2g1pq2fVGkUJyRsq9xklzlRpIwVH5Gv3C4U";
export const COPY_SPREADSHEET_ID =
  "1NrxkJzDIC4S7Epv8wo8jDyqF6Vfvfok7Kf0EJL8tomA";

// Имена листов
export const GAMES_SHEET_NAME = "Все рогалики";
export const GAMES_GID = "0";
export const COLLECTIONS_SHEET_NAME = "Подборки от Тиана";
export const SCHEDULE_SHEET_NAME = "Расписание";

// Прямые URL без ключа (используются только скриптом синхронизации при сборке)
export const GAMES_URL =
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=tsv&gid=${GAMES_GID}`;
// Та же таблица, но xlsx: только в этом формате приезжают гиперссылки ячеек
// (Steam, YouTube, выпуск МИ). Ключ не нужен — выгрузка публичная.
export const GAMES_XLSX_URL =
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`;
export const COLLECTIONS_URL =
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(COLLECTIONS_SHEET_NAME)}`;
export const SCHEDULE_URL =
  `https://docs.google.com/spreadsheets/d/${COPY_SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SCHEDULE_SHEET_NAME)}`;

// Ключа Sheets API здесь больше нет: браузерный ключ ограничен по referrer,
// с сайта он получал 403 и только лежал в публичном бандле. Гиперссылки
// забирает шаг синхронизации из xlsx (см. scripts/sync-data.js).

// Google Apps Script — приёмник формы расписания (проксируется через /api/schedule)
export const SCHEDULE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyrQYM-AifKnglwo2P7-pDnjkmf2eNz9_0z_DEQ21Iht5mR_4Ipf3sfH3M_I6AqxfcY/exec";

// Расписание стримов: публичный календарь канала на Twitch.
// Отдаёт ICS без токена и без ключа — проверено 18.10.2026 (код 200, 2444 байта).
// 95645837 — broadcaster_id канала tiankami.
export const TWITCH_BROADCASTER_ID = "95645837";
export const TWITCH_LOGIN = "tiankami";
export const TWITCH_ICS_URL =
  `https://api.twitch.tv/helix/schedule/icalendar?broadcaster_id=${TWITCH_BROADCASTER_ID}`;
export const TWITCH_CHANNEL_URL = "https://twitch.tv/tiankami";
