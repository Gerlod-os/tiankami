import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiChevronDown,
  FiFilter,
  FiStar,
  FiCalendar,
  FiArrowDown,
} from "react-icons/fi";
import { useData } from "../components/DataProvider";
import { GameCard } from "../components/GameCard";
import { GameModal } from "../components/GameModal";
import { RarityEgg } from "../components/RarityEgg";
import { Highlight } from "../components/Highlight";
import { getGameMetadata, parseNum, hasMI } from "../utils/normalize";
import { parseRuDate } from "../utils/date";
import { ratingColor } from "../utils/statusMeta";
import { topRated } from "../utils/stats";
import { usePageMeta } from "../utils/usePageMeta";

const PAGE = 24;

const EMPTY_PHRASES = [
  "Ничего не найдено 😢",
  "Рогалик сбежал из коробки...",
  "Пусто, как после забега в DBD",
  "Здесь мог быть твой рогалик",
  "Тиан ещё не добрался до этих игр",
];

const SORTS = {
  "played-desc": (a, b) =>
    (parseRuDate(b.playedDate)?.getTime() || 0) -
    (parseRuDate(a.playedDate)?.getTime() || 0),
  "rating-desc": (a, b) => parseNum(b.rating) - parseNum(a.rating),
  "hours-desc": (a, b) => parseNum(b.hours) - parseNum(a.hours),
  "release-desc": (a, b) =>
    (parseRuDate(b.releaseDate)?.getTime() || 0) -
    (parseRuDate(a.releaseDate)?.getTime() || 0),
  "progress-desc": (a, b) => parseNum(b.progress) - parseNum(a.progress),
  title: (a, b) => a.title.localeCompare(b.title, "ru"),
};

