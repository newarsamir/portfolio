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
import { imageSourceOk as imageOk } from "@/lib/images";

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

/* ---------------------------- Case studies ---------------------------- */

export type CaseActionResult = ActionResult & { id?: string };

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(form: FormData, key: string, max: number) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}

export async function saveCaseStudy(_prev: CaseActionResult | null, form: FormData): Promise<CaseActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return { ok: false, message: "Supabase isn't connected, so case studies can't be saved." };

  const id = text(form, "id", 36);
  if (id && !UUID.test(id)) return { ok: false, message: "That case study no longer exists." };

  const title = text(form, "title", 160);
  const slug = text(form, "slug", 80).toLowerCase();
  if (!title) return { ok: false, message: "Give the case study a title." };
  if (!SLUG.test(slug)) {
    return { ok: false, message: "The URL slug can only use lowercase letters, numbers and single dashes." };
  }

  const cover = text(form, "cover", 500);
  if (cover && !imageOk(cover)) {
    return { ok: false, message: "The cover must be a site path like /emails/email-01.webp or an https link." };
  }
  const gallery = String(form.get("gallery") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
  const badImage = gallery.find((g) => !imageOk(g));
  if (badImage) return { ok: false, message: `"${badImage.slice(0, 60)}" isn't a site path or an https link.` };

  const values = form.getAll("metric_value").map((v) => String(v).trim().slice(0, 24));
  const labels = form.getAll("metric_label").map((v) => String(v).trim().slice(0, 80));
  const metrics = values
    .map((value, i) => ({ value, label: labels[i] ?? "" }))
    .filter((m) => m.value && m.label)
    .slice(0, 6);

  const record = {
    slug,
    title,
    client: text(form, "client", 120),
    industry: text(form, "industry", 120),
    year: text(form, "year", 20),
    services: String(form.get("services") ?? "")
      .split(",")
      .map((s) => s.trim().slice(0, 60))
      .filter(Boolean)
      .slice(0, 8),
    summary: text(form, "summary", 600),
    cover,
    challenge: text(form, "challenge", 4000),
    approach: text(form, "approach", 4000),
    outcome: text(form, "outcome", 4000),
    metrics,
    gallery,
    published: form.get("published") === "on",
    updated_at: new Date().toISOString(),
  };

  let savedId = id;
  if (id) {
    const { error } = await db.from("case_studies").update(record).eq("id", id);
    if (error) return caseError(error);
  } else {
    // New ones go to the end of the list.
    const { data: last } = await db
      .from("case_studies")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1);
    const sort_order = ((last?.[0]?.sort_order as number | undefined) ?? -1) + 1;
    const { data, error } = await db
      .from("case_studies")
      .insert({ ...record, sort_order })
      .select("id")
      .single();
    if (error) return caseError(error);
    savedId = data.id as string;
  }

  revalidatePath("/", "layout");
  return {
    ok: true,
    id: savedId,
    message: record.published ? "Saved and live on the site." : "Saved as a draft. It's hidden until you publish it.",
  };
}

function caseError(error: { code?: string; message: string }): CaseActionResult {
  if (error.code === "23505") return { ok: false, message: "Another case study already uses that URL slug." };
  console.error("case study save failed:", error.message);
  return { ok: false, message: "The case study wasn't saved because the database didn't respond. Try again." };
}

export async function deleteCaseStudy(id: string): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't delete that case study." };
  const { error } = await db.from("case_studies").delete().eq("id", id);
  if (error) return { ok: false, message: "Couldn't delete that case study. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Case study deleted." };
}

export async function setCaseStudyPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || !UUID.test(id)) return { ok: false, message: "Couldn't update that case study." };
  const { error } = await db
    .from("case_studies")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, message: "Couldn't update that case study. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: published ? "Published." : "Moved back to drafts." };
}

/** Saves the order shown in the admin list. */
export async function reorderCaseStudies(ids: string[]): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db || ids.length > 200 || !ids.every((id) => UUID.test(id))) {
    return { ok: false, message: "Couldn't save the new order." };
  }
  const results = await Promise.all(
    ids.map((id, i) => db.from("case_studies").update({ sort_order: i }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return { ok: false, message: "Couldn't save the new order. Try again." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Order saved." };
}

/** Copies the sample case studies from site.ts into an empty table. */
export async function importSampleCaseStudies(): Promise<ActionResult> {
  await requireAdmin();
  const db = getSupabase();
  if (!db) return { ok: false, message: "Supabase isn't connected." };
  const { count } = await db.from("case_studies").select("id", { count: "exact", head: true });
  if (count) return { ok: false, message: "The table already has case studies, so nothing was imported." };
  const rows = site.caseStudies.items.map((c, i) => ({ ...c, published: false, sort_order: i }));
  const { error } = await db.from("case_studies").insert(rows);
  if (error) return caseError(error);
  revalidatePath("/", "layout");
  return { ok: true, message: `Imported ${rows.length} samples as drafts. Edit them, then publish.` };
}
