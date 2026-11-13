import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiArrowLeft,
  FiChevronRight,
  FiChevronLeft,
} from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { GameDetails } from "../components/GameDetails";
import { GameChips } from "../components/GameChips";
import { GameCard } from "../components/GameCard";
import { GameModal } from "../components/GameModal";
import { SITE_URL } from "../config/site.js";
import { usePageMeta } from "../utils/usePageMeta";
import { parseNum } from "../utils/normalize";
import { ratingColor } from "../utils/statusMeta";
import { recommendSimilar } from "../utils/recommend";

// Карусель «похожих» в стиле PlayStation: стрелки, клавиатура, глубина.
// Круг: набор повторяется трижды, старт — в средней копии. У края средней копии
// scrollLeft перескакивает на ширину одного набора, поэтому листать можно в обе
// стороны без конца и стрелки никогда не упираются (замер 18.10.2026).
function SimilarCarousel({ items, bySlug, onQuickView, openSlug }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);

  // Мгновенный прыжок: при scroll-behavior: smooth браузер анимирует и запись,
  // и нормализацию, и карусель гуляет между копиями (замер 18.10.2026).
  const jumpTo = (x) => {
    const el = ref.current;
    if (!el) return;
    const prev = el.style.scrollBehavior;
    el.style.scrollBehavior = "auto";
    el.scrollLeft = x;
    el.style.scrollBehavior = prev;
  };

  // Края средней копии: от неё и считаем прыжок — одной шириной набора.
  const bounds = () => {
    const el = ref.current;
    if (!el || !items.length) return null;
    const first = el.children[0];
    const middle = el.children[items.length];
    if (!first || !middle) return null;
    const start = middle.offsetLeft - first.offsetLeft;
    return { start, width: start };
  };

  useEffect(() => {
    const el = ref.current;
    const b = bounds();
    if (!el || !b || !items.length) return;
    // Старт — начало средней копии. Карточка встаёт на свой внутренний отступ,
    // первая не срезана: scroll-snap может докрутить на пару пикселей.
    jumpTo(b.start - 8);
  }, [items.map((g) => g.slug).join(",")]);

  const onScroll = () => {
    const el = ref.current;
    const b = bounds();
    if (!el || !b) return;
    // Держим окно внутри средней копии: ушли к краю — приводим к ближайшей копии
    // ЦЕЛЫМ числом наборов. Прыжок «на один набор от текущего края» попадал за
    // противоположный порог, карусель откатывалась назад и застревала на первой
    // карточке средней копии (замер 18.10.2026: влево 1674 → 1398 → 1122 → 846 и стоп).
    const rel = el.scrollLeft - b.start;
    if (Math.abs(rel) > b.width * 0.5) {
      jumpTo(el.scrollLeft - Math.round(rel / b.width) * b.width);
    }

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
    setActive(best % items.length);
  };

  // Шаг — ровно одна карточка с промежутком. Берём из разметки, а не числом:
  // ширина карточки может поменяться, и тогда 300 px перестанет совпадать с шагом.
  const go = (dir) => {
    const el = ref.current;
    if (!el) return;
    const a = el.children[0];
    const b = el.children[1];
    const step = a && b ? b.offsetLeft - a.offsetLeft : 276;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const looped = [...items, ...items, ...items];

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
        aria-label="Карусель похожих игр: шесть игр по кругу (стрелки влево/вправо)"
        className="flex gap-4 overflow-x-auto scroll-smooth px-2 py-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pastel-pink"
      >
        {looped.map((g, i) => (
          <div
            key={`${g.slug}-${i}`}
            className={
              "car-item w-[260px] shrink-0 " +
              (i % items.length === active ? "" : "car-dim")
            }
          >
            <GameCard
              game={g}
              onQuickView={onQuickView}
              openSlug={openSlug}
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

  // Перешли на другую игру — окно быстрого просмотра закрываем. При смене slug
  // React Router не размонтирует страницу, поэтому состояние модалки живёт
  // дальше и висело поверх новой игры (слово владельца 13.11.2026).
  useEffect(() => {
    setModal(null);
  }, [slug]);

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

  // Рекомендации считаются одинаково на сервере и в браузере: порядок по весам
  // (жанр → сеттинг → теги) больше не перемешивается после маунта — иначе
  // «лучшая» игра оказывалась третьей (решение владельца 18.10.2026).
  const recs = game ? recommendSimilar(game, games, 10) : [];

  if (!game) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <div className="text-5xl" aria-hidden="true">
          🥐
        </div>
        <h1 className="font-hero mt-4 text-2xl font-extrabold text-ink">
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
      {/* Одна карточка на всю страницу: шапка и детали жили в двух рамках,
          между ними была пустота (замечание владельца 11.11.2026). */}
      <section className="card overflow-hidden">
      <header className="relative overflow-hidden">
        {/* Две колонки, обе по высоте: обложка растянута на всю шапку, справа
            текст и кнопки прижаты к низу. Третьей колонки с крупной оценкой
            больше нет — она оставляла пустой правый угол (11.11.2026). */}
        <div className="relative z-10 grid gap-6 p-6 md:grid-cols-[minmax(0,380px)_minmax(0,1fr)] md:items-stretch md:gap-8 md:p-8 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)_auto]">
          <div className="relative min-h-[220px]">
            {game.image ? (
              // Обложка кликабельна, если есть прохождение: отклик на наведение
              // как у характеристик — подъём и лёгкое увеличение (11.11.2026).
              game.youtube ? (
                <a
                  href={game.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap block h-full"
                  title={`Открыть прохождение ${game.title} на YouTube`}
                >
                  <img
                    src={game.image}
                    alt={`Обложка ${game.title}`}
                    width={460}
                    height={215}
                    className="h-full min-h-[220px] w-full rounded-card border border-white/15 object-cover shadow-card"
                  />
                </a>
              ) : (
                <img
                  src={game.image}
                  alt={`Обложка ${game.title}`}
                  width={460}
                  height={215}
                  className="h-full min-h-[220px] w-full rounded-card border border-white/15 object-cover shadow-card"
                />
              )
            ) : (
              <div className="flex h-full min-h-[220px] w-full flex-col items-center justify-center gap-2 rounded-card border border-dashed border-white/15 bg-gradient-to-br from-night-700 to-night-600">
                <span className="text-4xl" aria-hidden="true">
                  🥐
                </span>
                <span className="px-3 text-center text-xs text-ink-dim">
                  Обложки нет — но игра уже в истории канала
                </span>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
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
              className="font-hero mt-3 text-3xl font-black text-ink md:text-4xl"
              style={
                hardcore
                  ? { textShadow: "0 0 18px rgba(255,143,163,0.45), 0 2px 0 rgba(0,0,0,0.6)" }
                  : undefined
              }
            >
              {game.title}
            </h1>
            {/* Чипсы (редкость, статус, настроение, МИ) — в свободном месте
                шапки. Раньше висели посреди деталей под постером. */}
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <GameChips game={game} rarity={bySlug?.[game.slug] || "common"} />
              {/* На узких экранах оценка живёт здесь, на xl — крупно справа. */}
              {parseNum(game.rating) > 0 && (
                <span className="flex items-baseline gap-1 xl:hidden">
                  <span
                    className={
                      "font-display text-3xl font-black leading-none " +
                      ratingColor(game.rating)
                    }
                  >
                    {parseNum(game.rating)}
                  </span>
                  <span className="t-micro">
                    /10
                  </span>
                </span>
              )}
            </div>

            {/* Теги игры — справа от обложки, под чипсами. Крупнее обычного
                чипса: это не служебная метка, а описание игры, и под шкалами
                они терялись (слово владельца 12.11.2026). */}
            {game.features && (
              <div className="mt-6 flex flex-wrap gap-2">
                {String(game.features)
                  .split(",")
                  .map((f) => f.trim())
                  .filter(Boolean)
                  .map((f) => (
                    <span
                      key={f}
                      className="chip border border-pastel-purple/30 bg-pastel-purple/10 px-3.5 py-1.5 text-sm text-pastel-purple"
                    >
                      {f}
                    </span>
                  ))}
              </div>
            )}

            {/* Кнопки Steam и YouTube переехали в детали игры — в пустое место
                справа от шкал (слово владельца 12.11.2026): в шапке они жались
                под названием, а половина колонки шкал стояла пустой. */}
          </div>

          {/* Оценка крупно справа — как на проде: цвет по рейтингу, свечение,
              подпись под цифрой. Одна на страницу: шкала в деталях скрыта. */}
          {parseNum(game.rating) > 0 && (
            <div className="hidden text-right xl:block">
              <div
                className={
                  "font-display text-7xl font-black leading-none " +
                  ratingColor(game.rating)
                }
                style={{ textShadow: "0 0 34px rgba(160,196,255,0.35)" }}
              >
                {parseNum(game.rating)}
              </div>
              <div className="t-micro mt-2">
                оценка Тиана / 10
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Вкладок нет: впечатления снова в деталях, но внизу — под тегами
          (владелец 11.11.2026 отменил отдельную вкладку). */}
      <div className="px-6 pb-7 md:px-8">
        <GameDetails game={game} />
      </div>
      </section>

      {recs.length > 0 && (
        <section>
          <h2 className="section-title mb-1">
            Похожие игры
          </h2>
          <p className="mb-2 text-xs text-ink-dim">
            Рекомендации по жанру, сеттингу и особенностям.
          </p>
          <SimilarCarousel
            items={recs}
            bySlug={bySlug}
            onQuickView={setModal}
            openSlug={modal?.slug || ""}
          />
        </section>
      )}

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
