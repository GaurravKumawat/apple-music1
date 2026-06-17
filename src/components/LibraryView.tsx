import { useState } from "react";
import { Heart, ListMusic, Plus, ChevronLeft, Music2, Trash2 } from "lucide-react";
import { useLibrary } from "@/lib/library-store";
import { usePlayer } from "@/lib/player-context";
import { TrackRow } from "@/components/TrackRow";
import type { Track } from "@/lib/music.functions";

type View =
  | { kind: "root" }
  | { kind: "playlists" }
  | { kind: "favorites" }
  | { kind: "songs" }
  | { kind: "playlist"; id: string };

export function LibraryView({ onMore }: { onMore: (t: Track) => void }) {
  const lib = useLibrary();
  const { playTrack } = usePlayer();
  const [view, setView] = useState<View>({ kind: "root" });
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  if (view.kind === "playlist") {
    const pl = lib.playlists.find((p) => p.id === view.id);
    if (!pl) { setView({ kind: "playlists" }); return null; }
    const tracks = lib.getTracks(pl.trackIds);
    return (
      <div>
        <SubHeader title={pl.name} onBack={() => setView({ kind: "playlists" })}
          right={
            <button onClick={() => { lib.deletePlaylist(pl.id); setView({ kind: "playlists" }); }} className="p-2 text-destructive" aria-label="Delete">
              <Trash2 className="h-5 w-5" />
            </button>
          }
        />
        <div className="px-4">
          {tracks.length === 0 ? (
            <Empty icon={<ListMusic />} title="No songs yet" sub="Tap ••• on any song to add it here." />
          ) : tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i + 1} onPlay={() => playTrack(t, tracks)} onMore={onMore} />
          ))}
        </div>
      </div>
    );
  }

  if (view.kind === "playlists") {
    return (
      <div>
        <SubHeader title="Playlists" onBack={() => setView({ kind: "root" })} />
        <div className="px-4">
          {creating ? (
            <div className="flex gap-2 py-2">
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name"
                className="flex-1 bg-secondary rounded-lg px-3 py-2 text-[15px] outline-none" />
              <button className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-[14px] font-medium"
                onClick={() => { if (!name.trim()) return; lib.createPlaylist(name); setName(""); setCreating(false); }}>
                Create
              </button>
              <button className="px-3 py-2 text-muted-foreground" onClick={() => { setCreating(false); setName(""); }}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setCreating(true)} className="w-full flex items-center gap-3 py-3 text-primary text-[15px] font-medium">
              <Plus className="h-5 w-5" /> New Playlist
            </button>
          )}
          {lib.playlists.length === 0 && !creating && (
            <Empty icon={<ListMusic />} title="No playlists yet" sub="Create your first playlist." />
          )}
          {lib.playlists.map((p) => {
            const cover = lib.getTracks(p.trackIds.slice(0, 1))[0]?.thumbnail;
            return (
              <button key={p.id} onClick={() => setView({ kind: "playlist", id: p.id })}
                className="w-full flex items-center gap-3 py-2 active:bg-white/5 rounded-md text-left">
                <div className="h-12 w-12 rounded-md bg-muted overflow-hidden flex items-center justify-center">
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <ListMusic className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0 border-b border-border pb-2">
                  <div className="text-[15px] truncate">{p.name}</div>
                  <div className="text-[13px] text-muted-foreground">{p.trackIds.length} songs</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (view.kind === "favorites") {
    const tracks = lib.getTracks(lib.favorites);
    return (
      <div>
        <SubHeader title="Favorites" onBack={() => setView({ kind: "root" })} />
        <div className="px-4">
          {tracks.length === 0 ? (
            <Empty icon={<Heart />} title="No favorites yet" sub="Tap ••• → Add to Favorites." />
          ) : tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i + 1} onPlay={() => playTrack(t, tracks)} onMore={onMore} />
          ))}
        </div>
      </div>
    );
  }

  if (view.kind === "songs") {
    const tracks = lib.getTracks(lib.songs);
    return (
      <div>
        <SubHeader title="Songs" onBack={() => setView({ kind: "root" })} />
        <div className="px-4">
          {tracks.length === 0 ? (
            <Empty icon={<Music2 />} title="No songs in your library" sub="Tap ••• → Add to Library." />
          ) : tracks.map((t, i) => (
            <TrackRow key={t.id} track={t} index={i + 1} onPlay={() => playTrack(t, tracks)} onMore={onMore} />
          ))}
        </div>
      </div>
    );
  }

  // Root
  const items: { label: string; icon: React.ReactNode; onClick: () => void; count?: number }[] = [
    { label: "Playlists", icon: <ListMusic className="h-5 w-5" />, onClick: () => setView({ kind: "playlists" }), count: lib.playlists.length },
    { label: "Favorites", icon: <Heart className="h-5 w-5" />, onClick: () => setView({ kind: "favorites" }), count: lib.favorites.length },
    { label: "Songs", icon: <Music2 className="h-5 w-5" />, onClick: () => setView({ kind: "songs" }), count: lib.songs.length },
  ];

  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-tight px-4 pt-3 pb-2">Library</h1>
      <div className="px-4">
        {items.map((it) => (
          <button key={it.label} onClick={it.onClick}
            className="w-full flex items-center gap-4 py-3 border-b border-border active:bg-white/5">
            <span className="text-primary">{it.icon}</span>
            <span className="flex-1 text-left text-[17px]">{it.label}</span>
            {typeof it.count === "number" && <span className="text-muted-foreground text-[14px]">{it.count}</span>}
            <span className="text-muted-foreground">›</span>
          </button>
        ))}
      </div>

      {/* Recently added preview */}
      {lib.songs.length > 0 && (
        <div className="px-4 pt-6">
          <h2 className="text-[20px] font-bold mb-2">Recently Added</h2>
          <div className="grid grid-cols-2 gap-3">
            {lib.getTracks(lib.songs).slice(0, 6).map((t) => (
              <button key={t.id} onClick={() => playTrack(t, lib.getTracks(lib.songs))} className="text-left active:opacity-70">
                <img src={t.thumbnail} alt="" className="w-full aspect-square rounded-xl object-cover bg-muted" />
                <div className="text-[14px] font-medium mt-2 line-clamp-1">{t.title}</div>
                <div className="text-[12px] text-muted-foreground line-clamp-1">{t.artist}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SubHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1 px-2 pt-2 pb-1">
      <button onClick={onBack} className="p-2 text-primary flex items-center text-[15px]">
        <ChevronLeft className="h-5 w-5" /> Library
      </button>
      <div className="flex-1" />
      {right}
    </div>
  );
}

function Empty({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <div className="mx-auto mb-3 h-12 w-12 flex items-center justify-center rounded-full bg-secondary">{icon}</div>
      <div className="text-[15px] text-foreground font-medium">{title}</div>
      <div className="text-[13px] mt-1">{sub}</div>
    </div>
  );
}

export { LibraryView as default };
