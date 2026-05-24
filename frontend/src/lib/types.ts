export type Language = {
  code: string;
  label: string;
  flag: string;
};

export type LyricsLine = {
  t_ms: number | null;
  original: string;
  translated: string;
};

export type TrackResolveResponse = {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  artwork_url?: string | null;
  duration?: number | null;
  language?: string | null;
  confidence: number;
  target_lang: string;
  source: "recognition" | "manual";
  has_synced: boolean;
  lines: LyricsLine[];
  plain_lyrics: string;
  plain_translation: string;
  recognized_meta?: Record<string, any> | null;
  created_at: string;
};

export type HistoryItem = {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  artwork_url?: string | null;
  target_lang: string;
  has_synced: boolean;
  source: "recognition" | "manual";
  created_at: string;
};
