import { Link, useParams } from "react-router-dom";
import { FiArrowLeft, FiStar } from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { RarityEgg } from "../components/RarityEgg";
import { rankMedal, ratingColor } from "../utils/statusMeta";
import { parseNum } from "../utils/normalize";
import { usePageMeta } from "../utils/usePageMeta";

export function CollectionPage() {
  const { slug } = useParams();
  const { collections, games, bySlug } = useData();
  const collection = (collections || []).find((c) => c.slug === slug);

  usePageMeta({
    title: collection
      ? `${collection.name} — подборка от Тиана | Tiankami`
      : "Подборка не найдена — Tiankami",
    description: collection?.description || "Подборка рогаликов от стримера Tiankami.",
  });

  if (!collection) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <div className="text-5xl">📦</div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          Коробка пустая!
        </h1>
        <p className="mt-2 text-sm text-ink-dim">Такой подборки нет или её ещё не собрали.</p>
        <Link to="/collections" className="btn-primary mt-6">
          <FiArrowLeft /> Ко всем подборкам
        </Link>
      </div>
    );
  }

  const byTitle = new Map(games.map((g) => [String(g.title).toLowerCase(), g]));
  const golden = /золотой/i.test(collection.name);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/collections" className="btn-ghost !px-3 !py-1.5 text-xs">
        <FiArrowLeft /> Все подборки
      </Link>
      <div className={"card flex items-center gap-4 p-6 md:p-8 " + (golden ? "gold-card" : "")}>
        {golden && <RarityEgg rarity="legendary" size={44} />}
        <div>
          <h1 className={"section-title text-3xl " + (golden ? "text-pastel-amber" : "")}>
            {collection.name}
          </h1>
          {collection.description && (
            <p className="mt-2 text-ink-dim">{collection.description}</p>
          )}
        </div>
      </div>
      <ol className="space-y-2">
        {collection.games.map((g, i) => {
          const match = byTitle.get(String(g.name).toLowerCase());
          const pos = g.rank ? parseInt(g.rank, 10) : i + 1;
          return (
            <li key={`${g.name}-${i}`}>
              {match ? (
                <Link
                  to={`/catalog/${match.slug}`}
                  className="card card-hover flex items-center gap-4 p-4"
                >
                  <span className="w-10 shrink-0 text-center font-display text-xl font-black text-pastel-purple">
                    {rankMedal(g.rank) || `#${pos}`}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display font-extrabold text-ink">
                      {g.name}
                    </span>
                    <span className="block truncate text-xs text-ink-dim">
                      {match.genre || "Рогалик"}
                    </span>
                  </span>
                  <RarityEgg rarity={bySlug?.[match.slug] || "common"} size={20} />
                  {parseNum(match.rating) > 0 && (
                    <span className="chip border border-white/10 bg-night-900/70">
                      <FiStar className={ratingColor(match.rating)} />
                      <span className={ratingColor(match.rating)}>{parseNum(match.rating)}/10</span>
                    </span>
                  )}
                </Link>
              ) : (
                <div className="card flex items-center gap-4 p-4 opacity-70">
                  <span className="w-10 shrink-0 text-center font-display text-xl font-black text-ink-faint">
                    {rankMedal(g.rank) || `#${pos}`}
                  </span>
                  <span className="truncate font-display font-bold text-ink-dim">{g.name}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
