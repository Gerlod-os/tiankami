import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCalendar } from "react-icons/fi";
import { FaYoutube } from "react-icons/fa";
import { useData } from "../components/DataProvider";
import { TwitchWidgetInHero } from "../components/TwitchWidgetInHero";
import { CatchOfDay } from "../components/CatchOfDay";
import { LiveBanner } from "../components/LiveBanner";
import { BRAND } from "../config/branding";
import { RarityEgg } from "../components/RarityEgg";
import { CollectionIcon } from "../components/CollectionIcon";
import { CoverFan } from "../components/CoverFan";
import { MASCOTS } from "../config/mascots";
import { computeStats, lastPlayedGame } from "../utils/stats";
import { useCounter } from "../utils/useCounter";
import { useCountdown, streamMoment } from "../utils/useCountdown";
import { usePageMeta } from "../utils/usePageMeta";
import { statusMeta, ratingColor, rankMedal } from "../utils/statusMeta";
import { parseNum, isUrl } from "../utils/normalize";
import { todayUTC, formatRuDate } from "../utils/date";
import { splitSchedule, useMoscowTime } from "../utils/schedule";

const GRADS = ["grad-pink", "grad-mint", "grad-blue", "grad-amber"];

function StatCard({ value, label, grad, delay }) {
  const n = useCounter(value);
  return (
    <div className="glass card-hover p-5 text-center animate-fadeUp" style={{ animationDelay: `${delay}ms` }}>
      <div className={`stat-num ${grad}`}>{n.toLocaleString("ru-RU")}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-[2px] text-ink-dim opacity-70">
        {label}
      </div>
    </div>
  );
}

function Countdown({ date, time }) {
  const target = useMemo(() => streamMoment(date, time), [date, time]);
  const cd = useCountdown(target);
  if (!cd) return null;
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <span className="chip border border-pastel-blue/30 bg-pastel-blue/10 font-display text-pastel-blue tabular-nums">
      ⏱ {cd.d > 0 ? `${cd.d}д ` : ""}{pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}
    </span>
  );
}

