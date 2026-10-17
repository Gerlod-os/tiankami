import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiStar } from "react-icons/fi";
import { useData } from "./DataProvider";
import { RarityEgg } from "./RarityEgg";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { parseNum } from "../utils/normalize";
import { moodOf } from "../utils/recommend";
import { MASCOTS } from "../config/mascots";

// 🎣 Рыбалка-сфера: 3 слоя волн (bob 10s), spring-подсечка, 24 брызги.
export function CatchOfDay() {
  const { games, rarityBySlug } = useData();
  const [caught, setCaught] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | casting | caught
  const [drops, setDrops] = useState([]);
  const dropId = useRef(0);

  const cast = () => {
    if (phase === "casting" || !games.length) return;
    setPhase("casting");
    setTimeout(() => {
      const game = games[(Math.random() * games.length) | 0];
      setCaught(game);
      setPhase("caught");
      const burst = Array.from({ length: 24 }, () => ({
        id: dropId.current++,
        x: 50 + (Math.random() - 0.5) * 60,
        y: 45 + Math.random() * 15,
        dx: (Math.random() - 0.5) * 200,
        dy: -50 - Math.random() * 120,
      }));
      setDrops(burst);
      setTimeout(() => setDrops([]), 950);
    }, 450);
  };

  return (
    <section
      className="card relative overflow-hidden border-pastel-blue/20"
      aria-label="Улов дня"
    >
      {/* 3 слоя волн */}
      <div
        className="wave-bob pointer-events-none absolute inset-x-0 bottom-0 h-40"
        aria-hidden="true"
      >
        <svg
          className="wave-l1"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0 55 Q150 15 300 55 T600 55 T900 55 T1200 55 V100 H0Z"
            fill="#123a6b"
            opacity=".55"
          />
        </svg>
        <svg
          className="wave-l2"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0 65 Q150 35 300 65 T600 65 T900 65 T1200 65 V100 H0Z"
            fill="#2a6fb0"
            opacity=".4"
          />
        </svg>
        <svg
          className="wave-l3"
          viewBox="0 0 1200 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0 75 Q150 50 300 75 T600 75 T900 75 T1200 75 V100 H0Z"
            fill="#A0C4FF"
            opacity=".3"
          />
        </svg>
      </div>

      <div className="relative grid items-center gap-8 p-6 md:p-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div>
          <h2 className="section-title">
            🎣 Улов <span className="section-accent">дня</span>
          </h2>
          <p className="mt-2 text-sm text-ink-dim">
            Не знаешь, во что зайти? Закинь удочку в каталог из {games.length}{" "}
            рогаликов — вдруг клюнет легенда.
          </p>
          <div className="mt-5 flex items-end gap-4">
            <button
              type="button"
              onClick={cast}
              disabled={phase === "casting"}
              className="btn-primary !px-6 !py-3 text-base"
            >
              <span
                className={
                  "text-xl " + (phase === "casting" ? "animate-bounce" : "")
                }
              >
                🎣
              </span>
              {phase === "casting"
                ? "Подсечка!.."
                : caught
                  ? "Ещё разок!"
                  : "Поймать случайную игру"}
            </button>
            <img
              src={MASCOTS.fisher}
              alt="Кроассан-рыбак"
              className="hidden w-28 -scale-x-100 drop-shadow-[0_6px_16px_rgba(0,0,0,.5)] sm:block"
              loading="lazy"
            />
          </div>
        </div>

        <div
          className="relative flex min-h-[250px] items-center justify-center"
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
          {phase === "idle" && (
            <div className="wave-bob text-6xl" aria-hidden="true">
              🌊
            </div>
          )}
          {phase === "casting" && (
            <div className="text-6xl" aria-hidden="true">
              🎣
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
                <span className="absolute left-2 top-2 catch-spring">
                  <RarityEgg
                    rarity={rarityBySlug?.[caught.slug] || "common"}
                    size={40}
                  />
                </span>
                {parseNum(caught.rating) > 0 && (
                  <span className="chip absolute right-2 top-2 border border-white/10 bg-night-900/80 text-lg">
                    <FiStar className={ratingColor(caught.rating)} />
                    <span
                      className={
                        ratingColor(caught.rating) + " text-lg font-black"
                      }
                    >
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
                    title="Почему клюнуло: настроение забега"
                  >
                    {moodOf(caught).emoji} {moodOf(caught).label}
                  </span>
                  <span className="truncate">
                    {caught.genre || "Рогалик"}
                    {caught.setting ? ` · ${caught.setting}` : ""}
                  </span>
                  <span className={statusMeta(caught.status).cls + " chip"}>
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
