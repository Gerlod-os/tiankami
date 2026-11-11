import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { RarityEgg } from "../components/RarityEgg";
import { CoverFan } from "../components/CoverFan";
import { CollectionIcon } from "../components/CollectionIcon";
import { MASCOTS } from "../config/mascots";
import { usePageMeta } from "../utils/usePageMeta";

export function CollectionsPage() {
  const { collections, games } = useData();
  const byTitle = new Map(games.map((g) => [String(g.title).toLowerCase(), g]));
  usePageMeta({
    title: "Подборки от Тиана — Tiankami",
    description:
      "Авторские подборки рогаликов от стримера Tiankami: золотой список, топы по жанрам, игры для новичков и кооперативы.",
  });

  return (
    <div className="space-y-8">
      <div className="card relative overflow-hidden">
        <div className="grid items-center gap-6 p-6 md:grid-cols-[minmax(0,1fr)_320px] md:p-10">
          <div>
            <h1 className="section-title text-3xl md:text-4xl">
              <span className="h-marker">Подборки</span>{" "}
              <span className="section-accent">от Тиана</span>
            </h1>
            <p className="mt-3 max-w-xl text-ink-dim">
              Личные топы и тематические списки: что стоит играть, во что зайти
              новичку и что я считаю легендами. Открывай коробку — внутри
              мини-Тианы уже всё разложили.
            </p>
          </div>
          <img
            src={MASCOTS.collections}
            alt="Кроассан открывает коробку с мини-подборками"
            width={900}
            height={501}
            className="w-full max-w-[320px] justify-self-center rotate-2 transition-transform hover:rotate-0 drop-shadow-[0_14px_28px_rgba(0,0,0,.5)]"
            loading="lazy"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(collections || []).map((c) => {
          const golden = /золотой/i.test(c.name);
          // Пять игр: три уходят в веер, остальные — в список справа.
          const preview = c.games
            .slice(0, 5)
            .map((g) => byTitle.get(String(g.name).toLowerCase()))
            .filter(Boolean);
          // В маленькой подборке веер показывает всё, поэтому справа выводим
          // названия целиком — иначе место пустует.
          const listGames = preview.length > 3 ? preview.slice(3, 5) : preview;
          return (
            <Link
              key={c.slug}
              to={`/collections/${c.slug}`}
              className={
                // group обязателен: веер расходится по `.group:hover .fan-img`
                // (index.css). Без него на подборках он стоял неподвижно —
                // владелец 11.11.2026 попросил как на главной.
                "card card-hover group flex flex-col p-5 " +
                (golden ? "gold-card" : "")
              }
            >
              <div className="flex items-center gap-2">
                {golden ? (
                  <RarityEgg rarity="legendary" size={48} />
                ) : (
                  <CollectionIcon name={c.name} size={30} />
                )}
                <h2
                  className={
                    "line-clamp-1 font-display text-xl font-extrabold " +
                    (golden ? "text-pastel-amber" : "text-ink")
                  }
                >
                  {c.name}
                </h2>
              </div>
              {c.description && (
                <p className="mt-2 line-clamp-2 text-sm text-ink-dim">
                  {c.description}
                </p>
              )}
              {/* Веер обложек у каждой подборки — тот же вид, что у золотой на
                  главной: владелец 18.10.2026 назвал прежние карточки «старыми»
                  и попросил «везде как на золотом списке, красиво и живо». */}
              {/* Веер + список игр справа: карточки выглядели пустыми,
                  владелец 11.11.2026 попросил вернуть список, веер не убирать. */}
              <div className="mt-4 flex items-start gap-4">
                <div className="shrink-0">
                  <CoverFan games={preview} count={3} />
                </div>
                {listGames.length > 0 && (
                  <ul className="min-w-0 flex-1 space-y-1 pt-1 text-xs text-ink-dim">
                    {listGames.map((g) => (
                      <li key={g.slug} className="line-clamp-1">
                        {g.title}
                      </li>
                    ))}
                    {c.games.length > 5 && (
                      <li className="text-ink-faint">и ещё {c.games.length - 5}…</li>
                    )}
                  </ul>
                )}
              </div>
              <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-pastel-pink">
                {c.games.length} игр <FiArrowRight />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
