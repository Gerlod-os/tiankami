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

  const byTitle = new Map(games.map((g) => [String(g.name).toLowerCase(), g]));
  const golden = /золотой/i.test(collection.name);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/collections" className="btn-ghost !px-3 !py-1.5 text-xs">
        <FiArrowLeft /> Все подборки
      </Link>

      {/* Заголовок подборки */}
      <div className={"card relative overflow-hidden p-6 md:p-8 " + (golden ? "gold-card" : "")}>
        <div className="flex items-center gap-4">
          {golden ? (
            <RarityEgg rarity="legendary" size={56} />
          ) : (
            <RarityEgg rarity={golden ? "legendary" : "rare"} size={40} />
          )}
          <div>
            <h1 className={`section-title text-3xl ${golden ? "text-pastel-amber" : ""}`}
              style={golden ? {
                textShadow: "0 0 30px rgba(255,217,160,0.5)",
              } : {}}>
              {collection.name}
            </h1>
            {collection.description && (
              <p className="mt-2 text-lg text-ink-dim">{collection.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Список игр */}
      <ol className="space-y-3">
        {collection.games.map((g, i) => {
          const match = byTitle.get(String(g.name).toLowerCase());
          const pos = g.rank ? parseInt(g.rank, 10) : i + 1;
          return (
            <li key={`${g.name}-${i}`}>
              {match ? (
                <Link
                  to={`/catalog/${match.slug}`}
                  className="card card-hover flex items-center gap-4 p-4 transition duration-300 hover:scale-[1.02] hover:shadow-card"
                >
                  {/* Мини-обложка */}
                  {match.image && (
                    <img
                      src={match.image}
                      alt={match.title}
                      className="h-16 w-16 shrink-0 rounded-card object-cover border border-white/10"
                      loading="lazy"
                    />
                  )}
                  {/* Номер */}
                  <span className="w-10 shrink-0 text-center font-display text-2xl font-black text-pastel-purple">
                    {rankMedal(g.rank) || `#${pos}`}
                  </span>
                  {/* Название */}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-lg font-extrabold text-ink"
                      style={golden ? {
                        background: "linear-gradient(90deg, #ffd880, #ffb6c1)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                      } : {}}>
                      {g.name}
                    </span>
                    <span className="block truncate text-xs text-ink-dim">
                      {match.genre || "Рогалик"}
                    </span>
                  </span>
                  {/* Яйцо */}
                  <RarityEgg rarity={bySlug?.[match.slug] || "common"} size={32} />
                  {/* Рейтинг */}
                  {parseNum(match.rating) > 0 && (
                    <span className="chip border border-white/10 bg-night-900/70 text-base">
                      <FiStar className={ratingColor(match.rating)} />
                      <span className={ratingColor(match.rating) + " font-display font-extrabold"}>
                        {parseNum(match.rating)}/10
                      </span>
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
