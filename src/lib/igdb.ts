/**
 * IGDB proxy — server-only. Requires TWITCH_CLIENT_ID + TWITCH_CLIENT_SECRET.
 * https://api-docs.igdb.com/
 */

const IGDB_URL = "https://api.igdb.com/v4";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string | null> {
  const id = process.env.TWITCH_CLIENT_ID;
  const secret = process.env.TWITCH_CLIENT_SECRET;
  if (!id || !secret) return null;

  const now = Date.now();
  if (tokenCache && now < tokenCache.expiresAt - 60_000) {
    return tokenCache.token;
  }

  const params = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "client_credentials",
  });

  const res = await fetch(`https://id.twitch.tv/oauth2/token?${params}`, {
    method: "POST",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };
  return data.access_token;
}

export type IgdbGenre = { id?: number; name?: string };

export type IgdbInvolvedCompany = {
  developer?: boolean;
  publisher?: boolean;
  company?: { name?: string };
};

export type IgdbGameHit = {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  cover?: { url?: string };
  platforms?: { name?: string }[];
  genres?: IgdbGenre[];
  involved_companies?: IgdbInvolvedCompany[];
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  total_rating?: number;
  total_rating_count?: number;
};

const searchMemory = new Map<string, { at: number; hits: IgdbGameHit[] }>();
const SEARCH_TTL_MS = 24 * 60 * 60 * 1000;

export async function searchIgdb(query: string, limit = 20): Promise<IgdbGameHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const id = process.env.TWITCH_CLIENT_ID;
  const token = await getAccessToken();
  if (!id || !token) return [];

  const cacheKey = `${q.toLowerCase()}:${limit}`;
  const cached = searchMemory.get(cacheKey);
  if (cached && Date.now() - cached.at < SEARCH_TTL_MS) return cached.hits;

  const body = `search "${q.replace(/"/g, '\\"')}";
fields name,summary,first_release_date,cover.url,platforms.name,genres.name,aggregated_rating,involved_companies.developer,involved_companies.company.name;
limit ${limit};
`;

  const res = await fetch(`${IGDB_URL}/games`, {
    method: "POST",
    headers: {
      "Client-ID": id,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) return [];

  const hits = (await res.json()) as IgdbGameHit[];
  searchMemory.set(cacheKey, { at: Date.now(), hits });
  return hits;
}

export async function getIgdbGame(igdbId: number): Promise<IgdbGameHit | null> {
  const id = process.env.TWITCH_CLIENT_ID;
  const token = await getAccessToken();
  if (!id || !token) return null;

  const body = `where id = ${igdbId};
fields name,summary,first_release_date,cover.url,platforms.name,
genres.id,genres.name,
aggregated_rating,aggregated_rating_count,total_rating,total_rating_count,
involved_companies.developer,involved_companies.company.name;
limit 1;
`;

  const res = await fetch(`${IGDB_URL}/games`, {
    method: "POST",
    headers: {
      "Client-ID": id,
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) return null;
  const rows = (await res.json()) as IgdbGameHit[];
  return rows[0] ?? null;
}

export function coverUrlFromIgdb(cover?: { url?: string }): string | null {
  if (!cover?.url) return null;
  const u = cover.url.startsWith("//") ? `https:${cover.url}` : cover.url;
  return u.replace("/t_thumb/", "/t_cover_big/");
}

export function developerFromIgdb(involved?: IgdbInvolvedCompany[]): string | null {
  if (!involved?.length) return null;
  const dev = involved.find((x) => x.developer && x.company?.name);
  return dev?.company?.name?.trim() ?? null;
}

export function genresFromIgdb(genres?: IgdbGenre[]): { id: number; name: string }[] | null {
  if (!genres?.length) return null;
  const out: { id: number; name: string }[] = [];
  for (const g of genres) {
    if (g.id != null && g.name) out.push({ id: g.id, name: g.name });
  }
  return out.length ? out : null;
}
