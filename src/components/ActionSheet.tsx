import { useState } from "react";
import { Heart, ListMusic, Plus, Play, X, Check, Trash2, FileText, Download } from "lucide-react";
import { AnimatePresence, m } from "motion/react";
import type { Track } from "@/lib/music.functions";
import { useLibrary } from "@/lib/library-store";
import { usePlayer } from "@/lib/player-context";
import { springPlayer, springSnappy, tapScaleSoft } from "@/lib/motion";
import { toast } from "sonner";

type Props = {
  track: Track | null;
  onClose: () => void;
  onShowLyrics?: (t: Track) => void;
};

export function ActionSheet({ track, onClose, onShowLyrics }: Props) {
  const lib = useLibrary();
  const { playTrack } = usePlayer();
  const [view, setView] = useState<"main" | "playlists">("main");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  const close = () => {
    setView("main");
    setCreating(false);
    setName("");
    onClose();
  };

  return (
    <AnimatePresence>
      {track && (
        <div key={track.id} className="fixed inset-0 z-[60] flex items-end">
          <m.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/60"
            onClick={close}
            aria-label="Close"
          />
          <m.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={springPlayer}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 80 || info.velocity.y > 350) close();
            }}
            className="relative w-full bg-popover rounded-t-3xl pb-safe gpu-layer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="h-1 w-9 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <img src={track.thumbnail} alt="" className="h-14 w-14 rounded-lg object-cover bg-muted" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold truncate">{track.title}</div>
                <div className="text-[13px] text-muted-foreground truncate">{track.artist}</div>
              </div>
              <m.button
                whileTap={tapScaleSoft}
                transition={springSnappy}
                onClick={close}
                className="p-2 text-muted-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </m.button>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {view === "main" ? (
                <m.div
                  key="main"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="py-1"
                >
                  <Row icon={<Play className="h-5 w-5" />} label="Play" onClick={() => { playTrack(track, [track]); close(); }} />
                  <Row
                    icon={<Heart className={`h-5 w-5 ${lib.isFavorite(track.id) ? "fill-primary text-primary" : ""}`} />}
                    label={lib.isFavorite(track.id) ? "Remove from Favorites" : "Add to Favorites"}
                    onClick={() => {
                      const fav = lib.isFavorite(track.id);
                      lib.toggleFavorite(track);
                      toast.success(fav ? "Removed from Favorites" : "Added to Favorites");
                      close();
                    }}
                  />
                  <Row
                    icon={<Plus className="h-5 w-5" />}
                    label={lib.isInLibrary(track.id) ? "Remove from Library" : "Add to Library"}
                    onClick={() => {
                      if (lib.isInLibrary(track.id)) {
                        lib.removeFromLibrary(track.id);
                        toast.success("Removed from Library");
                      } else {
                        lib.addToLibrary(track);
                        toast.success("Added to Library");
                      }
                      close();
                    }}
                  />
                  <Row icon={<ListMusic className="h-5 w-5" />} label="Add to a Playlist…" onClick={() => setView("playlists")} chevron />
                  {onShowLyrics && (
                    <Row icon={<FileText className="h-5 w-5" />} label="Show Lyrics" onClick={() => { onShowLyrics(track); close(); }} />
                  )}
                  <Row
                    icon={<Download className="h-5 w-5" />}
                    label="Download"
                    onClick={() => {
                      toast.info("Downloading isn't available", {
                        description: "YouTube's terms prevent direct downloads from the browser.",
                      });
                    }}
                  />
                </m.div>
              ) : (
                <m.div
                  key="playlists"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className="py-1 max-h-[60vh] overflow-y-auto"
                >
                  {creating ? (
                    <div className="px-4 py-3 flex gap-2">
                      <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Playlist name"
                        className="flex-1 bg-secondary rounded-lg px-3 py-2 text-[15px] outline-none"
                      />
                      <button
                        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[14px] font-medium"
                        onClick={() => {
                          const pl = lib.createPlaylist(name);
                          lib.addToPlaylist(pl.id, track);
                          toast.success(`Added to ${pl.name}`);
                          close();
                        }}
                      >
                        Create
                      </button>
                    </div>
                  ) : (
                    <Row icon={<Plus className="h-5 w-5" />} label="New Playlist" onClick={() => setCreating(true)} />
                  )}
                  {lib.playlists.length === 0 && !creating && (
                    <div className="px-4 py-6 text-center text-[13px] text-muted-foreground">No playlists yet</div>
                  )}
                  {lib.playlists.map((p) => {
                    const has = p.trackIds.includes(track.id);
                    return (
                      <Row
                        key={p.id}
                        icon={<ListMusic className="h-5 w-5" />}
                        label={p.name}
                        trailing={has ? <Check className="h-5 w-5 text-primary" /> : null}
                        onClick={() => {
                          if (has) return close();
                          lib.addToPlaylist(p.id, track);
                          toast.success(`Added to ${p.name}`);
                          close();
                        }}
                      />
                    );
                  })}
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Row({
  icon,
  label,
  onClick,
  chevron,
  trailing,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  chevron?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <m.button
      whileTap={tapScaleSoft}
      transition={springSnappy}
      onClick={onClick}
      className="w-full flex items-center gap-4 px-5 py-3 active:bg-white/5 text-left"
    >
      <span className="text-foreground">{icon}</span>
      <span className="flex-1 text-[15px]">{label}</span>
      {trailing}
      {chevron && <span className="text-muted-foreground">›</span>}
    </m.button>
  );
}

export function DeleteRow({ onClick, label = "Delete" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-3 text-destructive active:bg-white/5">
      <Trash2 className="h-5 w-5" />
      <span className="flex-1 text-left text-[15px]">{label}</span>
    </button>
  );
}
