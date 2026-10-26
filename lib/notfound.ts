/** The 404 designs. Each visit to a missing page gets one of the enabled ones at random. */
export const NOT_FOUND_VARIANTS = [
  { id: "zero", label: "Zero conversions" },
  { id: "pen", label: "Editable vector" },
] as const;

export type NotFoundVariant = (typeof NOT_FOUND_VARIANTS)[number]["id"];

export const isNotFoundVariant = (v: unknown): v is NotFoundVariant => NOT_FOUND_VARIANTS.some((x) => x.id === v);

/** The designs switched on in /admin, in order. All of them if every switch is off. */
export function enabledNotFoundVariants(rotation: Partial<Record<string, boolean>> | undefined): NotFoundVariant[] {
  const on = NOT_FOUND_VARIANTS.map((v) => v.id).filter((id) => rotation?.[id] !== false);
  return on.length ? on : NOT_FOUND_VARIANTS.map((v) => v.id);
}

/**
 * Inline script for the static 404 page: before the first paint it picks this
 * visit's design and marks <html data-nf> with it. ?nf= forces one, and the
 * page editor's preview (?cms=1) always starts on the first design.
 */
export function notFoundPickScript(enabled: NotFoundVariant[]) {
  const all = JSON.stringify(NOT_FOUND_VARIANTS.map((v) => v.id));
  return `(function(){try{var e=${JSON.stringify(enabled)},a=${all},q=new URLSearchParams(location.search),n=q.get('nf');document.documentElement.dataset.nf=a.indexOf(n)>-1?n:q.get('cms')==='1'?e[0]:e[Math.floor(Math.random()*e.length)]}catch(_){}})();`;
}
