import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.private.coffee",
  "https://pipedapi.reallyaweso.me",
];

export type Track = {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  views?: number;
};

export function formatViews(n?: number): string {
  if (!n || n <= 0) return "";
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${n}`;
}

async function tryInstances<T>(fn: (base: string) => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (const base of PIPED_INSTANCES) {
    try {
      return await fn(base);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("All instances failed");
}

function normalizeThumb(url: string): string {
  // Use higher-res YouTube thumbnail when possible
  const m = url.match(/\/vi\/([^/]+)\//);
  if (m) return `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg`;
  return url;
}

export const searchMusic = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string().min(1).max(200) }))
  .handler(async ({ data }) => {
    const results = await tryInstances(async (base) => {
      const url = `${base}/search?q=${encodeURIComponent(data.query)}&filter=music_songs`;
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`status ${res.status}`);
      return (await res.json()) as { items: any[] };
    });

    const tracks: Track[] = (results.items || [])
      .filter((it) => it.url && (it.type === "stream" || it.url.includes("watch?v=")))
      .map((it) => {
        const id = (it.url as string).split("watch?v=")[1]?.split("&")[0] ?? "";
        return {
          id,
          title: it.title ?? "Unknown",
          artist: it.uploaderName ?? it.uploader ?? "Unknown Artist",
          duration: Number(it.duration ?? 0),
          thumbnail: normalizeThumb(it.thumbnail ?? ""),
          views: Number(it.views ?? 0) || undefined,
        };
      })
      .filter((t) => t.id);

    return { tracks };
  });

export const getTrending = createServerFn({ method: "GET" }).handler(async () => {
  const queries = ["top hits 2026", "billboard hot 100", "trending music", "new releases"];
  const q = queries[Math.floor(Math.random() * queries.length)];
  const results = await tryInstances(async (base) => {
    const url = `${base}/search?q=${encodeURIComponent(q)}&filter=music_songs`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`status ${res.status}`);
    return (await res.json()) as { items: any[] };
  });
  const tracks: Track[] = (results.items || [])
    .slice(0, 20)
    .map((it) => {
      const id = (it.url as string)?.split("watch?v=")[1]?.split("&")[0] ?? "";
      return {
        id,
        title: it.title ?? "",
        artist: it.uploaderName ?? "",
        duration: Number(it.duration ?? 0),
        thumbnail: normalizeThumb(it.thumbnail ?? ""),
        views: Number(it.views ?? 0) || undefined,
      };
    })
    .filter((t) => t.id);
  return { tracks };
});
