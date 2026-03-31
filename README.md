# Thumb Journey

Thumb Journey is a mobile-first React experience where users hold their thumb on-screen to enter an immersive audio state. Releasing the press exits the journey. Visuals, transcript beats, and motion are synchronized to speech playback.

## Highlights

- Press-and-hold interaction model designed for mobile.
- Audio-driven visual journey with beat-aware overlays.
- Progress persistence in `localStorage`.
- Multiple speeches with selectable post-completion replay.

## Tech Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- Motion (`motion/react`) for transitions and choreography

## Quick Start

### Prerequisites

- Node.js 20+ (recommended)
- npm

### Install and run

```bash
npm install
npm run dev
```

App runs on `http://localhost:3000`.

### Production build

```bash
npm run build
npm run preview
```

## Available Scripts

- `npm run dev` starts Vite dev server on port `3000`.
- `npm run build` creates production output in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs TypeScript type-checking (`tsc --noEmit`).
- `npm run transcribe:audio` generates transcript artifacts from audio.
- `npm run detect:spikes` runs transcript/audio spike detection helpers.
- `npm run clean` removes `dist/`.

## Environment Variables

Create `.env` only when using script tooling that calls external APIs:

```env
GEMINI_API_KEY=your_key_here
```

Template: [`.env.example`](/home/neo/Downloads/thumb-journey/.env.example)

## Interaction Model

- `Home`: user sees the hold prompt for the active speaker.
- `Journey`: while the thumb stays down, audio fades in and immersive visuals/transcript overlays run.
- `Release`: audio fades out and returns to home state.
- `Reward`: shown after a speech completes.
- `Selection`: available after completing all journeys.

## Project Structure

- [`src/`](/home/neo/Downloads/thumb-journey/src): app code.
- [`src/components/`](/home/neo/Downloads/thumb-journey/src/components): UI and experience screens.
- [`src/data/`](/home/neo/Downloads/thumb-journey/src/data): speeches and transcript beat metadata.
- [`public/audio/`](/home/neo/Downloads/thumb-journey/public/audio): speech audio assets.
- [`scripts/`](/home/neo/Downloads/thumb-journey/scripts): transcript/audio helper scripts.
- [`metadata.json`](/home/neo/Downloads/thumb-journey/metadata.json): brand/domain metadata source.

## Content Updates

To add or adjust a journey:

1. Add/update audio files under [`public/audio/`](/home/neo/Downloads/thumb-journey/public/audio).
2. Update speech metadata in [`src/data/speeches.ts`](/home/neo/Downloads/thumb-journey/src/data/speeches.ts).
3. Update transcript beat timing/content in [`src/data/transcriptBeats.ts`](/home/neo/Downloads/thumb-journey/src/data/transcriptBeats.ts).
4. Validate on mobile viewport and run `npm run build`.

## Metadata and SEO

Metadata is maintained in both:

- [`metadata.json`](/home/neo/Downloads/thumb-journey/metadata.json)
- [`index.html`](/home/neo/Downloads/thumb-journey/index.html)

Keep canonical URL, title, and `og:image` aligned when changing branding or deployment domains.
# Thumb-Journey
