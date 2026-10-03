"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitContact, type ContactFields, type ContactState } from "@/app/(site)/contact/actions";
import { site } from "@/content/site";

const initial: ContactState = { status: "idle" };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Same rules as the server action, run on blur for instant feedback. */
function check(field: ContactFields, value: string): string | undefined {
  const v = value.trim();
  switch (field) {
    case "name":
      return v.length < 2 ? "Add your name so I know who to reply to." : undefined;
    case "email":
      return EMAIL.test(v) ? undefined : "That doesn't look like an email address. Check for typos.";
    case "projectType":
      return v ? undefined : "Pick the closest project type.";
    case "budget":
      return v ? undefined : "Pick a budget range. A rough one is fine.";
    case "message":
      return v.length < 20 ? "Tell me a little more, at least 20 characters." : undefined;
    default:
      return undefined;
  }
}

export default function ContactForm() {
  const [state, action, pending] = useActionState(submitContact, initial);
  const [local, setLocal] = useState<Partial<Record<ContactFields, string | undefined>>>({});
  const formRef = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  // Server errors replace local ones after each submit.
  useEffect(() => {
    if (state.status === "error") {
      setLocal(state.errors ?? {});
      const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
    }
    if (state.status === "success") successRef.current?.focus();
  }, [state]);

  const errorFor = (f: ContactFields) => local[f];
  const onBlur = (f: ContactFields) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setLocal((prev) => ({ ...prev, [f]: check(f, e.target.value) }));
  const onChange = (f: ContactFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (local[f]) setLocal((prev) => ({ ...prev, [f]: check(f, e.target.value) }));
  };

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-[1.75rem] bg-surface p-8 outline-none md:p-12"
      >
        <svg viewBox="0 0 96 96" className="sent-envelope w-24" fill="none" aria-hidden="true">
          <rect x="10" y="26" width="76" height="52" rx="9" className="fill-lime" stroke="var(--on-lime)" strokeWidth="3.5" />
          <path className="sent-flap" d="M12 30 48 56l36-26" stroke="var(--on-lime)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="76" cy="26" r="15" fill="var(--ink)" />
          <path className="sent-check" d="m69 26.5 5 5 9-10" stroke="var(--bg)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 className="display-md mt-8">{site.contact.success.title}</h2>
        <p className="mt-4 max-w-[44ch] text-lg text-muted">{site.contact.success.body}</p>
      </div>
    );
  }

  const v = state.values ?? {};
  const field = (f: ContactFields) => ({
    id: f,
    name: f,
    "aria-invalid": errorFor(f) ? (true as const) : undefined,
    "aria-describedby": errorFor(f) ? `${f}-error` : undefined,
    onBlur: onBlur(f),
    onChange: onChange(f),
    className: "field",
  });

  const Err = ({ f }: { f: ContactFields }) =>
    errorFor(f) ? (
      <p id={`${f}-error`} className="mt-2 text-[0.95rem] font-medium text-danger">
        {errorFor(f)}
      </p>
    ) : null;

  return (
    <form ref={formRef} action={action} noValidate className="grid gap-5 sm:grid-cols-2">
      <div>
        <label htmlFor="name" className="mb-2 block font-medium">
          Your name
        </label>
        <input {...field("name")} type="text" autoComplete="name" required defaultValue={v.name} />
        <Err f="name" />
      </div>
      <div>
        <label htmlFor="email" className="mb-2 block font-medium">
          Email
        </label>
        <input
          {...field("email")}
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@brand.com"
          defaultValue={v.email}
        />
        <Err f="email" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="brand" className="mb-2 block font-medium">
          Brand or website <span className="font-normal text-muted">(optional)</span>
        </label>
        <input {...field("brand")} type="text" autoComplete="organization" placeholder="yourbrand.com" defaultValue={v.brand} />
        <Err f="brand" />
      </div>
      <div>
        <label htmlFor="projectType" className="mb-2 block font-medium">
          Project type
        </label>
        <select {...field("projectType")} required defaultValue={v.projectType ?? ""}>
          <option value="" disabled>
            Choose one
          </option>
          {site.contact.projectTypes.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Err f="projectType" />
      </div>
      <div>
        <label htmlFor="budget" className="mb-2 block font-medium">
          Budget range
        </label>
        <select {...field("budget")} required defaultValue={v.budget ?? ""}>
          <option value="" disabled>
            Choose one
          </option>
          {site.contact.budgets.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
        <Err f="budget" />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="message" className="mb-2 block font-medium">
          What do you need?
        </label>
        <textarea
          {...field("message")}
          rows={6}
          required
          placeholder="What you sell, what you send today, and what you want the emails to do."
          defaultValue={v.message}
          className="field resize-y"
        />
        <Err f="message" />
      </div>

      {/* Honeypot. Hidden from people and assistive tech, tempting to bots. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="company_site">Leave this field empty</label>
        <input id="company_site" name="company_site" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:col-span-2">
        <button type="submit" className="btn btn-lime min-h-[3.75rem] px-8 text-lg" disabled={pending}>
          {pending ? "Sending inquiry" : "Send inquiry"}
        </button>
        <p role="alert" aria-live="assertive" className="max-w-[46ch] font-medium text-danger">
          {state.status === "error" ? state.message : ""}
        </p>
      </div>
    </form>
  );
}
