import { Pause, Play, SkipForward, Eye } from "lucide-react";
import { motion } from "motion/react";
import { usePlayer } from "@/lib/player-context";
import { formatViews } from "@/lib/music.functions";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next, setShowFull, position, duration, showFull } = usePlayer();
  if (!current || showFull) return null;
  const pct = duration > 0 ? (position / duration) * 100 : 0;
  const views = formatViews(current.views);

  return (
    <motion.div
      layoutId="player-surface"
      onClick={() => setShowFull(true)}
      initial={false}
      transition={{ type: "spring", stiffness: 420, damping: 38 }}
      style={{ borderRadius: 30 }}
      className="fixed left-2 right-2 bottom-[calc(env(safe-area-inset-bottom)+58px)] z-40 glass-strong shadow-2xl border border-border overflow-hidden text-left cursor-pointer"
    >
      <motion.div
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="flex items-center gap-3 p-2"
      >
        <motion.img
          layoutId="player-art"
          src={current.thumbnail}
          alt=""
          className="h-12 w-12 rounded-2xl object-cover bg-muted shrink-0"
        />
        <div className="flex-1 min-w-0">
          <motion.div layoutId="player-title" className="text-[14px] font-semibold truncate text-foreground">
            {current.title}
          </motion.div>
          <div className="text-[12px] text-muted-foreground truncate flex items-center gap-1.5">
            <span className="truncate">{current.artist}</span>
            {views && (
              <span className="flex items-center gap-0.5 shrink-0 text-muted-foreground/80">
                <Eye className="h-3 w-3" /> {views}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); toggle(); }}
          className="p-2 text-foreground"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          className="p-2 pr-3 text-foreground"
          aria-label="Next"
        >
          <SkipForward className="h-5 w-5 fill-current" />
        </button>
      </motion.div>
      <div className="h-[2px] bg-white/10">
        <div className="h-full bg-white/80 transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </motion.div>
  );
}
