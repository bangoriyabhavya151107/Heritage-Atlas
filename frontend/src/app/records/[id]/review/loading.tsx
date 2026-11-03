import { LoadingSkeleton } from "@/components/Feedback";

export default function ReviewLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-8">
      <LoadingSkeleton lines={5} />
    </main>
  );
}
