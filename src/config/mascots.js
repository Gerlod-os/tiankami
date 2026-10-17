// Бренд-ассеты канала Tiankami (оригинальные растровые маскоты)
import { BASE_PATH } from "./site.js";

// Сайт на GitHub Pages живёт в подпапке, поэтому путь к картинке начинается с BASE_PATH.
const img = (file) => `${BASE_PATH}/img/${file}`;

export const MASCOTS = {
  // Логотип-бейдж: кроассан-геймпад
  logo: img("logo.webp"),
  og: img("og.png"),
  // Кроассан-персонаж
  croissant: img("mascot-croissant.webp"),
  // Герой с копилкой — блок поддержки/подписки
  support: img("mascot-support.webp"),
  // Герой с коробкой мини-кроассанов — подборки
  collections: img("mascot-collections.webp"),
  // Рыбак — «улов дня»
  fisher: img("mascot-fisher.webp"),
  // Грустный — пустое состояние каталога
  sad: img("mascot-sad.webp"),
};
