import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Track } from "./music.functions";

export type RepeatMode = "off" | "all" | "one";

type PlayerState = {
  queue: Track[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  showFull: boolean;
  ready: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
};

type PlayerApi = PlayerState & {
  playTrack: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setShowFull: (b: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

const PlayerContext = createContext<PlayerApi | null>(null);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let ytReadyPromise: Promise<void> | null = null;
function loadYT(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ytReadyPromise) return ytReadyPromise;
  ytReadyPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) return resolve();
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return ytReadyPromise;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const [ready, setReady] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const playerRef = useRef<any>(null);
  const containerId = "yt-player-host";

  const current = queue[index] ?? null;

  // Refs to always read latest in YT callbacks
  const queueRef = useRef(queue);
  const indexRef = useRef(index);
  const shuffleRef = useRef(shuffle);
  const repeatRef = useRef(repeat);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = index; }, [index]);
  useEffect(() => { shuffleRef.current = shuffle; }, [shuffle]);
  useEffect(() => { repeatRef.current = repeat; }, [repeat]);

  const advance = useCallback(() => {
    const q = queueRef.current;
    const i = indexRef.current;
    if (!q.length) return;
    if (repeatRef.current === "one") {
      try { playerRef.current?.seekTo(0, true); playerRef.current?.playVideo(); } catch {}
      return;
    }
    if (shuffleRef.current && q.length > 1) {
      let r = i;
      while (r === i) r = Math.floor(Math.random() * q.length);
      setIndex(r);
      return;
    }
    if (i + 1 < q.length) setIndex(i + 1);
    else if (repeatRef.current === "all") setIndex(0);
  }, []);

  // init YT
  useEffect(() => {
    let mounted = true;
    loadYT().then(() => {
      if (!mounted) return;
      playerRef.current = new window.YT.Player(containerId, {
        height: "0",
        width: "0",
        playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: () => setReady(true),
          onStateChange: (e: any) => {
            const YTState = window.YT.PlayerState;
            if (e.data === YTState.PLAYING) setIsPlaying(true);
            else if (e.data === YTState.PAUSED) setIsPlaying(false);
            else if (e.data === YTState.ENDED) advance();
          },
        },
      });
    });
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const p = playerRef.current;
      if (p && p.getCurrentTime) {
        try {
          const pos = p.getCurrentTime() || 0;
          const dur = p.getDuration() || 0;
          setPosition(pos);
          setDuration(dur);
          if (typeof navigator !== "undefined" && "mediaSession" in navigator && dur > 0) {
            try {
              navigator.mediaSession.setPositionState({
                duration: dur,
                position: Math.min(pos, dur),
                playbackRate: 1,
              });
            } catch {}
          }
        } catch {}
      }
    }, 500);
    return () => clearInterval(id);
  }, []);

  // Keep the OS playback state in sync so the lock screen shows correct controls
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!ready || !current || !playerRef.current) return;
    try {
      playerRef.current.loadVideoById(current.id);
      playerRef.current.playVideo();
    } catch {}
  }, [ready, current?.id]);

  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist,
      artwork: [{ src: current.thumbnail, sizes: "512x512", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("play", () => playerRef.current?.playVideo());
    navigator.mediaSession.setActionHandler("pause", () => playerRef.current?.pauseVideo());
    navigator.mediaSession.setActionHandler("nexttrack", () => advance());
    navigator.mediaSession.setActionHandler("previoustrack", () => setIndex((i) => Math.max(0, i - 1)));
    // Explicitly remove the 10s skip controls so iOS shows prev/next track buttons instead
    try {
      navigator.mediaSession.setActionHandler("seekbackward", null);
      navigator.mediaSession.setActionHandler("seekforward", null);
    } catch {}
    try {
      navigator.mediaSession.setActionHandler("seekto", (details: any) => {
        if (details.seekTime != null) playerRef.current?.seekTo(details.seekTime, true);
      });
    } catch {}
  }, [current, advance]);

  // Lock body scroll when full player is open
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (showFull) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [showFull]);

  const playTrack = useCallback((track: Track, q?: Track[]) => {
    const newQueue = q && q.length ? q : [track];
    const idx = newQueue.findIndex((t) => t.id === track.id);
    setQueue(newQueue);
    setIndex(idx >= 0 ? idx : 0);
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (isPlaying) p.pauseVideo();
    else p.playVideo();
  }, [isPlaying]);

  const next = useCallback(() => advance(), [advance]);
  const prev = useCallback(() => {
    if (position > 3) {
      playerRef.current?.seekTo(0, true);
    } else {
      setIndex((i) => Math.max(0, i - 1));
    }
  }, [position]);
  const seek = useCallback((s: number) => {
    playerRef.current?.seekTo(s, true);
    setPosition(s);
  }, []);

  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const cycleRepeat = useCallback(() => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")), []);

  return (
    <PlayerContext.Provider
      value={{ queue, index, current, isPlaying, position, duration, showFull, ready, shuffle, repeat, playTrack, toggle, next, prev, seek, setShowFull, toggleShuffle, cycleRepeat }}
    >
      {children}
      <div style={{ position: "fixed", left: -9999, top: -9999, width: 0, height: 0, overflow: "hidden" }}>
        <div id={containerId} />
      </div>
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}

export function formatTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