function Chip({ active, onClick, children, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={
        "chip border px-4 py-2 transition-all duration-200 " +
        (active
          ? "border-transparent bg-gradient-to-r from-pastel-pink to-pastel-purple font-extrabold text-night-900 shadow-glow-pink"
          : "border-white/10 bg-white/5 text-ink-dim hover:border-pastel-purple/40 hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

export function CatalogPage() {
  const { games, collections, bySlug } = useData();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const collectionParam = searchParams.get("collection");
  const genreParam = searchParams.get("genre");

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [dropOpen, setDropOpen] = useState(false);
  const [genresSel, setGenresSel] = useState(
    () => new Set(genreParam ? [genreParam] : []),
  );
  const MAX_GENRES = 2;
  const [status, setStatus] = useState("any");
  const [year, setYear] = useState("any");
  const [ratingMin, setRatingMin] = useState(0);
  const [complexity, setComplexity] = useState("any");
  const [hours, setHours] = useState("any");
  const [miOnly, setMiOnly] = useState(false);
  const [sort, setSort] = useState("played-desc");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE);
  const [modal, setModal] = useState(null);
  const [emptyPhrase, setEmptyPhrase] = useState(EMPTY_PHRASES[0]);
  const [teleportKey, setTeleportKey] = useState(0);
  const searchRef = useRef(null);
  const filtersRef = useRef(null);

  usePageMeta({
    title: "Каталог рогаликов — Tiankami",
    description:
      "Все рогалики стримера Tiankami: мгновенный поиск, фильтры-чипсы по жанру, статусу, оценке, сложности, часам и году.",
  });

  // Синк URL-параметров (?genre=, ?q=) даже при уже смонтированном каталоге
  useEffect(() => {
    const g = searchParams.get("genre");
    if (g) setGenresSel((s) => new Set(s).add(g));
    const qq = searchParams.get("q");
    if (qq) {
      setQ(qq);
      window.scrollTo({ top: 0 });
    }
  }, [searchParams]);

  // Телепортация при поиске
  const prevQ = useRef(q);
  useEffect(() => {
    if (prevQ.current !== q && q) {
      setTeleportKey((k) => k + 1);
      setVisible(PAGE);
    }
    prevQ.current = q;
  }, [q]);

  // «/» — фокус на поиск
  useEffect(() => {
    const onKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (
        e.key === "/" &&
        tag !== "INPUT" &&
        tag !== "TEXTAREA" &&
        tag !== "SELECT"
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Дропдаун поиска закрывается при любом скролле страницы
  useEffect(() => {
    if (!dropOpen) return undefined;
    const on = () => setDropOpen(false);
    window.addEventListener("scroll", on, { passive: true, capture: true });
    return () => window.removeEventListener("scroll", on, true);
  }, [dropOpen]);

  // Сворачивание фильтров: Escape, клик вне (НО НЕ при скролле — фильтр остаётся)
  useEffect(() => {
    if (!filtersOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setFiltersOpen(false);
    const onDown = (e) => {
      if (filtersRef.current && !filtersRef.current.contains(e.target))
        setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [filtersOpen]);

  // рандомная фраза пустого состояния — только в браузере (SSR детерминирован)
  useEffect(() => {
    setEmptyPhrase(EMPTY_PHRASES[(Math.random() * EMPTY_PHRASES.length) | 0]);
  }, []);

  const meta = useMemo(() => getGameMetadata(games), [games]);
  const statuses = useMemo(
    () =>
      [...new Set(games.map((g) => g.status).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "ru"),
      ),
    [games],
  );
  const genreCounts = useMemo(() => {
    const m = new Map();
    games.forEach((g) =>
      String(g.genre)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((x) => m.set(x, (m.get(x) || 0) + 1)),
    );
    return m;
  }, [games]);

  const collection = useMemo(() => {
    if (!collectionParam) return null;
    return (
      collections.find(
        (c) => c.name === collectionParam || c.slug === collectionParam,
      ) || null
    );
  }, [collectionParam, collections]);
  const collectionTitles = useMemo(
    () =>
      collection
        ? new Set(collection.games.map((g) => String(g.name).toLowerCase()))
        : null,
    [collection],
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = games.filter((g) => {
      if (
        collectionTitles &&
        !collectionTitles.has(String(g.title).toLowerCase())
      )
        return false;
      if (query) {
        const hay =
          `${g.title} ${g.genre} ${g.setting} ${g.features} ${g.notes}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      if (genresSel.size) {
        const gset = String(g.genre)
          .split(",")
          .map((s) => s.trim());
        if (![...genresSel].every((x) => gset.includes(x))) return false;
      }
      if (status !== "any" && g.status !== status) return false;
      if (year !== "any" && !String(g.releaseDate).includes(year)) return false;
      if (parseNum(g.rating) < ratingMin) return false;
      const cx = parseNum(g.complexity);
      if (complexity === "low" && !(cx >= 1 && cx <= 4)) return false;
      if (complexity === "mid" && !(cx >= 5 && cx <= 7)) return false;
      if (complexity === "high" && !(cx >= 8 && cx <= 10)) return false;
      const h = parseNum(g.hours);
      if (hours === "lt10" && !(h > 0 && h < 10)) return false;
      if (hours === "10-49" && !(h >= 10 && h < 50)) return false;
      if (hours === "50-99" && !(h >= 50 && h < 100)) return false;
      if (hours === "100+" && !(h >= 100)) return false;
      if (miOnly && !hasMI(g)) return false;
      return true;
    });
    return list.sort(SORTS[sort] || SORTS.title);
  }, [
    games,
    q,
    genresSel,
    status,
    year,
    ratingMin,
    complexity,
    hours,
    miOnly,
    sort,
    collectionTitles,
  ]);

  useEffect(() => {
    setVisible(PAGE);
  }, [
    q,
    genresSel,
    status,
    year,
    ratingMin,
    complexity,
    hours,
    miOnly,
    sort,
    collectionParam,
  ]);

  const sugg = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (query.length < 2) return null;
    const g = games
      .filter((x) => x.title.toLowerCase().includes(query))
      .slice(0, 5);
    const genres = meta.genres
      .filter((x) => x.toLowerCase().includes(query))
      .slice(0, 4);
    const settings = [...new Set(games.map((x) => x.setting).filter(Boolean))]
      .filter((x) => x.toLowerCase().includes(query))
      .slice(0, 3);
    const features = [
      ...new Set(
        games.flatMap((x) =>
          String(x.features)
            .split(",")
            .map((s) => s.trim()),
        ),
      ),
    ]
      .filter((x) => x && x.toLowerCase().includes(query))
      .slice(0, 3);
    if (!g.length && !genres.length && !settings.length && !features.length)
      return null;
    return { g, genres, settings, features };
  }, [q, games, meta]);

  const hasFilters =
    q ||
    genresSel.size ||
    status !== "any" ||
    year !== "any" ||
    ratingMin > 0 ||
    complexity !== "any" ||
    hours !== "any" ||
    miOnly ||
    collectionParam ||
    genreParam;

  const reset = () => {
    setQ("");
    setGenresSel(new Set());
    setStatus("any");
    setYear("any");
    setRatingMin(0);
    setComplexity("any");
    setHours("any");
    setMiOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="section-title text-3xl md:text-4xl">
          <span className="h-marker">Каталог</span>{" "}
          <span className="section-accent">рогаликов</span>
        </h1>
        <p className="mt-2 text-base text-ink-dim">
          <span className="text-ink-dim">Всего:</span>{" "}
          <b className="text-pastel-pink text-lg">{games.length}</b>{" "}
          <span className="text-ink-dim">· по фильтрам:</span>{" "}
          <b className="text-pastel-pink text-lg">{filtered.length}</b>
        </p>
      </div>

      {/* Поиск + сброс — единая панель */}
      <div className="relative mx-auto w-full max-w-3xl">
        <FiSearch className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          ref={searchRef}
          className="input glass !h-16 !rounded-card border-2 !border-transparent !pl-12 !text-base transition focus:!border-pastel-pink/60 focus:shadow-glow-pink"
          placeholder="Введите название, жанр, сеттинг…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setDropOpen(true);
          }}
          onFocus={() => setDropOpen(true)}
          onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          onKeyDown={(e) => e.key === "Escape" && setDropOpen(false)}
          aria-label="Живой поиск по каталогу"
        />
        {hasFilters && !q && (
          <button
            type="button"
            onClick={reset}
            className="absolute right-4 top-1/2 -translate-y-1/2 btn-ghost !px-2 !py-1 text-xs"
          >
            <FiX /> Сбросить всё
          </button>
        )}
        {dropOpen && sugg && (
          <div className="card absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto p-4 text-left shadow-glow-purple">
            {sugg.g.length > 0 && (
              <div className="mb-3">
                <div className="label">🔥 Популярные</div>
                {sugg.g.map((g) => (
                  <button
                    key={g.slug}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm text-ink transition hover:bg-white/5"
                    onMouseDown={() => navigate(`/catalog/${g.slug}`)}
                  >
                    <RarityEgg
                      rarity={bySlug?.[g.slug] || "common"}
                      size={16}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      <Highlight text={g.title} q={q} />
                    </span>
                    {parseNum(g.rating) > 0 && (
                      <span
                        className={
                          "flex items-center gap-1 text-xs " +
                          ratingColor(g.rating)
                        }
                      >
                        <FiStar /> {parseNum(g.rating)}/10
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            {sugg.genres.length > 0 && (
              <div className="mb-3">
                <div className="label">⚔️ Жанры</div>
                <div className="flex flex-wrap gap-1.5">
                  {sugg.genres.map((x) => (
                    <Chip
                      key={x}
                      onClick={() => {
                        setGenresSel((s) => new Set(s).add(x));
                        setQ("");
                      }}
                    >
                      <Highlight text={x} q={q} /> ({genreCounts.get(x) || 0})
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {sugg.settings.length > 0 && (
              <div className="mb-3">
                <div className="label">🏛️ Сеттинги</div>
                <div className="flex flex-wrap gap-1.5">
                  {sugg.settings.map((x) => (
                    <Chip key={x} onClick={() => setQ(x)}>
                      <Highlight text={x} q={q} />
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {sugg.features.length > 0 && (
              <div>
                <div className="label">✨ Особенности</div>
                <div className="flex flex-wrap gap-1.5">
                  {sugg.features.map((x) => (
                    <Chip key={x} onClick={() => setQ(x)}>
                      <Highlight text={x} q={q} />
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {collection && (
        <div className="card flex flex-wrap items-center gap-3 border-pastel-purple/30 p-4">
          <span className="text-2xl" aria-hidden="true">
            📦
          </span>
          <div className="min-w-0 flex-1">
            <div className="font-display font-extrabold text-ink">
              Подборка: {collection.name}
            </div>
            {collection.description && (
              <div className="text-xs text-ink-dim">
                {collection.description}
              </div>
            )}
          </div>
          <Link
            to="/catalog"
            className="btn-ghost !px-3 !py-1.5 text-xs"
            onClick={reset}
          >
            <FiX /> Сбросить
          </Link>
        </div>
      )}

      {/* Панель фильтров */}
      <div className="card space-y-4 p-4" ref={filtersRef}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="btn-ghost text-sm"
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
          >
            <FiFilter /> Фильтры
            <FiChevronDown
              className={filtersOpen ? "rotate-180 transition" : "transition"}
            />
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-dim">
              <span className="switch">
                <input
                  type="checkbox"
                  checked={miOnly}
                  onChange={(e) => setMiOnly(e.target.checked)}
                  aria-label="Только с кубком МИ"
                />
                <span className="knob" />
              </span>
              Только с кубком МИ
            </label>

            <span className="select-wrap">
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                aria-label="Год выхода"
              >
                <option value="any">Любой год</option>
                {meta.years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <FiCalendar className="sel-icon" />
            </span>

            <span className="select-wrap">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Сортировка"
              >
                <option value="played-desc">Сначала недавние</option>
                <option value="rating-desc">По оценке Тиана</option>
                <option value="hours-desc">По часам</option>
                <option value="release-desc">По дате выхода</option>
                <option value="progress-desc">По прогрессу</option>
                <option value="title">По алфавиту</option>
              </select>
              <FiArrowDown className="sel-icon" />
            </span>
          </div>
        </div>

        {filtersOpen && (
          <div className="grid animate-fadeUp gap-4 md:grid-cols-2">
            <div>
              <div className="label">Жанр (макс. 2) — работает по ИЛИ</div>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {meta.genres.slice(0, 14).map((x) => (
                  <Chip
                    key={x}
                    active={genresSel.has(x)}
                    onClick={() =>
                      setGenresSel((s) => {
                        const n = new Set(s);
                        if (n.has(x)) n.delete(x);
                        else if (n.size < MAX_GENRES) n.add(x);
                        return n;
                      })
                    }
                    disabled={!genresSel.has(x) && genresSel.size >= MAX_GENRES}
                  >
                    {x}
                    {!genresSel.has(x) && genresSel.size >= MAX_GENRES
                      ? " 🔒"
                      : ""}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <div className="label">Статус</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={status === "any"}
                    onClick={() => setStatus("any")}
                  >
                    Любой
                  </Chip>
                  {statuses.map((s) => (
                    <Chip
                      key={s}
                      active={status === s}
                      onClick={() => setStatus(status === s ? "any" : s)}
                    >
                      {s}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="label">Оценка</div>
                <div className="flex flex-wrap gap-1.5">
                  {[0, 6, 8, 9, 10].map((r) => (
                    <Chip
                      key={r}
                      active={ratingMin === r}
                      onClick={() => setRatingMin(ratingMin === r ? 0 : r)}
                    >
                      {r === 0 ? "Любая" : `⭐ ${r}+`}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="label">Сложность</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={complexity === "any"}
                    onClick={() => setComplexity("any")}
                  >
                    Любая
                  </Chip>
                  <Chip
                    active={complexity === "low"}
                    onClick={() =>
                      setComplexity(complexity === "low" ? "any" : "low")
                    }
                  >
                    💀 Лёгкие
                  </Chip>
                  <Chip
                    active={complexity === "mid"}
                    onClick={() =>
                      setComplexity(complexity === "mid" ? "any" : "mid")
                    }
                  >
                    💀💀 Средне
                  </Chip>
                  <Chip
                    active={complexity === "high"}
                    onClick={() =>
                      setComplexity(complexity === "high" ? "any" : "high")
                    }
                  >
                    💀💀💀 Хардкор
                  </Chip>
                </div>
              </div>
              <div>
                <div className="label">Часы</div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["any", "Любые"],
                    ["lt10", "<10ч"],
                    ["10-49", "10–50ч"],
                    ["50-99", "50–100ч"],
                    ["100+", "100ч+"],
                  ].map(([v, l]) => (
                    <Chip
                      key={v}
                      active={hours === v}
                      onClick={() => setHours(hours === v ? "any" : v)}
                    >
                      {l}
                    </Chip>
                  ))}
                  {hasFilters && (
                    <Chip onClick={reset}>
                      <FiX /> Сбросить всё
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-8 py-16 text-center">
          <img
            src="/img/mascot-sad.png"
            alt="Грустный чиби-герой"
            className="w-56 drop-shadow-none"
            loading="lazy"
          />
          <p className="font-display text-2xl font-extrabold text-ink">
            {emptyPhrase}
          </p>
          <div className="grid w-full max-w-3xl gap-x-6 gap-y-8 sm:grid-cols-3">
            {topRated(games, 3).map((g, i) => (
              <div
                key={g.slug}
                className="opacity-50 transition-all duration-300 hover:opacity-100 hover:scale-105"
              >
                <GameCard
                  game={g}
                  rarity={bySlug?.[g.slug] || "common"}
                  delay={i}
                  egg="inline"
                />
              </div>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={reset}>
            Сбросить фильтры
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.slice(0, visible).map((g, i) => (
              <GameCard
                key={g.slug}
                game={g}
                onQuickView={setModal}
                highlight={q}
                rarity={bySlug?.[g.slug] || "common"}
                delay={i % PAGE}
                egg="inline"
                teleport={teleportKey}
              />
            ))}
          </div>
          {visible < filtered.length && (
            <div className="flex justify-center">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setVisible((v) => v + PAGE)}
              >
                <FiChevronDown /> Показать ещё ({filtered.length - visible})
              </button>
            </div>
          )}
        </>
      )}

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
