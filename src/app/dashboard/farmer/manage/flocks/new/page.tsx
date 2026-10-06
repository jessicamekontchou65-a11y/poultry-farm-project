"use client";

import { Suspense } from "react";
import NewFlockForm from "./NewFlockForm";

export default function NewFlockRoutePage() {
  return (
    <Suspense fallback={<div style={{ padding: 24 }}>Loading...</div>}>
      <NewFlockForm />
    </Suspense>
  );
}
