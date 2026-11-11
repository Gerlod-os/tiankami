import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiTag,
  FiCalendar,
  FiGlobe,
  FiYoutube,
  FiPlay,
  FiMessageCircle,
  FiStar,
  FiFlag,
} from "react-icons/fi";
import { FaSkull, FaSteam } from "react-icons/fa";
import { LuTrophy } from "react-icons/lu";
import { parseNum, isUrl, hasMI } from "../utils/normalize";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { parseYouTubeUrl, posterVideoId } from "../utils/youtube";
import { moodOf } from "../utils/recommend";
import { RarityEgg } from "./RarityEgg";
import { MITrophy } from "./MITrophy";
import { useData } from "./DataProvider";

// Иконки шкал: один шрифт на всех устройствах, цвет из палитры. Эмодзи (💫💀🌳)
// рисовала система, и на iPhone, и на Windows это были разные значки.
const ratingIcon = () => FiStar;
const progIcon = () => FiFlag;

// Черепа сложности — как раньше: ряд из 1–3 черепов, а не одна сменяемая иконка.
// Правило то же, что в карточке каталога (GameCard.jsx): >=8 → 3, >=5 → 2, >=1 → 1.
export function skullCount(c) {
  return c >= 8 ? 3 : c >= 5 ? 2 : c >= 1 ? 1 : 0;
}

// Цвета шкал: у каждой свой, чтобы оценка, сложность и прогресс читались
// с одного взгляда (замечание владельца 11.11.2026 — всё было одним оранжевым).
const BAR_TONES = {
  gold: { from: "#FFD9A0", to: "#F0913A", glow: "rgba(255,217,160,0.45)" },
  pink: { from: "#FFB6C1", to: "#E05A7A", glow: "rgba(255,143,163,0.45)" },
  mint: { from: "#9FE2B9", to: "#3FAE7A", glow: "rgba(159,226,185,0.45)" },
};

function Bar({ label, icon: Icon, skulls = 0, value, max, suffix, tone = "gold" }) {
  const v = parseNum(value);
  const c = BAR_TONES[tone] || BAR_TONES.gold;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ink-dim">
          {skulls > 0 ? (
            <span className="flex items-center gap-0.5" aria-hidden="true">
              {Array.from({ length: skulls }, (_, i) => (
                <FaSkull key={i} className="skull text-[13px]" />
              ))}
            </span>
          ) : (
            Icon && (
              <Icon
                className="shrink-0"
                aria-hidden="true"
                style={{ color: c.from, filter: `drop-shadow(0 0 5px ${c.glow})` }}
              />
            )
          )}{" "}
          {label}
        </span>
        <span className="font-display font-bold text-ink">
          {v > 0 ? `${v}${suffix || `/${max}`}` : "—"}
        </span>
      </div>
      <div className="bar-track bar-shine">
        <div
          className="bar-fill"
          style={{
            width: `${Math.min(100, (v / max) * 100)}%`,
            backgroundImage: `linear-gradient(90deg, ${c.from}, ${c.to})`,
            boxShadow: `0 0 12px ${c.glow}`,
          }}
        />
      </div>
    </div>
  );
}

// Две ячейки сетки: подпись с иконкой и значение. Иконка одна — вторая,
// стоявшая перед значением, была дублем и сбивала выравнивание.
// tone — цвет пары «подпись + значение»: у жанра, сеттинга, часов и дат свои
// цвета, чтобы характеристики не сливались в серую стену (11.11.2026).
function MetaCell({ icon: Icon, iconCls, label, children, onGo, tone }) {
  if (!children) return null;
  const Comp = onGo ? "button" : "span";
  const colored = Boolean(tone);
  return (
    <>
      <span
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
        style={
          colored
            ? { color: tone, textShadow: `0 0 10px ${tone}55` }
            : undefined
        }
      >
        <Icon
          className={"shrink-0 " + (colored ? "" : iconCls)}
          aria-hidden="true"
          style={colored ? { filter: `drop-shadow(0 0 5px ${tone}88)` } : undefined}
        />{" "}
        {label}
      </span>
      <Comp
        {...(onGo ? { type: "button", onClick: onGo } : {})}
        className={
          (onGo
            ? "inline-flex min-h-8 w-full items-center justify-self-start text-left text-ink underline-offset-2 transition hover:text-pastel-blue hover:underline"
            : "min-w-0 w-full text-ink") + (colored ? " meta-underline" : "")
        }
        style={colored ? { ["--tone"]: tone } : undefined}
      >
        {children}
      </Comp>
    </>
  );
}

