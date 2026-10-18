import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronRight,
  FiChevronLeft,
  FiYoutube,
} from "react-icons/fi";
import { FaSteam } from "react-icons/fa";
import { useData } from "../components/DataProvider";
import { GameDetails } from "../components/GameDetails";
import { GameCard } from "../components/GameCard";
import { GameModal } from "../components/GameModal";
import { MITrophy } from "../components/MITrophy";
import { SITE_URL } from "../config/site.js";
import { usePageMeta } from "../utils/usePageMeta";
import { parseNum, hasMI } from "../utils/normalize";
import { ratingColor } from "../utils/statusMeta";
import { recommendSimilar } from "../utils/recommend";

// Карусель «похожих» в стиле PlayStation: стрелки, клавиатура, глубина.
function SimilarCarousel({ items, bySlug, onQuickView }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const cards = [...el.children];
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bd = Infinity;
    cards.forEach((c, i) => {
      const cc = c.offsetLeft + c.offsetWidth / 2;
      const d = Math.abs(cc - center);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    setActive(best);
  };

  const go = (dir) =>
    ref.current?.scrollBy({ left: dir * 300, behavior: "smooth" });

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label="Предыдущие похожие игры"
        className="absolute -left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-night-900/90 text-xl text-ink opacity-60 transition hover:opacity-100 hover:shadow-glow-purple"
      >
        <FiChevronLeft />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="Следующие похожие игры"
        className="absolute -right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-night-900/90 text-xl text-ink opacity-60 transition hover:opacity-100 hover:shadow-glow-purple"
      >
        <FiChevronRight />
      </button>
      <div
        ref={ref}
        onScroll={onScroll}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        tabIndex={0}
        role="region"
        aria-label="Карусель похожих игр (стрелки влево/вправо)"
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth px-2 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pastel-pink"
      >
        {items.map((g, i) => (
          <div
            key={g.slug}
            className={
              "car-item w-[260px] shrink-0 snap-start " +
              (i === active ? "" : "car-dim")
            }
          >
            <GameCard
              game={g}
              onQuickView={onQuickView}
              rarity={bySlug?.[g.slug] || "common"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GamePage() {
  const { slug } = useParams();
  const { games, bySlug } = useData();
  const [modal, setModal] = useState(null);
  const game = games.find((g) => g.slug === slug);

  usePageMeta(
    game
      ? {
          title: `${game.title} — ${game.status || "рогалик"} | Tiankami`,
          description: `${game.genre || "Рогалик"}${game.setting ? ` · ${game.setting}` : ""}. Оценка Тиана: ${parseNum(game.rating) || "—"}/10, наиграно ${parseNum(game.hours) || "—"} ч. ${String(game.notes || "").slice(0, 140)}`,
          image: game.image || "/img/og.png",
          url: `${SITE_URL}/catalog/${game.slug}/`,
        }
      : { title: "Игра не найдена — Tiankami" },
  );

  // Рекомендации: SSR — детерминированно, после маунта — лёгкий шuffles по критериям
  const [recs, setRecs] = useState(() =>
    game ? recommendSimilar(game, games, 6) : [],
  );
  useEffect(() => {
    if (!game) return;
    setRecs((r) => [...r].sort(() => Math.random() - 0.5));
  }, [game?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!game) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <div className="text-5xl" aria-hidden="true">
          🥐
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          Игра съедена кроассаном
        </h1>
        <p className="mt-2 text-sm text-ink-dim">
          Такой страницы нет. Загляни в каталог!
        </p>
        <Link to="/catalog" className="btn-primary mt-6">
          <FiArrowLeft /> В каталог
        </Link>
      </div>
    );
  }

  const hardcore = parseNum(game.complexity) >= 8;

  return (
    <div className="space-y-8">
      {/* HERO: обложка слева, текст справа — как в Steam/Backloggd.
          Было: обложка по центру на 100vh, текст прижат к её левому краю, оценка
          висела справа отдельным блоком — три разных оси на одном экране. */}
      <header className="card relative overflow-hidden">
        {/* Фоновый арт убран: при высоте карточки 300 px он резал голову персонажа
            сверху. Обложка слева и так даёт цвет, вторая копия не нужна. */}
        <div className="relative z-10 grid gap-6 p-6 md:grid-cols-[260px_minmax(0,1fr)] md:items-start md:p-8 xl:grid-cols-[260px_minmax(0,1fr)_auto]">
          <div>
            {game.image ? (
              <img
                src={game.image}
                alt={`Обложка ${game.title}`}
                width={460}
                height={215}
                className="w-full rounded-card border border-white/15 object-cover shadow-card"
              />
            ) : (
              <div className="flex aspect-[2/1] w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-white/15 bg-gradient-to-br from-night-700 to-night-600">
                <span className="text-4xl" aria-hidden="true">
                  🥐
                </span>
                <span className="px-3 text-center text-xs text-ink-dim">
                  Обложки нет — но игра уже в истории канала
                </span>
              </div>
            )}
          </div>

          <div className="min-w-0">
            <nav
              className="flex flex-wrap items-center gap-1 text-sm text-ink-dim"
              aria-label="Хлебные крошки"
            >
              <Link
                className="inline-flex min-h-6 items-center rounded-btn px-1 transition hover:text-pastel-pink"
                to="/"
              >
                Главная
              </Link>
              <FiChevronRight />
              <Link
                className="inline-flex min-h-6 items-center rounded-btn px-1 transition hover:text-pastel-pink"
                to="/catalog"
              >
                Каталог
              </Link>
              <FiChevronRight />
              <span className="font-semibold text-ink">{game.title}</span>
            </nav>
            <h1
              className={
                "mt-3 text-4xl font-black text-ink md:text-5xl " +
                (hardcore ? "death-title" : "font-display")
              }
            >
              {game.title}
            </h1>
            <p className="mt-2 text-base text-ink-dim md:text-lg">
              {game.genre}
              {game.setting ? ` · ${game.setting}` : ""}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              {parseNum(game.rating) > 0 && (
                <span className="flex items-baseline gap-1.5 xl:hidden">
                  <span
                    className={
                      "font-display text-4xl font-black " +
                      ratingColor(game.rating)
                    }
                    style={{ textShadow: "0 0 24px rgba(159,226,185,0.35)" }}
                  >
                    {parseNum(game.rating)}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-widest text-ink-dim">
                    /10 · оценка Тиана
                  </span>
                </span>
              )}
              {hasMI(game) && (
                <span className="chip border-2 border-pastel-amber/50 bg-pastel-amber/15 font-extrabold text-pastel-amber">
                  <MITrophy size="xs" /> Участник «Мастер Игорей»
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {game.steamUrl && (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2.5 text-sm font-display font-extrabold text-[#0E1621] transition duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg,#66C0F4 0%,#3E8BC0 100%)",
                    boxShadow: "0 10px 26px rgba(102,192,244,0.30)",
                  }}
                  href={game.steamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaSteam className="text-lg" /> В Steam
                </a>
              )}
              {game.youtube && (
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2.5 text-sm font-display font-extrabold text-white transition duration-300 hover:scale-[1.02]"
                  style={{
                    backgroundImage:
                      "linear-gradient(135deg,#FF2D2D 0%,#C40000 100%)",
                    boxShadow: "0 10px 26px rgba(255,0,0,0.28)",
                  }}
                  href={game.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FiYoutube className="text-lg" /> YouTube
                </a>
              )}
            </div>
          </div>

          {/* Оценка крупно в правом углу — как в дизайн.md: «оценку в углу выделить + больше».
              На узких экранах она живёт в строке чипсов выше. */}
          {parseNum(game.rating) > 0 && (
            <div className="hidden text-right xl:block">
              <div
                className={
                  "font-display text-7xl font-black leading-none " +
                  ratingColor(game.rating)
                }
                style={{ textShadow: "0 0 30px rgba(159,226,185,0.35)" }}
              >
                {parseNum(game.rating)}
              </div>
              <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-ink-dim">
                оценка Тиана / 10
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="card p-5 md:p-7">
        <GameDetails game={game} />
      </div>

      {recs.length > 0 && (
        <section>
          <h2 className="section-title mb-1 text-xl md:text-2xl">
            🤖 Похожие игры
          </h2>
          <p className="mb-2 text-xs text-ink-dim">
            Рекомендации по особенностям, жанру и сеттингу — как будто советует
            ИИ, но это опыт Тиана.
          </p>
          <SimilarCarousel
            items={recs}
            bySlug={bySlug}
            onQuickView={setModal}
          />
        </section>
      )}

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
