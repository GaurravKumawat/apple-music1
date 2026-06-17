import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type LyricLine = { time: number; text: string };
export type LyricsResult = {
  synced: LyricLine[] | null;
  plain: string | null;
  source: "lrclib" | "none";
};

function parseLRC(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const matches = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    if (!matches.length) continue;
    const text = raw.replace(/\[(\d+):(\d+(?:\.\d+)?)\]/g, "").trim();
    for (const m of matches) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      lines.push({ time: min * 60 + sec, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export const getLyrics = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      title: z.string().min(1).max(300),
      artist: z.string().min(1).max(300),
      duration: z.number().optional(),
    }),
  )
  .handler(async ({ data }): Promise<LyricsResult> => {
    // lrclib.net — free, no key. Returns synced + plain when available.
    const cleanTitle = data.title.replace(/\s*\(.*?\)\s*/g, "").replace(/\s*\[.*?\]\s*/g, "").trim();
    const cleanArtist = data.artist.replace(/\s*-\s*Topic\s*$/i, "").trim();
    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    try {
      const res = await fetch(url, { headers: { "User-Agent": "WebMusicPlayer (https://lovable.dev)" } });
      if (res.ok) {
        const json: any = await res.json();
        const synced = json.syncedLyrics ? parseLRC(json.syncedLyrics) : null;
        return { synced: synced && synced.length ? synced : null, plain: json.plainLyrics ?? null, source: "lrclib" };
      }
      // fallback search
      const sUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      const sRes = await fetch(sUrl);
      if (sRes.ok) {
        const arr: any[] = await sRes.json();
        const hit = arr?.[0];
        if (hit) {
          const synced = hit.syncedLyrics ? parseLRC(hit.syncedLyrics) : null;
          return { synced: synced && synced.length ? synced : null, plain: hit.plainLyrics ?? null, source: "lrclib" };
        }
      }
    } catch {}
    return { synced: null, plain: null, source: "none" };
  });
