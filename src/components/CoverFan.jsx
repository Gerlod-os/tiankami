// Веер обложек (реальные Steam-обложки): hover — расходятся
const ROTS = [-5, 0, 5, -3, 3];

export function CoverFan({ games, count = 5 }) {
  const list = games.filter((g) => g?.image).slice(0, count);
  if (!list.length) return null;
  return (
    <div className="fan w-[240px]" aria-hidden="true">
      {list.map((g, i) => (
        <img
          key={g.slug}
          src={g.image}
          alt=""
          width={460}
          height={215}
          loading="lazy"
          className="fan-img"
          style={{ ["--i"]: i, ["--rot"]: `${ROTS[i % 5]}deg` }}
        />
      ))}
    </div>
  );
}
