import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { RarityEgg } from "../components/RarityEgg";
import { CollectionIcon } from "../components/CollectionIcon";
import { MASCOTS } from "../config/mascots";
import { ratingColor } from "../utils/statusMeta";
import { parseNum } from "../utils/normalize";
import { usePageMeta } from "../utils/usePageMeta";

export function CollectionsPage() {
  const { collections, bySlug, games } = useData();
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
          const preview = c.games
            .slice(0, 3)
            .map((g) => byTitle.get(String(g.name).toLowerCase()))
            .filter(Boolean);
          return (
            <Link
              key={c.slug}
              to={`/collections/${c.slug}`}
              className={
                "card card-hover flex flex-col p-5 " +
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
              {/* Один вид у всех подборок: три превью-карточки игр. Веер оставлен
                  только на главной — здесь он делал золотую непохожей на остальные
                  (замечание владельца 18.10.2026). */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {preview.map((g) => (
                  <span
                    key={g.slug}
                    className="block min-w-0 overflow-hidden rounded-btn border border-white/10 bg-night-900/60"
                  >
                    <img
                      src={g.image}
                      alt=""
                      width={460}
                      height={215}
                      loading="lazy"
                      className="aspect-[2/1] w-full object-cover"
                    />
                    <span className="block px-1.5 py-1">
                      <span className="line-clamp-1 text-[11px] font-bold text-ink">
                        {g.title}
                      </span>
                      <span className="mt-0.5 flex items-center justify-between gap-1">
                        <RarityEgg
                          rarity={bySlug?.[g.slug] || "common"}
                          size={12}
                        />
                        {parseNum(g.rating) > 0 && (
                          <span
                            className={
                              "text-[10px] font-bold " + ratingColor(g.rating)
                            }
                          >
                            {parseNum(g.rating)}/10
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                ))}
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
