"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ExploreMapClient from "@/components/ExploreMapClient";

type ExploreMapProps = ComponentProps<typeof ExploreMapClient>;

const ExploreMapCanvas = dynamic<ExploreMapProps>(() => import("@/components/ExploreMapClient"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full min-h-[32rem] place-items-center bg-[#E8E3D9]" role="status">
      <p className="rounded-full bg-paper/90 px-4 py-2 text-sm font-semibold text-indigo">Loading the Gujarat atlas map…</p>
    </div>
  ),
});

export function ExploreMap(props: ExploreMapProps) {
  return <ExploreMapCanvas {...props} />;
}
