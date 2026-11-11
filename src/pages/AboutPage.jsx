import { FaTwitch, FaYoutube, FaDiscord } from "react-icons/fa";
import { FiCalendar, FiMessageSquare, FiAward } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa";
import { Link } from "react-router-dom";
import { BRAND } from "../config/branding";
import { MASCOTS } from "../config/mascots";
import { usePageMeta } from "../utils/usePageMeta";

export function AboutPage() {
  usePageMeta({
    title: "Обо мне — Tiankami",
    description:
      "Кто такой Тиан, какие игры на стримах, расписание и как поддержать канал. Уютный хардкор каждый день.",
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="card overflow-hidden">
        {/* Баннер канала вместо плашки с Сайтамой: владелец прислал картинку
            11.11.2026 и попросил «закинуть, только отредактируй как надо».
            Обрезана белая кайма, на телефоне кадр сдвинут к логотипу, иначе
            надпись на широком баннере становится нечитаемой. */}
        {/* Баннер растворяется маской, а не тёмной накладкой: накладка давала
            видимую полосу, маска тянет переход на всю нижнюю половину картинки
            (замечание владельца 11.11.2026 — «слишком резкий переход»). */}
        <div className="relative">
          <img
            src={MASCOTS.aboutBanner}
            alt="TianKami — канал Тиана"
            width={1872}
            height={276}
            className="block aspect-[1872/276] w-full object-cover [mask-image:linear-gradient(to_bottom,#000_52%,rgba(0,0,0,0.55)_78%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,#000_52%,rgba(0,0,0,0.55)_78%,transparent_100%)] max-sm:aspect-[3.4/1] max-sm:object-[38%_center]"
            fetchPriority="high"
            loading="eager"
          />
        </div>
        <div className="p-6 md:p-10">
          <div className="max-w-2xl">
            <h1 className="section-title text-3xl md:text-4xl">
              <span className="h-marker">Обо</span> <span className="section-accent">мне</span>
            </h1>
            <p className="mt-4 text-ink-dim">
              Всем привет и добро пожаловать! Меня зовут{" "}
              <b className="text-ink">{BRAND.about.realName}</b>, но все зовут просто{" "}
              <b className="section-accent">{BRAND.about.nick}</b>.
            </p>
            {/* Иконки крупнее и в цветных кружках: раньше это были бледные
                значки 1em, они терялись рядом с жирным текстом (11.11.2026). */}
            <ul className="mt-5 space-y-4 text-sm text-ink-dim">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pastel-pink/30 bg-pastel-pink/10 text-pastel-pink">
                  <FaGamepad className="text-lg" aria-hidden="true" />
                </span>
                <span>
                  <b className="text-ink">Какие игры на стримах?</b> Всевозможные{" "}
                  <b className="text-pastel-pink">новинки-рогалики</b> в первые дни релиза!
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pastel-blue/30 bg-pastel-blue/10 text-pastel-blue">
                  <FiCalendar className="text-lg" aria-hidden="true" />
                </span>
                <span>
                  <b className="text-ink">Стримлю КАЖДЫЙ ДЕНЬ</b>.{" "}
                  {BRAND.about.scheduleNote}
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pastel-amber/30 bg-pastel-amber/10 text-pastel-amber">
                  <FiAward className="text-lg" aria-hidden="true" />
                </span>
                <span>
                  На этом сайте я веду <b className="text-ink">базу всех рогаликов</b>:
                  оценки, часы, статусы и заметки — всё честно, даже боль.
                </span>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/schedule" className="about-cta text-sm">
                <FiCalendar /> Расписание стримов
              </Link>
              <Link to="/catalog" className="about-cta-ghost text-sm">
                Каталог рогаликов
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <div>
            <h2 className="section-title text-2xl md:text-3xl">
              Подписка и <span className="section-accent">поддержка</span>
            </h2>
            <p className="mt-4 text-sm text-ink-dim">
              Подписка — лучший способ <b className="text-ink">поддержать стримера</b>.
              Взамен: уникальная иконка в чате, смайлики, просмотр без рекламы и любовь
              в чате! А ещё ты просто помогаешь стримеру развиваться и стримить дальше :3
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a className="about-cta text-sm" href={BRAND.links.twitch} target="_blank" rel="noopener noreferrer">
                <FaTwitch /> Подписаться на Twitch
              </a>
              <a className="about-cta-ghost text-sm" href={BRAND.links.youtube} target="_blank" rel="noopener noreferrer">
                <FaYoutube /> YouTube
              </a>
              <a className="about-cta-ghost text-sm" href={BRAND.links.discord} target="_blank" rel="noopener noreferrer">
                <FaDiscord /> Discord
              </a>
            </div>
            <div className="mt-6 rounded-card border border-pastel-purple/25 bg-pastel-purple/10 p-4">
              <div className="flex items-center gap-2 font-display font-extrabold text-pastel-purple">
                <FiMessageSquare /> MEME ALERTS
              </div>
              <p className="mt-1 text-sm text-ink-dim">
                Отправь мемас на стрим — заходи в Discord и кидай в специальное место!
              </p>
            </div>
          </div>
          <img
            src={MASCOTS.support}
            alt="Кроассан обнимает копилку"
            width={900}
            height={501}
            className="w-full max-w-[280px] rotate-2 justify-self-center transition-transform hover:rotate-0 drop-shadow-[0_14px_28px_rgba(0,0,0,.5)]"
            loading="lazy"
          />
        </div>
      </section>
    </div>
  );
}
