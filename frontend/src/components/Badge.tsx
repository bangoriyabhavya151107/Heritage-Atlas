import type { ReactNode } from "react";

type BadgeTone = "good" | "caution" | "low" | "neutral" | "indigo";

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  good: "border-[#B7D9C1] bg-[#E8F3EA] text-[#185B35]",
  caution: "border-[#E8D199] bg-[#FFF4D8] text-[#754B05]",
  low: "border-[#E8C2BD] bg-[#FCEBE8] text-[#872E28]",
  neutral: "border-line bg-white/75 text-muted",
  indigo: "border-indigo/15 bg-indigo/8 text-indigo",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${tones[tone]}`}>
      {children}
    </span>
  );
}
