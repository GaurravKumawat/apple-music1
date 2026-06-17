import { MoreHorizontal } from "lucide-react";
import { m } from "motion/react";
import type { Track } from "@/lib/music.functions";
import { springSnappy, tapScaleSoft } from "@/lib/motion";

export function TrackRow({
  track,
  index,
  onPlay,
  onMore,
  delay = 0,
}: {
  track: Track;
  index?: number;
  onPlay: () => void;
  onMore?: (t: Track) => void;
  delay?: number;
}) {
  return (
    <m.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...springSnappy, delay }}
      className="w-full flex items-center gap-3 py-2 px-1 active:bg-white/5 rounded-md text-left"
    >
      {typeof index === "number" ? (
        <div className="w-5 text-center text-muted-foreground text-[14px] tabular-nums">{index}</div>
      ) : null}
      <m.button
        whileTap={tapScaleSoft}
        transition={springSnappy}
        onClick={onPlay}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <img src={track.thumbnail} alt="" className="h-12 w-12 rounded-md object-cover bg-muted" />
        <div className="flex-1 min-w-0 border-b border-border pb-2">
          <div className="text-[15px] truncate text-foreground">{track.title}</div>
          <div className="text-[13px] text-muted-foreground truncate">{track.artist}</div>
        </div>
      </m.button>
      <m.button
        whileTap={tapScaleSoft}
        transition={springSnappy}
        onClick={() => onMore?.(track)}
        className="p-2 text-muted-foreground"
        aria-label="More"
      >
        <MoreHorizontal className="h-5 w-5" />
      </m.button>
    </m.div>
  );
}
