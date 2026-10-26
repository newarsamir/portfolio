"use client";

import { useId, useRef, useState, useTransition } from "react";
import { site as defaults } from "@/content/site";
import { uploadContentImage } from "@/app/admin/content-actions";
import { isPlainObject, itemTemplate } from "@/lib/cms";
import { toast } from "@/lib/toast";

type Props = {
  value: unknown;
  onChange: (v: unknown) => void;
  /** Path without list indexes, e.g. "faq.items", used for labels and templates. */
  path: string;
  name: string;
  omit?: string[];
  fixed?: string[];
  canUpload: boolean;
};

const LABELS: Record<string, string> = {
  q: "Question",
  a: "Answer",
  href: "Link",
  cta: "Call to action",
  sub: "Intro text",
  seo: "Search and sharing",
  eyebrow: "Small line above",
  headline: "Headline",
  heading: "Heading",
  label: "Label",
  note: "Small note",
  primary: "Main button",
  secondary: "Second button",
  button: "Button",
  body: "Text",
  story: "Paragraphs",
  tools: "Tools",
  toolsHeading: "Tools heading",
  portrait: "Portrait (4:5)",
  portraitAlt: "Portrait description (for screen readers)",
  image: "Image",
  favicon: "Favicon (browser tab icon, square PNG 512 x 512)",
  items: "Items",
  steps: "Steps",
  detail: "Detail",
  when: "When it sends",
  tag: "Size",
  use: "What for",
  quips: "Jokes (one shows at a time)",
  placeholder: "Show the 'sample numbers' note",
  sampleNote: "Sample note",
  suffix: "After the number",
  joke: "Lime highlight",
  value: "Number",
  projectTypes: "Project types",
  currencies: "Currencies and budget ranges",
  ranges: "Budget ranges",
  code: "Currency code",
  symbol: "Symbol",
  customBudget: "Custom amount option",
  openBudget: "Open budget option",
  success: "After sending",
  copyHint: "Line above the email",
  timeZone: "Time zone (IANA, e.g. Asia/Kathmandu)",
  socials: "Social links",
  links: "Footer links",
  nav: "Menu items",
  navBar: "Top bar",
  available: "When available",
  booked: "When booked",
  hire: "Hire button",
  name: "Name",
  title: "Title",
  email: "Email address",
  location: "Location",
  description: "Description",
  availableNote: "Line when taking projects",
  countNote: "Count note",
  hint: "Hint",
  nepaliLabel: "Label under नमस्ते",
  second: "Second word",
  secondLabel: "Label under the second word",
  third: "Last word",
  thirdLabel: "Label under the last word",
  blame: "Joke button",
  blameTitle: "Joke popup title",
  blameBody: "Joke popup text",
  undeliverable: "Label before the broken link",
  rotation: "404 designs in the rotation",
  zero: "Zero conversions (the original)",
  bounce: "Bounce-back email",
  pen: "Pen tool (editable vector 404)",
  prefs: "Preference center",
  report: "Campaign report",
  intro: "Intro",
  details: "Details heading",
  original: "Original message heading",
  retry: "Retry button",
  retried: "Retry message",
  shuffle: "Another-404 button",
  file: "File name",
  export: "Export button",
  reset: "Reset button",
  outline: "Outline button",
  toggle: "Toggle label",
  toggleNote: "Toggle note",
  frequency: "Frequency question",
  frequencies: "Frequency steps",
  reasons: "Reasons question",
  save: "Save button",
  saved: "Saved message",
  kpis: "Numbers",
  chart: "Chart title",
  insight: "Insight label",
  advice: "Advice",
  noise: "Other emails in the inbox (the competition)",
  from: "From",
  subject: "Subject line",
  time: "Day",
  inboxLabel: "Inbox label",
  unreadNote: "Line next to the inbox label",
  search: "Search bar text",
  attachment: "Video attachment name",
  openHint: "Hint under the attachment",
  funnel: "Progress rail",
  stages: "Funnel stages",
  revenueLabel: "Revenue counter label",
  scrollHint: "Hint under the intro",
  endHeading: "Heading at the end of the row",
  lineItem: "Word after each service",
  thanks: "Receipt footer",
  signOff: "Sign-off above your name",
  basedIn: "Label: based in",
  emailLabel: "Label: email",
  trigger: "First pill (the trigger)",
  done: "Last pill (the send)",
  stepsLabel: "Word after the step count",
  nodeKind: "Small label on each step",
  asker: "Name on each question",
  replyNote: "Reply count on closed questions",
  composeTitle: "Window title",
  toLabel: "To label",
  fromLabel: "From label",
  fromValue: "From placeholder",
  unsubscribe: "Back-to-top link",
  subjectPrefix: "Subject before your name",
};

