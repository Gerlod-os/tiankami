// Подсветка совпадений живого поиска (единый стиль через <mark>)
export function Highlight({ text, q }) {
  const query = (q || "").trim();
  if (!query) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${safe})`, "ig"));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>
      )}
    </>
  );
}
