# Samir Shrestha, email designer: portfolio

Personal portfolio for a freelance email designer. Next.js (App Router), TypeScript, Tailwind CSS v4, GSAP + ScrollTrigger, Lenis, React Three Fiber and Supabase.

## Design direction

- **Concept:** the inbox as a stage. One designer, big confident type, and the emails themselves as the only decoration.
- **Fonts:** Bricolage Grotesque (display, weight 600, near-normal width and open tracking), Geist (body), Geist Mono (labels and numbers). All self-hosted through Fontsource, so there is no request to Google.
- **Signature moment:** the hero video grows from 20% to 80% of the viewport as you scroll and starts playing when it lands, then the work section spins a 3D arc of emails.
- **Glass:** only the dock. Everything else is solid. A lime light orbits the dock's edge, a puck slides under the active icon, the first icon is a back-to-top button with a scroll-progress ring, and a live local-time chip sits next to the "Hire me" pill.
- **Motion vocabulary:** button labels roll letter by letter and their hover fill grows from wherever the pointer enters; arrows fly out and come back; section labels decode from random glyphs; a hairline at the top tracks scroll progress; the final CTA has a spinning text badge, a cursor spotlight and a marquee that reacts to scroll speed; the footer name rises letter by letter and fits the page width.
- **Grid:** a fixed 80px hairline grid sits behind every page (`--grid` and `--grid-size` in `app/globals.css`). Section dividers carry small registration marks.

### Color tokens

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | `oklch(98% 0.015 95)` | `oklch(17% 0.01 80)` | Page background |
| `--surface` | `oklch(95.6% 0.02 95)` | `oklch(21% 0.012 80)` | Panels, process band |
| `--raised` | `oklch(99.4% 0.008 95)` | `oklch(24.5% 0.014 80)` | Inputs, cards on a surface |
| `--ink` | `oklch(21% 0.012 80)` | `oklch(95% 0.02 95)` | Text |
| `--muted` | `oklch(45% 0.015 80)` | `oklch(73% 0.02 90)` | Secondary text (above 4.5:1) |
| `--line` | `oklch(87% 0.02 95)` | `oklch(31% 0.014 80)` | Borders |
| `--lime` | `oklch(88% 0.22 125)` | same | Fills, highlights, primary button |
| `--on-lime` | `oklch(22% 0.05 125)` | same | Text on lime |
| `--accent-fg` | ink | lime | Thin accents that sit on the page background |

Lime is never used as text on cream. In light mode `--accent-fg` falls back to ink for that reason. The theme follows the system (`prefers-color-scheme`); there is no toggle.

## Run it locally

```bash
npm install
cp .env.example .env.local   # fill in the values, see below
npm run dev                  # http://localhost:3000
```

The site runs without Supabase too. It then uses the defaults from `content/site.ts`, the contact form tells visitors to email you instead, and `/admin` explains what is missing.

## Set up Supabase (5 minutes)

1. Create a project at supabase.com.
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, run it. It creates `contacts`, `settings`, `showcase_items`, `case_studies` and `login_attempts` plus the `showcase` storage bucket, and turns on row level security with no public policies.
3. Open **Project Settings, API**. Copy the project URL into `SUPABASE_URL` and the secret key (`sb_secret_...`, or the legacy `service_role` key) into `SUPABASE_SERVICE_ROLE_KEY`.

The secret key is only read in server code (`lib/supabase.ts` is marked `server-only`). It is never sent to the browser.

## Deploy to Vercel

1. Push this repository to GitHub.
2. On vercel.com choose **Add New, Project** and import the repository. The framework is detected as Next.js. Keep the default build settings.
3. Under **Environment Variables** add everything from `.env.example`:

   | Name | Value |
   | --- | --- |
   | `SUPABASE_URL` | your project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | your secret key |
   | `ADMIN_PASSWORD` | a long password for `/admin` |
   | `ADMIN_SESSION_SECRET` | output of `openssl rand -hex 32` |
   | `NEXT_PUBLIC_SITE_URL` | `https://your-domain.com` |

4. Deploy. After adding or changing a variable, redeploy for it to take effect.

## Change the content

Everything you can read on the site is in **`content/site.ts`**: name, email, socials, hero copy, counters, showcase items, about, process, services, FAQ, contact options and footer. `TODO.md` lists what still needs your real content.

### Swap the emails

**From `/admin` (recommended):** open **Showcase**, then **Add an email**. Drop in a tall WebP, PNG or JPEG export (up to 4 MB) or paste a link; the size is read automatically. You can edit, hide, reorder and delete emails, and change the section heading, without a redeploy. Uploads go to the public `showcase` bucket in Supabase Storage, which `supabase/schema.sql` creates. Until you add the first email the site shows the placeholders below.

**In code:**

1. Export each email from Figma as WebP, 600 to 1200px wide, full height.
2. Save them in `public/emails/` as `email-01.webp` to `email-08.webp` (replace the placeholders).
3. In `content/site.ts`, update each item under `showcase.items`: `brand`, `type`, `note`, and the real pixel `width` and `height` of the file.

Add or remove items freely. The 3D arc, the carousel and the lightbox all follow the array.

