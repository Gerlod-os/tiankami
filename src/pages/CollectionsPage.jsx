import { useData } from "../components/DataProvider";
import { CollectionCard } from "../components/CollectionCard";
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
            <h1 className="t-h1">
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
        {(collections || []).map((c) => (
          <CollectionCard key={c.slug} collection={c} byTitle={byTitle} />
        ))}
      </div>
    </div>
  );
}
