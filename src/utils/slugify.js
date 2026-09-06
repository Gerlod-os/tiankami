export function slugify(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^\wа-яёА-Яё\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(slug, usedSlugs) {
  if (!usedSlugs.has(slug)) return slug;
  let i = 2;
  const base = slug;
  while (usedSlugs.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}
