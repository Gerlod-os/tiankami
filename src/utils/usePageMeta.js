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
    setMeta("property", "og:url", url || BRAND.siteUrl);
  }, [title, description, image, url]);
}
