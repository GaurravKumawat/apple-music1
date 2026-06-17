import { ChevronDown, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, MoreHorizontal, Heart, FileText, Eye } from "lucide-react";
import { motion } from "motion/react";
import { formatTime, usePlayer } from "@/lib/player-context";
import { formatViews } from "@/lib/music.functions";
import { useLibrary } from "@/lib/library-store";

export function NowPlaying({ onMore, onShowLyrics }: { onMore?: () => void; onShowLyrics?: () => void }) {
  const { current, isPlaying, toggle, next, prev, position, duration, seek, showFull, setShowFull, shuffle, repeat, toggleShuffle, cycleRepeat } = usePlayer();
  const lib = useLibrary();

  if (!showFull || !current) return null;
  const fav = lib.isFavorite(current.id);
  const views = formatViews(current.views);

  const fadeIn = {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const, delay: 0.08 },
  };

  return (
    <motion.div
      layoutId="player-surface"
      transition={{ type: "spring", stiffness: 360, damping: 40 }}
      style={{ borderRadius: 0 }}
      className="fixed inset-0 z-50 text-foreground overflow-hidden bg-black"
    >
      {/* Blurred artwork background */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="absolute inset-0 scale-125"
        style={{
          backgroundImage: `url(${current.thumbnail})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(80px) saturate(180%)",
        }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative h-full flex flex-col pt-safe pb-safe px-6">
        {/* Handle */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowFull(false)}
            className="h-1.5 w-10 rounded-full bg-white/40"
            aria-label="Close"
          />
        </div>

        <motion.button
          {...fadeIn}
          onClick={() => setShowFull(false)}
          className="absolute top-3 right-4 p-2 text-white/70"
          aria-label="Close"
        >
          <ChevronDown className="h-6 w-6" />
        </motion.button>

        {/* Artwork */}
        <div className="flex-1 flex items-center justify-center my-4">
          <motion.img
            layoutId="player-art"
            src={current.thumbnail}
            alt=""
            animate={{ scale: isPlaying ? 1 : 0.86 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="w-full max-w-[340px] aspect-square rounded-[24px] object-cover shadow-[0_24px_70px_rgba(0,0,0,0.65)]"
          />
        </div>

        {/* Title row */}
        <motion.div {...fadeIn} className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <motion.div layoutId="player-title" className="text-[20px] font-semibold leading-tight truncate">
              {current.title}
            </motion.div>
            <div className="text-[18px] text-white/70 truncate">{current.artist}</div>
            {views && (
              <div className="mt-1 flex items-center gap-1 text-[13px] text-white/55">
                <Eye className="h-3.5 w-3.5" /> {views} plays
              </div>
            )}
          </div>
          <button
            onClick={() => lib.toggleFavorite(current)}
            className="p-2 rounded-full bg-white/15"
            aria-label="Favorite"
          >
            <Heart className={`h-5 w-5 ${fav ? "fill-current text-primary" : ""}`} />
          </button>
          <button onClick={onMore} className="p-2 rounded-full bg-white/15" aria-label="More">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </motion.div>

        {/* Scrubber */}
        <motion.div {...fadeIn}>
          <input
            type="range"
            className="am-slider"
            min={0}
            max={duration || 0}
            step={1}
            value={Math.min(position, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
          />
          <div className="flex justify-between text-[11px] text-white/60 mt-1 tabular-nums">
            <span>{formatTime(position)}</span>
            <span>-{formatTime(Math.max(0, (duration || 0) - position))}</span>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div {...fadeIn} className="flex items-center justify-between mt-4 mb-6">
          <motion.button whileTap={{ scale: 0.8 }} onClick={prev} className="p-3" aria-label="Previous">
            <SkipBack className="h-8 w-8 fill-current" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={toggle}
            className="p-3"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="h-14 w-14 fill-current" />
            ) : (
              <Play className="h-14 w-14 fill-current" />
            )}
          </motion.button>
          <motion.button whileTap={{ scale: 0.8 }} onClick={next} className="p-3" aria-label="Next">
            <SkipForward className="h-8 w-8 fill-current" />
          </motion.button>
        </motion.div>

        {/* Bottom row */}
        <motion.div {...fadeIn} className="flex items-center justify-between text-white/70 pb-2">
          <button onClick={toggleShuffle} className={`p-2 ${shuffle ? "text-primary" : ""}`} aria-label="Shuffle"><Shuffle className="h-5 w-5" /></button>
          <button onClick={onShowLyrics} className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide">
            <FileText className="h-4 w-4" /> Lyrics
          </button>
          <button onClick={cycleRepeat} className={`p-2 ${repeat !== "off" ? "text-primary" : ""}`} aria-label="Repeat">
            {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
