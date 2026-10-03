"use server";

import { revalidatePath } from "next/cache";
import { site } from "@/content/site";
import {
  checkPassword,
  clientIp,
  createSession,
  destroySession,
  isAdminConfigured,
  requireAdmin,
} from "@/lib/auth";
import { loginAllowed, recordFailedLogin } from "@/lib/rate-limit";
import { SETTING_KEYS } from "@/lib/settings";
import { getSupabase } from "@/lib/supabase";
import { parseVideo } from "@/lib/video";

export type ActionResult = { ok: boolean; message: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function login(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  if (!isAdminConfigured()) {
    return { ok: false, message: "ADMIN_PASSWORD is not set, so sign-in is turned off." };
  }
  const ip = await clientIp();
  if (!(await loginAllowed(ip))) {
    return { ok: false, message: "Too many wrong passwords. Wait 15 minutes, then try again." };
  }
  // A fixed pause makes guessing slow whatever the result.
  await new Promise((r) => setTimeout(r, 450));

  const password = String(form.get("password") ?? "");
  if (!checkPassword(password)) {
    await recordFailedLogin(ip);
    return { ok: false, message: "Wrong password." };
  }
  await createSession();
  revalidatePath("/admin");
  return { ok: true, message: "Signed in." };
}

export async function logout() {
  await destroySession();
  revalidatePath("/admin");
}

export async function setRead(id: string, isRead: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't update that message." };
  const { error } = await db.from("contacts").update({ is_read: isRead }).eq("id", id);
  if (error) return { ok: false, message: "Couldn't update that message. Try again." };
  return { ok: true, message: isRead ? "Marked as read." : "Marked as unread." };
}

export async function deleteContact(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't delete that message." };
  const { error } = await db.from("contacts").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete that message. Try again." };
  return { ok: true, message: "Deleted." };
}

export async function saveSettings(_prev: ActionResult | null, form: FormData): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return { ok: false, message: "Supabase isn't connected, so settings can't be saved." };

  const videoUrl = String(form.get("heroVideoUrl") ?? "").trim();
  if (!videoUrl || !parseVideo(videoUrl)) {
    return { ok: false, message: "Use a direct .mp4 link, a YouTube link or a Vimeo link for the video." };
  }

  const counters: Record<string, number> = {};
  for (const c of site.counters.items) {
    const n = Number(form.get(`counter_${c.id}`));
    if (!Number.isFinite(n) || n < 0 || n > 1_000_000_000) {
      return { ok: false, message: `"${c.label}" needs a whole number, zero or more.` };
    }
    counters[c.id] = Math.round(n);
  }

  const now = new Date().toISOString();
  const { error } = await db.from("settings").upsert(
    [
      { key: SETTING_KEYS.video, value: videoUrl, updated_at: now },
      { key: SETTING_KEYS.available, value: form.get("available") === "on", updated_at: now },
      { key: SETTING_KEYS.counters, value: counters, updated_at: now },
    ],
    { onConflict: "key" },
  );
  if (error) {
    console.error("settings save failed:", error.message);
    return { ok: false, message: "Settings weren't saved because the database didn't respond. Try again." };
  }

  // Rebuild the public pages so the change is live immediately.
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. The site is updated." };
}
