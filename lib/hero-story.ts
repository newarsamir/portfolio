/**
 * Timing for the animated hero story. Generated from the narration audio
 * (public/hero/story/narration.mp3): each line's start and end in seconds.
 * If you re-record the narration, regenerate these numbers to match.
 */
export const STORY_DURATION = 45.9;

export type StoryLine = { id: string; text: string; start: number; end: number };

export const STORY_LINES: StoryLine[] = [
  { id: "intro1", text: "Picture a founder like her.", start: 0.5, end: 1.81 },
  { id: "intro2", text: "A product people love, and thousands of subscribers.", start: 3.0, end: 6.4 },
  { id: "intro3", text: "They open her emails. Almost nobody buys.", start: 6.9, end: 9.87 },
  { id: "why", text: "Here's why.", start: 10.3, end: 11.01 },
  { id: "p1", text: "A wall of text nobody reads.", start: 11.7, end: 13.67 },
  { id: "p2", text: "The offer, buried at the bottom.", start: 15.0, end: 16.88 },
  { id: "p3", text: "A button too small to tap.", start: 18.3, end: 19.97 },
  { id: "p4", text: "Built for desktop. Broken on phones.", start: 21.6, end: 24.28 },
  { id: "p5", text: "Images blocked. Logo gone in dark mode.", start: 25.0, end: 27.84 },
  { id: "p6", text: "And a cart reminder that forgets what they left.", start: 28.5, end: 30.68 },
  { id: "fix", text: "Fix the design, and the same list starts selling.", start: 31.9, end: 34.64 },
  { id: "flow", text: "Every welcome. Every cart. Every thank-you.", start: 35.2, end: 38.14 },
  { id: "me", text: "I'm Samir. I design emails that pay for themselves.", start: 38.6, end: 41.86 },
  { id: "ask", text: "Which of these is costing you?", start: 42.3, end: 43.52 },
];

/** Start time of a line by id, for scheduling the visuals. */
export const at = (id: string) => STORY_LINES.find((l) => l.id === id)?.start ?? 0;
