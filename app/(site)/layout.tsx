import "./redesign.css";
import "./postcard.css";
import "./apple.css";
import EditBridge from "@/components/cms/EditBridge";
import { SiteProvider } from "@/components/cms/SiteProvider";
import IntroGreeting from "@/components/IntroGreeting";
import SmoothScroll from "@/components/SmoothScroll";
import VariantShell from "@/components/VariantShell";
import { contentForClient, getContent, getLayouts } from "@/lib/content";
import { getSettings } from "@/lib/settings";

// Settings changed in /admin show up right away (the admin actions
// revalidate), and at the latest after a minute.
export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const content = await getContent();
  const layouts = await getLayouts();
  return (
    <SiteProvider content={contentForClient(content, layouts)} layouts={layouts}>
      {!layouts.global.hidden.includes("intro") && <IntroGreeting copy={content.intro} />}
      <SmoothScroll />
      <div className="scroll-progress" aria-hidden="true" />
      <VariantShell chosen={settings.variant} available={settings.availableForWork}>
        {children}
      </VariantShell>
      <EditBridge />
    </SiteProvider>
  );
}
