import type { Metadata } from "next";
import NotFoundScene from "@/components/NotFoundScene";

export const metadata: Metadata = {
  title: "404, zero conversions",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundScene />;
}
