import Link from "next/link";
import { RollText } from "@/components/RollText";

export default function NotFound() {
  return (
    <main className="wrap grid min-h-svh place-items-center py-24 text-center">
      <div>
        <p className="mono text-muted">404</p>
        <h1 className="display-lg mx-auto mt-4 max-w-[14ch]">This page bounced.</h1>
        <p className="mx-auto mt-5 max-w-[40ch] text-lg text-muted">
          Like an email to an address with a typo, it never arrived. The home page has a much better delivery rate.
        </p>
        <Link href="/" className="btn btn-lime mt-8">
          <RollText text="Back to the home page" />
        </Link>
      </div>
    </main>
  );
}
