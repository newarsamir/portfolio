import type { Metadata } from "next";
import EditBridge from "@/components/cms/EditBridge";
import { Editable, SiteProvider } from "@/components/cms/SiteProvider";
import NotFoundRotator from "@/components/notfound/NotFoundRotator";
import { contentForClient, getContent, getLayouts } from "@/lib/content";
import { enabledNotFoundVariants, notFoundPickScript } from "@/lib/notfound";
import "./notfound.css";

export const metadata: Metadata = {
  title: "404, zero conversions",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const [content, layouts] = await Promise.all([getContent(), getLayouts()]);
  // Stays static (it's part of every route), so the random pick runs in the browser.
  const pick = notFoundPickScript(enabledNotFoundVariants(content.notFound.rotation));
  return (
    <SiteProvider content={contentForClient(content, layouts)} layouts={layouts}>
      <script dangerouslySetInnerHTML={{ __html: pick }} />
      <Editable id="notFound">
        <NotFoundRotator />
      </Editable>
      <EditBridge />
    </SiteProvider>
  );
}
