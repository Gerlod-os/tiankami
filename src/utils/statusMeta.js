import { parseNum } from "./normalize";

export const STATUS_META = {
  Пройдено: { cls: "bg-pastel-mint/15 text-pastel-mint border border-pastel-mint/30", emoji: "🏆" },
  "В процессе": { cls: "bg-pastel-pink/15 text-pastel-pink border border-pastel-pink/30", emoji: "🎮" },
  "В паузе": { cls: "bg-pastel-amber/15 text-pastel-amber border border-pastel-amber/30", emoji: "⏸️" },
  Дропнуто: { cls: "bg-red-400/10 text-red-300 border border-red-400/30", emoji: "💔" },
  "Жду релиза": { cls: "bg-pastel-blue/15 text-pastel-blue border border-pastel-blue/30", emoji: "⏳" },
  "Не начал": { cls: "bg-white/10 text-ink-dim border border-white/20", emoji: "🌱" },
  Обзор: { cls: "bg-pastel-purple/15 text-pastel-purple border border-pastel-purple/30", emoji: "📝" },
};

export function statusMeta(status) {
  return (
    STATUS_META[status] || {
      cls: "bg-white/10 text-ink-dim border border-white/20",
      emoji: "🎲",
    }
  );
}

export function ratingColor(r) {
  const n = parseNum(r);
  if (n >= 9) return "text-pastel-mint";
  if (n >= 7) return "text-pastel-blue";
  if (n >= 5) return "text-pastel-amber";
  return "text-red-300";
}

export function rankMedal(rank) {
  const n = parseInt(rank, 10);
  if (n === 1) return "🥇";
  if (n === 2) return "🥈";
  if (n === 3) return "🥉";
  return null;
}
