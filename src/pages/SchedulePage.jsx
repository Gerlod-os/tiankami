import { FiClock, FiCalendar } from "react-icons/fi";
import { FaTwitch } from "react-icons/fa";
import { useData } from "../components/DataProvider";
import { ScheduleForm } from "../components/ScheduleForm";
import { parseRuDate, todayUTC } from "../utils/date";
import { usePageMeta } from "../utils/usePageMeta";

// ICS для ближайшего стрима (клиентская генерация, МСК → UTC)
function addToCalendar(s) {
  const d = parseRuDate(s.date);
  if (!d || typeof document === "undefined") return;
  const m = String(s.time || "").match(/(\d{1,2}):(\d{2})/);
  const h = m ? parseInt(m[1], 10) : 12;
  const mi = m ? parseInt(m[2], 10) : 0;
  const start = new Date(d.getTime() + h * 3600e3 + mi * 60e3 - 3 * 3600e3);
  const end = new Date(start.getTime() + 6 * 3600e3);
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

function StreamRow({ s, big }) {
  return (
    <div
      className={
        "card flex flex-wrap items-center gap-4 " +
        (big ? "border-pastel-pink/30 p-6 shadow-glow-pink" : "p-4")
      }
    >
      <div
        className={
          "flex flex-col items-center justify-center rounded-btn bg-gradient-to-br from-pastel-pink/20 to-pastel-purple/20 font-display font-black text-ink " +
          (big ? "h-20 w-20 text-2xl" : "h-14 w-14 text-lg")
        }
      >
        <span>{s.date.slice(0, 5)}</span>
        <span className="text-[10px] font-bold text-ink-dim">{s.date.slice(6)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className={"font-display font-extrabold text-ink " + (big ? "text-xl" : "text-base")}>
          {s.game}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-dim">
          <FiClock /> {s.time} МСК
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
      "Расписание стримов Tiankami: ближайшие стримы и прошедшие. Стримы каждый день, кроме субботы.",
  });

  const today = todayUTC();
  const list = [...(schedule || [])].sort(
    (a, b) => (parseRuDate(a.date)?.getTime() || 0) - (parseRuDate(b.date)?.getTime() || 0)
  );
  const upcoming = list.filter((s) => (parseRuDate(s.date)?.getTime() || 0) >= today.getTime());
  const past = list
    .filter((s) => (parseRuDate(s.date)?.getTime() || 0) < today.getTime())
    .slice(-5)
    .reverse();
  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="section-title text-3xl md:text-4xl">
          <span className="h-marker">Расписание</span> <span className="section-accent">стримов</span>
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Стримы каждый день, кроме субботы. Анонсы — в{" "}
          <a className="text-pastel-pink underline decoration-pastel-pink/40 underline-offset-2" href="https://twitch.tv/tiankami" target="_blank" rel="noopener noreferrer">
            группе Вконтакте
          </a>{" "}
          и на канале. Окончание — почти всегда до позднего вечера.
        </p>
      </div>

      {next ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold text-ink">🔥 Ближайший стрим</h2>
            <button type="button" className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => addToCalendar(next)}>
              <FiCalendar /> В календарь
            </button>
          </div>
          <StreamRow s={next} big />
          {upcoming.slice(1, 4).map((s, i) => (
            <StreamRow key={`${s.date}-${i}`} s={s} />
          ))}
        </section>
      ) : (
        <div className="card p-8 text-center text-ink-dim">
          Анонсов пока нет — загляни на канал <FaTwitch className="inline text-pastel-purple" />
        </div>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-extrabold text-ink">Прошедшие стримы</h2>
          {past.map((s, i) => (
            <StreamRow key={`${s.date}-p${i}`} s={s} />
          ))}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-display text-lg font-extrabold text-ink">
          📮 Предложить стрим / добавить в расписание
        </h2>
        <ScheduleForm />
      </section>

      <p className="text-center text-xs text-ink-faint">
        <FiCalendar className="inline" /> Все анонсы и изменения — в соцсетях канала.
      </p>
    </div>
  );
}
