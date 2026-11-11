import { memo, useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { FiClock, FiEye, FiStar } from "react-icons/fi";
import { FaSkull } from "react-icons/fa";
import { parseNum, hasMI } from "../utils/normalize";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { RARITY_GLOW } from "../utils/rarity";
import { RarityEgg } from "./RarityEgg";
import { MITrophy } from "./MITrophy";
import { Highlight } from "./Highlight";

// Единая карточка v4: яйцо редкости — всегда слева от названия, как в каталоге
// (решение владельца 18.10.2026: один вид на всех страницах). Кубок МИ живёт
// под обложкой, над кнопкой «Обзор», а не на обложке.
export const GameCard = memo(function GameCard({
  game,
  onQuickView,
  highlight = "",
  rarity = "common",
  delay = 0,
}) {
  const [broken, setBroken] = useState(false);
  const meta = statusMeta(game.status);
  const rating = parseNum(game.rating);
  const cx = parseNum(game.complexity);
  const skulls = cx >= 8 ? 3 : cx >= 5 ? 2 : cx >= 1 ? 1 : 0;

  // Клик по карточке открывает быстрый просмотр, но ссылка остаётся ссылкой:
  // в HTML живёт href (гейт внутренних ссылок и поисковики), а клик перехватываем.
  // Ctrl/Cmd/Shift/средняя кнопка — обычное открытие страницы в новой вкладке.
  const quickOpen = useCallback(
    (e) => {
      if (!onQuickView) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      onQuickView(game);
    },
    [onQuickView, game]
  );

  return (
    <article
      className="card card-hover group relative flex animate-fadeUp flex-col"
      style={{
        animationDelay: `${Math.min(delay, 20) * 0.05}s`,
        ["--glow"]: RARITY_GLOW[rarity] || RARITY_GLOW.common,
      }}
    >
      <Link
        to={`/catalog/${game.slug}`}
        onClick={quickOpen}
        className="relative block aspect-[2/1] overflow-hidden rounded-t-card bg-night-900"
        title={onQuickView ? `${game.title} — быстрый просмотр` : game.title}
        aria-label={game.title}
      >
        {!broken && game.image ? (
          <img
            src={game.image}
            alt={`Обложка ${game.title}`}
            width={460}
            height={215}
            loading="lazy"
            onError={() => setBroken(true)}
            className={"h-full w-full object-cover "}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-night-700 via-night-600 to-night-700 p-3 text-center">
            <svg
              viewBox="0 0 24 24"
              className="h-16 w-16 opacity-30"
              fill="none"
              stroke="#B9B4CF"
              strokeWidth="1.5"
              aria-hidden="true"
            >
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
          <span className="chip absolute right-2 top-2 border border-white/10 bg-night-900/90">
            <FiStar className={ratingColor(rating)} />
            <span className={ratingColor(rating)}>{rating}/10</span>
          </span>
        )}
        <span className={"chip absolute bottom-2 left-2 " + meta.cls}>
          {meta.icon && <meta.icon className="shrink-0" aria-hidden="true" />} {game.status || "—"}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-1 rounded-b-card bg-night-600/60 p-3 sm:p-4">
        <Link
          to={`/catalog/${game.slug}`}
          onClick={quickOpen}
          className="flex min-h-8 items-center gap-2 font-display text-sm font-extrabold text-ink transition hover:text-pastel-pink sm:text-base"
        >
          <RarityEgg rarity={rarity} size={18} className="shrink-0" />
          <span className="line-clamp-1">
            <Highlight text={game.title} q={highlight} />
          </span>
        </Link>
        <div className="line-clamp-1 text-xs text-ink-dim">
          <Highlight text={game.genre || "Рогалик"} q={highlight} />
          {game.setting ? ` · ${game.setting}` : ""}
        </div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <span className="flex items-center gap-2 text-xs text-ink-faint">
            <span className="flex items-center gap-1">
              <FiClock /> {parseNum(game.hours) || "—"} ч.
            </span>
            {skulls > 0 && (
              <span className="flex" title={`Сложность ${cx}/10`}>
                {Array.from({ length: skulls }, (_, i) => (
                  <FaSkull key={i} className="skull" aria-hidden="true" />
                ))}
              </span>
            )}
          </span>
          <span className="flex flex-col items-end gap-1">
            {hasMI(game) && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-pastel-amber">
                <MITrophy size="xs" /> МИ
              </span>
            )}
            {/* «Обзор» ведёт на страницу игры — владелец 11.11.2026 развёл два
                действия: клик по карточке — быстрый просмотр, «Обзор» — страница. */}
            <Link
              to={`/catalog/${game.slug}`}
              className="btn-ghost !min-h-8 !px-3 !py-1 text-xs"
              title={`Открыть страницу ${game.title}`}
            >
              <FiEye /> Обзор
            </Link>
          </span>
        </div>
      </div>
    </article>
  );
});
