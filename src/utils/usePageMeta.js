import { useEffect } from "react";
import { BRAND } from "../config/branding";

// Клиентское обновление title/description/og-тегов при SPA-навигации.
// На SSR теги проставляет scripts/prerender.mjs.
export function usePageMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (attr, name, content) => {
      if (content == null) return;
      let el = document.head.querySelector(`meta[${attr}="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };
    setMeta("name", "description", description);
    setMeta("property", "og:title", title || BRAND.siteTitle);
    setMeta("property", "og:description", description);
    if (image)
      setMeta(
        "property",
        "og:image",
        /^https?:/i.test(image) ? image : BRAND.siteUrl + image
      );
    setMeta("property", "og:url", currentUrl(url));
    // canonical: пререндер ставит его один раз, при переходах внутри сайта он
    // оставался от предыдущей страницы. Адрес без запроса и якоря, со слешем
    // на конце — как в scripts/prerender.mjs (18.11.2026).
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", currentUrl(url));
  }, [title, description, image, url]);
}

// Текущий адрес страницы без параметров и якоря. До появления window — адрес сайта.
function currentUrl(explicit) {
  if (explicit) return explicit;
  if (typeof window === "undefined") return BRAND.siteUrl;
  const { origin, pathname } = window.location;
  return origin + pathname.replace(/\/?$/, "/");
}
