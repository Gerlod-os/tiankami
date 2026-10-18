// Прошедшие трансляции канала Twitch: то, что видно во вкладке «Расписание» на канале.
// Источник — тот же, что использует сама страница Twitch: публичный GraphQL с Client-Id
// веб-клиента. Ключей и токенов не требует.
import { videoToEntry } from "../src/utils/streams.js";

const GQL_URL = "https://gql.twitch.tv/gql";
const WEB_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

const QUERY = `query RecentStreams($login: String!, $n: Int!) {
  user(login: $login) {
    videos(first: $n, type: ARCHIVE, sort: TIME) {
      edges { node { id title createdAt lengthSeconds game { name } } }
    }
  }
}`;

/** Последние записи трансляций, свежие сверху. */
export async function twitchRecentStreams(login, count = 12, timeoutMs = 15000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(GQL_URL, {
      method: "POST",
      headers: { "Client-Id": WEB_CLIENT_ID, "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { login, n: count } }),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (json?.errors?.length) throw new Error(json.errors[0].message || "ошибка GraphQL");
    const edges = json?.data?.user?.videos?.edges || [];
    return edges.map((e) => videoToEntry(e.node)).filter(Boolean);
  } finally {
    clearTimeout(t);
  }
}
