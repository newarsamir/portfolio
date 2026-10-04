# What you still need to fill in

Everything is in `content/site.ts` unless noted. Search that file for `TODO`.

## Must do before sharing the link

- [ ] **Social links** (`socials`): LinkedIn, Dribbble, Behance, Instagram. Links left as `#` are hidden.
- [ ] **Location** (`location`). Set to Kathmandu, Nepal. Confirm or change it.
- [ ] **Re-run `supabase/schema.sql`** after pulling this update. It adds the `showcase_items` table and the `showcase` storage bucket, and is safe to run again.
- [ ] **Email designs**: upload them in `/admin` under Showcase, or replace `public/emails/email-01.webp` to `email-08.webp`, then update `brand`, `type`, `note`, `width` and `height` for each item in `showcase.items`.
- [x] **Hero video**: the narrated film is `public/hero/hero-video.mp4` with its poster. To change it later, use `/admin` or set `defaults.heroVideoUrl`.
- [ ] **Counters** (`counters.items`): the values are samples (100+, 10+, 3, 404). Put in real numbers here or in `/admin`. If you edit them in code, also set `counters.placeholder` to `false` to remove the "sample numbers" note. Saving them in `/admin` removes the note automatically.
- [ ] **Environment variables in Vercel**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`.
- [ ] **Run `supabase/schema.sql`** in the Supabase SQL editor.

- [ ] **Case studies** (`caseStudies.items`, or `/admin` once Supabase is connected): the three included are samples built on the placeholder emails. Replace the titles, story and especially the metrics with real ones, or unpublish them. Re-run `supabase/schema.sql` to create the `case_studies` table.

## Should do

- [ ] **About story** (`about.story`): rewrite in your own words. I kept it to what the brief said and invented no biography.
- [ ] **Budget ranges** (`contact.budgets`): they are in USD and are my guess at sensible brackets.
- [ ] **Process details** (`process.steps[].detail`): "two rounds on the design" also appears in the FAQ. Change both if your terms differ.
- [ ] **FAQ timelines** (`faq.items`): "a few days" for a campaign and "one to two weeks" for a flow, and the "two working days" reply time on the contact page.
- [ ] **Service sizes** (`services.items[].tag`): "3 to 5 emails" and so on.
- [ ] **Service samples** (`services.items[].image`): each row shows one of the showcase emails on hover. Point them at the emails that fit once the real ones are in.
- [ ] **Anatomy notes** (`anatomy.parts`, section hidden for now in `app/(site)/page.tsx`): seven short notes on how I approach each part of an email. Edit them to match how you actually work.
- [ ] **Brand strip**: add the brands you've worked with in `/admin` under Settings (one per line). The strip under the hero stays hidden until there's at least one.

## When you have them

- [ ] **Testimonials** (`testimonials`): the section stays hidden until this has at least one real entry.
- [ ] **Custom domain** in Vercel, then update `NEXT_PUBLIC_SITE_URL`.
