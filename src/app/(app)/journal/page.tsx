import { Suspense } from "react";
import { JournalClient } from "@/components/journal-client";

export default function JournalPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-slate-500">Loading journal...</div>}>
      <JournalClient />
    </Suspense>
  );
}