const LONG = new Set(["sub", "body", "a", "note", "quote", "story", "summary", "description", "joke", "noSocials", "blameBody", "empty", "detail"]);
const IMAGE = /^(image|portrait|cover|poster|src|favicon)$/i;
const HIDDEN = new Set(["id"]);

export const humanize = (key: string) =>
  LABELS[key] ?? key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).toLowerCase().replace(/^./, (c) => c.toUpperCase());

/** The default value at a path, so new list items can copy its shape. */
function defaultAt(path: string): unknown {
  let v: unknown = defaults;
  for (const part of path.split(".")) {
    if (Array.isArray(v)) v = v[0];
    v = isPlainObject(v) ? v[part] : undefined;
  }
  return v;
}

export default function FieldEditor(props: Props) {
  const { value, path, name } = props;
  if (typeof value === "boolean") return <BoolField {...props} value={value} />;
  if (typeof value === "number") return <NumberField {...props} value={value} />;
  if (typeof value === "string") {
    if (IMAGE.test(name)) return <ImageField {...props} value={value} />;
    return <TextField {...props} value={value} />;
  }
  if (Array.isArray(value)) return <ListField {...props} value={value} />;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).filter((k) => !HIDDEN.has(k) && !props.omit?.includes(path ? `${path}.${k}` : k));
    return (
      <div className="space-y-5">
        {keys.map((k) => {
          const child = value[k];
          const nested = isPlainObject(child) || (Array.isArray(child) && child.some((c) => isPlainObject(c)));
          const inner = (
            <FieldEditor
              {...props}
              value={child}
              name={k}
              path={path ? `${path}.${k}` : k}
              onChange={(v) => props.onChange({ ...value, [k]: v })}
            />
          );
          if (!nested) return <div key={k}>{inner}</div>;
          return (
            <fieldset key={k} className="min-w-0 rounded-2xl border border-line p-4">
              <legend className="px-1.5 text-sm font-semibold">{humanize(k)}</legend>
              {inner}
            </fieldset>
          );
        })}
      </div>
    );
  }
  return null;
}

function Label({ htmlFor, children, hint }: { htmlFor: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {children}
      </label>
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

function TextField({ value, onChange, name, path }: Props & { value: string }) {
  const id = useId();
  const long = LONG.has(name) || value.length > 70 || value.includes("\n") || path.endsWith(".story");
  const hint = value.includes("{count}") ? "{count} is replaced with the number of items." : undefined;
  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {humanize(name)}
      </Label>
      {long ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={Math.min(8, Math.max(2, Math.ceil(value.length / 48)))}
          className="cms-field resize-y"
        />
      ) : (
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} className="cms-field" />
      )}
    </div>
  );
}

function NumberField({ value, onChange, name }: Props & { value: number }) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{humanize(name)}</Label>
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
        className="cms-field"
      />
    </div>
  );
}

export function Switch({ checked, onChange, label, help }: { checked: boolean; onChange: (v: boolean) => void; label: string; help?: string }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line px-3.5 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {help && <span className="block text-xs text-muted">{help}</span>}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        />
        <span className="h-6 w-11 rounded-full border border-line bg-surface transition-colors peer-checked:border-transparent peer-checked:bg-lime peer-focus-visible:ring-2 peer-focus-visible:ring-ink" />
        <span className="pointer-events-none absolute left-1 top-1 h-4 w-4 rounded-full bg-ink transition-transform peer-checked:translate-x-5 peer-checked:bg-on-lime" />
      </span>
    </label>
  );
}

function BoolField({ value, onChange, name }: Props & { value: boolean }) {
  return <Switch checked={value} onChange={onChange} label={humanize(name)} />;
}

