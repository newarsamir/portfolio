import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { SLUG } from "@/lib/link-utils";
import { countClick, getLinkBySlug, signedFileUrl } from "@/lib/links";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Link previews and crawlers fetch links too; they don't count as opens. */
const BOT = /bot|crawl|spider|preview|slack|whatsapp|telegram|discord|facebookexternalhit|linkedin|skype|embedly|vkshare|quora|pinterest|headless/i;

/**
 * /go/<name>: a short link made in /admin. A URL link redirects there; a file
 * link redirects to a short-lived download of the file. Unknown or switched-off
 * names show the site's 404.
 */
export default async function GoPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug.toLowerCase();
  if (!SLUG.test(slug)) notFound();
  const link = await getLinkBySlug(slug);
  if (!link || !link.enabled) notFound();

  const ua = (await headers()).get("user-agent") ?? "";
  if (!BOT.test(ua)) await countClick(link);

  const to = link.kind === "file" ? await signedFileUrl(link) : link.target;
  if (!to) notFound();
  redirect(to);
}
