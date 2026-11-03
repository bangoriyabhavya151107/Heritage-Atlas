import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreExperience } from "@/components/ExploreExperience";

export const metadata: Metadata = { title: "Explore the atlas" };

export default function ExplorePage() {
  return (
    <Suspense fallback={<main className="grid min-h-[calc(100svh-73px)] place-items-center bg-sandstone"><p className="rounded-full bg-paper px-4 py-2 text-sm font-semibold text-indigo">Preparing the atlas…</p></main>}>
      <ExploreExperience />
    </Suspense>
  );
}
