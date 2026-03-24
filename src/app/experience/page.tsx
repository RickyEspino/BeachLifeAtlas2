"use client";

import { Suspense } from "react";
import ExperiencePageInner from "./ExperiencePageInner";

export default function ExperiencePage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ExperiencePageInner />
    </Suspense>
  );
}
