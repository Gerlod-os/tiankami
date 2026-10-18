import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { pagesCount, pageSlice, pageNumbers } from "../utils/pagination";
import {
  FiSearch,
  FiX,
  FiChevronDown,
  FiFilter,
  FiStar,
  FiCalendar,
  FiArrowDown,
  FiArrowUp,
  FiCheck,
  FiTag,
  FiGlobe,
  FiZap,
  FiPackage,
} from "react-icons/fi";
import { FaSkull } from "react-icons/fa";
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
import { MASCOTS } from "../config/mascots";

const PAGE = 24;

const EMPTY_PHRASES = [
  "Ничего не найдено, даже крошки нет",
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

function Chip({ active, onClick, children, title, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={
        "chip border px-4 py-2 transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 " +
        (active
          ? "border-transparent bg-gradient-to-r from-pastel-pink to-pastel-purple font-extrabold text-night-900 shadow-glow-pink"
          : "border-white/10 bg-white/5 text-ink-dim hover:border-pastel-purple/40 hover:text-ink")
      }
    >
      {children}
    </button>
  );
}

// Свой список вместо <select>: системный белый список не оформить (MDN <option> —
// оформление зависит от ОС), клавиатура — по паттерну listbox WAI-ARIA APG.
function SelectMenu({ label, value, options, onChange, icon: Icon }) {
  const uid = useId().replace(/:/g, "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef(null);
  const btnRef = useRef(null);
  const listRef = useRef(null);
  const current = options.find((o) => o.v === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  const choose = (v) => {
    onChange(v);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onListKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActive(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      choose(options[active].v);
    }
  };

  return (
    <span className="relative inline-block shrink-0" ref={boxRef}>
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => {
          setOpen((o) => !o);
          setActive(Math.max(0, options.findIndex((o) => o.v === value)));
        }}
        className="input flex !h-12 !w-auto items-center gap-2 !py-2 pl-3 pr-8 text-xs font-semibold"
      >
        {Icon && <Icon className="shrink-0 text-pastel-purple" />}
        <span className="whitespace-nowrap">{current?.l}</span>
        <FiChevronDown
          className={
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-pastel-purple transition " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${uid}-opt-${active}`}
          onKeyDown={onListKey}
          className="absolute right-0 z-40 mt-2 max-h-72 w-56 overflow-y-auto rounded-btn border border-white/10 bg-night-700 p-1 shadow-card focus:outline-none"
        >
          {options.map((o, i) => (
            <li
              key={o.v}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={o.v === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.v)}
              className={
                "flex cursor-pointer items-center justify-between gap-2 rounded-btn px-3 py-2 text-xs " +
                (i === active ? "bg-white/10 text-ink" : "text-ink-dim")
              }
            >
              <span>{o.l}</span>
              {o.v === value && <FiCheck className="shrink-0 text-pastel-pink" />}
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}

export function CatalogPage() {
  const { games, collections, bySlug } = useData();
  // Адрес — единственный источник правды: фильтр, поиск, сортировка и страница
  // живут в ?query. Перезагрузка, «назад» и ссылка в чат дают одно и то же.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const q = searchParams.get("q") || "";
  const genresSel = useMemo(
    () => new Set(searchParams.getAll("genre")),
    [searchParams],
  );
  const status = searchParams.get("status") || "any";
  const year = searchParams.get("year") || "any";
  const ratingMin = Number(searchParams.get("rating")) || 0;
  const complexity = searchParams.get("complexity") || "any";
  const hours = searchParams.get("hours") || "any";
  const miOnly = searchParams.get("mi") === "1";
  const sort = searchParams.get("sort") || "played-desc";
  // Направление: у дат и чисел по умолчанию «сначала новые/большие», у алфавита — прямой.
  // ?dir= не задан — работает прежнее поведение, старые ссылки не ломаются.
  const dirDefault = sort === "title" ? "asc" : "desc";
  const dirParam = searchParams.get("dir");
  const dir = dirParam === "asc" || dirParam === "desc" ? dirParam : dirDefault;
  const flip = dir === dirDefault ? 1 : -1;
  const collectionParam = searchParams.get("collection");
  const page = Math.max(1, Math.floor(Number(searchParams.get("page")) || 1));

  // Поле поиска держит своё значение, чтобы ввод не ждал навигации;
  // из адреса оно подтягивается при сбросе и кнопке «назад».
  const [qInput, setQInput] = useState(q);
  useEffect(() => setQInput(q), [q]);

  const [dropOpen, setDropOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [emptyPhrase, setEmptyPhrase] = useState(EMPTY_PHRASES[0]);
  const searchRef = useRef(null);
  const filtersRef = useRef(null);
  const MAX_GENRES = 2;

  usePageMeta({
    title: "Каталог рогаликов — Tiankami",
    description:
      "Все рогалики стримера Tiankami: мгновенный поиск, фильтры-чипсы по жанру, статусу, оценке, сложности, часам и году.",
  });

  // Собрать новый адрес: ключ со значением null удаляется, пустое и «any» тоже.
  const searchWith = useCallback(
    (patch) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        next.delete(key);
        if (value == null) continue;
        if (Array.isArray(value)) value.forEach((v) => next.append(key, String(v)));
        else if (value !== "" && value !== "any" && value !== 0 && value !== false)
          next.set(key, String(value));
      }
      // Любая правка фильтра возвращает на первую страницу.
      if (!("page" in patch)) next.delete("page");
      return next.toString();
    },
    [searchParams],
  );

  const apply = useCallback(
    (patch, replace = false) => {
      const search = searchWith(patch);
      if (search === searchParams.toString()) return;
      setSearchParams(new URLSearchParams(search), { replace });
    },
    [searchWith, searchParams, setSearchParams],
  );

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
    // Закрываем на click, а не на mousedown: панель схлопывается на 310 px, и если
    // это случится до отпускания кнопки, click уйдёт общему предку — карточка
    // не откроется (проверено 18.10.2026). После click переход уже начался.
    const onOutside = (e) => {
      if (filtersRef.current && filtersRef.current.contains(e.target)) return;
      // Панель фильтров теперь отдельная карточка под строкой поиска: без этой
      // проверки клик по чипсу считался «вне» и схлопывал панель.
      if (e.target.closest && e.target.closest("[data-filters-panel]")) return;
      setFiltersOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onOutside);
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
        // Жанры — по «ИЛИ», как написано в подписи: два жанра дают объединение.
        if (![...genresSel].some((x) => gset.includes(x))) return false;
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
    const cmp = SORTS[sort] || SORTS.title;
    return list.sort((a, b) => flip * cmp(a, b));
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
    flip,
    collectionTitles,
  ]);

  // Сколько всего страниц и какая открыта. Если фильтры сократили список и
  // открытой страницы больше нет — показываем первую, а адрес подчищаем.
  const pages = pagesCount(filtered.length, PAGE);
  const safePage = Math.min(page, pages || 1);
  const pageItems = pageSlice(filtered, safePage, PAGE);

  useEffect(() => {
    if (pages > 0 && page > pages) apply({ page: null }, true);
  }, [page, pages, apply]);

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
    collectionParam;

  // Сброс чистит и состояние, и адрес: иначе ?collection= остаётся и фильтр живёт.
  const reset = () => {
    setQInput("");
    apply({
      q: null,
      genre: null,
      status: null,
      year: null,
      rating: null,
      complexity: null,
      hours: null,
      mi: null,
      collection: null,
      dir: null,
      page: null,
    });
  };

  const toggleGenre = (x) => {
    const next = new Set(genresSel);
    if (next.has(x)) next.delete(x);
    else if (next.size < MAX_GENRES) next.add(x);
    apply({ genre: [...next] });
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

      {/* Поиск и фильтры — одна строка: поле, «Фильтры», сортировка, направление.
          Было две панели друг под другом (решение владельца 18.10.2026). */}
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-stretch gap-2" ref={filtersRef}>
        <div className="relative w-full min-w-0 sm:flex-1">
        <FiSearch className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
        <input
          ref={searchRef}
          className="input !h-12 !rounded-card !border-white/10 !bg-night-600/80 !pl-12 !pr-28 !text-base transition focus:!border-pastel-pink/60 focus:shadow-glow-pink"
          placeholder="Введите название, жанр, сеттинг…"
          value={qInput}
          onChange={(e) => {
            setQInput(e.target.value);
            setDropOpen(true);
            apply({ q: e.target.value || null }, true);
          }}
          onFocus={() => setDropOpen(true)}
          onBlur={() => setTimeout(() => setDropOpen(false), 150)}
          onKeyDown={(e) => e.key === "Escape" && setDropOpen(false)}
          aria-label="Живой поиск по каталогу"
        />
        {hasFilters && !qInput && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={reset}
              className="btn-ghost !px-2 !py-1 text-xs"
            >
              <FiX /> Сбросить всё
            </button>
          </span>
        )}
        {dropOpen && sugg && (
          /* Непрозрачная панель и один список без заголовков и отступов между
             группами: на просвечивающем фоне подсказки не читались, а четыре
             блока с заголовками дробили список (решение владельца 18.10.2026). */
          <div className="absolute inset-x-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-card border border-white/15 bg-night-700 p-1.5 text-left shadow-card">
            {sugg.g.map((g) => (
              <button
                key={g.slug}
                type="button"
                className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm text-ink transition hover:bg-white/10"
                onMouseDown={() => navigate(`/catalog/${g.slug}`)}
              >
                <RarityEgg rarity={bySlug?.[g.slug] || "common"} size={16} />
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={g.title} q={q} />
                </span>
                {parseNum(g.rating) > 0 && (
                  <span
                    className={
                      "flex shrink-0 items-center gap-1 text-xs " +
                      ratingColor(g.rating)
                    }
                  >
                    <FiStar /> {parseNum(g.rating)}/10
                  </span>
                )}
              </button>
            ))}
            {sugg.genres.map((x) => (
              <button
                key={`genre-${x}`}
                type="button"
                onMouseDown={() => {
                  setQInput("");
                  apply({
                    q: null,
                    genre: [...new Set([...genresSel, x])].slice(0, MAX_GENRES),
                  });
                }}
                className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm text-ink-dim transition hover:bg-white/10 hover:text-ink"
              >
                <FiTag aria-hidden="true" className="shrink-0 text-pastel-purple" />
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={x} q={q} />
                </span>
                <span className="shrink-0 text-xs text-ink-faint">
                  {genreCounts.get(x) || 0}
                </span>
              </button>
            ))}
            {sugg.settings.map((x) => (
              <button
                key={`setting-${x}`}
                type="button"
                onMouseDown={() => {
                  setQInput(x);
                  apply({ q: x }, true);
                }}
                className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm text-ink-dim transition hover:bg-white/10 hover:text-ink"
              >
                <FiGlobe aria-hidden="true" className="shrink-0 text-pastel-blue" />
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={x} q={q} />
                </span>
              </button>
            ))}
            {sugg.features.map((x) => (
              <button
                key={`feature-${x}`}
                type="button"
                onMouseDown={() => {
                  setQInput(x);
                  apply({ q: x }, true);
                }}
                className="flex w-full items-center gap-2 rounded-btn px-2 py-1.5 text-left text-sm text-ink-dim transition hover:bg-white/10 hover:text-ink"
              >
                <FiZap aria-hidden="true" className="shrink-0 text-pastel-amber" />
                <span className="min-w-0 flex-1 truncate">
                  <Highlight text={x} q={q} />
                </span>
              </button>
            ))}
          </div>
        )}
        </div>

        <button
          type="button"
          className={
            "btn-ghost h-12 shrink-0 text-sm " +
            (filtersOpen ? "!border-pastel-purple/50 !text-ink" : "")
          }
          onClick={() => setFiltersOpen((v) => !v)}
          aria-expanded={filtersOpen}
        >
          <FiFilter /> Фильтры
          <FiChevronDown
            className={filtersOpen ? "rotate-180 transition" : "transition"}
          />
        </button>

        <SelectMenu
          label="Сортировка"
          value={sort}
          onChange={(v) =>
            apply({
              sort: v === "played-desc" ? null : v,
              dir: null,
            })
          }
          options={[
            { v: "played-desc", l: "Сначала недавние" },
            { v: "rating-desc", l: "По оценке Тиана" },
            { v: "hours-desc", l: "По часам" },
            { v: "release-desc", l: "По дате выхода" },
            { v: "progress-desc", l: "По прогрессу" },
            { v: "title", l: "По алфавиту" },
          ]}
        />

        <button
          type="button"
          onClick={() => apply({ dir: dir === "asc" ? "desc" : "asc" })}
          aria-label={
            dir === "asc"
              ? "Направление сортировки: по возрастанию. Переключить на убывание"
              : "Направление сортировки: по убыванию. Переключить на возрастание"
          }
          title={dir === "asc" ? "По возрастанию" : "По убыванию"}
          className="input flex !h-12 !w-auto shrink-0 items-center justify-center !px-2.5 !py-2 text-ink-dim hover:border-pastel-purple/40 hover:text-ink"
        >
          {dir === "asc" ? (
            <FiArrowUp className="text-pastel-mint" />
          ) : (
            <FiArrowDown className="text-pastel-mint" />
          )}
        </button>
        </div>
      </div>

      {collection && (
        <div className="card flex flex-wrap items-center gap-3 border-pastel-purple/30 p-4">
          <FiPackage className="shrink-0 text-2xl text-pastel-purple" aria-hidden="true" />
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
          <button
            type="button"
            className="btn-ghost !px-3 !py-1.5 text-xs"
            onClick={reset}
          >
            <FiX /> Сбросить
          </button>
        </div>
      )}

      {/* Панель фильтров: кнопка живёт в строке поиска, карточка — только когда открыта */}
      {filtersOpen && (
        <div className="card space-y-4 p-4" data-filters-panel>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-dim">
              <span className="switch">
                <input
                  type="checkbox"
                  checked={miOnly}
                  onChange={(e) => apply({ mi: e.target.checked ? "1" : null })}
                  aria-label="Только с кубком МИ"
                />
                <span className="knob" />
              </span>
              Только с кубком МИ
            </label>

            <SelectMenu
              label="Год выхода"
              value={year}
              icon={FiCalendar}
              onChange={(v) => apply({ year: v })}
              options={[
                { v: "any", l: "Любой год" },
                ...meta.years.map((y) => ({ v: String(y), l: String(y) })),
              ]}
            />

            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="btn-ghost ml-auto !border-pastel-pink/40 !px-3 !py-1.5 text-xs !text-pastel-pink"
              >
                <FiX /> Сбросить всё
              </button>
            )}
          </div>

          {/* Жанры — отдельной строкой во всю ширину: в узкой колонке 14 чипсов
              складывались в столбик, а слово «закрыто» дописывалось к чипсу
              (решение владельца 18.10.2026) */}
          <div>
            <div className="label">Жанр</div>
            <div className="flex flex-wrap gap-1.5">
              {meta.genres.slice(0, 14).map((x) => (
                <Chip
                  key={x}
                  active={genresSel.has(x)}
                  onClick={() => toggleGenre(x)}
                  disabled={!genresSel.has(x) && genresSel.size >= MAX_GENRES}
                >
                  {x}
                </Chip>
              ))}
            </div>
          </div>

          <div className="grid animate-fadeUp gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="label">Статус</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={status === "any"}
                    onClick={() => apply({ status: null })}
                  >
                    Любой
                  </Chip>
                  {statuses.map((s) => (
                    <Chip
                      key={s}
                      active={status === s}
                      onClick={() => apply({ status: status === s ? null : s })}
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
                      onClick={() => apply({ rating: ratingMin === r ? null : r })}
                    >
                      {r === 0 ? (
                        "Любая"
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <FiStar aria-hidden="true" />
                          {r}+
                        </span>
                      )}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <div className="label">Сложность</div>
                <div className="flex flex-wrap gap-1.5">
                  <Chip
                    active={complexity === "any"}
                    onClick={() => apply({ complexity: null })}
                  >
                    Любая
                  </Chip>
                  <Chip
                    active={complexity === "low"}
                    onClick={() =>
                      apply({ complexity: complexity === "low" ? null : "low" })
                    }
                  >
                    <FaSkull className="inline" aria-hidden="true" /> Лёгкие
                  </Chip>
                  <Chip
                    active={complexity === "mid"}
                    onClick={() =>
                      apply({ complexity: complexity === "mid" ? null : "mid" })
                    }
                  >
                    <FaSkull className="inline" aria-hidden="true" /><FaSkull className="inline" aria-hidden="true" /> Средне
                  </Chip>
                  <Chip
                    active={complexity === "high"}
                    onClick={() =>
                      apply({ complexity: complexity === "high" ? null : "high" })
                    }
                  >
                    <FaSkull className="inline" aria-hidden="true" /><FaSkull className="inline" aria-hidden="true" /><FaSkull className="inline" aria-hidden="true" /> Хардкор
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
                      onClick={() => apply({ hours: hours === v ? null : v })}
                    >
                      {l}
                    </Chip>
                  ))}
                </div>
              </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-8 py-16 text-center">
          <img
            src={MASCOTS.sad}
            alt="Грустный кроассан"
            width={700}
            height={700}
            className="w-56 drop-shadow-[0_14px_28px_rgba(0,0,0,.45)]"
            loading="lazy"
          />
          <p className="font-display text-2xl font-extrabold text-ink">
            {emptyPhrase}
          </p>
          <div className="grid w-full max-w-3xl gap-x-6 gap-y-8 sm:grid-cols-3">
            {topRated(games, 3).map((g, i) => (
              <div
                key={g.slug}
                className="opacity-50 transition duration-300 hover:opacity-100 hover:scale-105"
              >
                <GameCard
                  game={g}
                  rarity={bySlug?.[g.slug] || "common"}
                  delay={i}
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
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((g, i) => (
              <GameCard
                key={g.slug}
                game={g}
                onQuickView={setModal}
                highlight={q}
                rarity={bySlug?.[g.slug] || "common"}
                delay={i % PAGE}
              />
            ))}
          </div>
          {pages > 1 && (
            <nav
              aria-label="Страницы каталога"
              className="mt-8 flex flex-wrap items-center justify-center gap-1.5 text-sm"
            >
              {pageNumbers(pages, safePage).map((n, i) =>
                n === "…" ? (
                  <span key={`gap-${i}`} className="px-1 text-ink-faint">
                    …
                  </span>
                ) : (
                  // Ссылка, а не кнопка: краулер ходит только по <a href>.
                  <Link
                    key={n}
                    to={{ search: searchWith({ page: n === 1 ? null : n }) }}
                    aria-current={n === safePage ? "page" : undefined}
                    className={
                      "min-w-9 rounded-btn px-2.5 py-1.5 text-center font-display font-bold transition " +
                      (n === safePage
                        ? "bg-pastel-purple/25 text-ink"
                        : "text-ink-dim hover:bg-white/5 hover:text-ink")
                    }
                  >
                    {n}
                  </Link>
                ),
              )}
            </nav>
          )}
        </>
      )}

      <GameModal game={modal} onClose={() => setModal(null)} />
    </div>
  );
}
