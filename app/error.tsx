"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RollText } from "@/components/RollText";
import { toast } from "@/lib/toast";

/** Something threw while rendering. Own it, apologise once, offer a retry. */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    toast.error("Something on this page broke while loading. It's been logged, and it's not your fault this time.", "Well, that's embarrassing");
  }, [error]);

  return (
    <main className="wrap grid min-h-svh place-items-center py-24 text-center">
      <div>
        <p className="mono text-muted">500 · Soft bounce</p>
        <h1 className="display-lg mx-auto mt-4 max-w-[16ch]">This page tripped over its own footer.</h1>
        <p className="mx-auto mt-5 max-w-[44ch] text-lg text-muted">
          A soft bounce means it might work on a second try. Unlike most re-sends, this one isn&apos;t spam.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-lime">
            <RollText text="Try sending it again" />
          </button>
          <Link href="/" className="btn btn-ghost">
            <RollText text="Back to the home page" />
          </Link>
        </div>
        {error.digest && <p className="mono mt-8 text-muted">Reference {error.digest}</p>}
      </div>
    </main>
  );
}