export function GameDetails({ game, compact = false }) {
  const navigate = useNavigate();
  const { bySlug } = useData();
  const rarity = bySlug?.[game.slug] || "common";
  const meta = statusMeta(game.status);
  // Авторство проверено на сборке (sync-data.js → youtubeOwners.js):
  // youtubeOwn === false — ролик чужой, плеер не показываем. Не проверено
  // (undefined) — показываем: молча спрятать рабочий плеер хуже.
  const yt = parseYouTubeUrl(game.youtube);
  const showPlayer = Boolean(yt?.embedUrl) && game.youtubeOwn !== false;
  // Плеер грузится по клику: автозагрузка тянула ~1,2 МБ (замер 18.10.2026 —
  // 726 КБ без плеера, 1926 КБ с ним) на 172 страницах, а смотрят его единицы.
  const [playing, setPlaying] = useState(false);
  const autoplayUrl = yt?.embedUrl
    ? yt.embedUrl + (yt.embedUrl.includes("?") ? "&" : "?") + "autoplay=1"
    : "";
  // Превью ролика: maxresdefault 1280×720 (16:9), запасной mqdefault 320×180.
  // hqdefault не годится — 480×360 с чёрными полосами у 16:9 (замер 18.10.2026).
  // У плейлиста своего кадра нет, поэтому ID первого ролика берём из карты
  // youtube-posters.json (собрана scripts/yt-posters.mjs): владелец 11.11.2026
  // попросил показывать кадр видео, а не обложку игры. Обложка игры — последний запас.
  const posterId = posterVideoId(game.youtube);
  const poster = posterId
    ? `https://i.ytimg.com/vi/${posterId}/maxresdefault.jpg`
    : game.image || "";
  const posterFallback = posterId
    ? `https://i.ytimg.com/vi/${posterId}/mqdefault.jpg`
    : game.image || "";

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      {/* Обложки здесь нет: в шапке страницы она уже стоит дважды (фон + видимая).
          Третья копия на том же экране — дубль (план, Б17). */}

      {/* YouTube под обложкой: сначала постер, плеер — по клику.
          В модалке плеера нет: там место занимает обложка, а смотреть — на странице игры. */}
      {showPlayer && !compact && (
        <div className="mx-auto max-w-xl overflow-hidden rounded-card border border-white/10 shadow-card">
          {playing ? (
            <iframe
              className="aspect-video w-full"
              src={autoplayUrl}
              title={`Прохождение ${game.title} на YouTube`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              aria-label={`Смотреть прохождение ${game.title} на YouTube`}
              className="group relative flex aspect-video w-full flex-col items-center justify-center gap-2 overflow-hidden bg-night-800 transition"
            >
              {poster && (
                <img
                  src={poster}
                  alt=""
                  aria-hidden="true"
                  width={1280}
                  height={720}
                  className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-90"
                  onError={(e) => {
                    if (posterFallback && e.currentTarget.src !== posterFallback)
                      e.currentTarget.src = posterFallback;
                  }}
                />
              )}
              <span className="absolute inset-0 bg-night-900/55" />
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#FF2D2D] text-white shadow-[0_10px_26px_rgba(255,0,0,0.35)] transition group-hover:scale-110">
                <FiPlay className="ml-1 text-2xl" aria-hidden="true" />
              </span>
              <span className="relative flex flex-col items-center gap-0.5 rounded-btn bg-night-900/70 px-4 py-2 text-center backdrop-blur-sm">
                <span className="font-display text-sm font-extrabold text-ink">
                  Смотреть прохождение
                </span>
                <span className="text-xs text-ink-dim">
                  Плеер YouTube загрузится после нажатия
                </span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* Кнопки — только в модалке: на странице игры они уже стоят в шапке.
          Steam забирает свободное место, YouTube — по содержимому и уже:
          владелец 11.11.2026 попросил не растягивать обе на половину. */}
      {compact && (
      <div className="flex flex-wrap gap-2">
        {/* Цветные кнопки без заливки: обводка + свечение + цветной текст,
            как просил владелец 11.11.2026. */}
        {game.steamUrl && (
          <a
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-btn border px-3 py-2.5 font-display font-bold transition duration-300 hover:bg-white/5"
            style={{
              borderColor: "rgba(102,192,244,0.45)",
              color: "#66C0F4",
              boxShadow: "0 0 18px rgba(102,192,244,0.16)",
            }}
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaSteam className="text-lg" /> В Steam
          </a>
        )}
        {isUrl(game.youtube) && (
          <a
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-btn border px-3.5 py-2.5 text-sm font-display font-bold transition duration-300 hover:bg-white/5"
            style={{
              borderColor: "rgba(255,45,45,0.45)",
              color: "#FF6B6B",
              boxShadow: "0 0 18px rgba(255,45,45,0.16)",
            }}
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiYoutube className="text-lg" />{" "}
            {/list=/.test(game.youtube) ? "YouTube плейлист" : "YouTube"}
          </a>
        )}
        {hasMI(game) && isUrl(game.miVideo) && (
          <a
            className="col-span-2 inline-flex w-full items-center justify-center gap-2 rounded-btn border px-3 py-2 font-display font-bold transition duration-300 hover:bg-white/5"
            style={{
              borderColor: "rgba(255,217,160,0.45)",
              color: "#FFD9A0",
              boxShadow: "0 0 18px rgba(255,217,160,0.16)",
            }}
            href={game.miVideo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LuTrophy className="text-lg" /> Выпуск МИ
          </a>
        )}
      </div>
      )}

      {/* Теги: в панели не нужны — статус и оценка уже в шапке и шкалах,
          а место нужно, чтобы модалка влезла целиком (11.11.2026). */}
      {!compact && (
      <div className="flex flex-wrap items-center gap-2">
        {/* Яйцо — подпись редкости, а не кнопка: раньше клик уводил в каталог
            с фильтром по первому жанру, и это читалось как случайный переход
            (решение владельца 18.10.2026). */}
        <span className="chip border border-white/10 bg-night-900/70">
          <RarityEgg rarity={rarity} size={24} />
        </span>
        <span className={"chip " + meta.cls}>
          {meta.icon && <meta.icon className="shrink-0" aria-hidden="true" />} {game.status || "—"}
        </span>
        <span
          className="chip border border-pastel-mint/25 bg-pastel-mint/10 text-pastel-mint"
          title="Настроение забега"
        >
          {(() => { const M = moodOf(game); const MI = M.icon; return <>{MI && <MI className="shrink-0" aria-hidden="true" />} {M.label}</>; })()}
        </span>
        {hasMI(game) && (
          <span className="chip border border-pastel-amber/30 bg-pastel-amber/15 text-pastel-amber">
            <MITrophy size="xs" /> МИ
          </span>
        )}
        {parseNum(game.rating) > 0 && (
          <span className="chip border border-white/10 bg-night-900/70">
            <span
              className={
                ratingColor(game.rating) + " font-display font-extrabold"
              }
            >
              {parseNum(game.rating)}/10
            </span>
          </span>
        )}
      </div>
      )}

      {/* Впечатления Тиана: единственная колонка таблицы, которая не доходила до
          посетителя (459/459 заполнено). Ставлю выше баров: это текст, ради которого
          открывают страницу, а не приложение к шкалам. В панели — две строки,
          иначе она не влезает целиком. */}
      {game.notes && !compact && (
        <div className="rounded-btn bg-night-700/40 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint">
            <FiMessageCircle className="text-pastel-mint" aria-hidden="true" />
            Впечатления Тиана
          </div>
          <p className="text-sm leading-relaxed text-ink-dim">{game.notes}</p>
        </div>
      )}

      {/* Бары и мета — рядом. В панели две колонки всегда: иначе восемь
          строк не влезают в уменьшенную высоту (11.11.2026). */}
      <div
        className={
          compact
            ? "grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2"
            : "grid gap-5 lg:grid-cols-2 lg:gap-8"
        }
      >
      {/* Бары */}
      <div className="max-w-xs space-y-3">
        <Bar
          label="Оценка"
          icon={ratingIcon(parseNum(game.rating))}
          value={game.rating}
          max={10}
          tone="gold"
        />
        <Bar
          label="Сложность"
          skulls={skullCount(parseNum(game.complexity))}
          value={game.complexity}
          max={10}
          tone="pink"
        />
        <Bar
          label="Прогресс"
          icon={progIcon(parseNum(game.progress))}
          value={game.progress}
          max={100}
          suffix="%"
          tone="mint"
        />
      </div>

      {/* Мета: одна иконка у подписи, значения строго по одной вертикали */}
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-sm sm:grid-cols-[132px_minmax(0,1fr)]">
        <MetaCell
          icon={FiTag}
          iconCls="text-pastel-purple"
          tone="#C9A0DC"
          label="Жанр"
          onGo={() =>
            navigate(
              `/catalog?genre=${encodeURIComponent(String(game.genre).split(",")[0]?.trim() || "")}`,
            )
          }
        >
          {game.genre}
        </MetaCell>
        <MetaCell
          icon={FiGlobe}
          iconCls="text-pastel-blue"
          tone="#A0C4FF"
          label="Сеттинг"
          onGo={() =>
            navigate(`/catalog?q=${encodeURIComponent(game.setting || "")}`)
          }
        >
          {game.setting}
        </MetaCell>
        <MetaCell icon={FiClock} iconCls="text-pastel-amber" tone="#FFD9A0" label="Наиграно">
          {parseNum(game.hours) ? `${parseNum(game.hours)} ч.` : ""}
        </MetaCell>
        <MetaCell icon={FiCalendar} iconCls="text-pastel-mint" tone="#9FE2B9" label="Выход">
          {game.releaseDate}
        </MetaCell>
        <MetaCell icon={FiCalendar} iconCls="text-pastel-pink" tone="#FFB6C1" label="Играл">
          {game.playedDate}
        </MetaCell>
      </div>
      </div>

      {game.features && (
        <div className="flex max-w-full flex-wrap gap-1.5">
          {String(game.features)
            .split(",")
            .map((f) => f.trim())
            .filter(Boolean)
            .map((f) => (
              <span
                key={f}
                className="chip border border-pastel-purple/25 bg-pastel-purple/10 text-pastel-purple"
              >
                {f}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
