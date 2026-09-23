import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiExternalLink,
  FiTag,
  FiCalendar,
  FiGlobe,
  FiYoutube,
} from "react-icons/fi";
import { FaSteam } from "react-icons/fa";
import { parseNum, isUrl, hasMI } from "../utils/normalize";
import { statusMeta, ratingColor } from "../utils/statusMeta";
import { checkYouTubeUrlSafe } from "../utils/youtubeSafe";
import { parseYouTubeUrl } from "../utils/youtube";
import { moodOf } from "../utils/recommend";
import { RarityEgg } from "./RarityEgg";
import { MITrophy } from "./MITrophy";
import { useData } from "./DataProvider";

const ratingIcon = (r) => (r >= 9 ? "💫" : r >= 6 ? "🌟" : "⭐");
const cxIcon = (c) => (c >= 7 ? "💀" : c >= 4 ? "😐" : "😌");
const progIcon = (p) => (p >= 100 ? "🌳" : p > 50 ? "🌿" : "🌱");

function Bar({ label, icon, value, max, suffix }) {
  const v = parseNum(value);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-ink-dim">
          <span aria-hidden="true">{icon}</span> {label}
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

function MetaRow({ icon: Icon, iconCls, label, children, onGo }) {
  if (!children) return null;
  const Comp = onGo ? "button" : "span";
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className={"mt-0.5 shrink-0 " + iconCls} />
      <div>
        <span className="mr-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        <Comp
          {...(onGo ? { type: "button", onClick: onGo } : {})}
          className={
            onGo
              ? "text-pastel-blue underline-offset-2 transition hover:underline hover:drop-shadow-[0_0_8px_rgba(160,196,255,.6)]"
              : "text-ink"
          }
        >
          {children}
        </Comp>
      </div>
    </div>
  );
}

export function GameDetails({ game }) {
  const navigate = useNavigate();
  const { bySlug } = useData();
  const rarity = bySlug?.[game.slug] || "common";
  const meta = statusMeta(game.status);
  const [ytState, setYtState] = useState("loading");
  const yt = parseYouTubeUrl(game.youtube);

  useEffect(() => {
    let alive = true;
    if (!game.youtube || !yt) {
      setYtState("hide");
      return undefined;
    }
    checkYouTubeUrlSafe(game.youtube).then((res) => {
      if (alive) setYtState(res === "mismatch" ? "hide" : "show");
    });
    return () => {
      alive = false;
    };
  }, [game.youtube]);

  return (
    <div className="space-y-5">
      {/* Обложка сверху */}
      {game.image && (
        <img
          src={game.image}
          alt={`Обложка ${game.title}`}
          className="w-full rounded-card border border-white/10 object-cover shadow-sticker"
          loading="lazy"
        />
      )}

      {/* YouTube под обложкой */}
      {game.youtube && ytState === "show" && yt?.embedUrl && (
        <div className="overflow-hidden rounded-card border border-white/10 shadow-card">
          <iframe
            className="aspect-video w-full"
            src={yt.embedUrl}
            title={`Прохождение ${game.title} на YouTube`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      )}

      {/* Кнопки */}
      <div className="flex flex-wrap gap-2">
        {game.steamUrl && (
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn px-4 py-3 font-display font-extrabold text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
              boxShadow: "0 10px 30px rgba(102,126,234,0.5)",
            }}
            href={game.steamUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaSteam className="text-xl" /> В Steam
          </a>
        )}
        {isUrl(game.youtube) && (
          <a
            className="inline-flex w-full items-center justify-center gap-2 rounded-btn px-4 py-3 font-display font-extrabold text-white transition-all duration-300 hover:scale-[1.02]"
            style={{
              backgroundImage:
                "linear-gradient(135deg,#ff0000 0%,#cc0000 100%)",
              boxShadow: "0 10px 30px rgba(255,0,0,0.4)",
            }}
            href={game.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiYoutube className="text-2xl" /> YouTube плейлист
          </a>
        )}
        {hasMI(game) && isUrl(game.miVideo) && (
          <a
            className="btn-ghost text-sm"
            href={game.miVideo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FiExternalLink className="text-pastel-amber" /> Выпуск МИ
          </a>
        )}
      </div>

      {/* Теги */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="chip border border-white/10 bg-night-900/70 cursor-pointer"
          onClick={() =>
            navigate(
              `/catalog?genre=${encodeURIComponent(String(game.genre).split(",")[0]?.trim() || "")}`,
            )
          }
        >
          <RarityEgg rarity={rarity} size={24} />
        </span>
        <span className={"chip " + meta.cls}>
          {meta.emoji} {game.status || "—"}
        </span>
        <span
          className="chip border border-pastel-mint/25 bg-pastel-mint/10 text-pastel-mint"
          title="Настроение забега"
        >
          {moodOf(game).emoji} {moodOf(game).label}
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

      {/* Бары */}
      <div className="space-y-3">
        <Bar
          label="Оценка"
          icon={ratingIcon(parseNum(game.rating))}
          value={game.rating}
          max={10}
        />
        <div>
          <Bar
            label="Сложность"
            icon={cxIcon(parseNum(game.complexity))}
            value={game.complexity}
            max={10}
          />
          {parseNum(game.complexity) >= 7 && (
            <div className="mt-1 text-xs text-pastel-rose">Попотеешь 💀</div>
          )}
        </div>
        <Bar
          label="Прогресс"
          icon={progIcon(parseNum(game.progress))}
          value={game.progress}
          max={100}
          suffix="%"
        />
      </div>

      {/* Мета */}
      <div className="space-y-2.5">
        <MetaRow
          icon={FiTag}
          iconCls="text-pastel-purple"
          label="Жанр"
          onGo={() =>
            navigate(
              `/catalog?genre=${encodeURIComponent(String(game.genre).split(",")[0]?.trim() || "")}`,
            )
          }
        >
          <span className="inline-flex items-center gap-1">
            <FiTag className="text-pastel-purple" /> {game.genre}
          </span>
        </MetaRow>
        <MetaRow
          icon={FiGlobe}
          iconCls="text-pastel-blue"
          label="Сеттинг"
          onGo={() =>
            navigate(`/catalog?q=${encodeURIComponent(game.setting || "")}`)
          }
        >
          <span className="inline-flex items-center gap-1">
            <FiGlobe className="text-pastel-blue" /> {game.setting}
          </span>
        </MetaRow>
        <MetaRow icon={FiClock} iconCls="text-pastel-amber" label="Наиграно">
          <span className="inline-flex items-center gap-1">
            <FiClock className="text-pastel-amber" />{" "}
            {parseNum(game.hours) ? `${parseNum(game.hours)} ч.` : ""}
          </span>
        </MetaRow>
        <MetaRow icon={FiCalendar} iconCls="text-pastel-mint" label="Выход">
          <span className="inline-flex items-center gap-1">
            <FiCalendar className="text-pastel-mint" /> {game.releaseDate}
          </span>
        </MetaRow>
        <MetaRow icon={FiCalendar} iconCls="text-pastel-pink" label="Играл">
          <span className="inline-flex items-center gap-1">
            <FiCalendar className="text-pastel-pink" /> {game.playedDate}
          </span>
        </MetaRow>
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
