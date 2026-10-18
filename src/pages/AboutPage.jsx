import { FaTwitch, FaYoutube, FaDiscord } from "react-icons/fa";
import { FiCalendar, FiMessageSquare } from "react-icons/fi";
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
      <section className="card relative overflow-hidden p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[280px_minmax(0,1fr)]">
          <img
            src={MASCOTS.croissant}
            alt="Кроассан-маскот канала Tiankami"
            width={720}
            height={720}
            className="w-full -rotate-2 transition-transform hover:rotate-0 drop-shadow-[0_14px_28px_rgba(0,0,0,.5)]"
            loading="lazy"
          />
          <div>
            <h1 className="section-title text-3xl md:text-4xl">
              <span className="h-marker">Обо</span> <span className="section-accent">мне</span>
            </h1>
            <p className="mt-4 text-ink-dim">
              Всем привет и добро пожаловать! Меня зовут{" "}
              <b className="text-ink">{BRAND.about.realName}</b>, но все зовут просто{" "}
              <b className="section-accent">{BRAND.about.nick}</b>.
            </p>
            <ul className="mt-4 space-y-3 text-sm text-ink-dim">
              <li className="flex gap-2">
                <span>🎮</span>
                <span>
                  <b className="text-ink">Какие игры на стримах?</b> Всевозможные{" "}
                  <b className="text-pastel-pink">новинки-рогалики</b> в первые дни релиза!
                </span>
              </li>
              <li className="flex gap-2">
                <span>📅</span>
                <span>
                  <b className="text-ink">Стримлю КАЖДЫЙ ДЕНЬ</b>.{" "}
                  {BRAND.about.scheduleNote}
                </span>
              </li>
              <li className="flex gap-2">
                <span>🏆</span>
                <span>
                  На этом сайте я веду <b className="text-ink">базу всех рогаликов</b>:
                  оценки, часы, статусы и заметки — всё честно, даже боль.
                </span>
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/schedule" className="btn-primary text-sm">
                <FiCalendar /> Расписание стримов
              </Link>
              <Link to="/catalog" className="btn-ghost text-sm">
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
              <a className="btn-primary text-sm" href={BRAND.links.twitch} target="_blank" rel="noopener noreferrer">
                <FaTwitch /> Подписаться на Twitch
              </a>
              <a className="btn-ghost text-sm" href={BRAND.links.youtube} target="_blank" rel="noopener noreferrer">
                <FaYoutube /> YouTube
              </a>
              <a className="btn-ghost text-sm" href={BRAND.links.discord} target="_blank" rel="noopener noreferrer">
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
