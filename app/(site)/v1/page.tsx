import type { Metadata } from "next";
import Home from "@/components/home/Home";

export const revalidate = 60;

// A preview of one design. The real home page is /, so search engines are pointed there.
export const metadata: Metadata = {
  title: "Revenue Inbox design",
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function Page() {
  return <Home variant="inbox" />;
}
