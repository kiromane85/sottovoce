import { TrackResolveResponse, HistoryItem, Language } from "./types";

const BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

if (!BASE_URL) {
  console.warn("EXPO_PUBLIC_BACKEND_URL is not set");
}

const api = (path: string) => `${BASE_URL}/api${path}`;

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchLanguages(): Promise<Language[]> {
  const res = await fetch(api("/languages"));
  const data = await jsonOrThrow<{ languages: Language[] }>(res);
  return data.languages;
}

export async function resolveAudio(
  audioUri: string,
  mimeType: string,
  targetLang: string
): Promise<TrackResolveResponse> {
  const form = new FormData();
  // React Native FormData supports {uri, name, type}
  const ext = mimeType.includes("mp4") || mimeType.includes("m4a")
    ? "m4a"
    : mimeType.includes("wav")
    ? "wav"
    : mimeType.includes("ogg")
    ? "ogg"
    : mimeType.includes("mp3") || mimeType.includes("mpeg")
    ? "mp3"
    : "m4a";
  form.append("audio", {
    // @ts-ignore RN FormData file object
    uri: audioUri,
    name: `recording.${ext}`,
    type: mimeType,
  } as any);
  form.append("target_lang", targetLang);

  const res = await fetch(api("/track/resolve"), {
    method: "POST",
    body: form,
  });
  return jsonOrThrow<TrackResolveResponse>(res);
}

export async function resolveManual(
  title: string,
  artist: string,
  targetLang: string,
  album?: string
): Promise<TrackResolveResponse> {
  const res = await fetch(api("/track/manual"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, artist, target_lang: targetLang, album }),
  });
  return jsonOrThrow<TrackResolveResponse>(res);
}

export async function resolveLinkMeta(
  url: string,
  targetLang: string
): Promise<{ title: string; artist: string; source: string }> {
  const res = await fetch(api("/track/from_link"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, target_lang: targetLang }),
  });
  return jsonOrThrow(res);
}

export async function fetchHistory(): Promise<HistoryItem[]> {
  const res = await fetch(api("/history"));
  return jsonOrThrow<HistoryItem[]>(res);
}

export async function fetchHistoryItem(id: string): Promise<TrackResolveResponse> {
  const res = await fetch(api(`/history/${id}`));
  return jsonOrThrow<TrackResolveResponse>(res);
}

export async function deleteHistoryItem(id: string): Promise<void> {
  const res = await fetch(api(`/history/${id}`), { method: "DELETE" });
  await jsonOrThrow(res);
}

export async function clearHistory(): Promise<void> {
  const res = await fetch(api("/history"), { method: "DELETE" });
  await jsonOrThrow(res);
}