### Swap the hero video

- **Without a redeploy:** sign in at `/admin`, open **Settings**, paste a direct `.mp4` link, a YouTube link or a Vimeo link, check the preview, save.
- **In code:** set `defaults.heroVideoUrl` in `content/site.ts`. For a local file, put it in `public/hero/` and use a path such as `/hero/reel.mp4`.
- The image shown before the video plays is `defaults.heroPoster` (`public/hero/poster-placeholder.webp`). Replace it with a 1280x720 frame of your video. YouTube links use the YouTube thumbnail.

### Add your portrait

Save a 4:5 image as `public/portrait.webp` and set `about.portrait` to `"/portrait.webp"`.

### Case studies

With Supabase connected, manage them in `/admin` under **Case studies**: create, edit, publish or unpublish, reorder and delete. Each one gets a page at `/work/<slug>`, a card in the stacked section on the home page and a row on `/work`. On a fresh table, **Import the samples** copies the three examples from `content/site.ts` in as drafts.

Without Supabase, the samples in `site.caseStudies.items` are shown and the admin tab is read-only. Images are site paths (`/emails/email-01.webp`) or https links.

### Testimonials

The section is hidden while `testimonials` in `content/site.ts` is empty. Add real ones and it appears.

## Admin panel

`/admin` is protected by `ADMIN_PASSWORD`. Signing in sets a signed, httpOnly cookie that lasts 7 days and is only sent to `/admin`. Five wrong passwords from one IP lock sign-in for 15 minutes.

- **Contacts:** newest first, search, read and unread, delete, CSV export.
- **Showcase:** upload or link emails, automatic image size, edit, hide, reorder, delete, and the section heading.
- **Case studies:** full create, read, update and delete, with a live card preview, publish/draft, and up/down ordering.
- Errors and confirmations appear as pop-ups in the corner (bottom on phones).
- **Settings:** hero video URL with live preview, the "available for work" switch that drives the nav badge, and the counter values.

Saving settings rebuilds the public pages straight away.

## Project structure

```
app/
  layout.tsx              fonts, metadata, theme color
  globals.css             tokens for both themes, component styles
  opengraph-image.tsx     generated Open Graph image
  robots.ts, sitemap.ts
  (site)/
    layout.tsx            nav, footer, smooth scroll, cursor
    template.tsx          page transition
    page.tsx              home page, JSON-LD Person schema
    work/
      page.tsx            case study index with a pointer-following preview
      [slug]/page.tsx     case study page
    contact/
      page.tsx
      actions.ts          server action that saves to Supabase
  admin/
    page.tsx              login or panel
    actions.ts            login, logout, read, delete, save settings
    export/route.ts       CSV export
components/
  Nav.tsx                 top bar that morphs into the dock
  Hero.tsx, HeroVideo.tsx pinned hero and the video player
  Showcase.tsx            picks 3D or carousel, owns the lightbox
  ShowcaseCanvas.tsx      React Three Fiber arc (loaded lazily)
  ShowcaseCarousel.tsx    CSS 3D fallback
  Lightbox.tsx
  CaseStudies.tsx         stacked sticky case study cards
  WorkIndex.tsx, EmailScroll.tsx, CountUp.tsx
  RollText.tsx            rolling button labels and the arrow swap
  VelocityMarquee.tsx, Spotlight.tsx, Wordmark.tsx, LocalTime.tsx, BackToTop.tsx
  BrandStrip, Counters, About, Anatomy, Process, Services, Testimonials, Faq, FinalCta, Footer
  SectionRule.tsx         hairline divider with registration marks
  ContactForm.tsx, CopyEmail.tsx
  Reveal.tsx              split headings, staggered and mask reveals
  SmoothScroll.tsx        Lenis wired to ScrollTrigger
  Cursor.tsx, Magnetic.tsx, PageTransition.tsx, AnchorLink.tsx, icons.tsx
  admin/AdminPanel.tsx, admin/LoginForm.tsx, admin/CaseStudiesAdmin.tsx
content/site.ts           every editable word and number
lib/
  supabase.ts             server-only client
  settings.ts             settings merged over the defaults
  case-studies.ts         case studies from Supabase, or the defaults
  auth.ts                 password check and signed cookie
  rate-limit.ts           login and contact form limits
  video.ts                mp4, YouTube and Vimeo parsing
  gsap.ts, url.ts
public/emails/            showcase images
public/hero/              hero video and poster
supabase/schema.sql       tables and row level security
```

## Behavior notes

- **Reduced motion:** with `prefers-reduced-motion: reduce`, Lenis, pinning, the 3D arc, the custom cursor and the page curtain are all off. The hero video shows at full size with controls and does not autoplay, the showcase is the carousel, and the process steps are a plain list.
- **3D fallback:** phones, touch devices and browsers without WebGL get the CSS 3D snap carousel with the same lightbox.
- **Performance:** hero text is server-rendered and animated with CSS, so it paints before any script. three.js is a separate chunk that loads when the work section approaches. The video file is not requested until the player reaches full size.
- **Contact rate limit** is held in memory per server instance, which is enough to stop a casual flood. The admin login limit is stored in Supabase, so it holds across instances.
