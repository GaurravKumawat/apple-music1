import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search as SearchIcon, X } from "lucide-react";
import { AnimatePresence, LayoutGroup, m } from "motion/react";
import { PlayerProvider, usePlayer } from "@/lib/player-context";
import { LibraryProvider } from "@/lib/library-store";
import { getTrending, searchMusic, formatViews, type Track } from "@/lib/music.functions";
import { fadeScaleItem, staggerContainer, tapScaleSoft } from "@/lib/motion";
import { Player } from "@/components/Player";
import { MotionProvider } from "@/components/MotionProvider";
import { AppleMusicLogo } from "@/components/AppleMusicLogo";
import { TabBar, getTabDirection, type Tab } from "@/components/TabBar";
import { TrackRow } from "@/components/TrackRow";
import { LibraryView } from "@/components/LibraryView";
import { ActionSheet } from "@/components/ActionSheet";
import { LyricsView } from "@/components/LyricsView";
import { RecognizeView } from "@/components/RecognizeView";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Music — Web Player" },
      { name: "description", content: "Apple Music–inspired web music player powered by YouTube." },
      { name: "theme-color", content: "#000000" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" },
    ],
  }),
  component: () => (
    <MotionProvider>
      <LibraryProvider>
        <PlayerProvider>
          <App />
        </PlayerProvider>
      </LibraryProvider>
    </MotionProvider>
  ),
});

function App() {
  const [tab, setTab] = useState<Tab>("listen");
  const prevTab = useRef<Tab>("listen");
  const direction = getTabDirection(prevTab.current, tab);
  const { current } = usePlayer();
  const [moreFor, setMoreFor] = useState<Track | null>(null);
  const [lyricsFor, setLyricsFor] = useState<Track | null>(null);

  const handleTabChange = (next: Tab) => {
    prevTab.current = tab;
    setTab(next);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {tab === "listen" && (
          <m.header
            key="listen-header"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="sticky top-0 z-30 glass pt-safe"
          >
            <div className="grid grid-cols-3 items-center px-4 h-12">
              <div />
              <AppleMusicLogo />
              <div className="flex justify-end">
                <div className="h-8 w-8 rounded-full bg-secondary grid place-items-center text-[12px] font-semibold text-foreground/80">
                  GK
                </div>
              </div>
            </div>
          </m.header>
        )}
      </AnimatePresence>

      <div className={tab === "listen" ? "" : "pt-safe"}>
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <m.div
            key={tab}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 20 }),
              center: { opacity: 1, x: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } },
              exit: (d: number) => ({ opacity: 0, x: d * -16, transition: { duration: 0.2, ease: [0.32, 0.72, 0, 1] } }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {tab === "listen" && <ListenNow onMore={setMoreFor} />}
            {tab === "search" && <SearchView onMore={setMoreFor} />}
            {tab === "library" && <LibraryView onMore={setMoreFor} />}
            {tab === "recognize" && <RecognizeView />}
          </m.div>
        </AnimatePresence>
      </div>

      <div style={{ height: current ? 140 : 80 }} />

      <LayoutGroup id="player">
        <Player
          onMore={() => current && setMoreFor(current)}
          onShowLyrics={() => current && setLyricsFor(current)}
        />
      </LayoutGroup>

      <TabBar tab={tab} onChange={handleTabChange} />
      <ActionSheet track={moreFor} onClose={() => setMoreFor(null)} onShowLyrics={(t) => setLyricsFor(t)} />
      <LyricsView track={lyricsFor} onClose={() => setLyricsFor(null)} />
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h1 className="text-[28px] font-bold tracking-tight px-4 pt-3 pb-2">{title}</h1>;
}

