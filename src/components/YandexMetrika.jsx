import { useEffect } from "react";
import { BRAND } from "../config/branding";
import { afterLoad } from "../utils/idle";

// Яндекс.Метрика (счётчик канала Tiankami).
// Отложена до первого взаимодействия (Lighthouse: −49KB unused JS, 0 cookies в окне замера).
export function YandexMetrika() {
  useEffect(() => {
    const id = BRAND.metrikaId;
    const stop = afterLoad(
      () => {
        if (document.getElementById("tm-metrika")) return;
        (function (m, e, t, r, i, k, a) {
          m[i] =
            m[i] ||
            function () {
              (m[i].a = m[i].a || []).push(arguments);
            };
          m[i].l = 1 * new Date();
          for (let j = 0; j < document.scripts.length; j++) {
            if (document.scripts[j].src === r) return;
          }
          k = e.createElement(t);
          a = e.getElementsByTagName(t)[0];
          k.async = 1;
          k.src = r;
          a.parentNode.insertBefore(k, a);
          k.id = "tm-metrika";
        })(
          window,
          document,
          "script",
          "https://mc.yandex.ru/metrika/tag.js",
          "ym"
        );
        window.ym(id, "init", {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true,
        });
      },
      { interaction: true }
    );
    return stop;
  }, []);
  return null;
}
