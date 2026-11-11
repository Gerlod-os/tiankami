import { useState } from "react";
import { Link } from "react-router-dom";
import { FiUsers, FiBookOpen, FiInfo, FiAward, FiPlay, FiArrowRight } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";
import { useData } from "../components/DataProvider";
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
    // Как карточка игры: постер на всю верхнюю часть, под ним инфоблок с
    // названием и кнопкой страницы игры. Ни подписей, ни крупной залитой
    // кнопки — только контурная иконка play, обложка не загораживается
    // (замечание владельца 11.11.2026).
    <div className="card overflow-hidden">
      <div className="relative aspect-[2/1] overflow-hidden bg-night-900">
        {playing && autoplayUrl ? (
          <iframe
            className="absolute inset-0 h-full w-full"
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
            className="group absolute inset-0 flex items-center justify-center"
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
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-300 group-hover:scale-[1.03]"
                onError={(e) => {
                  if (posterFallback && e.currentTarget.src !== posterFallback)
                    e.currentTarget.src = posterFallback;
                }}
              />
            )}
            <span className="absolute inset-0 bg-gradient-to-t from-night-900/70 via-transparent to-transparent" />
            <span className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/85 bg-night-900/25 text-white backdrop-blur-sm transition group-hover:scale-110">
              <FiPlay className="ml-0.5 text-lg" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-pastel-pink/25 bg-night-600/60 p-3">
        <span className="min-w-0 flex-1 truncate font-display text-sm font-extrabold text-ink sm:text-base">
          {game.title}
        </span>
        <Link
          to={`/catalog/${game.slug}`}
          className="btn-ghost !min-h-8 !px-3 !py-1 text-xs"
          title={`Открыть страницу ${game.title}`}
        >
          <FiArrowRight /> Страница игры
        </Link>
      </div>
    </div>
  );
}

export function MIPage() {
  const { games } = useData();
  const [modal, setModal] = useState(null);
  usePageMeta({
    title: "Мастер Игорей — Tiankami",
    description:
      "Мастер Игорей: соревнование стримеров по рогаликам. Игры-участники, выпуски, кубки и правила.",
  });

  const miGames = games.filter((g) => hasMI(g));
  // Дата выхода выпуска в данных — playedDate (ДД.ММ.ГГГГ), отдельного поля
  // нет. Сначала новые; у всех 23 выпусков дата заполнена (замер 11.11.2026).
  const dateKey = (d) => {
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(String(d || "").trim());
    return m ? Number(m[3] + m[2] + m[1]) : 0;
  };
  const episodes = miGames
    .filter((g) => isUrl(g.miVideo))
    .sort((a, b) => dateKey(b.playedDate) - dateKey(a.playedDate));

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
            <h2 className="t-h3">Что такое МИ</h2>
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
            <h2 className="t-h3">Правила</h2>
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
          <h2 className="t-h3">Участники</h2>
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

      {/* Блок «Игры» и подпись «Выпуски» убраны: остаются только карточки
          видео со ссылками (11.11.2026). */}
      {episodes.length > 0 && (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {episodes.map((g) => (
            <li key={g.slug}>
              <EpisodeCard game={g} />
            </li>
          ))}
        </ul>
      )}

      {/* Маскота в конце страницы убрал по просьбе владельца 18.10.2026:
          он стоял после списка выпусков один и выглядел потерянным */}

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
