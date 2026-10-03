"use client";

import { useEffect, useState } from "react";

// False for the very first page load, true for every navigation after it,
// so the lime curtain never delays the first paint.
let hasNavigated = false;

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const [curtain] = useState(hasNavigated);

  useEffect(() => {
    hasNavigated = true;
  }, []);

  return (
    <>
      {curtain && <div className="page-curtain" aria-hidden="true" />}
      <div className={curtain ? "page-enter" : undefined}>{children}</div>
    </>
  );
}
