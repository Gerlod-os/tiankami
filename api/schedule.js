// Vercel serverless: прокси CORS для формы расписания → Google Apps Script
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyrQYM-AifKnglwo2P7-pDnjkmf2eNz9_0z_DEQ21Iht5mR_4Ipf3sfH3M_I6AqxfcY/exec";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }
  let rawBody = "";
  for await (const chunk of req) rawBody += chunk;
  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return res.status(400).json({ success: false, error: "Invalid JSON" });
  }
  const { date, time, game, streamLink } = body;
  if (!date || !time || !game) {
    return res
      .status(400)
      .json({ success: false, error: "Не все поля заполнены (date, time, game обязательны)" });
  }
  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date,
        time,
        game,
        streamLink: streamLink || "https://twitch.tv/tiankami",
      }),
    });
    if (!response.ok) {
      return res
        .status(response.status)
        .json({ success: false, error: `Google Apps Script вернул ${response.status}` });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[Proxy] Ошибка:", error);
    return res.status(500).json({ success: false, error: error.message || "Ошибка сервера" });
  }
}
