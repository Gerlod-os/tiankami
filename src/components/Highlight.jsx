// Подсветка совпадений живого поиска — внутри слова, без разрыва
export function Highlight({ text, q }) {
  const query = (q || "").trim();
  if (!query) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // Используем replace вместо split — подсвечиваем внутри слова, не разрывая его
  const regex = new RegExp("(" + escaped + ")", "ig");
  return (
    <>
      {String(text).split(regex).map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i}>{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}
