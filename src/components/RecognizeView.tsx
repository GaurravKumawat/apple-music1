import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Headphones, AudioLines } from "lucide-react";
import { toast } from "sonner";
import { recognizeAudio } from "@/lib/recognize.functions";
import { searchMusic, type Track } from "@/lib/music.functions";
import { usePlayer } from "@/lib/player-context";

type Phase = "idle" | "listening" | "matching";

const RECENT_KEY = "recognize.recent.v1";

type RecentItem = { title: string; artist: string; at: number };

export function RecognizeView() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [recent, setRecent] = useState<RecentItem[]>([]);
  const recognize = useServerFn(recognizeAudio);
  const search = useServerFn(searchMusic);
  const { playTrack } = usePlayer();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {}
  }, []);

  const saveRecent = (item: RecentItem) => {
    const next = [item, ...recent.filter((r) => r.title !== item.title)].slice(0, 8);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };

  const cleanup = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {}
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const start = useCallback(async () => {
    if (phase !== "idle") {
      // tap again = cancel
      cleanup();
      setPhase("idle");
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error("Microphone permission denied");
      return;
    }
    streamRef.current = stream;
    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recorderRef.current = rec;
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      setPhase("matching");
      try {
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const buf = await blob.arrayBuffer();
        const b64 = btoa(
          new Uint8Array(buf).reduce((s, b) => s + String.fromCharCode(b), ""),
        );
        const result = await recognize({
          data: { audioBase64: b64, mime: rec.mimeType || "audio/webm" },
        });
        if (!result.ok) {
          toast.error("Couldn't recognize that. Try again with clearer audio.");
          setPhase("idle");
          return;
        }
        const { title, artist } = result.song;
        saveRecent({ title, artist, at: Date.now() });
        toast.success(`${title} — ${artist}`);
        const q = `${title} ${artist}`;
        const sr = await search({ data: { query: q } });
        const top = (sr.tracks ?? [])[0] as Track | undefined;
        if (top) playTrack(top, sr.tracks);
        else toast.error("Found it, but couldn't locate audio");
      } catch (e: any) {
        toast.error(e?.message ?? "Recognition failed");
      } finally {
        setPhase("idle");
      }
    };
    rec.start();
    setPhase("listening");
    setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state === "recording") {
        recorderRef.current.stop();
      }
    }, 7000);
  }, [phase, cleanup, recognize, search, playTrack, recent]);

  const listening = phase === "listening";
  const matching = phase === "matching";
  const active = listening || matching;

  return (
    <div className="min-h-[calc(100vh-160px)] flex flex-col items-center px-6 pt-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-[22px] font-bold">
        {active ? (
          <>
            <AudioLines className="h-6 w-6" />
            <span>{matching ? "Matching…" : "Listening for music"}</span>
          </>
        ) : (
          <>
            <Headphones className="h-6 w-6" />
            <span>Tap to Recognize</span>
          </>
        )}
      </div>

      {/* Pulsing button */}
      <div className="relative mt-16 mb-4 grid place-items-center" style={{ width: 280, height: 280 }}>
        {active && (
          <>
            <span className="absolute inset-0 rounded-full bg-foreground/10 animate-ping" />
            <span
              className="absolute rounded-full bg-foreground/[0.06]"
              style={{ inset: -40, animation: "ping 2.4s cubic-bezier(0,0,0.2,1) infinite" }}
            />
            <span
              className="absolute rounded-full bg-foreground/[0.04]"
              style={{ inset: -80, animation: "ping 3s cubic-bezier(0,0,0.2,1) infinite" }}
            />
          </>
        )}
        <button
          onClick={start}
          aria-label={active ? "Cancel" : "Start recognition"}
          className="relative h-44 w-44 rounded-full bg-gradient-to-b from-zinc-700 to-zinc-900 shadow-2xl ring-1 ring-white/10 grid place-items-center active:scale-95 transition"
          style={{
            boxShadow:
              "0 30px 60px -20px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          <ShazamLikeGlyph />
        </button>
      </div>

      {matching && (
        <div className="text-[14px] text-muted-foreground mt-2">Finding the song…</div>
      )}
      {listening && (
        <div className="text-[14px] text-muted-foreground mt-2 text-center max-w-[260px]">
          Make sure your device can hear the song clearly
        </div>
      )}

      {/* Recently Found */}
      <div className="w-full mt-14">
        <h2 className="text-[18px] font-bold mb-3">Recently Found</h2>
        {recent.length === 0 ? (
          <div className="rounded-2xl bg-card/60 border border-border/60 p-6 text-center text-[13px] text-muted-foreground">
            Songs you recognize will appear here
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 pb-2">
            {recent.map((r) => (
              <button
                key={r.at}
                onClick={async () => {
                  const sr = await search({ data: { query: `${r.title} ${r.artist}` } });
                  const top = (sr.tracks ?? [])[0];
                  if (top) playTrack(top, sr.tracks);
                }}
                className="shrink-0 w-44 text-left rounded-2xl bg-card/60 border border-border/60 p-3"
              >
                <div className="h-24 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 mb-2 grid place-items-center">
                  <AudioLines className="h-6 w-6 text-white/70" />
                </div>
                <div className="text-[14px] font-semibold line-clamp-1">{r.title}</div>
                <div className="text-[12px] text-muted-foreground line-clamp-1">{r.artist}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ShazamLikeGlyph() {
  // Stylized "S"-like mark (not a logo) — original mark for our app
  return (
    <svg viewBox="0 0 100 100" className="h-20 w-20" fill="none">
      <path
        d="M68 30c-5-6-13-9-21-7-10 2-17 11-15 21 1 7 7 11 15 13l8 2c6 1 10 5 11 10 1 9-8 16-19 14-7-1-13-5-16-12"
        stroke="white"
        strokeWidth="11"
        strokeLinecap="round"
      />
    </svg>
  );
}
