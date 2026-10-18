import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiExternalLink,
  FiTag,
  FiCalendar,
  FiGlobe,
  FiYoutube,
  FiPlay,
  FiMessageCircle,
  FiStar,
  FiActivity,
  FiFeather,
  FiFlag,
} from "react-icons/fi";
import { FaSkull, FaSteam } from "react-icons/fa";
import { parseNum, isUrl, hasMI } from "../utils/normalize";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { parseYouTubeUrl } from "../utils/youtube";
import { moodOf } from "../utils/recommend";
import { RarityEgg } from "./RarityEgg";
import { MITrophy } from "./MITrophy";
import { useData } from "./DataProvider";

// Иконки шкал: один шрифт на всех устройствах, цвет из палитры. Эмодзи (💫💀🌳)
// рисовала система, и на iPhone, и на Windows это были разные значки.
const ratingIcon = () => FiStar;
const cxIcon = (c) => (c >= 7 ? FaSkull : c >= 4 ? FiActivity : FiFeather);
const progIcon = () => FiFlag;

function Bar({ label, icon: Icon, value, max, suffix }) {
  const v = parseNum(value);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ink-dim">
          {Icon && <Icon className="shrink-0" aria-hidden="true" />} {label}
        </span>
        <span className="font-display font-bold text-ink">
          {v > 0 ? `${v}${suffix || `/${max}`}` : "—"}
        </span>
      </div>
      <div className="bar-track bar-shine">
        <div
          className="bar-fill"
          style={{ width: `${Math.min(100, (v / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}

// Две ячейки сетки: подпись с иконкой и значение. Иконка одна — вторая,
// стоявшая перед значением, была дублем и сбивала выравнивание.
function MetaCell({ icon: Icon, iconCls, label, children, onGo }) {
  if (!children) return null;
  const Comp = onGo ? "button" : "span";
  return (
    <>
      <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
        <Icon className={"shrink-0 " + iconCls} aria-hidden="true" /> {label}
      </span>
      <Comp
        {...(onGo ? { type: "button", onClick: onGo } : {})}
        className={
          onGo
            ? "-mx-1 inline-flex min-h-8 items-center justify-self-start rounded-btn px-1 text-left text-ink underline-offset-2 transition hover:text-pastel-blue hover:underline"
            : "min-w-0 text-ink"
        }
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
  // У плейлиста ролика нет — подложкой идёт обложка игры.
  const poster = yt?.videoId
    ? `https://i.ytimg.com/vi/${yt.videoId}/maxresdefault.jpg`
    : game.image || "";
  const posterFallback = yt?.videoId
    ? `https://i.ytimg.com/vi/${yt.videoId}/mqdefault.jpg`
    : game.image || "";

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {/* Обложки здесь нет: в шапке страницы она уже стоит дважды (фон + видимая).
          Третья копия на том же экране — дубль (план, Б17). */}

      {/* YouTube под обложкой: сначала постер, плеер — по клику.
          В модалке плеера нет: там место занимает обложка, а смотреть — на странице игры. */}
      {showPlayer && !compact && (
        <div className="mx-auto max-w-2xl overflow-hidden rounded-card border border-white/10 shadow-card">
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
          В один ряд 50/50, спокойный фон — цвет остаётся только у иконки. */}
      {compact && (
      <div
        className={
          (Boolean(game.steamUrl) && isUrl(game.youtube)
            ? "grid grid-cols-2 "
            : "flex flex-wrap ") + "gap-2"
        }
      >
        {game.steamUrl && (
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn border border-white/10 bg-white/5 px-3 py-2.5 font-display font-bold text-ink transition duration-300 hover:border-white/25 hover:bg-white/10"
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaSteam className="text-lg text-[#66C0F4]" /> В Steam
          </a>
        )}
        {isUrl(game.youtube) && (
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn border border-white/10 bg-white/5 px-3 py-2.5 font-display font-bold text-ink transition duration-300 hover:border-white/25 hover:bg-white/10"
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiYoutube className="text-lg text-[#FF2D2D]" /> YouTube плейлист
          </a>
        )}
        {hasMI(game) && isUrl(game.miVideo) && (
          <a
            className="btn-ghost col-span-2 text-sm"
            href={game.miVideo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiExternalLink className="text-pastel-amber" /> Выпуск МИ
          </a>
        )}
      </div>
      )}

      {/* Теги */}
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

      {/* Впечатления Тиана: единственная колонка таблицы, которая не доходила до
          посетителя (459/459 заполнено). Ставлю выше баров: это текст, ради которого
          открывают страницу, а не приложение к шкалам. */}
      {game.notes && (
        <div className="rounded-btn bg-night-700/40 p-3.5">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-faint">
            <FiMessageCircle className="text-pastel-mint" aria-hidden="true" />
            Впечатления Тиана
          </div>
          <p className="text-sm leading-relaxed text-ink-dim">{game.notes}</p>
        </div>
      )}

      {/* Бары и мета — рядом: шкалы короткие (448 px), справа не пусто */}
      <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
      {/* Бары */}
      <div className="max-w-md space-y-3">
        <Bar
          label="Оценка"
          icon={ratingIcon(parseNum(game.rating))}
          value={game.rating}
          max={10}
        />
        <Bar
          label="Сложность"
          icon={cxIcon(parseNum(game.complexity))}
          value={game.complexity}
          max={10}
        />
        <Bar
          label="Прогресс"
          icon={progIcon(parseNum(game.progress))}
          value={game.progress}
          max={100}
          suffix="%"
        />
      </div>

      {/* Мета: одна иконка у подписи, значения строго по одной вертикали */}
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-x-3 gap-y-2 text-sm sm:grid-cols-[132px_minmax(0,1fr)]">
        <MetaCell
          icon={FiTag}
          iconCls="text-pastel-purple"
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
          label="Сеттинг"
          onGo={() =>
            navigate(`/catalog?q=${encodeURIComponent(game.setting || "")}`)
          }
        >
          {game.setting}
        </MetaCell>
        <MetaCell icon={FiClock} iconCls="text-pastel-amber" label="Наиграно">
          {parseNum(game.hours) ? `${parseNum(game.hours)} ч.` : ""}
        </MetaCell>
        <MetaCell icon={FiCalendar} iconCls="text-pastel-mint" label="Выход">
          {game.releaseDate}
        </MetaCell>
        <MetaCell icon={FiCalendar} iconCls="text-pastel-pink" label="Играл">
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
