import Home from "@/components/home/Home";
import { getSettings } from "@/lib/settings";

export const revalidate = 60;

/** The home page, in whichever design is picked in /admin (Settings). */
export default async function HomePage() {
  const settings = await getSettings();
  return <Home variant={settings.variant} />;
}
