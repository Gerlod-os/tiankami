import {
  FiAward,
  FiPlay,
  FiPause,
  FiXCircle,
  FiClock,
  FiFeather,
  FiEdit3,
  FiHelpCircle,
} from "react-icons/fi";
import { parseNum } from "./normalize";

// Иконки вместо эмодзи: рисуются одним шрифтом на всех устройствах и берут цвет
// из класса чипа (эмодзи этого не умеют). Замена 18.10.2026.
export const STATUS_META = {
  Пройдено: {
    cls: "bg-pastel-mint/15 text-pastel-mint border border-pastel-mint/30",
    icon: FiAward,
  },
  "В процессе": {
    cls: "bg-pastel-pink/15 text-pastel-pink border border-pastel-pink/30",
    icon: FiPlay,
  },
  "В паузе": {
    cls: "bg-pastel-amber/15 text-pastel-amber border border-pastel-amber/30",
    icon: FiPause,
  },
  Дропнуто: {
    cls: "bg-red-400/10 text-red-300 border border-red-400/30",
    icon: FiXCircle,
  },
  "Жду релиза": {
    cls: "bg-pastel-blue/15 text-pastel-blue border border-pastel-blue/30",
    icon: FiClock,
  },
  "Не начал": {
    cls: "bg-white/10 text-ink-dim border border-white/20",
    icon: FiFeather,
  },
  Обзор: {
    cls: "bg-pastel-purple/15 text-pastel-purple border border-pastel-purple/30",
    icon: FiEdit3,
  },
};

export function statusMeta(status) {
  return (
    STATUS_META[status] || {
      cls: "bg-white/10 text-ink-dim border border-white/20",
      icon: FiHelpCircle,
    }
  );
}

// Цвет оценки = цвет яйца редкости (utils/rarity.js): 10 — золото perfect,
// 9 — фиолет epic, 7–8 — голубой rare, ниже 7 — серый common. Раньше 5–6 были
// янтарными и путались с золотым яйцом (замечание владельца 11.11.2026).
export function ratingColor(r) {
  const n = parseNum(r);
  if (n >= 10) return "text-[#FFD9A0]";
  if (n >= 9) return "text-[#C9A0DC]";
  if (n >= 7) return "text-[#A0C4FF]";
  return "text-[#9aa0ae]";
}

// Медали первым трём — просто номера: эмодзи 🥇🥈🥉 на разных системах выглядят
// по-разному, а цифры в стиле сайта читаются одинаково.
export function rankMedal(rank) {
  const n = parseInt(rank, 10);
  if (n === 1 || n === 2 || n === 3) return String(n);
  return null;
}
