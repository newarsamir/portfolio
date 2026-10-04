import Cursor from "@/components/Cursor";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import SmoothScroll from "@/components/SmoothScroll";
import { getSettings } from "@/lib/settings";

// Settings changed in /admin show up right away (the admin actions
// revalidate), and at the latest after a minute.
export const revalidate = 60;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      <SmoothScroll />
      <div className="scroll-progress" aria-hidden="true" />
      <Nav available={settings.availableForWork} />
      <main id="main">{children}</main>
      <Footer />
      <Cursor />
    </>
  );
}
