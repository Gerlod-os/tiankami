import { useState } from "react";
import { FiExternalLink, FiYoutube, FiCalendar, FiUsers, FiBookOpen, FiInfo } from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { GameCard } from "../components/GameCard";
import { GameModal } from "../components/GameModal";
import { MITrophy } from "../components/MITrophy";
import { MASCOTS } from "../config/mascots";
import { hasMI, isUrl } from "../utils/normalize";
import { usePageMeta } from "../utils/usePageMeta";
import { RarityEgg } from "../components/RarityEgg";

export function MIPage() {
  const { games, bySlug } = useData();
  const [modal, setModal] = useState(null);
  usePageMeta({
    title: "Мастер Игорей — Tiankami",
    description:
      "Мастер Игорей: соревнование стримеров по рогаликам. Игры-участники, выпуски, кубки и правила.",
  });

  const miGames = games.filter((g) => hasMI(g));
  const episodes = miGames.filter((g) => isUrl(g.miVideo));

  return (
    <div className="space-y-10">
      {/* Hero */}
      <header className="card mi-bg relative overflow-hidden p-8 text-center md:p-14">
        <MITrophy size="lg" className="mx-auto" />
        <h1 className="death-title mt-4 font-gothic text-4xl font-bold text-pastel-amber md:text-6xl">
          Мастер Игорей
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-dim">
          Эпичное соревнование стримеров по рогаликам. Независимые забеги,
          одинаковые правила, честная борьба за кубок.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="chip border-2 border-pastel-amber/50 bg-pastel-amber/15 font-extrabold text-pastel-amber text-base">
            🎮 Тиан — участник
          </span>
          <span className="chip border border-white/10 bg-white/5 text-ink-dim">
            🏆 {miGames.length} игр прошло
          </span>
        </div>
      </header>

      {/* Описание и правила */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <FiInfo className="text-pastel-blue" />
            <h2 className="section-title text-xl">Что такое МИ</h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-dim">
            Мастер Игорей — ежемесячное соревнование стримеров-рогаликов.
            Каждый сезон выбирается игра, все участники проходят её по
            одинаковым правилам. Побеждает тот, кто быстрее достигнет
            максимального результата.
          </p>
        </section>
        <section className="card p-6">
          <div className="flex items-center gap-2 mb-3">
            <FiBookOpen className="text-pastel-purple" />
            <h2 className="section-title text-xl">Правила</h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-dim">
            Одинаковые условия для всех участников: один и тот же старт,
            одинаковые модификаторы сложности. Забеги записываются на стриме.
            Полные правила каждого сезона — в описании под выпуском на YouTube.
          </p>
        </section>
      </div>

      {/* Участники */}
      <section className="card p-6 md:p-8">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="text-pastel-mint" />
          <h2 className="section-title text-xl">Участники</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <span className="chip border-2 border-pastel-amber/50 bg-pastel-amber/15 text-pastel-amber">
            🎮 Tiankami
          </span>
          <span className="chip border border-white/10 bg-white/5 text-ink-dim">
            Другие стримеры — состав в каждом выпуске
          </span>
        </div>
      </section>

      {/* Игры */}
      <section>
        <h2 className="section-title mb-2 text-2xl">
          🏆 Игры <span className="text-ink-dim text-base">({miGames.length})</span>
        </h2>
        <p className="mb-4 text-sm text-ink-dim">
          Все игры, участвовавшие в Мастер Игорей — с датами, статусами и кубками.
        </p>
        <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {miGames.map((g, i) => (
            <GameCard
              key={g.slug}
              game={g}
              onQuickView={setModal}
              rarity={bySlug?.[g.slug] || "common"}
              delay={i % 8}
            />
          ))}
        </div>
      </section>

      {/* Выпуски */}
      {episodes.length > 0 && (
        <section className="card p-6 md:p-8">
          <div className="flex items-center gap-2 mb-4">
            <FiYoutube className="text-red-300" />
            <h2 className="section-title text-xl">🎬 Выпуски</h2>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2">
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

      {/* Mascot */}
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
