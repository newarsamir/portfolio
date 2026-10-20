import Cursor from "@/components/Cursor";
import EditBridge from "@/components/cms/EditBridge";
import { Editable, SiteProvider } from "@/components/cms/SiteProvider";
import Footer from "@/components/Footer";
import IntroGreeting from "@/components/IntroGreeting";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
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
      <Editable id="nav">
        <Nav available={settings.availableForWork} />
      </Editable>
      <main id="main">{children}</main>
      <Editable id="footer">
        <Footer />
      </Editable>
      <Cursor />
      <EditBridge />
    </SiteProvider>
  );
}