function ListenNow({ onMore }: { onMore: (t: Track) => void }) {
  const trending = useServerFn(getTrending);
  const { data, isLoading } = useQuery({
    queryKey: ["trending"],
    queryFn: () => trending(),
    staleTime: 5 * 60 * 1000,
  });
  const { playTrack } = usePlayer();
  const tracks = data?.tracks ?? [];

  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
  const gradients = [
    "linear-gradient(160deg, #ff2d55, #7a0b2e)",
    "linear-gradient(160deg, #fa8c1f, #7a2e00)",
    "linear-gradient(160deg, #5e5ce6, #1a1240)",
    "linear-gradient(160deg, #30d158, #0b3a1f)",
    "linear-gradient(160deg, #64d2ff, #093a55)",
  ];
  const labels = ["Top Hits 2025", "New Music Mix", "Chill Vibes", "Throwback", "Discovery"];

  return (
    <div>
      <div className="px-4 pt-3 pb-1">
        <div className="text-[12px] uppercase tracking-wider text-muted-foreground font-semibold">{dateLabel}</div>
        <h1 className="text-[30px] font-bold tracking-tight">Listen Now</h1>
      </div>

      {/* Top Picks — gradient cards */}
      <h2 className="text-[20px] font-bold px-4 mb-2 mt-2">Top Picks</h2>
      <m.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4 snap-x snap-mandatory"
      >
        {(isLoading ? Array.from({ length: 4 }) : tracks.slice(0, 5)).map((t: any, i) => (
          <m.button
            key={t?.id ?? i}
            variants={fadeScaleItem}
            whileTap={tapScaleSoft}
            onClick={() => t && playTrack(t, tracks)}
            className="snap-start shrink-0 w-[280px] h-[340px] rounded-[26px] overflow-hidden relative text-left shadow-xl gpu-layer"
            style={{ background: gradients[i % gradients.length] }}
          >
            {t?.thumbnail && (
              <img src={t.thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
            <div className="absolute top-5 left-5 right-5 text-center">
              <div className="text-white text-[15px] font-semibold drop-shadow">{labels[i % labels.length]}</div>
            </div>
            <div className="absolute bottom-5 left-5 right-5">
              <div className="text-[11px] uppercase tracking-wider text-white/70 font-semibold mb-1">Playlist</div>
              <div className="text-white text-[22px] font-bold leading-tight line-clamp-2">{t?.title ?? "Loading…"}</div>
              {t?.artist && <div className="text-white/80 text-[14px] truncate">{t.artist}</div>}
            </div>
          </m.button>
        ))}
      </m.div>

      <h2 className="text-[20px] font-bold px-4 mb-2">Trending Now</h2>
      <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 pb-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="shrink-0 w-40">
                <div className="w-40 h-40 rounded-xl bg-muted animate-pulse" />
                <div className="h-3 mt-2 w-32 rounded bg-muted animate-pulse" />
                <div className="h-3 mt-1 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))
          : tracks.slice(1, 12).map((t, i) => (
              <m.button
                key={t.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035, type: "spring", stiffness: 300, damping: 32, mass: 0.9 }}
                whileTap={tapScaleSoft}
                onClick={() => playTrack(t, tracks)}
                className="shrink-0 w-40 text-left gpu-layer"
              >
                <img src={t.thumbnail} alt="" className="w-40 h-40 rounded-xl object-cover bg-muted" />
                <div className="text-[14px] font-medium mt-2 line-clamp-1">{t.title}</div>
                <div className="text-[12px] text-muted-foreground line-clamp-1 flex items-center gap-1">
                  {formatViews(t.views) ? `${formatViews(t.views)} plays` : t.artist}
                </div>
              </m.button>
            ))}
      </div>

      <h2 className="text-[20px] font-bold px-4 mb-2 mt-2">Made For You</h2>
      <div className="px-4">
        {tracks.slice(0, 10).map((t, i) => (
          <TrackRow
            key={t.id + i}
            track={t}
            index={i + 1}
            delay={i * 0.03}
            onPlay={() => playTrack(t, tracks)}
            onMore={onMore}
          />
        ))}
      </div>
    </div>
  );
}


function SearchView({ onMore }: { onMore: (t: Track) => void }) {
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const search = useServerFn(searchMusic);
  const { data, isFetching } = useQuery({
    queryKey: ["search", submitted],
    queryFn: () => search({ data: { query: submitted } }),
    enabled: submitted.length > 0,
  });
  const { playTrack } = usePlayer();

  useEffect(() => {
    const id = setTimeout(() => setSubmitted(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const tracks: Track[] = data?.tracks ?? [];

  return (
    <div>
      <SectionHeader title="Search" />
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
          <SearchIcon className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Artists, Songs, Lyrics, and More"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-muted-foreground"
          />
          {q && (
            <button onClick={() => setQ("")} aria-label="Clear">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      <div className="px-4">
        {!submitted && (
          <div className="pt-2">
            <div className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Try Searching For
            </div>
            <div className="flex flex-wrap gap-2">
              {["Taylor Swift", "Drake", "The Weeknd", "Billie Eilish", "SZA", "Bad Bunny", "Lo-fi", "Jazz"].map((s) => (
                <button
                  key={s}
                  onClick={() => setQ(s)}
                  className="px-3 py-1.5 rounded-full bg-secondary text-[13px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {submitted && isFetching && (
          <div className="space-y-2 pt-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {submitted && !isFetching && tracks.length === 0 && (
          <div className="text-center text-muted-foreground py-12 text-[14px]">No results</div>
        )}

        {tracks.map((t) => (
          <TrackRow key={t.id} track={t} onPlay={() => playTrack(t, tracks)} onMore={onMore} />
        ))}
      </div>
    </div>
  );
}
