import { useState } from "react";
import { Link } from "react-router-dom";
import { FiExternalLink, FiYoutube, FiUsers, FiBookOpen, FiInfo, FiAward, FiFilm, FiPlay, FiArrowRight } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";
import { useData } from "../components/DataProvider";
import { GameCard } from "../components/GameCard";
import { GameModal } from "../components/GameModal";
import { MITrophy } from "../components/MITrophy";
import { hasMI, isUrl } from "../utils/normalize";
import { parseYouTubeUrl, posterVideoId } from "../utils/youtube";
import { usePageMeta } from "../utils/usePageMeta";

// Карточка выпуска: постер — кадр ролика, плеер грузится по клику.
// Автозагрузка 23 iframe сразу — лишние мегабайты и тормоза (тот же довод,
// что у плеера на странице игры, замер 18.10.2026).
function EpisodeCard({ game }) {
  const [playing, setPlaying] = useState(false);
  const yt = parseYouTubeUrl(game.miVideo);
  const posterId = posterVideoId(game.miVideo);
  const poster = posterId
    ? `https://i.ytimg.com/vi/${posterId}/maxresdefault.jpg`
    : "";
  const posterFallback = posterId
    ? `https://i.ytimg.com/vi/${posterId}/mqdefault.jpg`
    : "";
  const autoplayUrl = yt?.embedUrl
    ? yt.embedUrl + (yt.embedUrl.includes("?") ? "&" : "?") + "autoplay=1"
    : "";

  return (
    <div className="group/ep overflow-hidden rounded-card">
      {playing && autoplayUrl ? (
        <iframe
          className="aspect-video w-full"
          src={autoplayUrl}
          title={`Выпуск МИ: ${game.title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-night-800"
          aria-label={`Смотреть выпуск МИ: ${game.title}`}
        >
          {poster && (
            <img
              src={poster}
              alt=""
              aria-hidden="true"
              width={1280}
              height={720}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.03] group-hover:opacity-95"
              onError={(e) => {
                if (posterFallback && e.currentTarget.src !== posterFallback)
                  e.currentTarget.src = posterFallback;
              }}
            />
          )}
          <span className="absolute inset-0 bg-night-900/45" />
          <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-[#FF2D2D] text-white shadow-[0_8px_22px_rgba(255,0,0,0.35)] transition group-hover:scale-110">
            <FiPlay className="ml-0.5 text-xl" aria-hidden="true" />
          </span>
        </button>
      )}
      {/* Снизу — ссылка на страницу игры, как просил владелец 11.11.2026.
          Внешняя ссылка на YouTube осталась мелкой иконкой рядом. */}
      <div className="px-1 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 truncate font-display text-sm font-extrabold text-ink">
            {game.title}
          </span>
          <a
            className="shrink-0 text-ink-faint transition hover:text-[#FF2D2D]"
            href={game.miVideo}
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть выпуск на YouTube"
            aria-label={`Открыть выпуск ${game.title} на YouTube`}
          >
            <FiExternalLink />
          </a>
        </div>
        <Link
          to={`/catalog/${game.slug}`}
          className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-pastel-amber transition hover:text-ink"
          title={`Страница игры ${game.title}`}
        >
          Страница игры <FiArrowRight />
        </Link>
      </div>
    </div>
  );
}

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
        <h1
          className="font-hero mt-4 text-4xl font-black text-pastel-amber md:text-6xl"
          style={{ textShadow: "0 0 24px rgba(255,217,160,0.35)" }}
        >
          Мастер Игорей
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-ink-dim">
          Эпичное соревнование стримеров по рогаликам. Независимые забеги,
          одинаковые правила, честная борьба за кубок.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {/* Плашку «Тиан — участник» убрал по просьбе владельца 18.10.2026:
              страница и так про соревнование, лишняя плашка дублировала заголовок */}
          <span className="chip border border-white/10 bg-white/5 text-ink-dim">
            <FiAward className="inline" aria-hidden="true" /> {miGames.length} игр прошло
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
            Мастер Игорей — регулярное соревнование стримеров-рогаликов.
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
            <FaGamepad className="inline" aria-hidden="true" /> Tiankami
          </span>
          <span className="chip border border-white/10 bg-white/5 text-ink-dim">
            Другие стримеры — состав в каждом выпуске
          </span>
        </div>
      </section>

      {/* Игры */}
      <section>
        <h2 className="section-title mb-2 text-2xl">
          <FiAward className="inline" aria-hidden="true" /> Игры <span className="text-ink-dim text-base">({miGames.length})</span>
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
        <section>
          {/* Без карточки-обёртки: владелец 11.11.2026 попросил «без фона,
              красиво по карточкам» — остаются постеры и подписи. */}
          <div className="flex items-center gap-2 mb-4">
            <FiYoutube className="text-red-300" />
            <h2 className="section-title text-xl"><FiFilm className="inline" aria-hidden="true" /> Выпуски</h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {episodes.map((g) => (
              <li key={g.slug}>
                <EpisodeCard game={g} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Маскота в конце страницы убрал по просьбе владельца 18.10.2026:
          он стоял после списка выпусков один и выглядел потерянным */}

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
