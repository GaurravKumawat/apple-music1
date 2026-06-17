import { Library, Radio, Search, Mic } from "lucide-react";
import { LayoutGroup, m } from "motion/react";
import { springSnappy } from "@/lib/motion";

export type Tab = "listen" | "library" | "search" | "recognize";

const TAB_ORDER: Tab[] = ["listen", "recognize", "library", "search"];

export function getTabDirection(from: Tab, to: Tab): number {
  return TAB_ORDER.indexOf(to) >= TAB_ORDER.indexOf(from) ? 1 : -1;
}

export function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: typeof Radio }[] = [
    { id: "listen", label: "Listen Now", icon: Radio },
    { id: "recognize", label: "Recognize", icon: Mic },
    { id: "library", label: "Library", icon: Library },
    { id: "search", label: "Search", icon: Search },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border pb-safe gpu-layer">
      <LayoutGroup id="tab-bar">
        <div className="flex items-stretch justify-around relative">
          {items.map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <m.button
                key={id}
                onClick={() => onChange(id)}
                whileTap={{ scale: 0.88 }}
                transition={springSnappy}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 py-2 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <m.span
                    layoutId="tab-pill"
                    transition={springSnappy}
                    className="absolute inset-x-3 inset-y-1.5 rounded-xl bg-primary/12"
                  />
                )}
                <Icon className="relative h-[22px] w-[22px]" />
                <span className="relative text-[10px] font-medium">{label}</span>
              </m.button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
