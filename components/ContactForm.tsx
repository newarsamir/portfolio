"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { submitContact, type ContactFields, type ContactState } from "@/app/(site)/contact/actions";
import { site } from "@/content/site";
import { toast } from "@/lib/toast";
import { ArrowSwap, RollText } from "./RollText";

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
  const [currencyCode, setCurrencyCode] = useState<string>(site.contact.currencies[0].code);
  const [budgetChoice, setBudgetChoice] = useState("");
  // Selects are kept in state: React resets the form after each submit, and
  // an uncontrolled select would lose the visitor's pick on a failed one.
  const [projectType, setProjectType] = useState("");

  // Start in the visitor's likely currency, guessed from their time zone.
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
      const guess =
        tz === "Asia/Kathmandu" || tz === "Asia/Katmandu" ? "NPR"
        : tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "INR"
        : tz === "Europe/London" ? "GBP"
        : tz.startsWith("Australia/") ? "AUD"
        : /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina)/.test(tz) ? "CAD"
        : tz.startsWith("Europe/") ? "EUR"
        : null;
      if (guess && site.contact.currencies.some((c) => c.code === guess)) setCurrencyCode(guess);
    } catch {
      // Keep the default.
    }
  }, []);
  const successRef = useRef<HTMLDivElement>(null);

  // Server errors replace local ones after each submit.
  useEffect(() => {
    if (state.status === "error") {
      setLocal(state.errors ?? {});
      // Keep what they picked after a failed submit.
      if (state.values?.currency) setCurrencyCode(state.values.currency);
      if (state.values?.budget !== undefined) setBudgetChoice(state.values.budget);
      if (state.values?.projectType !== undefined) setProjectType(state.values.projectType);
      const count = Object.values(state.errors ?? {}).filter(Boolean).length;
      toast.error(
        count ? `${count === 1 ? "One field needs" : `${count} fields need`} a second look. They're marked in red.` : (state.message ?? "Try again in a minute."),
        count ? "Almost there" : "Your inquiry wasn't sent",
      );
      const first = formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']");
      first?.focus();
    }
    if (state.status === "success") successRef.current?.focus();
  }, [state]);

  const errorFor = (f: ContactFields) => local[f];
  const onBlur = (f: ContactFields) => (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    // Leaving a field by pressing Send: the submit checks everything anyway,
    // and an error appearing here would push the button away mid-click.
    if ((e.relatedTarget as HTMLButtonElement | null)?.type === "submit") return;
    setLocal((prev) => ({ ...prev, [f]: check(f, e.target.value) }));
  };
  const onChange = (f: ContactFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (local[f]) setLocal((prev) => ({ ...prev, [f]: check(f, e.target.value) }));
  };

  if (state.status === "success") {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl bg-surface p-8 outline-none md:p-12"
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
  const currency = site.contact.currencies.find((c) => c.code === currencyCode) ?? site.contact.currencies[0];
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
        <select
          {...field("projectType")}
          required
          value={projectType}
          onChange={(e) => {
            setProjectType(e.target.value);
            onChange("projectType")(e);
          }}
        >
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
          Budget
        </label>
        <div className="flex gap-2">
          <label htmlFor="currency" className="sr-only">
            Currency
          </label>
          <select
            id="currency"
            name="currency"
            value={currency.code}
            onChange={(e) => {
              setCurrencyCode(e.target.value);
              // Ranges differ per currency, so a picked range no longer applies.
              if (budgetChoice !== site.contact.customBudget && budgetChoice !== site.contact.openBudget) setBudgetChoice("");
            }}
            className="field w-[6.5rem] shrink-0"
          >
            {site.contact.currencies.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
          <select
            {...field("budget")}
            required
            value={budgetChoice}
            onChange={(e) => {
              setBudgetChoice(e.target.value);
              onChange("budget")(e);
            }}
          >
            <option value="" disabled>
              Choose one
            </option>
            {currency.ranges.map((b) => (
              <option key={b}>{b}</option>
            ))}
            <option>{site.contact.customBudget}</option>
            <option>{site.contact.openBudget}</option>
          </select>
        </div>
        {budgetChoice === site.contact.customBudget && (
          <div className="relative mt-2">
            <label htmlFor="budgetAmount" className="sr-only">
              Your budget in {currency.code}
            </label>
            <span className="mono pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true">
              {currency.symbol}
            </span>
            <input
              id="budgetAmount"
              name="budgetAmount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="2,500"
              defaultValue={v.budgetAmount}
              autoFocus={!v.budgetAmount}
              aria-describedby="budgetAmount-help"
              className="field"
              style={{ paddingLeft: `${1.4 + currency.symbol.length * 0.6}rem` }}
            />
            <p id="budgetAmount-help" className="mt-1.5 text-[0.9rem] text-muted">
              Total for the project, in {currency.code}. A rough number is fine.
            </p>
          </div>
        )}
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
          {pending ? "Sending inquiry" : <RollText text="Send inquiry" />}
          {!pending && <ArrowSwap />}
        </button>
        <p role="alert" aria-live="assertive" className="max-w-[46ch] font-medium text-danger">
          {state.status === "error" ? state.message : ""}
        </p>
      </div>
    </form>
  );
}
