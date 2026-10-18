// Разбор календаря расписания Twitch (ICS) и разворот повторов в конкретные даты.
// Twitch отдаёт недельную сетку: событие с RRULE:FREQ=WEEKLY;BYDAY=MO и временем начала.
// Дат «когда будет стрим» в файле нет — их считаем сами на нужное окно.

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]; // как в getUTCDay()

// Строки ICS переносятся: продолжение начинается с пробела или таба.
const unfold = (text) => String(text || "").replace(/\r?\n[ \t]/g, "");

function parseStamp(value) {
  // 20241028T120000 | 20241028T120000Z | 20241028
  const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(String(value || "").trim());
  if (!m) return null;
  const stamp = {
    y: Number(m[1]),
    mo: Number(m[2]),
    d: Number(m[3]),
    h: m[4] ? Number(m[4]) : 0,
    mi: m[5] ? Number(m[5]) : 0,
    utc: Boolean(m[7]),
  };
  // Сайт живёт по Москве, перевода часов в России нет: UTC → МСК это +3 часа.
  if (stamp.utc) {
    const t = new Date(Date.UTC(stamp.y, stamp.mo - 1, stamp.d, stamp.h, stamp.mi) + 3 * 3600e3);
    return { y: t.getUTCFullYear(), mo: t.getUTCMonth() + 1, d: t.getUTCDate(), h: t.getUTCHours(), mi: t.getUTCMinutes(), utc: false };
  }
  return stamp;
}

function parseRrule(value) {
  const out = {};
  for (const part of String(value || "").split(";")) {
    const [k, v] = part.split("=");
    if (!k || v === undefined) continue;
    out[k.toUpperCase()] = v;
  }
  if (!out.FREQ) return null;
  return {
    freq: out.FREQ.toUpperCase(),
    interval: out.INTERVAL ? Number(out.INTERVAL) : 1,
    byday: out.BYDAY ? out.BYDAY.split(",").map((x) => x.trim().toUpperCase()) : [],
    count: out.COUNT ? Number(out.COUNT) : null,
    until: out.UNTIL ? parseStamp(out.UNTIL) : null,
  };
}

const fieldValue = (block, name) => {
  const re = new RegExp("^" + name + "[^:\\r\\n]*:(.*)$", "m");
  const m = re.exec(block);
  return m ? m[1].trim() : null;
};

const fieldAll = (block, name) => {
  const re = new RegExp("^" + name + "[^:\\r\\n]*:(.*)$", "gm");
  return [...block.matchAll(re)].map((m) => m[1].trim());
};

/** События календаря: начало, конец, название, правило повтора, исключения. */
export function parseIcsEvents(text) {
  const body = unfold(text);
  const events = [];
  for (const m of body.matchAll(/BEGIN:VEVENT([\s\S]*?)END:VEVENT/g)) {
    const block = m[1];
    const start = parseStamp(fieldValue(block, "DTSTART"));
    if (!start) continue;
    const end = parseStamp(fieldValue(block, "DTEND")) || start;
    const exdates = [];
    for (const line of fieldAll(block, "EXDATE")) {
      for (const part of line.split(",")) {
        const stamp = parseStamp(part);
        if (stamp) exdates.push(`${stamp.y}-${stamp.mo}-${stamp.d}`);
      }
    }
    events.push({
      uid: fieldValue(block, "UID") || "",
      summary: fieldValue(block, "SUMMARY") || "",
      category: fieldValue(block, "CATEGORIES") || "",
      status: (fieldValue(block, "STATUS") || "").toUpperCase(),
      start,
      end,
      rrule: parseRrule(fieldValue(block, "RRULE")),
      exdates,
    });
  }
  return events;
}

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (y, mo, d) => `${y}-${mo}-${d}`;
const toRuDate = (y, mo, d) => `${pad(d)}.${pad(mo)}.${y}`;
const toHHMM = (h, mi) => `${pad(h)}:${pad(mi)}`;
const startMs = (s) => Date.UTC(s.y, s.mo - 1, s.d);

// Понедельник недели, в которую попадает дата: по нему считаем INTERVAL.
function mondayMs(ms) {
  const dow = new Date(ms).getUTCDay(); // 0 = воскресенье
  const shift = dow === 0 ? 6 : dow - 1;
  return ms - shift * 86400e3;
}

/**
 * Пары «дата + время» на окно вперёд. from — Date (UTC-полночь), days — сколько дней.
 * Повторы поддерживаются только недельные: другого формата Twitch для расписания не отдаёт.
 */
export function expandEvents(events, from, days) {
  const out = [];
  const fromMs = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  for (let i = 0; i < days; i++) {
    const ms = fromMs + i * 86400e3;
    const day = new Date(ms);
    const y = day.getUTCFullYear();
    const mo = day.getUTCMonth() + 1;
    const d = day.getUTCDate();
    const dow = DAY_CODES[day.getUTCDay()];
    const key = dayKey(y, mo, d);

    for (const ev of events) {
      if (ev.status === "CANCELLED") continue;
      if (ev.exdates.includes(key)) continue;
      const evStartMs = startMs(ev.start);
      if (ms < evStartMs) continue;

      if (!ev.rrule) {
        if (ms !== evStartMs) continue;
      } else {
        if (ev.rrule.freq !== "WEEKLY") continue; // другие частоты не встречались — не выдумываем
        const byday = ev.rrule.byday.length ? ev.rrule.byday : [DAY_CODES[new Date(evStartMs).getUTCDay()]];
        if (!byday.includes(dow)) continue;
        const weeks = Math.round((mondayMs(ms) - mondayMs(evStartMs)) / (7 * 86400e3));
        if (ev.rrule.interval > 1 && weeks % ev.rrule.interval !== 0) continue;
        if (ev.rrule.until) {
          const u = ev.rrule.until;
          if (ms > Date.UTC(u.y, u.mo - 1, u.d)) continue;
        }
        if (ev.rrule.count) {
          // Сколько повторов прошло с начала до этого дня включительно.
          const passed = Math.floor((ms - evStartMs) / (7 * 86400e3)) + 1;
          if (passed > ev.rrule.count) continue;
        }
      }

      out.push({
        date: toRuDate(y, mo, d),
        time: toHHMM(ev.start.h, ev.start.mi),
        endTime: toHHMM(ev.end.h, ev.end.mi),
        game: ev.summary,
        category: ev.category,
        streamLink: "https://twitch.tv/tiankami",
        ms,
      });
    }
  }
  return out.sort((a, b) => a.ms - b.ms);
}
