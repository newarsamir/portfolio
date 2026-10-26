"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";
import { useSite } from "../cms/SiteProvider";
import { ArrowSwap, RollText } from "../RollText";

/** The 404 as a hard bounce: a Mail Delivery Subsystem email with an SMTP log. */
export default function Bounce404() {
  const site = useSite();
  const copy = site.notFound;
  const b = copy.bounce;
  const quips = copy.quips.filter((q) => q.trim() !== "");
  const [quip, setQuip] = useState(0);
  // Filled in after mount so the server and browser markup match.
  const [where, setWhere] = useState({ host: "", path: "", date: "" });
  const [retrying, setRetrying] = useState(false);
  const [attempts, setAttempts] = useState(1);

  useEffect(() => {
    setWhere({
      host: window.location.host,
      path: window.location.pathname,
      date: new Date().toUTCString().replace("GMT", "+0000"),
    });
    const id = window.setInterval(() => setQuip((q) => q + 1), 5200);
    return () => window.clearInterval(id);
  }, []);

  const retry = () => {
    if (retrying) return;
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setAttempts((n) => n + 1);
      toast.error(b.retried, b.subject);
    }, 1100);
  };

  const recipient = `${where.host}${where.path}`;
  const log = [
    `Reporting-MTA: dns; mx.${where.host || "localhost"}`,
    `Final-Recipient: rfc822; ${recipient}`,
    "Action: failed",
    "Status: 5.1.1",
    `Diagnostic-Code: smtp; 550 5.1.1 <${where.path}>: Recipient page does not exist`,
    `Attempts: ${attempts}`,
    `Last-Attempt-Date: ${where.date}`,
  ];

  return (
    <main className="nfb">
      <div className="nfb-window">
        <div className="nfb-bar">
          <Link href="/" className="nfb-icon" aria-label={copy.primary} title={copy.primary}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </Link>
          <span className="nfb-bar-sep" />
          <span className="nfb-crumb mono">{copy.eyebrow}</span>
          <span className="nfb-bar-count mono">1 of 1</span>
        </div>

        <div className="nfb-head">
          <h1 className="nfb-subject">
            {b.subject}
            <span className="nfb-tag">Bounced</span>
          </h1>
          <div className="nfb-from">
            <span className="nfb-avatar" aria-hidden="true">
              M
            </span>
            <div className="min-w-0">
              <p className="nfb-sender">
                <strong>{b.from}</strong> <span>&lt;mailer-daemon@{where.host || "localhost"}&gt;</span>
              </p>
              <p className="nfb-to">to you</p>
            </div>
            <span className="nfb-time mono">now</span>
          </div>
        </div>

        <div className="nfb-body">
          <div className="nfb-alert">
            <svg className="nfb-alert-icon" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
              <circle cx="20" cy="20" r="18" />
              <path d="M20 11v11" />
              <circle cx="20" cy="28" r="1.6" className="nfb-dot" />
            </svg>
            <div className="min-w-0">
              <h2 className="nfb-alert-title">{b.heading}</h2>
              <p className="nfb-intro">{b.intro}</p>
              <p className="nfb-recipient mono" title={recipient}>
                {copy.undeliverable}: <strong>{where.path || "…"}</strong>
              </p>
              <p key={quip} className="nfb-quip blur-swap" aria-live="polite">
                {quips.length ? quips[quip % quips.length] : copy.headline}
              </p>
              <div className="nfb-actions">
                <Link href="/" className="btn btn-lime">
                  <RollText text={copy.primary} />
                  <ArrowSwap />
                </Link>
                <Link href="/work" className="btn btn-ghost">
                  <RollText text={copy.secondary} />
                </Link>
                <button type="button" className="nfb-retry mono" onClick={retry} aria-busy={retrying} disabled={retrying}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    aria-hidden="true"
                  >
                    <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
                  </svg>
                  {b.retry}
                </button>
              </div>
            </div>
          </div>

          <section className="nfb-log" aria-label={b.details}>
            <h3 className="mono">{b.details}</h3>
            <div className="nfb-pre mono">
              {log.map((line, i) => (
                <span key={`${i}-${attempts}`} className="nfb-line" style={{ animationDelay: `${0.35 + i * 0.11}s` }}>
                  {line}
                </span>
              ))}
            </div>
          </section>

          <section className="nfb-original" aria-label={b.original}>
            <p className="mono nfb-rule">---------- {b.original} ----------</p>
            <dl className="mono">
              <dt>From:</dt>
              <dd>You &lt;you@your-browser&gt;</dd>
              <dt>To:</dt>
              <dd className="truncate">{recipient || "…"}</dd>
              <dt>Subject:</dt>
              <dd className="truncate">GET {where.path || "/"}</dd>
            </dl>
            <p className="nfb-original-body">{copy.headline}</p>
          </section>

          <button type="button" onClick={() => toast.info(copy.blameBody, copy.blameTitle)} className="nfb-blame mono">
            {copy.blame}
          </button>
        </div>
      </div>
    </main>
  );
}
