"use client";

import { usePathname } from "next/navigation";
import { createContext, useContext, type ReactNode } from "react";
import { type VariantId, variantForPath } from "@/lib/variants";
import AppleFooter from "./apple/AppleFooter";
import AppleNav from "./apple/AppleNav";
import { Editable } from "./cms/SiteProvider";
import Cursor from "./Cursor";
import Footer from "./Footer";
import Nav from "./Nav";
import FooterLight from "./v3/FooterLight";
import FooterX from "./x/FooterX";

const VariantContext = createContext<VariantId>("classic");
/** The design the current page is shown in. */
export const useVariant = () => useContext(VariantContext);

/**
 * Wraps every page in the chosen design: its nav, footer and theme. /v1,
 * /v2 and /v3 always show one design; every other page uses the one picked
 * in /admin (Settings).
 */
export default function VariantShell({ chosen, available, children }: { chosen: VariantId; available: boolean; children: ReactNode }) {
  const variant = variantForPath(usePathname() ?? "/", chosen);
  const footer = { classic: <Footer />, inbox: <FooterX />, postcard: <FooterLight />, apple: <AppleFooter /> }[variant];
  return (
    <VariantContext.Provider value={variant}>
      <div data-variant={variant} className="variant-root">
        <Editable id="nav">{variant === "apple" ? <AppleNav /> : <Nav available={available} />}</Editable>
        <main id="main">{children}</main>
        <Editable id="footer">{footer}</Editable>
        {variant !== "apple" && <Cursor />}
      </div>
    </VariantContext.Provider>
  );
}
