import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { TagPicker } from "../components/TagPicker";
import { Highlight } from "../components/Highlight";
import {
  getGameMetadata,
  parseNum,
  hasMI,
  featureCounts,
  matchesFeatures,
} from "../utils/normalize";
import { parseRuDate } from "../utils/date";
import { ratingColor } from "../utils/statusMeta";
import { topRated } from "../utils/stats";
import { usePageMeta } from "../utils/usePageMeta";
import { MASCOTS } from "../config/mascots";
import { useAnchoredPanel } from "../utils/useAnchoredPanel";

const PAGE = 24;

// Параметры для самого первого рендера: пока не прошла гидратация, каталог
// считается без фильтров — ровно так, как его отдаёт пререндер.
const EMPTY_PARAMS = new URLSearchParams();

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

function Chip({ active, onClick, children, title, disabled, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={
        // В панели фильтров чипсы компактнее обычных: их десятки, и крупные
        // кнопки раздували панель до 476 px (замечание владельца 13.11.2026).
        // Текст — обычные 12 px: на 11 px читалось мелко (правка 13.11.2026).
        "chip border px-2.5 py-1.5 text-xs leading-tight transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 sm:px-2.5 sm:py-1 " +
        className +
        " " +
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
// tall — для верхней строки каталога: там все элементы одной высоты 48 px,
// и «Сначала недавние» не должна проседать рядом с поиском (слово владельца 13.11.2026).
function SelectMenu({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  wrapClass = "",
  btnClass = "!w-auto",
  tall = false,
}) {
  const uid = useId().replace(/:/g, "");
  // Список рендерится порталом: панель фильтров прокручивается и обрезает
  // absolute-потомков (список годов из 18 пунктов терял последние).
  const { open, setOpen, pos, btnRef, panelRef } = useAnchoredPanel({ width: 224 });
  const [active, setActive] = useState(0);
  const current = options.find((o) => o.v === value) || options[0];

  // Фокус — на сам список (panelRef), чтобы работали стрелки и Enter.
  // Зависимость от pos обязательна: портал появляется только когда посчитана
  // позиция, и до этого panelRef.current ещё null (замер 13.11.2026).
  useEffect(() => {
    if (open && pos) panelRef.current?.focus();
  }, [open, pos, panelRef]);

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
    <span className={"relative inline-block shrink-0 " + wrapClass}>
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
        className={
          "input flex items-center gap-2 pl-3 pr-8 text-xs font-semibold " +
          (tall ? "!h-12 !py-2 " : "!h-11 !py-1.5 sm:!h-10 ") +
          btnClass
        }
      >
        {Icon && <Icon className="shrink-0 text-pastel-purple" />}
        <span className="min-w-0 truncate">{current?.l}</span>
        <FiChevronDown
          className={
            "pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-pastel-purple transition " +
            (open ? "rotate-180" : "")
          }
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            aria-label={label}
            tabIndex={-1}
            aria-activedescendant={`${uid}-opt-${active}`}
            onKeyDown={onListKey}
            data-filter-popup
            style={{
              left: pos.left,
              width: pos.width,
              top: pos.top,
              bottom: pos.bottom,
              maxHeight: pos.maxHeight,
            }}
            className="fixed z-[60] overflow-y-auto rounded-btn border border-white/10 bg-night-700 p-1 shadow-card focus:outline-none"
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
          </ul>,
          document.body,
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

  // Пререндер отдаёт каталог БЕЗ фильтров. Если открыть адрес вида
  // /catalog/?genre=Шутер, клиент на первом рендере отфильтровал бы список и
  // React ругался на расхождение разметки (ошибка #418, ловилась в консоли
  // 11.11.2026). Поэтому первый рендер считается по пустым параметрам — ровно
  // как в статике, — а настоящие подставляются в layout-эффекте: он срабатывает
  // до отрисовки, так что мигания «весь каталог → отфильтрованный» не видно.
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => setHydrated(true), []);
  const sp = hydrated ? searchParams : EMPTY_PARAMS;

  const q = sp.get("q") || "";
  const genresSel = useMemo(() => new Set(sp.getAll("genre")), [sp]);
  const tagsSel = useMemo(() => new Set(sp.getAll("tag")), [sp]);
  const status = sp.get("status") || "any";
  const year = sp.get("year") || "any";
  const ratingMin = Number(sp.get("rating")) || 0;
  const complexity = sp.get("complexity") || "any";
  const hours = sp.get("hours") || "any";
  const miOnly = sp.get("mi") === "1";
  const sort = sp.get("sort") || "played-desc";
  // Направление: у дат и чисел по умолчанию «сначала новые/большие», у алфавита — прямой.
  // ?dir= не задан — работает прежнее поведение, старые ссылки не ломаются.
  const dirDefault = sort === "title" ? "asc" : "desc";
  const dirParam = sp.get("dir");
  const dir = dirParam === "asc" || dirParam === "desc" ? dirParam : dirDefault;
  const flip = dir === dirDefault ? 1 : -1;
  const collectionParam = sp.get("collection");
  const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));

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
  // Тегов у игры в среднем 2,25 (медиана 2). Фильтр работает по «И», поэтому
  // пять тегов — это уже очень узкая выборка; больше и не нужно.
  const MAX_TAGS = 5;

  // Липкая строка фильтров встаёт под шапку сайта. Высоту шапки меряю, а не
  // угадываю: на телефоне и десктопе она разная, и от неё зависит, не наедет
  // ли строка на меню (11.11.2026).
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const header = document.querySelector("header");
    if (!header) return undefined;
    const measure = () =>
      setHeaderH(Math.round(header.getBoundingClientRect().height));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

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
    // Escape сначала закрывает выпадающий список (год, теги), и только
    // следующим нажатием — саму панель. Иначе один Escape схлопывал всё.
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (document.querySelector("[data-filter-popup]")) return;
      setFiltersOpen(false);
    };
    // Закрываем на click, а не на mousedown: панель схлопывается на 310 px, и если
    // это случится до отпускания кнопки, click уйдёт общему предку — карточка
    // не откроется (проверено 18.10.2026). После click переход уже начался.
    const onOutside = (e) => {
      if (filtersRef.current && filtersRef.current.contains(e.target)) return;
      // Панель фильтров теперь отдельная карточка под строкой поиска: без этой
      // проверки клик по чипсу считался «вне» и схлопывал панель.
      if (e.target.closest && e.target.closest("[data-filters-panel]")) return;
      // Выпадающие списки (год, теги) живут порталом в body — они тоже «внутри»
      // фильтров, иначе клик по пункту схлопывал всю панель (замер 13.11.2026).
      if (e.target.closest && e.target.closest("[data-filter-popup]")) return;
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

  // Теги со счётчиками: 257 штук, редкие — в конце списка.
  const tagItems = useMemo(() => featureCounts(games), [games]);

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
        // Жанры — по «И»: игра должна быть в каждом выбранном жанре
        // (слово владельца 13.11.2026, раньше давало объединение).
        if (![...genresSel].every((x) => gset.includes(x))) return false;
      }
      // Теги — по «И»: нужны все выбранные.
      if (!matchesFeatures(g, tagsSel)) return false;
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
    tagsSel,
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
    tagsSel.size ||
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
      tag: null,
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

  const toggleTag = (x) => {
    const next = new Set(tagsSel);
    if (next.has(x)) next.delete(x);
    else if (next.size < MAX_TAGS) next.add(x);
    apply({ tag: [...next] });
  };

  // Активные фильтры видимой строкой: панель свёрнута, а состояние видно.
  // Каждую плашку можно снять по одной, не открывая панель (11.11.2026).
  const HOURS_LABELS = {
    lt10: "до 10 ч",
    "10-49": "10–50 ч",
    "50-99": "50–100 ч",
    "100+": "100+ ч",
  };
  const COMPLEXITY_LABELS = { low: "лёгкие", mid: "средние", high: "хардкор" };
  const activeChips = useMemo(() => {
    const list = [];
    for (const g of genresSel) {
      list.push({ key: `genre-${g}`, label: g, clear: () => toggleGenre(g) });
    }
    // Тег подписан «#», чтобы плашку нельзя было спутать с жанром.
    for (const t of tagsSel) {
      list.push({ key: `tag-${t}`, label: `#${t}`, clear: () => toggleTag(t) });
    }
    if (status !== "any") {
      list.push({
        key: "status",
        label: status,
        clear: () => apply({ status: null }),
      });
    }
    if (year !== "any") {
      list.push({
        key: "year",
        label: `${year} год`,
        clear: () => apply({ year: null }),
      });
    }
    if (ratingMin > 0) {
      list.push({
        key: "rating",
        label: `оценка ${ratingMin}+`,
        clear: () => apply({ rating: null }),
      });
    }
    if (complexity !== "any") {
      list.push({
        key: "complexity",
        label: COMPLEXITY_LABELS[complexity] || complexity,
        clear: () => apply({ complexity: null }),
      });
    }
    if (hours !== "any") {
      list.push({
        key: "hours",
        label: HOURS_LABELS[hours] || hours,
        clear: () => apply({ hours: null }),
      });
    }
    if (miOnly) {
      list.push({
        key: "mi",
        label: "только МИ",
        clear: () => apply({ mi: null }),
      });
    }
    if (collectionParam) {
      list.push({
        key: "collection",
        label: "подборка",
        clear: () => apply({ collection: null }),
      });
    }
    return list;
    // toggleGenre и apply пересоздаются вместе с searchParams — этого достаточно.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genresSel, tagsSel, status, year, ratingMin, complexity, hours, miOnly, collectionParam, searchParams]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="t-h1">
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

      {/* Поиск, сортировка и активные фильтры — одна липкая полоса под шапкой:
          панель фильтров больше не занимает экран, а состояние видно всегда
          (11.11.2026). Ширина та же, что у панели под ней. */}
      <div
        className="sticky z-30 -mx-4 border-b border-white/5 bg-night-800/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6"
        style={{ top: headerH }}
        data-catalog-toolbar
      >
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
        {/* Единственная кнопка сброса на странице. Раньше их было три: в панели
            фильтров, в баннере подборки и здесь; владелец просил одну — в поле
            поиска. Показываем при любом активном фильтре, в том числе при введённом
            запросе (раньше кнопка в этом случае исчезала). */}
        {hasFilters && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            <button
              type="button"
              onClick={reset}
              className="btn-ghost !px-2 !py-1 text-xs"
              aria-label="Сбросить фильтры и поиск"
              title="Сбросить фильтры и поиск"
            >
              <FiX /> Сбросить
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
          {activeChips.length > 0 && (
            <span className="ml-0.5 rounded-full bg-pastel-purple/30 px-1.5 text-xs font-bold text-ink">
              {activeChips.length}
            </span>
          )}
          <FiChevronDown
            className={filtersOpen ? "rotate-180 transition" : "transition"}
          />
        </button>

        {/* Сортировка и направление — одна группа: на телефоне они делят
            вторую строку с «Фильтрами» и не уезжают на третью (11.11.2026). */}
        <div className="flex min-w-0 flex-1 items-stretch gap-2 sm:flex-none">
          <SelectMenu
            label="Сортировка"
            value={sort}
            tall
            wrapClass="min-w-0 flex-1 sm:flex-none"
            btnClass="!w-full sm:!w-auto"
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

        {/* Активные фильтры — плашками под строкой: видно, что включено,
            и каждую можно снять одной кнопкой. */}
        {activeChips.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {activeChips.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={c.clear}
                className="chip inline-flex items-center gap-1 border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-ink transition hover:border-pastel-pink/50 hover:text-pastel-pink"
                title={`Убрать фильтр: ${c.label}`}
                aria-label={`Убрать фильтр: ${c.label}`}
              >
                {c.label}
                <FiX className="shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {/* Панель фильтров — выпадает из-под липкой строки. Раньше жила в потоке
            ниже и при прокрученной странице открывалась выше экрана: за ней
            приходилось ездить вверх (слово владельца 13.11.2026).
            Высота ограничена, прокрутка внутри — на телефоне панель не занимает
            весь экран. */}
        {filtersOpen && (
          <div
            className="absolute inset-x-0 top-full z-40 px-4 pt-2 md:px-6"
            data-filters-panel
          >
            {/* Фон непрозрачный: обычный .card полупрозрачный, и сквозь панель
                читались карточки каталога. */}
            {/* pb-16 на телефоне: внизу справа висит круглая кнопка-маскот
                (fixed), и без запаса она накрывала «100ч+» и теги. */}
            <div className="card relative max-h-[70dvh] overflow-y-auto !bg-night-800 p-3 pb-16 md:p-4">
              <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {/* Жанры — две колонки из шести: 14 чипсов в узкой колонке
                    растягивали панель втрое (замер 13.11.2026: 476 px). */}
                <div className="min-w-0 sm:col-span-2">
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

                <div className="min-w-0">
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
                <div className="min-w-0">
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
                <div className="min-w-0">
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
                <div className="min-w-0">
                  {/* Подпись вернулась: без неё селект выглядел ещё одним жанром
                      и прилипал к чипсам (замечание владельца 13.11.2026). */}
                  <div className="label">Год</div>
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
                </div>
                <div className="min-w-0 xl:col-span-2">
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

                {/* Теги — седьмая колонка: одна кнопка вместо сотни чипсов.
                    До пяти, внутри выпадающего списка есть поиск
                    (слово владельца 13.11.2026). */}
                <div className="min-w-0 sm:col-span-2">
                  <div className="label">Теги</div>
                  <TagPicker
                    items={tagItems}
                    selected={tagsSel}
                    onToggle={toggleTag}
                    onClear={() => apply({ tag: null })}
                    max={MAX_TAGS}
                  />
                </div>
              </div>

              {/* Тумблер «Только МИ» — справа, но низ на уровне колонки «Жанр».
                  Владелец 11.11.2026: отдельная строка ниже делала панель выше
                  жанров; absolute убирает лишнюю высоту. На телефоне — в потоке,
                  иначе перекрывает «Часы». */}
              <div className="mt-3 flex justify-end sm:absolute sm:bottom-3 sm:right-3 sm:mt-0">
                <label className="flex items-center gap-2 text-xs font-semibold text-ink-dim">
                  <span className="switch">
                    <input
                      type="checkbox"
                      checked={miOnly}
                      onChange={(e) => apply({ mi: e.target.checked ? "1" : null })}
                      aria-label="Только с кубком МИ"
                    />
                    <span className="knob" />
                  </span>
                  Только МИ
                </label>
              </div>
            </div>
          </div>
        )}
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
          <p className="text-xs text-ink-faint">
            Сбросить всё — кнопкой в строке поиска.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((g, i) => (
              <GameCard
                key={g.slug}
                game={g}
                onQuickView={setModal}
                openSlug={modal?.slug || ""}
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
