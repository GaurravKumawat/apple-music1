import {
  ChevronDown,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  MoreHorizontal,
  Heart,
  FileText,
  Eye,
} from "lucide-react";
import { AnimatePresence, m, useDragControls, useMotionValue, useTransform } from "motion/react";
import { useCallback, useEffect } from "react";
import { formatTime, usePlayer } from "@/lib/player-context";
import { formatViews } from "@/lib/music.functions";
import { useLibrary } from "@/lib/library-store";
import {
  fadeTween,
  layoutTransition,
  springPlayer,
  springSnappy,
  staggerContainer,
  tapScale,
  tapScaleSoft,
} from "@/lib/motion";

type PlayerProps = {
  onMore?: () => void;
  onShowLyrics?: () => void;
};

const MINI_BOTTOM = "calc(env(safe-area-inset-bottom) + 58px)";

export function Player({ onMore, onShowLyrics }: PlayerProps) {
  const {
    current,
    isPlaying,
    toggle,
    next,
    prev,
    position,
    duration,
    seek,
    showFull,
    setShowFull,
    shuffle,
    repeat,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer();
  const lib = useLibrary();
  const dragControls = useDragControls();
  const dragY = useMotionValue(0);
  const dismissOpacity = useTransform(dragY, [0, 180], [1, 0.35]);
  const contentScale = useTransform(dragY, [0, 220], [1, 0.94]);

  const openFull = useCallback(() => setShowFull(true), [setShowFull]);
  const closeFull = useCallback(() => setShowFull(false), [setShowFull]);

  useEffect(() => {
    if (!showFull) dragY.set(0);
  }, [showFull, dragY]);

  if (!current) return null;

  const fav = lib.isFavorite(current.id);
  const views = formatViews(current.views);
  const pct = duration > 0 ? Math.min(position / duration, 1) : 0;

  return (
    <>
      {/* Mini player bar */}
      <AnimatePresence>
        {!showFull && (
          <m.div
            key="mini"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
            transition={springPlayer}
            className="fixed left-2 right-2 z-40 gpu-layer"
            style={{ bottom: MINI_BOTTOM }}
          >
            <m.div
              layoutId="player-card"
              transition={layoutTransition}
              onClick={openFull}
              whileTap={tapScaleSoft}
              className="glass-strong shadow-2xl border border-border overflow-hidden text-left cursor-pointer rounded-[30px]"
            >
              <div className="flex items-center gap-3 p-2">
                <m.img
                  layoutId="player-artwork"
                  transition={layoutTransition}
                  src={current.thumbnail}
                  alt=""
                  className="h-12 w-12 rounded-2xl object-cover bg-muted shrink-0 gpu-layer"
                />
                <div className="flex-1 min-w-0">
                  <m.div
                    layoutId="player-track-title"
                    transition={layoutTransition}
                    className="text-[14px] font-semibold truncate text-foreground"
                  >
                    {current.title}
                  </m.div>
                  <div className="text-[12px] text-muted-foreground truncate flex items-center gap-1.5">
                    <span className="truncate">{current.artist}</span>
                    {views && (
                      <span className="flex items-center gap-0.5 shrink-0 text-muted-foreground/80">
                        <Eye className="h-3 w-3" /> {views}
                      </span>
                    )}
                  </div>
                </div>
                <m.button
                  whileTap={tapScale}
                  transition={springSnappy}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle();
                  }}
                  className="p-2 text-foreground"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6 fill-current" />
                  ) : (
                    <Play className="h-6 w-6 fill-current" />
                  )}
                </m.button>
                <m.button
                  whileTap={tapScale}
                  transition={springSnappy}
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                  className="p-2 pr-3 text-foreground"
                  aria-label="Next"
                >
                  <SkipForward className="h-5 w-5 fill-current" />
                </m.button>
              </div>
              <div className="h-[2px] bg-white/10 overflow-hidden">
                <m.div
                  className="h-full w-full origin-left bg-white/80 gpu-layer"
                  style={{ scaleX: pct }}
                  transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                />
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Full-screen now playing */}
      <AnimatePresence>
        {showFull && (
          <m.div
            key="full"
            layoutId="player-card"
            transition={layoutTransition}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.05, bottom: 0.35 }}
            dragListener={false}
            style={{ y: dragY, opacity: dismissOpacity, borderRadius: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 400) closeFull();
            }}
            className="fixed inset-0 z-50 text-foreground overflow-hidden bg-black gpu-layer"
          >
            {/* Static blurred backdrop — opacity only, no layout animation */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTween}
              className="absolute inset-0 pointer-events-none gpu-layer"
              aria-hidden
            >
              <div
                className="absolute inset-0 scale-[1.2]"
                style={{
                  backgroundImage: `url(${current.thumbnail})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(64px) saturate(160%)",
                  transform: "translateZ(0)",
                }}
              />
              <div className="absolute inset-0 bg-black/62" />
            </m.div>

            <m.div
              style={{ scale: contentScale }}
              className="relative h-full flex flex-col pt-safe pb-safe px-6 gpu-layer"
            >
              {/* Drag handle */}
              <div
                className="flex justify-center pt-2 pb-1 touch-none"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="h-1.5 w-10 rounded-full bg-white/40" />
              </div>

              <m.button
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...fadeTween, delay: 0.12 }}
                onClick={closeFull}
                className="absolute top-3 right-4 p-2 text-white/70"
                aria-label="Close"
              >
                <ChevronDown className="h-6 w-6" />
              </m.button>

              <m.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="flex-1 flex flex-col min-h-0"
              >
                {/* Artwork */}
                <div className="flex-1 flex items-center justify-center my-4 min-h-0">
                  <m.img
                    layoutId="player-artwork"
                    transition={layoutTransition}
                    src={current.thumbnail}
                    alt=""
                    animate={{ scale: isPlaying ? 1 : 0.92 }}
                    style={{ willChange: "transform" }}
                    className="w-full max-w-[340px] aspect-square rounded-[24px] object-cover shadow-[0_24px_70px_rgba(0,0,0,0.65)] gpu-layer"
                  />
                </div>

                {/* Title row */}
                <m.div variants={fadeUpVariant} className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <m.div
                      layoutId="player-track-title"
                      transition={layoutTransition}
                      className="text-[20px] font-semibold leading-tight truncate"
                    >
                      {current.title}
                    </m.div>
                    <div className="text-[18px] text-white/70 truncate">{current.artist}</div>
                    {views && (
                      <div className="mt-1 flex items-center gap-1 text-[13px] text-white/55">
                        <Eye className="h-3.5 w-3.5" /> {views} plays
                      </div>
                    )}
                  </div>
                  <m.button
                    whileTap={tapScale}
                    transition={springSnappy}
                    onClick={() => lib.toggleFavorite(current)}
                    className="p-2 rounded-full bg-white/15"
                    aria-label="Favorite"
                  >
                    <Heart className={`h-5 w-5 ${fav ? "fill-current text-primary" : ""}`} />
                  </m.button>
                  <m.button
                    whileTap={tapScale}
                    transition={springSnappy}
                    onClick={onMore}
                    className="p-2 rounded-full bg-white/15"
                    aria-label="More"
                  >
                    <MoreHorizontal className="h-5 w-5" />
                  </m.button>
                </m.div>

                {/* Scrubber */}
                <m.div variants={fadeUpVariant}>
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
                </m.div>

                {/* Controls */}
                <m.div variants={fadeUpVariant} className="flex items-center justify-between mt-4 mb-6">
                  <m.button whileTap={tapScale} transition={springSnappy} onClick={prev} className="p-3" aria-label="Previous">
                    <SkipBack className="h-8 w-8 fill-current" />
                  </m.button>
                  <m.button
                    whileTap={{ scale: 0.88 }}
                    transition={springSnappy}
                    onClick={toggle}
                    className="p-3"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <m.span
                        key={isPlaying ? "pause" : "play"}
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                        className="block"
                      >
                        {isPlaying ? (
                          <Pause className="h-14 w-14 fill-current" />
                        ) : (
                          <Play className="h-14 w-14 fill-current" />
                        )}
                      </m.span>
                    </AnimatePresence>
                  </m.button>
                  <m.button whileTap={tapScale} transition={springSnappy} onClick={next} className="p-3" aria-label="Next">
                    <SkipForward className="h-8 w-8 fill-current" />
                  </m.button>
                </m.div>

                {/* Bottom row */}
                <m.div variants={fadeUpVariant} className="flex items-center justify-between text-white/70 pb-2">
                  <m.button
                    whileTap={tapScale}
                    transition={springSnappy}
                    onClick={toggleShuffle}
                    className={`p-2 ${shuffle ? "text-primary" : ""}`}
                    aria-label="Shuffle"
                  >
                    <Shuffle className="h-5 w-5" />
                  </m.button>
                  <m.button
                    whileTap={tapScaleSoft}
                    transition={springSnappy}
                    onClick={onShowLyrics}
                    className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide"
                  >
                    <FileText className="h-4 w-4" /> Lyrics
                  </m.button>
                  <m.button
                    whileTap={tapScale}
                    transition={springSnappy}
                    onClick={cycleRepeat}
                    className={`p-2 ${repeat !== "off" ? "text-primary" : ""}`}
                    aria-label="Repeat"
                  >
                    {repeat === "one" ? <Repeat1 className="h-5 w-5" /> : <Repeat className="h-5 w-5" />}
                  </m.button>
                </m.div>
              </m.div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  );
}

const fadeUpVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 340, damping: 34, mass: 0.85 },
  },
};