export function HomePage() {
  const { games, collections, schedule } = useData();
  usePageMeta({
    title: "Tiankami — каталог рогаликов",
    description:
      "Уютный хардкор: база рогаликов стримера Tiankami — оценки, часы, статусы прохождений, подборки и расписание стримов.",
  });

  const stats = computeStats(games, collections);
  const last = lastPlayedGame(games);
  // Ближайший стрим — тот же выбор, что на странице расписания: закончившийся
  // сегодняшний не показываем, иначе в 22:00 главная зовёт на утренний стрим.
  const nowMsk = useMoscowTime();
  const nextStream = splitSchedule(schedule, formatRuDate(todayUTC()), nowMsk).upcoming[0];
  const byTitle = useMemo(
    () => new Map(games.map((g) => [String(g.title).toLowerCase(), g])),
    [games]
  );

  const maskStyle = {
    maskImage: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)",
    WebkitMaskImage: "linear-gradient(to right, rgba(0,0,0,0.5) 0%, transparent 100%)",
  };

  return (
    <div className="space-y-10">
      {/* LIVE-плашка (появляется, когда Тиан в эфире) */}
      <LiveBanner />

      {/* HERO */}
      <section className="card relative overflow-hidden">
        {last?.image && (
          <img
            src={last.image}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -top-[50px] right-[-100px] z-0 hidden w-[600px] max-w-none opacity-50 lg:block"
            style={maskStyle}
          />
        )}
        <div className="relative z-10 grid grid-cols-1 gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="animate-fadeUp min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="section-accent font-display text-2xl font-black tracking-wide">
                TianKami · каталог рогаликов
              </h1>
              <span className="chip border border-white/10 bg-white/5 text-ink-dim">{`Уютный хардкор · Рогалики`}</span>
            </div>
            <h2 className="mt-5 font-display text-4xl font-black leading-tight text-ink md:text-5xl">
              {last?.title || "Каталог рогаликов"}
            </h2>
            <p className="mt-3 text-lg text-ink-dim">
              {last?.genre}
              {last?.setting ? ` · ${last.setting}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {parseNum(last?.rating) > 0 && (
                <span className="chip border border-white/10 bg-night-900/70 text-base">
                  <span aria-hidden="true">⭐</span>
                  <span className={ratingColor(last.rating) + " font-display font-extrabold"}>
                    {parseNum(last.rating)}/10
                  </span>
                </span>
              )}
              {last && <span className={"chip " + statusMeta(last.status).cls}>{statusMeta(last.status).emoji} {last.status}</span>}
              <span className="chip border border-pastel-pink/30 bg-pastel-pink/10 text-pastel-pink">
                Последний забег · {last?.playedDate || "—"}
              </span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {last && (
                <Link to={`/catalog/${last.slug}`} className="btn-primary">
                  Подробнее об игре <FiArrowRight />
                </Link>
              )}
              {last && isUrl(last.youtube) && (
                <a className="btn-ghost" href={last.youtube} target="_blank" rel="noopener noreferrer">
                  <FaYoutube className="text-red-300" /> Прохождение
                </a>
              )}
              <Link to="/catalog" className="btn-ghost">Весь каталог</Link>
            </div>
          </div>

          <div className="relative flex flex-col items-center gap-5">
            <div className="w-full"><TwitchWidgetInHero /></div>
            <img
              src={MASCOTS.logo}
              alt="Аватар Tiankami с Twitch — кроассан-геймпад"
              width={512}
              height={512}
              className="relative z-10 w-[240px] rounded-full border-4 border-white object-cover shadow-sticker md:w-[320px]"
            />
          </div>
        </div>
      </section>

      {/* СТАТИСТИКА: domino 50ms */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Статистика канала">
        <StatCard value={stats.total} label="Рогаликов в базе" grad={GRADS[0]} delay={50} />
        <StatCard value={stats.done} label="Пройдено" grad={GRADS[1]} delay={100} />
        <StatCard value={stats.hours} label="Часов сыграно" grad={GRADS[2]} delay={150} />
        <StatCard value={stats.collections} label="Подборок от Тиана" grad={GRADS[3]} delay={200} />
      </section>

      {/* УЛОВ ДНЯ */}
      <div className="animate-fadeUp" style={{ animationDelay: "100ms" }}>
        <CatchOfDay />
      </div>

      {/* MEME ALERTS */}
      <a
        href={BRAND.links.discord}
        target="_blank"
        rel="noopener noreferrer"
        className="card card-hover flex flex-wrap items-center gap-4 border-pastel-purple/30 p-4 animate-fadeUp"
        style={{ animationDelay: "120ms" }}
      >
        <span className="text-3xl" aria-hidden="true">🐶</span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-extrabold text-pastel-purple">MEME ALERTS</div>
          <div className="text-xs text-ink-dim">Отправь мемас на стрим — заходи в Discord и кидай в специальное место! 🐱</div>
        </div>
        <span className="btn-ghost text-sm">В коммьюнити →</span>
      </a>

      {/* БЛИЖАЙШИЙ СТРИМ */}
      {nextStream && (
        <section className="card card-hover flex flex-wrap items-center gap-4 border-pastel-blue/20 p-5 animate-fadeUp" style={{ animationDelay: "150ms" }}>
          <span className="text-3xl" aria-hidden="true">📅</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-display text-lg font-extrabold text-ink">
              Ближайший стрим: {nextStream.date} в {nextStream.time}
              <Countdown date={nextStream.date} time={nextStream.time} />
            </div>
            <div className="truncate text-sm text-ink-dim">{nextStream.game}</div>
          </div>
          <Link to="/schedule" className="btn-ghost text-sm"><FiCalendar /> Расписание</Link>
        </section>
      )}

      {/* ПОДБОРКИ */}
      <section className="animate-fadeUp" style={{ animationDelay: "150ms" }}>
        <div className="mb-5 flex items-end justify-between gap-4">
          <h2 className="section-title"><span className="h-marker">Подборки</span> <span className="section-accent">от Тиана</span></h2>
          <Link to="/collections" className="btn-ghost text-sm">Все подборки <FiArrowRight /></Link>
        </div>
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {(collections || []).slice(0, 4).map((c) => {
            const golden = /золотой/i.test(c.name);
            const fanGames = c.games
              .map((g) => byTitle.get(String(g.name).toLowerCase()))
              .filter(Boolean);
            return (
              <Link
                key={c.slug}
                to={`/collections/${c.slug}`}
                className={"card card-hover group flex flex-col p-5 " + (golden ? "gold-card" : "")}
              >
                <div className="flex items-center gap-3">
                  {golden ? <RarityEgg rarity="legendary" size={30} /> : <CollectionIcon name={c.name} />}
                  <h3 className={"line-clamp-1 font-display text-lg font-extrabold " + (golden ? "font-gothic text-pastel-amber" : "text-ink")}>
                    {c.name}
                  </h3>
                </div>
                {golden ? (
                  <div className="mt-4"><CoverFan games={fanGames} /></div>
                ) : (
                  <ul className="mt-3 space-y-1 text-sm text-ink-dim">
                    {c.games.slice(0, 3).map((g, i) => (
                      <li key={`${g.name}-${i}`} className="flex items-center gap-2 truncate">
                        <span>{rankMedal(g.rank) || `#${g.rank || i + 1}`}</span>
                        <span className="truncate">{g.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {c.description && <p className="mt-2 line-clamp-1 text-xs text-ink-dim">{c.description}</p>}
                <span className="mt-auto pt-3 text-xs font-bold text-pastel-pink">{c.games.length} игр →</span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
