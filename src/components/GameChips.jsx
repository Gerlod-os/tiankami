import { RarityEgg } from "./RarityEgg";
import { MITrophy } from "./MITrophy";
import { statusMeta } from "../utils/statusMeta";
import { moodOf } from "../utils/recommend";
import { hasMI } from "../utils/normalize";

// Чипсы игры (редкость, статус, настроение, МИ) одним компонентом: на странице
// игры они стоят в шапке, а не посреди деталей (владелец 11.11.2026).
export function GameChips({ game, rarity = "common" }) {
  const meta = statusMeta(game.status);
  const mood = moodOf(game);
  const MoodIcon = mood.icon;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="chip border border-white/10 bg-night-900/70">
        <RarityEgg rarity={rarity} size={22} />
      </span>
      <span className={"chip " + meta.cls}>
        {meta.icon && <meta.icon className="shrink-0" aria-hidden="true" />} {game.status || "—"}
      </span>
      <span
        className="chip border border-pastel-mint/25 bg-pastel-mint/10 text-pastel-mint"
        title="Настроение забега"
      >
        {MoodIcon && <MoodIcon className="shrink-0" aria-hidden="true" />} {mood.label}
      </span>
      {hasMI(game) && (
        <span className="chip border border-pastel-amber/30 bg-pastel-amber/15 text-pastel-amber">
          <MITrophy size="xs" /> МИ
        </span>
      )}
    </div>
  );
}
