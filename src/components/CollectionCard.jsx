import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { RarityEgg } from "./RarityEgg";
import { CoverFan } from "./CoverFan";
import { CollectionIcon } from "./CollectionIcon";

// Один вид подборки для главной и страницы подборок: раньше это были две
// разные разметки (владелец 11.11.2026 просил «выглядеть как в подборках»).
export function CollectionCard({ collection: c, byTitle }) {
  const golden = /золотой/i.test(c.name);
  const preview = c.games
    .slice(0, 5)
    .map((g) => byTitle.get(String(g.name).toLowerCase()))
    .filter(Boolean);
  // В маленькой подборке веер показывает всё, поэтому справа идут названия
  // целиком. Номер берём из rank: где его нет — не выдумываем.
  const listGames = (c.games.length > 3 ? c.games.slice(3, 5) : c.games)
    .map((g) => ({
      rank: g.rank || null,
      title: byTitle.get(String(g.name).toLowerCase())?.title || g.name,
    }))
    .filter((g) => g.title);

  return (
    <Link
      to={`/collections/${c.slug}`}
      // group обязателен: веер расходится по `.group:hover .fan-img`
      className={"card card-hover group flex flex-col p-4 " + (golden ? "gold-card" : "")}
    >
      <div className="flex items-center gap-2">
        {golden ? (
          <RarityEgg rarity="legendary" size={40} />
        ) : (
          <CollectionIcon name={c.name} size={30} />
        )}
        <h3
          className={
            "line-clamp-1 font-display text-lg font-extrabold sm:text-xl " +
            (golden ? "text-pastel-amber" : "text-ink")
          }
        >
          {c.name}
        </h3>
      </div>
      {c.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-ink-dim">{c.description}</p>
      )}
      <div className="mt-3 flex items-start gap-3">
        <div className="shrink-0">
          <CoverFan games={preview} count={3} />
        </div>
        {listGames.length > 0 && (
          <ul className="min-w-0 flex-1 space-y-1 text-base font-semibold text-ink-dim">
            {listGames.map((g, i) => (
              <li key={g.title + i} className="flex gap-1.5">
                {g.rank && (
                  <span className="shrink-0 font-display text-sm font-bold text-pastel-purple">
                    {g.rank}.
                  </span>
                )}
                <span className="line-clamp-1">{g.title}</span>
              </li>
            ))}
            {c.games.length > 5 && (
              <li className="text-sm text-ink-faint">и ещё {c.games.length - 5}…</li>
            )}
          </ul>
        )}
      </div>
      <span className="flex items-center gap-1 pt-3 text-sm font-bold text-pastel-pink">
        {c.games.length} игр <FiArrowRight />
      </span>
    </Link>
  );
}
