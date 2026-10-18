import { FiClock, FiCalendar } from "react-icons/fi";
import { FaTwitch } from "react-icons/fa";
import { useData } from "../components/DataProvider";
import { parseRuDate, todayUTC, formatRuDate, formatRuDateLong } from "../utils/date";
import { splitSchedule, useMoscowTime } from "../utils/schedule";
import { BRAND } from "../config/branding";
import { usePageMeta } from "../utils/usePageMeta";

// ICS для ближайшего стрима (клиентская генерация, МСК → UTC)
function addToCalendar(s) {
  const d = parseRuDate(s.date);
  if (!d || typeof document === "undefined") return;
  const m = String(s.time || "").match(/(\d{1,2}):(\d{2})/);
  const h = m ? parseInt(m[1], 10) : 12;
  const mi = m ? parseInt(m[2], 10) : 0;
  const start = new Date(d.getTime() + h * 3600e3 + mi * 60e3 - 3 * 3600e3);
  const end = (() => {
    const em = String(s.endTime || "").match(/(\d{1,2}):(\d{2})/);
    if (em) {
      return new Date(
        d.getTime() + parseInt(em[1], 10) * 3600e3 + parseInt(em[2], 10) * 60e3 - 3 * 3600e3
      );
    }
    return new Date(start.getTime() + 6 * 3600e3);
  })();
  const f = (x) => x.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Tiankami//Schedule//RU",
    "BEGIN:VEVENT",
    `UID:${s.date}T${s.time}@tiankami`,
    `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:Стрим Tiankami: ${s.game}`,
    `DESCRIPTION:${s.game} • twitch.tv/tiankami`,
    "URL:https://twitch.tv/tiankami",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tiankami-${s.date}.ics`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Крупная карточка — только для ближайшего стрима.
function NextStreamCard({ s, isToday }) {
  return (
    <div
      className={
        "card flex flex-wrap items-center gap-4 border-pastel-pink/30 p-6 shadow-glow-pink" +
        (isToday ? " ring-1 ring-pastel-pink/40" : "")
      }
    >
      <div className="flex h-20 w-20 flex-col items-center justify-center rounded-btn bg-gradient-to-br from-pastel-pink/20 to-pastel-purple/20 font-display font-black text-ink text-2xl">
        <span>{s.date.slice(0, 5)}</span>
        <span className="text-[10px] font-bold text-ink-dim">{s.date.slice(6)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-xl font-extrabold text-ink">{s.game}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-dim">
          <FiClock /> {s.time}
          {s.endTime ? `–${s.endTime}` : ""} МСК
          <span aria-hidden="true">·</span>
          <span>{formatRuDateLong(parseRuDate(s.date))}</span>
          {isToday && (
            <span className="chip border border-pastel-pink/40 bg-pastel-pink/10 text-pastel-pink">
              сегодня
            </span>
          )}
        </div>
      </div>
      <a
        className="btn-ghost !px-3 !py-1.5 text-xs"
        href={s.streamLink || "https://twitch.tv/tiankami"}
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaTwitch className="text-pastel-purple" /> Канал
      </a>
    </div>
  );
}

export function SchedulePage() {
  const { schedule } = useData();
  usePageMeta({
    title: "Расписание стримов — Tiankami",
    description:
      "Расписание стримов Tiankami: ближайший стрим по календарю канала на Twitch и прошедшие трансляции с записями.",
  });

  const todayRu = formatRuDate(todayUTC());
  const nowMsk = useMoscowTime();
  const { upcoming, past } = splitSchedule(schedule, todayRu, nowMsk);
  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="section-title min-h-[2lh] text-3xl md:min-h-0 md:text-4xl">
          <span className="h-marker">Расписание</span> <span className="section-accent">стримов</span>
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Ближайший стрим — из календаря канала, прошедшие трансляции — из записей на{" "}
          <a className="text-pastel-pink underline decoration-pastel-pink/40 underline-offset-2" href={BRAND.links.twitch} target="_blank" rel="noopener noreferrer">
            Twitch
          </a>
          . Всё обновляется само; анонсы и переносы — в Telegram и ВК.
        </p>
      </div>

      {next ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold text-ink">
              {next.date === todayRu && nowMsk && nowMsk >= next.time && nowMsk < (next.endTime || "23:59")
                ? "🔴 Идёт сейчас"
                : "🔥 Ближайший стрим"}
            </h2>
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => addToCalendar(next)}>
              <FiCalendar /> В календарь
            </button>
          </div>
          <NextStreamCard s={next} isToday={next.date === todayRu} />
        </section>
      ) : (
        <div className="card p-8 text-center">
          <p className="font-display text-lg font-extrabold text-ink">
            Ближайших стримов пока нет
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-dim">
            Расписание и переносы пишу в Telegram и ВК — там же анонсы за день до стрима.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <a
              className="btn-primary text-sm"
              href={BRAND.links.telegram}
              target="_blank"
              rel="noopener noreferrer"
            >
              Расписание в Telegram
            </a>
            <a
              className="btn-ghost text-sm"
              href={BRAND.links.vk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Группа ВКонтакте
            </a>
          </div>
        </div>
      )}

      {past.length > 0 && (
        <section>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold text-ink">Прошедшие трансляции</h2>
            <a
              className="btn-ghost !px-3 !py-1.5 text-xs"
              href={BRAND.links.twitch + "/schedule"}
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaTwitch className="text-pastel-purple" /> Всё на канале
            </a>
          </div>
          <ul className="divide-y divide-white/5">
            {past.map((s, i) => (
              <li key={`${s.date}-p${i}`}>
                <a
                  className="group flex flex-col gap-0.5 py-3 transition sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-3"
                  href={s.streamLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="flex items-baseline gap-2 sm:contents">
                    <span className="font-display text-sm font-extrabold text-ink">
                      {formatRuDateLong(parseRuDate(s.date)).split(",")[0]}
                    </span>
                    <span className="font-display text-sm font-bold text-ink-dim">
                      {s.date.slice(0, 5)}
                    </span>
                    <span className="text-xs tabular-nums text-ink-dim">
                      {s.time}
                      {s.endTime ? `–${s.endTime}` : ""} МСК
                    </span>
                  </span>
                  <span className="min-w-0 text-sm text-ink sm:flex-1 group-hover:text-pastel-pink">
                    {s.game}
                  </span>
                  {s.category && (
                    <span className="text-xs text-ink-faint">{s.category}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-xs text-ink-faint">
        <FiCalendar className="inline" /> Все анонсы и изменения — в соцсетях канала.
      </p>
    </div>
  );
}
