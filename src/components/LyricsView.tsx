import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import { getLyrics } from "@/lib/lyrics.functions";
import { usePlayer } from "@/lib/player-context";
import type { Track } from "@/lib/music.functions";
import { fadeTween, springPlayer, springSnappy, tapScaleSoft } from "@/lib/motion";

export function LyricsView({ track, onClose }: { track: Track | null; onClose: () => void }) {
  const fetchLyrics = useServerFn(getLyrics);
  const { position, seek } = usePlayer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(-1);

  const { data, isLoading } = useQuery({
    queryKey: ["lyrics", track?.id],
    queryFn: () => fetchLyrics({ data: { title: track!.title, artist: track!.artist, duration: track!.duration } }),
    enabled: !!track,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (!data?.synced) return;
    let idx = -1;
    for (let i = 0; i < data.synced.length; i++) {
      if (data.synced[i].time <= position) idx = i;
      else break;
    }
    if (idx !== activeIdx) {
      setActiveIdx(idx);
      const el = containerRef.current?.querySelector<HTMLElement>(`[data-line="${idx}"]`);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [position, data, activeIdx]);

  return (
    <AnimatePresence>
      {track && (
        <m.div
          key={track.id}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 32 }}
          transition={springPlayer}
          className="fixed inset-0 z-[70] text-foreground gpu-layer"
        >
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className="absolute inset-0 scale-[1.25] gpu-layer"
              style={{
                backgroundImage: `url(${track.thumbnail})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(64px) saturate(160%)",
              }}
            />
            <div className="absolute inset-0 bg-black/70" />
          </div>

          <div className="relative h-full flex flex-col pt-safe pb-safe">
            <div className="flex items-center justify-between px-5 pt-3 pb-2">
              <div className="min-w-0">
                <div className="text-[16px] font-semibold truncate">{track.title}</div>
                <div className="text-[13px] text-white/60 truncate">{track.artist}</div>
              </div>
              <m.button
                whileTap={tapScaleSoft}
                transition={springSnappy}
                onClick={onClose}
                className="p-2 text-white/80"
                aria-label="Close"
              >
                <X className="h-6 w-6" />
              </m.button>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto px-6 pb-32 pt-24 space-y-5">
              {isLoading && (
                <m.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={fadeTween}
                  className="text-center text-white/60 text-[14px]"
                >
                  Loading lyrics…
                </m.div>
              )}
              {!isLoading && !data?.synced && !data?.plain && (
                <div className="text-center text-white/60 text-[14px]">No lyrics found for this track.</div>
              )}
              {!isLoading &&
                data?.synced &&
                data.synced.map((l, i) => (
                  <m.button
                    key={i}
                    data-line={i}
                    onClick={() => seek(l.time)}
                    animate={{
                      opacity: i === activeIdx ? 1 : 0.35,
                      scale: i === activeIdx ? 1 : 0.98,
                    }}
                    transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                    className={`block w-full text-left text-[24px] font-bold leading-snug ${
                      i === activeIdx ? "text-white" : "text-white/35"
                    }`}
                  >
                    {l.text || "♪"}
                  </m.button>
                ))}
              {!isLoading && !data?.synced && data?.plain && (
                <pre className="whitespace-pre-wrap text-[16px] leading-relaxed text-white/85 font-sans">{data.plain}</pre>
              )}
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
