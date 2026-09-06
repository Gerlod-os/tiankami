import { useState } from "react";
import { FiExternalLink, FiYoutube } from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { GameCard } from "../components/GameCard";
import { GameModal } from "../components/GameModal";
import { MITrophy } from "../components/MITrophy";
import { MASCOTS } from "../config/mascots";
import { hasMI, isUrl } from "../utils/normalize";
import { usePageMeta } from "../utils/usePageMeta";

// 🏆 «Мастер Игорей» — соревнование стримеров по рогаликам.
// Данные — только из таблицы (hasMI / miVideo); участники не выдумываются.
export function MIPage() {
  const { games, bySlug } = useData();
  const [modal, setModal] = useState(null);
  usePageMeta({
    title: "Мастер Игорей — Tiankami",
    description:
      "Мастер Игорей: соревнование стримеров по рогаликам. Игры-участники, выпуски и кубки.",
  });

  const miGames = games.filter((g) => hasMI(g));
  const episodes = miGames.filter((g) => isUrl(g.miVideo));

  return (
    <div className="space-y-10">
      <header className="card mi-bg relative overflow-hidden p-8 text-center md:p-14">
        <MITrophy size="lg" className="mx-auto" />
        <h1 className="death-title mt-4 font-gothic text-4xl font-bold text-pastel-amber md:text-6xl">
          Мастер Игорей
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-ink-dim">
          Соревнование стримеров по рогаликам. Эпичные забеги, напряжённая борьба,
          незабвенные моменты — и один очень уютный кроассан в составе участников.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="chip border-2 border-pastel-amber/50 bg-pastel-amber/15 font-extrabold text-pastel-amber">
            🎮 Тиан — участник
          </span>
          <span className="chip border border-white/10 bg-white/5 text-ink-dim">
            + другие стримеры — состав в каждом выпуске
          </span>
        </div>
      </header>

      <section className="card p-6 md:p-8">
        <h2 className="section-title text-2xl">📜 Правила</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-dim">
          Стримеры проходят рогалики на скорость/результат по правилам выпуска:
          одинаковые условия, честные забеги и много боли. Полные правила каждого
          сезона — в закрепе под выпуском на YouTube.
        </p>
      </section>

      <section>
        <h2 className="section-title mb-6 text-2xl">
          🏆 Игры, участвовавшие в МИ <span className="text-ink-dim text-base">({miGames.length})</span>
        </h2>
        <div className="grid gap-x-4 gap-y-10 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          {miGames.map((g, i) => (
            <GameCard key={g.slug} game={g} onQuickView={setModal} rarity={bySlug?.[g.slug] || "common"} delay={i % 8} />
          ))}
        </div>
      </section>

      {episodes.length > 0 && (
        <section className="card p-6 md:p-8">
          <h2 className="section-title text-2xl">🎬 Выпуски</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {episodes.map((g) => (
              <li key={g.slug}>
                <a
                  className="btn-ghost w-full justify-start text-sm"
                  href={g.miVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiYoutube className="shrink-0 text-red-300" />
                  <span className="truncate">{g.title}</span>
                  <FiExternalLink className="ml-auto shrink-0 text-ink-faint" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex justify-center">
        <img
          src={MASCOTS.croissant}
          alt="Кроассан-геймпад держит кубок"
          className="sticker w-56 -rotate-2 rounded-full transition-transform hover:rotate-0"
          loading="lazy"
        />
      </div>

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
