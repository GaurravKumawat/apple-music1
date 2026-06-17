import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { Track } from "./music.functions";

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
};

type LibraryState = {
  tracks: Record<string, Track>; // all saved/known tracks
  favorites: string[]; // track ids
  playlists: Playlist[];
  songs: string[]; // "Added to Library"
};

type LibraryApi = LibraryState & {
  addToLibrary: (t: Track) => void;
  removeFromLibrary: (id: string) => void;
  toggleFavorite: (t: Track) => void;
  isFavorite: (id: string) => boolean;
  isInLibrary: (id: string) => boolean;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addToPlaylist: (playlistId: string, t: Track) => void;
  removeFromPlaylist: (playlistId: string, trackId: string) => void;
  getTracks: (ids: string[]) => Track[];
};

const KEY = "music-library-v1";
const Ctx = createContext<LibraryApi | null>(null);

const empty: LibraryState = { tracks: {}, favorites: [], playlists: [], songs: [] };

function load(): LibraryState {
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw) };
  } catch { return empty; }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(empty);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setState(load()); setHydrated(true); }, []);
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  }, [state, hydrated]);

  const rememberTrack = (t: Track) =>
    setState((s) => (s.tracks[t.id] ? s : { ...s, tracks: { ...s.tracks, [t.id]: t } }));

  const addToLibrary = useCallback((t: Track) => {
    setState((s) => ({
      ...s,
      tracks: { ...s.tracks, [t.id]: t },
      songs: s.songs.includes(t.id) ? s.songs : [t.id, ...s.songs],
    }));
  }, []);

  const removeFromLibrary = useCallback((id: string) => {
    setState((s) => ({ ...s, songs: s.songs.filter((x) => x !== id) }));
  }, []);

  const toggleFavorite = useCallback((t: Track) => {
    setState((s) => {
      const has = s.favorites.includes(t.id);
      return {
        ...s,
        tracks: { ...s.tracks, [t.id]: t },
        favorites: has ? s.favorites.filter((x) => x !== t.id) : [t.id, ...s.favorites],
      };
    });
  }, []);

  const isFavorite = useCallback((id: string) => state.favorites.includes(id), [state.favorites]);
  const isInLibrary = useCallback((id: string) => state.songs.includes(id), [state.songs]);

  const createPlaylist = useCallback((name: string) => {
    const pl: Playlist = { id: crypto.randomUUID(), name: name.trim() || "New Playlist", trackIds: [], createdAt: Date.now() };
    setState((s) => ({ ...s, playlists: [pl, ...s.playlists] }));
    return pl;
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setState((s) => ({ ...s, playlists: s.playlists.filter((p) => p.id !== id) }));
  }, []);

  const renamePlaylist = useCallback((id: string, name: string) => {
    setState((s) => ({ ...s, playlists: s.playlists.map((p) => p.id === id ? { ...p, name } : p) }));
  }, []);

  const addToPlaylist = useCallback((playlistId: string, t: Track) => {
    setState((s) => ({
      ...s,
      tracks: { ...s.tracks, [t.id]: t },
      playlists: s.playlists.map((p) =>
        p.id === playlistId && !p.trackIds.includes(t.id)
          ? { ...p, trackIds: [...p.trackIds, t.id] }
          : p,
      ),
    }));
  }, []);

  const removeFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setState((s) => ({
      ...s,
      playlists: s.playlists.map((p) =>
        p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((x) => x !== trackId) } : p,
      ),
    }));
  }, []);

  const getTracks = useCallback(
    (ids: string[]) => ids.map((id) => state.tracks[id]).filter(Boolean) as Track[],
    [state.tracks],
  );

  return (
    <Ctx.Provider value={{ ...state, addToLibrary, removeFromLibrary, toggleFavorite, isFavorite, isInLibrary, createPlaylist, deletePlaylist, renamePlaylist, addToPlaylist, removeFromPlaylist, getTracks }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLibrary() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}
