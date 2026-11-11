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
import { parseYouTubeUrl, posterVideoId } from "../utils/youtube";

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
        <span className="t-micro flex items-center gap-1.5">
          {skulls > 0 ? (
            <span className="flex items-center gap-1" aria-hidden="true">
              {Array.from({ length: skulls }, (_, i) => (
                <FaSkull key={i} className="skull text-sm" />
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
        <span
          className="font-display text-base font-black tabular-nums"
          style={{ color: c.from, textShadow: `0 0 12px ${c.glow}` }}
        >
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

// Одна строка «подпись → значение». Линия под строкой начинается у подписи
// и тает к значению: так видно, к чему относится цвет (11.11.2026).
// tone — цвет пары, у жанра, сеттинга, часов и дат свой.
function MetaCell({ icon: Icon, iconCls, label, children, onGo, tone }) {
  if (!children) return null;
  const Comp = onGo ? "button" : "span";
  const colored = Boolean(tone);
  return (
    <div className="meta-row text-sm" style={colored ? { ["--tone"]: tone } : undefined}>
      <span
        className="t-micro flex shrink-0 items-center gap-1.5"
        style={colored ? { color: tone } : undefined}
      >
        <Icon
          className={"shrink-0 " + (colored ? "" : iconCls)}
          aria-hidden="true"
        />{" "}
        {label}
      </span>
      <Comp
        {...(onGo ? { type: "button", onClick: onGo } : {})}
        className={
          "min-w-0 truncate text-right font-semibold text-ink " +
          // py-0.5 поднимает высоту нажимаемого значения до 24 px (WCAG 2.5.8):
          // было 20 px, аудит 11.11.2026 считал это мелкой целью.
          (onGo ? "tap min-h-6 min-w-6 py-0.5 hover:text-pastel-blue hover:underline" : "")
        }
      >
        {children}
      </Comp>
    </div>
  );
}

export function GameDetails({ game, compact = false }) {
  const navigate = useNavigate();
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
    <div className="space-y-3">
      {/* Обложки здесь нет: в шапке страницы она уже стоит дважды (фон + видимая).
          Третья копия на том же экране — дубль (план, Б17). */}

      {/* YouTube: сначала постер, плеер — по клику. В модалке плеера нет,
          чтобы не раздувать панель; смотреть — на странице игры. */}
      {showPlayer && !compact && (
        <div className="w-full overflow-hidden rounded-card border border-white/10 shadow-card">
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
              className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-night-800"
            >
              {poster && (
                <img
                  src={poster}
                  alt=""
                  aria-hidden="true"
                  width={1280}
                  height={720}
                  className="absolute inset-0 h-full w-full object-cover opacity-95 transition duration-300 group-hover:scale-[1.02]"
                  onError={(e) => {
                    if (posterFallback && e.currentTarget.src !== posterFallback)
                      e.currentTarget.src = posterFallback;
                  }}
                />
              )}
              {/* Контурная иконка из линий: ни залитого круга, ни текста,
                  ни затемнения — обложка видео остаётся видна (11.11.2026). */}
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 bg-night-900/20 text-white backdrop-blur-sm transition group-hover:scale-110">
                <FiPlay className="ml-0.5 text-lg" aria-hidden="true" />
              </span>
            </button>
          )}
        </div>
      )}

      {/* Кнопки — только в модалке. Заливка как на странице игры и один
          размер на всех: flex-1 делит ряд поровну при любом числе кнопок
          (замечание владельца 11.11.2026). */}
      {compact && (
      <div className="flex gap-2">
        {game.steamUrl && (
          <a
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-btn px-2 py-2.5 text-xs font-display font-extrabold text-[#0E1621] transition duration-300 hover:scale-[1.02]"
            style={{
              backgroundImage: "linear-gradient(135deg,#66C0F4 0%,#3E8BC0 100%)",
              boxShadow: "0 8px 20px rgba(102,192,244,0.25)",
            }}
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaSteam className="shrink-0 text-base" /> В Steam
          </a>
        )}
        {isUrl(game.youtube) && (
          <a
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-btn px-2 py-2.5 text-xs font-display font-extrabold text-white transition duration-300 hover:scale-[1.02]"
            style={{
              backgroundImage: "linear-gradient(135deg,#FF2D2D 0%,#C40000 100%)",
              boxShadow: "0 8px 20px rgba(255,0,0,0.22)",
            }}
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiYoutube className="shrink-0 text-base" /> YouTube
          </a>
        )}
        {hasMI(game) && isUrl(game.miVideo) && (
          <a
            className="inline-flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-btn px-2 py-2.5 text-xs font-display font-extrabold text-[#2A1B08] transition duration-300 hover:scale-[1.02]"
            style={{
              backgroundImage: "linear-gradient(135deg,#FFD9A0 0%,#E8A33D 100%)",
              boxShadow: "0 8px 20px rgba(255,217,160,0.22)",
            }}
            href={game.miVideo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <LuTrophy className="shrink-0 text-base" /> Выпуск МИ
          </a>
        )}
      </div>
      )}

      {/* Теги: в панели не нужны — статус и оценка уже в шапке и шкалах,
          а место нужно, чтобы модалка влезла целиком (11.11.2026). */}
      {/* Впечатления в окне — двумя строками; на странице игры они живут
          отдельной вкладкой внизу (владелец 11.11.2026). */}
      {game.notes && compact && (
        <div className="rounded-btn bg-night-700/40 p-2.5">
          <div className="t-micro mb-1 flex items-center gap-1.5">
            <FiMessageCircle className="text-pastel-mint" aria-hidden="true" />
            Впечатления Тиана
          </div>
          <p className="line-clamp-2 text-xs leading-relaxed text-ink-dim">
            {game.notes}
          </p>
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
      {/* Бары. На странице игры оценка стоит бейджем на обложке — шкала
          остаётся только в окне, чтобы число не повторялось (11.11.2026). */}
      <div className="max-w-xs space-y-3">
        {compact && (
          <Bar
            label="Оценка"
            icon={ratingIcon(parseNum(game.rating))}
            value={game.rating}
            max={10}
            tone="gold"
          />
        )}
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

      {/* В панели мету держим в одну колонку иначе значения обрезаются;
          на странице игры — две в ряд. */}
      <div className={compact ? "grid grid-cols-1 gap-y-2" : "grid grid-cols-1 gap-x-5 gap-y-2 sm:grid-cols-2"}>
        <MetaCell
          icon={FiTag}
          tone="#D7A8F5"
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
          tone="#8FC0FF"
          label="Сеттинг"
          onGo={() =>
            navigate(`/catalog?q=${encodeURIComponent(game.setting || "")}`)
          }
        >
          {game.setting}
        </MetaCell>
        <MetaCell
          icon={FiClock}
          tone="#FFC86B"
          label="Наиграно"
          onGo={() => navigate("/catalog?sort=hours-desc")}
        >
          {parseNum(game.hours) ? `${parseNum(game.hours)} ч.` : ""}
        </MetaCell>
        <MetaCell
          icon={FiCalendar}
          tone="#7BE0A8"
          label="Выход"
          onGo={() =>
            navigate(
              `/catalog?year=${encodeURIComponent(String(game.releaseDate).slice(-4))}`,
            )
          }
        >
          {game.releaseDate}
        </MetaCell>
        <MetaCell
          icon={FiCalendar}
          tone="#FF9DB8"
          label="Играл"
          onGo={() => navigate("/catalog?sort=played-desc")}
        >
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

      {/* Впечатления — в самом низу, под тегами: владелец 11.11.2026 отменил
          отдельную вкладку. В окне они остаются двумя строками выше. */}
      {game.notes && !compact && (
        <div className="rounded-card bg-night-700/40 p-4">
          <div className="t-micro mb-2 flex items-center gap-1.5">
            <FiMessageCircle className="text-pastel-mint" aria-hidden="true" />
            Впечатления Тиана
          </div>
          <p className="text-sm leading-relaxed text-ink-dim">{game.notes}</p>
        </div>
      )}
    </div>
  );
}
