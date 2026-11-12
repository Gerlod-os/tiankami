import { Link } from "react-router-dom";
import { FiArrowRight } from "react-icons/fi";
import { CoverFan } from "./CoverFan";
import { CollectionIcon } from "./CollectionIcon";

// Один вид подборки для главной и страницы подборок: раньше это были две
// разные разметки (владелец 11.11.2026 просил «выглядеть как в подборках»).
export function CollectionCard({ collection: c, byTitle }) {
  const golden = /золотой/i.test(c.name);
  const allGames = c.games
    .map((g) => byTitle.get(String(g.name).toLowerCase()))
    .filter(Boolean);
  // Веер свой у каждой подборки: три обложки из разных мест списка, сдвиг
  // считается из slug. Иначе у «Золотого списка» и топов повторялись одни и те
  // же популярные игры и веер выглядел одинаковым (11.11.2026).
  const seed = [...c.slug].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const step = Math.max(1, Math.floor(allGames.length / 3));
  const preview =
    allGames.length > 3
      ? [0, 1, 2].map((i) => allGames[(seed + i * step) % allGames.length])
      : allGames;
  // Четыре первые игры подборки, затем многоточие. Номер берём из rank:
  // где его нет — оставляем пустой отступ, чтобы названия не разъезжались
  // у «Золотого списка» и остальных подборок (11.11.2026).
  const listGames = c.games
    .slice(0, 4)
    .map((g) => ({
      rank: g.rank || null,
      title: byTitle.get(String(g.name).toLowerCase())?.title || g.name,
    }))
    .filter((g) => g.title);

  return (
    <Link
      to={`/collections/${c.slug}`}
      // group обязателен: веер расходится по `.group:hover .fan-img`
      className={
        "card card-hover group flex flex-col p-4 hover:scale-[1.01] " +
        (golden ? "gold-card" : "")
      }
    >
      <div className="flex items-center gap-2">
        {/* Иконка подборки вместо яйца: яйца путали с редкостью игры и давали
            артефакты на малом размере (11.11.2026). */}
        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
          <CollectionIcon name={c.name} size={32} />
        </span>
        <h3
          className={
            "line-clamp-1 font-display text-lg font-extrabold sm:text-xl " +
            (golden ? "text-pastel-amber" : "text-ink")
          }
        >
          {c.name}
        </h3>
      </div>
      {/* Описание убрано из карточки: оно было только у «Золотого списка» и
          сдвигало вниз весь список игр. Полный текст остался на странице
          подборки (CollectionPage.jsx), здесь геометрия у всех одинаковая. */}
      <div className="mt-3 flex items-start gap-3">
        {/* Веер уже, чтобы названия игр не обрезались на «Monster…»: карточка
            узкая, и 240 px веера съедали половину строки. */}
        <div className="w-[176px] shrink-0 overflow-hidden">
          <div className="origin-top-left scale-[0.72]">
            <CoverFan games={preview} count={3} />
          </div>
        </div>
        {listGames.length > 0 && (
          <ul className="min-w-0 flex-1 space-y-1 text-base font-semibold text-ink-dim">
            {listGames.map((g, i) => (
              <li key={g.title + i} className="flex gap-1">
                {/* Пустая ячейка вместо номера: названия начинаются с одной
                    вертикали и у золотого списка, и у топов. */}
                <span className="w-4 shrink-0 font-display text-sm font-bold text-pastel-purple">
                  {g.rank ? `${g.rank}.` : ""}
                </span>
                <span className="line-clamp-1 font-bold text-ink">{g.title}</span>
              </li>
            ))}
            {c.games.length > 4 && (
              <li className="pl-[20px] text-sm text-ink-faint" title={`И ещё ${c.games.length - 4} игр`}>
                и ещё {c.games.length - 4}…
              </li>
            )}
          </ul>
        )}
      </div>
      <span className="flex items-center gap-1 pt-3 text-sm font-bold text-pastel-pink">
        {c.games.length} игр <FiArrowRight />
      </span>
    </Link>
  );
}
