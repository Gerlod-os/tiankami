import { useState } from "react";
import { FiSend, FiLoader } from "react-icons/fi";

// Форма добавления стрима в расписание: POST /api/schedule → Vercel → Google Apps Script
export function ScheduleForm() {
  const [form, setForm] = useState({ date: "", time: "", game: "", streamLink: "" });
  const [state, setState] = useState("idle"); // idle | sending | ok | error
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.game) {
      setState("error");
      setError("Заполни дату, время и игру/тему стрима.");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          time: form.time,
          game: form.game,
          streamLink: form.streamLink || "https://twitch.tv/tiankami",
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("ok");
      setForm({ date: "", time: "", game: "", streamLink: "" });
    } catch {
      setState("error");
      setError(
        "Не удалось отправить (на dev-сервере /api не работает — форма оживёт на Vercel)."
      );
    }
  };

  return (
    <form onSubmit={submit} className="card grid gap-4 p-6 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="sf-date">Дата</label>
        <input id="sf-date" type="date" className="input" value={form.date} onChange={set("date")} required />
      </div>
      <div>
        <label className="label" htmlFor="sf-time">Время (МСК)</label>
        <input id="sf-time" type="time" className="input" value={form.time} onChange={set("time")} required />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="sf-game">Игра / тема стрима</label>
        <input
          id="sf-game"
          type="text"
          className="input"
          placeholder="Например: новинки-рогалики или ШОУ Мастер Игорей"
          value={form.game}
          onChange={set("game")}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <label className="label" htmlFor="sf-link">Ссылка на стрим (необязательно)</label>
        <input
          id="sf-link"
          type="url"
          className="input"
          placeholder="https://twitch.tv/tiankami"
          value={form.streamLink}
          onChange={set("streamLink")}
        />
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={state === "sending"}>
          {state === "sending" ? <FiLoader className="animate-spin" /> : <FiSend />}
          Предложить стрим
        </button>
        {state === "ok" && (
          <span className="text-sm font-semibold text-pastel-mint">
            ✅ Улетело в таблицу! Тиан посмотрит.
          </span>
        )}
        {state === "error" && (
          <span className="text-sm font-semibold text-red-300">{error}</span>
        )}
      </div>
    </form>
  );
}
