import type { Metadata } from "next";
import EditBridge from "@/components/cms/EditBridge";
import { Editable, SiteProvider } from "@/components/cms/SiteProvider";
import NotFoundScene from "@/components/NotFoundScene";
import { contentForClient, getContent, getLayouts } from "@/lib/content";

export const metadata: Metadata = {
  title: "404, zero conversions",
  robots: { index: false, follow: true },
};

export default async function NotFound() {
  const layouts = await getLayouts();
  return (
    <SiteProvider content={contentForClient(await getContent(), layouts)} layouts={layouts}>
      <Editable id="notFound">
        <NotFoundScene />
      </Editable>
      <EditBridge />
    </SiteProvider>
  );
}
