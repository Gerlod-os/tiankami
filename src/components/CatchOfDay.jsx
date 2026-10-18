import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiStar } from "react-icons/fi";
import { useData } from "./DataProvider";
import { RarityEgg } from "./RarityEgg";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { parseNum } from "../utils/normalize";
import { moodOf } from "../utils/recommend";
import { MASCOTS } from "../config/mascots";
import { safeGet, safeSet } from "../utils/storage";

// Улов дня. Один заброс в сутки на браузер: ключ tiankami_catch_YYYY-MM-DD.
// Дата местная, не UTC: иначе после 21:00 по МСК сутки менялись бы не вовремя.
const todayKey = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `tiankami_catch_${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Поплавок на леске: линия с точками, floats при подсечке уходит вниз.
function Bobber({ dip }) {
  return (
    <svg
      viewBox="0 0 120 160"
      className={"h-40 w-24 transition-transform duration-700 ease-out " + (dip ? "translate-y-6" : "")}
      aria-hidden="true"
    >
      <line x1="60" y1="0" x2="60" y2="92" stroke="#B9B4CF" strokeWidth="2" strokeDasharray="4 4" />
      <ellipse cx="60" cy="104" rx="16" ry="18" fill="#FF2D2D" />
      <ellipse cx="60" cy="104" rx="16" ry="18" fill="url(#bob-shine)" />
      <ellipse cx="60" cy="122" rx="9" ry="7" fill="#FFFFFF" opacity="0.9" />
      <defs>
        <linearGradient id="bob-shine" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="60%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function CatchOfDay() {
  const { games, rarityBySlug } = useData();
  const [caught, setCaught] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | casting | caught
  const [locked, setLocked] = useState(false);
  const [drops, setDrops] = useState([]);
  const dropId = useRef(0);
  const calm =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Улов за сегодня — из хранилища. Только после mount: сервер рисует пустое
  // состояние, иначе разъедется разметка (React #418).
  useEffect(() => {
    const saved = safeGet(todayKey());
    if (!saved?.slug) return;
    const game = games.find((g) => g.slug === saved.slug);
    if (game) {
      setCaught(game);
      setPhase("caught");
      setLocked(true);
    }
  }, [games]);

  const cast = () => {
    if (phase === "casting" || locked || !games.length) return;
    const finish = () => {
      const game = games[(Math.random() * games.length) | 0];
      setCaught(game);
      setPhase("caught");
      setLocked(true);
      safeSet(todayKey(), { slug: game.slug });
      if (calm) return;
      const burst = Array.from({ length: 18 }, () => ({
        id: dropId.current++,
        x: 50 + (Math.random() - 0.5) * 40,
        y: 46 + Math.random() * 8,
        dx: (Math.random() - 0.5) * 220,
        dy: -60 - Math.random() * 130,
      }));
      setDrops(burst);
      setTimeout(() => setDrops([]), 950);
    };
    if (calm) {
      finish();
      return;
    }
    setPhase("casting");
    setTimeout(finish, 450);
  };

  const MoodIcon = caught ? moodOf(caught).icon : null;

  return (
    <section
      className="card relative overflow-hidden border-pastel-blue/20"
      aria-label="Улов дня"
    >
      {/* Три слоя волн — уже были в дизайн-системе */}
      <div
        className="wave-bob pointer-events-none absolute inset-x-0 bottom-0 h-40"
        aria-hidden="true"
      >
        <svg className="wave-l1" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0 55 Q150 15 300 55 T600 55 T900 55 T1200 55 V100 H0Z" fill="#123a6b" opacity=".55" />
        </svg>
        <svg className="wave-l2" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0 65 Q150 35 300 65 T600 65 T900 65 T1200 65 V100 H0Z" fill="#2a6fb0" opacity=".4" />
        </svg>
        <svg className="wave-l3" viewBox="0 0 1200 100" preserveAspectRatio="none">
          <path d="M0 75 Q150 50 300 75 T900 75 T1200 75 V100 H0Z" fill="#A0C4FF" opacity=".3" />
        </svg>
      </div>

      <div className="relative grid items-center gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <h2 className="section-title">
            Улов <span className="section-accent">дня</span>
          </h2>
          <p className="mt-2 text-sm text-ink-dim">
            Не знаешь, во что зайти? Закинь удочку в каталог из {games.length}{" "}
            рогаликов — вдруг клюнет легенда. Заброс один в день: следующий — завтра.
          </p>
          <div className="mt-5 flex items-end gap-4">
            <button
              type="button"
              onClick={cast}
              disabled={phase === "casting" || locked}
              className="btn-primary !px-6 !py-3 text-base disabled:cursor-not-allowed disabled:opacity-60"
            >
              {phase === "casting"
                ? "Подсечка!.."
                : locked
                  ? "Придти завтра"
                  : "Поймать случайную игру"}
            </button>
            <img
              src={MASCOTS.fisher}
              alt="Сайтама-рыбак с удочкой"
              width={700}
              height={700}
              className="hidden w-28 drop-shadow-[0_6px_16px_rgba(0,0,0,.5)] sm:block"
              loading="lazy"
            />
          </div>
        </div>

        <div
          className="relative flex min-h-[220px] items-end justify-center"
          aria-live="polite"
        >
          {drops.map((d) => (
            <span
              key={d.id}
              className="splash-drop absolute h-2 w-2 rounded-full bg-pastel-blue"
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                ["--dx"]: `${d.dx}px`,
                ["--dy"]: `${d.dy}px`,
              }}
            />
          ))}

          {/* Пока не поймано — поплавок на воде */}
          {phase !== "caught" && (
            <div className={calm ? "" : "animate-floaty"}>
              <Bobber dip={phase === "casting"} />
            </div>
          )}

          {phase === "caught" && caught && (
            <div className="catch-spring card w-full max-w-sm overflow-hidden border-pastel-blue/40 shadow-glow-blue">
              <div className="relative aspect-[2/1] bg-night-900">
                {caught.image && (
                  <img
                    src={caught.image}
                    alt={`Обложка ${caught.title}`}
                    className="h-full w-full object-cover"
                  />
                )}
                <span className="absolute left-2 top-2">
                  <RarityEgg
                    rarity={rarityBySlug?.[caught.slug] || "common"}
                    size={40}
                  />
                </span>
                {parseNum(caught.rating) > 0 && (
                  <span className="chip absolute right-2 top-2 border border-white/10 bg-night-900/80 text-lg">
                    <FiStar className={ratingColor(caught.rating)} />
                    <span className={ratingColor(caught.rating) + " text-lg font-black"}>
                      {parseNum(caught.rating)}/10
                    </span>
                  </span>
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="line-clamp-1 font-display text-lg font-extrabold text-ink">
                  {caught.title}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-dim">
                  <span
                    className="chip border border-pastel-mint/25 bg-pastel-mint/10 text-pastel-mint"
                    title="Настроение забега"
                  >
                    {MoodIcon && <MoodIcon className="shrink-0" aria-hidden="true" />}{" "}
                    {moodOf(caught).label}
                  </span>
                  <span className="truncate">
                    {caught.genre || "Рогалик"}
                    {caught.setting ? ` · ${caught.setting}` : ""}
                  </span>
                  <span className={statusMeta(caught.status).cls + " chip"}>
                    {(() => {
                      const m = statusMeta(caught.status);
                      const I = m.icon;
                      return I ? <I className="shrink-0" aria-hidden="true" /> : null;
                    })()}{" "}
                    {caught.status}
                  </span>
                </div>
                <Link
                  to={`/catalog/${caught.slug}`}
                  className="btn-ghost w-full text-sm"
                >
                  Что это за игра? <FiArrowRight />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
