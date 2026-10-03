"use server";

import { site } from "@/content/site";
import { clientIp } from "@/lib/auth";
import { memoryLimit } from "@/lib/rate-limit";
import { getSupabase } from "@/lib/supabase";

export type ContactFields = "name" | "email" | "brand" | "projectType" | "budget" | "message";

export type ContactState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<ContactFields, string>>;
  values?: Partial<Record<ContactFields, string>>;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitContact(_prev: ContactState, form: FormData): Promise<ContactState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();

  // Honeypot: real people never see this field. Bots get a polite fake success.
  if (get("company_site")) return { status: "success" };

  const values = {
    name: get("name"),
    email: get("email"),
    brand: get("brand"),
    projectType: get("projectType"),
    budget: get("budget"),
    message: get("message"),
  };

  const errors: ContactState["errors"] = {};
  if (values.name.length < 2) errors.name = "Add your name so I know who to reply to.";
  else if (values.name.length > 120) errors.name = "Keep the name under 120 characters.";
  if (!EMAIL.test(values.email) || values.email.length > 200)
    errors.email = "That doesn't look like an email address. Check for typos.";
  if (values.brand.length > 200) errors.brand = "Keep this under 200 characters.";
  if (!(site.contact.projectTypes as readonly string[]).includes(values.projectType))
    errors.projectType = "Pick the closest project type.";
  if (!(site.contact.budgets as readonly string[]).includes(values.budget))
    errors.budget = "Pick a budget range. A rough one is fine.";
  if (values.message.length < 20) errors.message = "Tell me a little more, at least 20 characters.";
  else if (values.message.length > 5000) errors.message = "Keep the message under 5,000 characters.";

  if (Object.keys(errors).length > 0) {
    return { status: "error", message: "A few fields need another look.", errors, values };
  }

  const ip = await clientIp();
  if (!memoryLimit(`contact:${ip}`, 5, 10 * 60 * 1000)) {
    return {
      status: "error",
      message: "That's a lot of messages in a short time. Wait a few minutes, or email me directly.",
      values,
    };
  }

  const db = getSupabase();
  if (!db) {
    return {
      status: "error",
      message: `The form isn't connected to a database yet. Email me at ${site.email} instead.`,
      values,
    };
  }

  const { error } = await db.from("contacts").insert({
    name: values.name,
    email: values.email,
    brand: values.brand || null,
    project_type: values.projectType,
    budget: values.budget,
    message: values.message,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("contact insert failed:", error.message);
    return {
      status: "error",
      message: `Your message wasn't saved because the database didn't respond. Try again, or email me at ${site.email}.`,
      values,
    };
  }

  return { status: "success" };
}
