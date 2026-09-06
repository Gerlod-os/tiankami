import { memo, useState } from "react";
import { Link } from "react-router-dom";
import { FiClock, FiEye, FiStar } from "react-icons/fi";
import { parseNum, hasMI } from "../utils/normalize";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { RARITY_GLOW } from "../utils/rarity";
import { RarityEgg } from "./RarityEgg";
import { MITrophy } from "./MITrophy";
import { Highlight } from "./Highlight";

// Единая карточка v3: яйцо 40px СВЕРХУ справа над карточкой, hover поднимает ВСЮ
// карточку и светится цветом редкости; обложка при hover НЕ увеличивается.
// egg: "big" — яйцо 40px над карточкой (витрины), "inline" — 18px у названия (каталог)
export const GameCard = memo(function GameCard({
  game,
  onQuickView,
  highlight = "",
  rarity = "common",
  delay = 0,
  egg = "big",
}) {
  const [broken, setBroken] = useState(false);
  const meta = statusMeta(game.status);
  const rating = parseNum(game.rating);
  const cx = parseNum(game.complexity);
  const skulls = cx >= 8 ? 3 : cx >= 5 ? 2 : cx >= 1 ? 1 : 0;

  return (
    <article
      className="card card-hover group relative flex animate-fadeUp flex-col"
      style={{
        animationDelay: `${Math.min(delay, 20) * 0.05}s`,
        ["--glow"]: RARITY_GLOW[rarity] || RARITY_GLOW.common,
      }}
    >
      {egg === "big" && (
        <span className="absolute -top-5 right-5 z-10">
          <RarityEgg rarity={rarity} size={40} />
        </span>
      )}

      <Link
        to={`/catalog/${game.slug}`}
        className="relative block aspect-[2/1] overflow-hidden rounded-t-card bg-night-900"
        title={game.title}
      >
        {!broken && game.image ? (
          <img
            src={game.image}
            alt={`Обложка ${game.title}`}
            loading="lazy"
            onError={() => setBroken(true)}
            className={
              "h-full w-full object-cover " + (rating === 10 ? "glitch-hover" : "")
            }
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-night-700 via-night-600 to-night-700 p-3 text-center">
            <svg viewBox="0 0 24 24" className="h-16 w-16 opacity-30" fill="none" stroke="#B9B4CF" strokeWidth="1.5" aria-hidden="true">
              <path d="M6 9h12a4 4 0 0 1 4 4v3a3 3 0 0 1-3 3h-2l-2-2H9l-2 2H5a3 3 0 0 1-3-3v-3a4 4 0 0 1 4-4Z" />
              <circle cx="7.5" cy="13" r="1" fill="#B9B4CF" />
              <circle cx="16.5" cy="12" r="1" fill="#B9B4CF" />
              <circle cx="18" cy="14" r="1" fill="#B9B4CF" />
            </svg>
            <span className="text-xs text-ink-faint">Нет обложки</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-night-900/90 to-transparent" />
        {rating > 0 && (
          <span className="chip absolute right-2 top-2 border border-white/10 bg-night-900/80 backdrop-blur">
            <FiStar className={ratingColor(rating)} />
            <span className={ratingColor(rating)}>{rating}/10</span>
          </span>
        )}
        <span className={"chip absolute bottom-2 left-2 " + meta.cls}>
          {meta.emoji} {game.status || "—"}
        </span>
        {hasMI(game) && (
          <span className="absolute bottom-1.5 right-2">
            <MITrophy size="sm" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 rounded-b-card bg-night-600/60 p-4">
        <Link
          to={`/catalog/${game.slug}`}
          className="flex items-center gap-2 font-display text-base font-extrabold text-ink transition hover:text-pastel-pink"
        >
          {egg === "inline" && <RarityEgg rarity={rarity} size={18} className="shrink-0" />}
          <span className="line-clamp-1">
            <Highlight text={game.title} q={highlight} />
          </span>
        </Link>
        <div className="line-clamp-1 text-xs text-ink-dim">
          <Highlight text={game.genre || "Рогалик"} q={highlight} />
          {game.setting ? ` · ${game.setting}` : ""}
        </div>
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="flex items-center gap-2 text-xs text-ink-faint">
            <span className="flex items-center gap-1">
              <FiClock /> {parseNum(game.hours) || "—"} ч.
            </span>
            {skulls > 0 && (
              <span className="flex" title={`Сложность ${cx}/10`}>
                {Array.from({ length: skulls }, (_, i) => (
                  <span key={i} className="skull">💀</span>
                ))}
              </span>
            )}
          </span>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(game)}
              className="btn-ghost !px-2.5 !py-1 text-xs"
              title="Быстрый просмотр"
            >
              <FiEye /> Обзор
            </button>
          )}
        </div>
      </div>
    </article>
  );
});
