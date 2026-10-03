/**
 * Every editable word, number and showcase item on the site lives here.
 * Search this file for "TODO" to find what still needs real content.
 * The full checklist is in TODO.md.
 */

export type Counter = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  /** The joke counter gets the lime treatment. */
  joke?: boolean;
};

export type ShowcaseItem = {
  src: string;
  width: number;
  height: number;
  brand: string;
  type: string;
  note: string;
};

export type Testimonial = { quote: string; name: string; role: string };

export type CaseMetric = { value: string; label: string };

/**
 * A case study. The ones below are the defaults; once Supabase is connected
 * they are created, edited and deleted from /admin instead.
 */
export type CaseStudy = {
  slug: string;
  title: string;
  client: string;
  industry: string;
  year: string;
  services: string[];
  summary: string;
  cover: string;
  challenge: string;
  approach: string;
  outcome: string;
  metrics: CaseMetric[];
  gallery: string[];
  published: boolean;
};

export const site = {
  name: "Samir Shrestha",
  title: "Email Designer (Figma)",
  // TODO: your real inbox. It is shown on the site and used by the copy button.
  email: "your@email.com",
  // TODO: confirm your location.
  location: "Kathmandu, Nepal",

  seo: {
    title: "Samir Shrestha, email designer for ecommerce and DTC brands",
    description:
      "I design email flows and campaigns in Figma for ecommerce and DTC brands. Welcome flows, abandoned cart, post-purchase and templates, handed off ready to build.",
  },

  // TODO: replace each "#" with your real profile link. Empty or "#" links are hidden.
  socials: [
    { label: "LinkedIn", href: "#" },
    { label: "Dribbble", href: "#" },
    { label: "Behance", href: "#" },
    { label: "Instagram", href: "#" },
  ],

  nav: [
    { id: "home", label: "Home" },
    { id: "work", label: "Work" },
    { id: "cases", label: "Case studies" },
    { id: "about", label: "About" },
    { id: "process", label: "Process" },
    { id: "contact", label: "Contact" },
  ],

  /**
   * Defaults. The "available for work" switch, the hero video URL and the
   * counter values can all be changed from /admin without a redeploy.
   */
  defaults: {
    availableForWork: true,
    // TODO: your showreel. A direct .mp4, a YouTube link or a Vimeo link all work.
    heroVideoUrl: "/hero/reel-placeholder.mp4",
    heroPoster: "/hero/poster-placeholder.webp",
  },

  hero: {
    eyebrow: "Email design for ecommerce and DTC brands",
    headline: "I design the emails your subscribers open, read and click.",
    sub: "Welcome flows, campaigns, abandoned cart and post-purchase emails, designed in Figma and handed off ready to build in Klaviyo or Mailchimp.",
    primary: "See my work",
    secondary: "Hire me",
  },

  // Only real tools and clients go here. TODO: add client names you may show.
  brandStrip: {
    label: "Where my emails are designed and sent from",
    items: ["Figma", "Klaviyo", "Mailchimp", "Shopify"],
  },

  counters: {
    heading: "A few numbers from the inbox.",
    /**
     * TODO: these are sample values. Replace them here or in /admin, then set
     * `placeholder` to false to remove the "sample numbers" note on the site.
     */
    placeholder: true,
    items: [
      { id: "emails", label: "Emails designed", value: 100, suffix: "+" },
      { id: "brands", label: "Brands worked with", value: 10, suffix: "+" },
      { id: "years", label: "Years designing email", value: 3 },
      { id: "outlook", label: "Outlook rendering bugs survived", value: 404, joke: true },
    ] as Counter[],
  },

  showcase: {
    heading: "Selected emails. Scroll to spin them.",
    sub: "Click any email to read it top to bottom. Unlike most subscribers, you'll make it to the footer.",
    /**
     * TODO: export each email from Figma as a tall WebP (600 to 1200px wide)
     * into /public/emails, then update brand, type, note, width and height.
     * Until then these are clearly labelled placeholders.
     */
    items: [
      {
        src: "/emails/email-01.webp",
        width: 900,
        height: 2991,
        brand: "Placeholder 01",
        type: "Welcome flow, email 1",
        note: "One promise, one button. The discount code sits above the fold so nobody has to hunt for it.",
      },
      {
        src: "/emails/email-02.webp",
        width: 900,
        height: 3108,
        brand: "Placeholder 02",
        type: "Product launch campaign",
        note: "The product photo does the talking. Copy stays under 40 words until the second scroll.",
      },
      {
        src: "/emails/email-03.webp",
        width: 900,
        height: 2463,
        brand: "Placeholder 03",
        type: "Abandoned cart, email 1",
        note: "Shows the exact item left behind, with the checkout button repeated after the reviews.",
      },
      {
        src: "/emails/email-04.webp",
        width: 900,
        height: 2687,
        brand: "Placeholder 04",
        type: "Post-purchase, how to use",
        note: "Three steps, numbered, each with a photo. Fewer support tickets is the whole point.",
      },
      {
        src: "/emails/email-05.webp",
        width: 900,
        height: 2561,
        brand: "Placeholder 05",
        type: "Seasonal sale campaign",
        note: "Big type instead of a hero image, so the offer survives with images turned off.",
      },
      {
        src: "/emails/email-06.webp",
        width: 900,
        height: 2250,
        brand: "Placeholder 06",
        type: "Winback flow, email 2",
        note: "Plain and personal on purpose. It reads like a note, then earns the offer at the end.",
      },
      {
        src: "/emails/email-07.webp",
        width: 900,
        height: 2724,
        brand: "Placeholder 07",
        type: "Review request",
        note: "The star rating is the call to action. One tap and the review is already half written.",
      },
      {
        src: "/emails/email-08.webp",
        width: 900,
        height: 2471,
        brand: "Placeholder 08",
        type: "Master template system",
        note: "Twelve modules the team can stack in any order without breaking the layout.",
      },
    ] as ShowcaseItem[],
  },

  caseStudies: {
    heading: "The thinking behind the inbox.",
    sub: "A few projects from brief to send, with the problem, the decisions and what changed after.",
    /**
     * TODO: these are sample case studies so the layout has something to show.
     * Replace them here, or connect Supabase and manage them in /admin.
     * Metrics marked as samples must be swapped for real numbers before launch.
     */
    items: [
      {
        slug: "welcome-flow-rebuild",
        title: "A welcome flow that sells the second product, not just the first",
        client: "Placeholder brand A",
        industry: "Skincare, DTC",
        year: "2025",
        services: ["Welcome flow", "Template system", "Handoff"],
        summary:
          "Five emails rebuilt as one story: who the brand is, why it works, and what to buy first. Designed mobile first, checked in dark mode.",
        cover: "/emails/email-01.webp",
        challenge:
          "The old welcome series was a single discount email followed by four newsletters nobody asked for. New subscribers used the code, then went quiet.",
        approach:
          "I mapped the flow as a story before opening Figma: a promise, proof, a routine, a bestseller and a gentle last call. Each email has one job and one button. The discount moved above the fold of email one, and every later email links to a product that pairs with the first purchase.",
        outcome:
          "The team got five designed emails, a modular template they can reuse, and a build guide for Klaviyo. Swap these sample numbers for the real ones once the flow has run for a month.",
        metrics: [
          { value: "5", label: "Emails in the flow" },
          { value: "12", label: "Reusable modules" },
          { value: "2", label: "Revision rounds used" },
        ],
        gallery: ["/emails/email-01.webp", "/emails/email-02.webp", "/emails/email-07.webp"],
        published: true,
      },
      {
        slug: "abandoned-cart-sequence",
        title: "Abandoned cart emails that show the cart, not a stock photo",
        client: "Placeholder brand B",
        industry: "Home goods, Shopify",
        year: "2025",
        services: ["Abandoned cart", "Product blocks"],
        summary:
          "A three-email reminder sequence built around the exact item left behind, with reviews doing the persuading.",
        cover: "/emails/email-03.webp",
        challenge:
          "The existing reminder was a generic 'You forgot something!' banner with no product in sight, and it rendered as a grey box in Outlook.",
        approach:
          "Dynamic product blocks sit at the top of every email, set in live text so they survive images being off. Email two adds reviews, email three repeats the checkout button after a short FAQ that answers shipping and returns.",
        outcome:
          "A sequence that reads well with images off, a product block the team can reuse in campaigns, and annotated specs for the developer.",
        metrics: [
          { value: "3", label: "Emails in the sequence" },
          { value: "44px", label: "Minimum button height" },
          { value: "0", label: "Stock photos used" },
        ],
        gallery: ["/emails/email-03.webp", "/emails/email-04.webp", "/emails/email-06.webp"],
        published: true,
      },
      {
        slug: "master-template-system",
        title: "A master template the whole team can stack without breaking",
        client: "Placeholder brand C",
        industry: "Apparel, DTC",
        year: "2024",
        services: ["Template system", "Campaigns", "Documentation"],
        summary:
          "Twelve modules, one Figma library and a one-page rulebook, so campaigns go out on brand without a designer in the loop.",
        cover: "/emails/email-08.webp",
        challenge:
          "Every campaign was designed from scratch, so no two emails looked like they came from the same brand and the calendar kept slipping.",
        approach:
          "I audited forty past sends, kept the patterns that worked and turned them into twelve modules with variants for light and dark backgrounds. Each module has spacing rules baked in, so they stack in any order.",
        outcome:
          "The team now builds campaigns from the library in an afternoon. The rulebook covers type sizes, button styles and image ratios.",
        metrics: [
          { value: "12", label: "Modules" },
          { value: "40", label: "Past sends audited" },
          { value: "1", label: "Page of rules" },
        ],
        gallery: ["/emails/email-08.webp", "/emails/email-05.webp", "/emails/email-02.webp"],
        published: true,
      },
    ] as CaseStudy[],
  },

  about: {
    heading: "One designer who only does email.",
    // TODO: rewrite in your own words. Keep it first person.
    story: [
      "I'm Samir, a freelance email designer. I work with ecommerce and DTC brands whose product is better than the emails that sell it.",
      "Email is all I design: welcome flows, campaigns, abandoned cart and post-purchase emails, plus the templates that keep them consistent. I design mobile first, because that's where most subscribers open, and I check dark mode before you have to ask.",
      "When you hire me you talk to me. I read the brief, I design every email myself, and I answer when a subject line or a button needs to change.",
    ],
    // TODO: add /public/portrait.webp and set portrait to "/portrait.webp".
    portrait: "" as string,
    portraitAlt: "Portrait of Samir Shrestha",
    toolsHeading: "What I work in",
    tools: [
      { name: "Figma", use: "Where every email is designed" },
      { name: "Klaviyo", use: "Flows, segments and campaign structure" },
      { name: "Mailchimp", use: "Campaigns and templates" },
      { name: "Shopify", use: "Product feeds and store branding" },
    ],
  },

  anatomy: {
    heading: "Seven places an email wins or loses the click.",
    sub: "I check every email against these, top to bottom, because that is the order your subscriber meets them.",
    parts: [
      {
        id: "subject",
        title: "Subject line and preheader",
        body: "Designed as a pair. The preheader finishes the thought the subject line starts, instead of saying 'View in browser'.",
      },
      {
        id: "header",
        title: "Header",
        body: "The logo, and nothing fighting it. Navigation links only when they earn clicks.",
      },
      {
        id: "hero",
        title: "Hero",
        body: "One message, readable in two seconds, set in live text so it survives images being turned off.",
      },
      {
        id: "copy",
        title: "Body copy",
        body: "Short lines at 16px or larger, written for a thumb that is scrolling fast.",
      },
      {
        id: "cta",
        title: "Call to action",
        body: "One primary button, at least 44px tall, repeated after any long section.",
      },
      {
        id: "products",
        title: "Product block",
        body: "Real products with names and prices, two across on desktop and stacked on mobile.",
      },
      {
        id: "footer",
        title: "Footer",
        body: "An unsubscribe link that is easy to find. Hiding it only earns spam complaints.",
      },
    ],
  },

  process: {
    heading: "From brief to send-ready",
    steps: [
      {
        title: "Brief",
        body: "You tell me the goal, the segment and the offer. I ask the questions that save three rounds of revisions later.",
        detail: "A short call or a filled-in doc. Either works.",
      },
      {
        title: "Wireframe",
        body: "Grey boxes first. You approve the order of the message and where the button sits before anyone argues about colors.",
        detail: "One round of feedback on structure.",
      },
      {
        title: "Design in Figma",
        body: "Your brand, real copy, real product shots. I design mobile and desktop, light and dark mode, so nothing surprises you in the inbox.",
        detail: "Two rounds of revisions included.",
      },
      {
        title: "Handoff",
        body: "Exported images, alt text, link notes and a build guide for every email. Whoever sets it up in Klaviyo will not need to message me at midnight.",
        detail: "Ready to build in Klaviyo or Mailchimp.",
      },
    ],
  },

  services: {
    heading: "Emails you can hire me for",
    sub: "Pick one, or stack them into a full lifecycle. No 'Dear Valued Customer' is involved at any stage.",
    items: [
      {
        id: "welcome",
        title: "Welcome flows",
        body: "The first three to five emails a new subscriber gets. I design them as one story: who you are, why you're worth it, and what to buy first.",
        tag: "3 to 5 emails",
        when: "Sends when someone subscribes",
        image: "/emails/email-01.webp",
      },
      {
        id: "campaigns",
        title: "Campaigns",
        body: "Launches, sales and newsletters, designed one at a time or as a monthly batch.",
        tag: "One-off or monthly",
        when: "Sends on your calendar",
        image: "/emails/email-05.webp",
      },
      {
        id: "cart",
        title: "Abandoned cart",
        body: "A reminder, a reason and a nudge, each with the product they left front and center.",
        tag: "2 to 3 emails",
        when: "Sends when a cart is left behind",
        image: "/emails/email-03.webp",
      },
      {
        id: "post",
        title: "Post-purchase",
        body: "Order follow-ups, how-to-use guides and review requests that turn one order into the next.",
        tag: "3 to 4 emails",
        when: "Sends after an order",
        image: "/emails/email-04.webp",
      },
      {
        id: "templates",
        title: "Templates",
        body: "A modular master template, so your team can put together on-brand emails without starting from zero.",
        tag: "Reusable modules",
        when: "Used by every send",
        image: "/emails/email-08.webp",
      },
    ],
  },

  // Real ones only. While this array is empty the section is not rendered.
  // TODO: add testimonials as { quote, name, role }.
  testimonials: [] as Testimonial[],

  faq: {
    heading: "Questions I get, answered honestly",
    items: [
      {
        q: "Do you build the emails too, or only design them?",
        a: "I design in Figma and hand off a file that's ready to build: named layers, exported assets and notes for every module. If you need someone to code or set it up in Klaviyo, tell me and I'll say plainly whether I can help or who can.",
      },
      {
        q: "Will it look right in Outlook?",
        a: "I design with Outlook's limits in mind: safe fonts with fallbacks, layouts that hold up without background images, and buttons that are real buttons. Outlook will still find a way to surprise everyone, but it will be a small surprise.",
      },
      {
        q: "How long does a project take?",
        a: "A single campaign usually takes a few days. A full flow takes one to two weeks, depending on how quickly feedback comes back. If your sale starts tomorrow, last week was the time to message me, but message me anyway.",
      },
      {
        q: "What do you need from me to start?",
        a: "Brand assets (logo, fonts, colors), product photos, and the copy or at least the key points. If the copy isn't ready, I'll design with realistic draft text and mark it clearly, never lorem ipsum.",
      },
      {
        q: "How many revisions are included?",
        a: "One round on the wireframe and two on the design. That's enough for almost every project, because the structure is approved before the pretty part starts.",
      },
      {
        q: "Can you redesign the emails I already have?",
        a: "Yes. Send me your worst one. I'll tell you what I'd change and why, and you can decide whether it's worth a project.",
      },
    ],
  },

  finalCta: {
    eyebrow: "Got an inbox to fix?",
    headline: "Your next email deserves better than a stock photo and a prayer.",
    badge: "Available for new projects • Hire me • ",
    marquee: ["Welcome flows", "Campaigns", "Abandoned cart", "Post-purchase", "Templates"],
    button: "Hire me for your next flow",
    mini: "Or copy my address and write whenever you're ready.",
  },

  contact: {
    headline: "Send me your worst email. I've seen worse.",
    sub: "Tell me about the brand and what you need. I reply within two working days, and never with 'per my last email'.",
    projectTypes: [
      "Welcome flow",
      "Campaigns",
      "Abandoned cart",
      "Post-purchase",
      "Templates",
      "Full lifecycle",
      "Not sure yet",
    ],
    // TODO: set budget ranges that match your pricing.
    budgets: ["Under $500", "$500 to $1,500", "$1,500 to $3,000", "$3,000+", "Let's talk"],
    success: {
      title: "Inquiry sent.",
      body: "It's in my inbox, and I do open my emails. You'll hear from me within two working days.",
    },
  },

  footer: {
    /** IANA time zone for the live clock in the footer and the dock. */
    timeZone: "Asia/Kathmandu",
    cta: "Let's make your emails the ones people wait for.",
    joke: "You scrolled all the way to the footer. I hope your subscribers are this loyal.",
  },
} as const;

export type Site = typeof site;