function ImageField({ value, onChange, name, canUpload }: Props & { value: string }) {
  const id = useId();
  const file = useRef<HTMLInputElement>(null);
  const [busy, start] = useTransition();
  const [broken, setBroken] = useState(false);

  const upload = (f: File) => {
    const form = new FormData();
    form.append("file", f);
    start(async () => {
      const res = await uploadContentImage(form);
      if (res.ok && res.src) {
        setBroken(false);
        onChange(res.src);
        toast.success("Image uploaded. Save the section to publish it.");
      } else toast.error(res.message);
    });
  };

  return (
    <div>
      <Label htmlFor={id}>{humanize(name)}</Label>
      <div className="flex gap-3">
        <div className="grid h-20 w-16 shrink-0 place-items-center overflow-clip rounded-lg border border-line bg-surface">
          {value && !broken ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" onError={() => setBroken(true)} />
          ) : (
            <span className="px-1 text-center text-[0.65rem] text-muted">{value ? "Can't load" : "No image"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            id={id}
            type="text"
            inputMode="url"
            value={value}
            placeholder="/image.webp or https://"
            onChange={(e) => {
              setBroken(false);
              onChange(e.target.value);
            }}
            className="cms-field"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!canUpload || busy}
              onClick={() => file.current?.click()}
              className="cms-btn"
              title={canUpload ? undefined : "Connect Supabase to upload images"}
            >
              {busy ? "Uploading" : "Upload image"}
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="cms-btn">
                Remove
              </button>
            )}
          </div>
          <input
            ref={file}
            type="file"
            accept={name === "favicon" ? "image/png,image/x-icon,image/vnd.microsoft.icon,image/webp" : "image/webp,image/png,image/jpeg,image/gif,image/avif"}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

function newItem(path: string) {
  const base = defaultAt(path);
  const item = itemTemplate(path, Array.isArray(base) ? base : []);
  if (isPlainObject(item) && "id" in item) item.id = `item-${Math.random().toString(36).slice(2, 8)}`;
  return item;
}

function ListField(props: Props & { value: unknown[] }) {
  const { value, onChange, name, path, fixed } = props;
  const locked = fixed?.includes(path) ?? false;
  const [open, setOpen] = useState<number | null>(null);
  const objects = value.some((v) => isPlainObject(v)) || isPlainObject(newItemShape(path));

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    if (open === i) setOpen(j);
  };
  const remove = (i: number) => {
    onChange(value.filter((_, k) => k !== i));
    setOpen(null);
  };
  const add = () => {
    onChange([...value, newItem(path)]);
    setOpen(value.length);
  };

  const controls = (i: number) => (
    <span className="flex shrink-0 items-center gap-0.5">
      <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
        ↑
      </IconBtn>
      <IconBtn label="Move down" disabled={i === value.length - 1} onClick={() => move(i, 1)}>
        ↓
      </IconBtn>
      {!locked && (
        <IconBtn label="Remove" onClick={() => remove(i)} danger>
          ×
        </IconBtn>
      )}
    </span>
  );

  return (
    <div>
      {!objects && <p className="mb-1.5 text-sm font-medium">{humanize(name)}</p>}
      {value.length === 0 && <p className="mb-2 rounded-xl border border-dashed border-line px-3 py-4 text-center text-sm text-muted">Nothing here yet.</p>}
      <ul className="space-y-2">
        {value.map((item, i) =>
          objects ? (
            <li key={i} className="overflow-clip rounded-xl border border-line bg-bg">
              <div className="flex items-center gap-2 pr-1.5">
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2.5 text-left text-sm"
                >
                  <span className={`text-muted transition-transform ${open === i ? "rotate-90" : ""}`} aria-hidden="true">
                    ›
                  </span>
                  <span className="truncate font-medium">{summary(item) || `Item ${i + 1}`}</span>
                </button>
                {controls(i)}
              </div>
              {open === i && (
                <div className="border-t border-line p-3.5">
                  <FieldEditor
                    {...props}
                    value={item}
                    name={name}
                    onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))}
                  />
                </div>
              )}
            </li>
          ) : (
            <li key={i} className="flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                <ListText
                  value={String(item ?? "")}
                  long={LONG.has(name) || String(item ?? "").length > 70}
                  label={`${humanize(name)} ${i + 1}`}
                  onChange={(v) => onChange(value.map((x, k) => (k === i ? v : x)))}
                />
              </div>
              <span className="pt-1">{controls(i)}</span>
            </li>
          ),
        )}
      </ul>
      {!locked && (
        <button type="button" onClick={add} className="cms-btn mt-2.5">
          + Add {objects ? "item" : "line"}
        </button>
      )}
    </div>
  );
}

function newItemShape(path: string) {
  const base = defaultAt(path);
  return itemTemplate(path, Array.isArray(base) ? base : []);
}

function ListText({ value, onChange, long, label }: { value: string; onChange: (v: string) => void; long: boolean; label: string }) {
  return long ? (
    <textarea aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="cms-field resize-y" />
  ) : (
    <input aria-label={label} type="text" value={value} onChange={(e) => onChange(e.target.value)} className="cms-field" />
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg text-base leading-none transition-colors hover:bg-surface disabled:opacity-30 ${danger ? "text-danger" : "text-muted hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

/** A short title for a collapsed list item: its first non-empty text. */
function summary(item: unknown): string {
  if (typeof item === "string") return item;
  if (!isPlainObject(item)) return "";
  for (const k of ["title", "label", "name", "q", "code", "quote", "text"]) {
    const v = item[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  const first = Object.entries(item).find(([k, v]) => k !== "id" && typeof v === "string" && v.trim());
  return first ? String(first[1]) : "";
}
