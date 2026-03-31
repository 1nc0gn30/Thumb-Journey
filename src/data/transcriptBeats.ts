import { BookOpen, Globe2, HeartHandshake, Lightbulb, Rocket, Skull, Sparkles, Waypoints } from 'lucide-react';

export type TranscriptBeat = {
  start: number;
  end: number;
  keyword: string;
  statement: string;
  icon: 'book' | 'globe' | 'heart' | 'light' | 'rocket' | 'skull' | 'sparkles' | 'paths';
  hue: string;
  imageHint: string;
};

export type SceneAsset = {
  label: string;
  icon: TranscriptBeat['icon'];
  hue: string;
  x: number;
  y: number;
  size: number;
  drift: number;
};

export const BEAT_ICONS = {
  book: BookOpen,
  globe: Globe2,
  heart: HeartHandshake,
  light: Lightbulb,
  rocket: Rocket,
  skull: Skull,
  sparkles: Sparkles,
  paths: Waypoints,
} as const;

export const TRANSCRIPT_BEATS: Record<string, TranscriptBeat[]> = {
  '1': [
    {
      start: 0,
      end: 0.25,
      keyword: 'desire',
      statement: 'What do you desire? What makes you itch?',
      icon: 'light',
      hue: '#a78bfa',
      imageHint: 'a glowing question mark made of mist',
    },
    {
      start: 0.25,
      end: 0.5,
      keyword: 'money',
      statement: 'Do the work you actually want, not the work that merely pays.',
      icon: 'rocket',
      hue: '#7c3aed',
      imageHint: 'a hand letting coins dissolve into stars',
    },
    {
      start: 0.5,
      end: 0.75,
      keyword: 'mastery',
      statement: 'Love what you do long enough and mastery follows.',
      icon: 'sparkles',
      hue: '#d946ef',
      imageHint: 'a circle closing into a completed halo',
    },
    {
      start: 0.75,
      end: 1,
      keyword: 'follow',
      statement: 'What do I desire?',
      icon: 'paths',
      hue: '#f5d0fe',
      imageHint: 'a path branching into living brushstrokes',
    },
  ],
  '2': [
    {
      start: 0,
      end: 0.25,
      keyword: 'home',
      statement: 'This pale blue dot is here. It is us.',
      icon: 'globe',
      hue: '#38bdf8',
      imageHint: 'a tiny blue planet suspended in black space',
    },
    {
      start: 0.25,
      end: 0.5,
      keyword: 'all of us',
      statement: 'Everyone you know, every hero, every sinner, every dreamer.',
      icon: 'heart',
      hue: '#7dd3fc',
      imageHint: 'many small lights clustered into one orbit',
    },
    {
      start: 0.5,
      end: 0.75,
      keyword: 'humility',
      statement: 'The cosmic arena makes our self-importance look fragile.',
      icon: 'book',
      hue: '#bae6fd',
      imageHint: 'a vast dark field with one bright grain of light',
    },
    {
      start: 0.75,
      end: 1,
      keyword: 'care',
      statement: 'Preserve and cherish the only home we have ever known.',
      icon: 'sparkles',
      hue: '#f0f9ff',
      imageHint: 'hands holding a small luminous world',
    },
  ],
  '3': [
    {
      start: 0,
      end: 0.25,
      keyword: 'love',
      statement: 'Find what you love and do great work.',
      icon: 'heart',
      hue: '#f59e0b',
      imageHint: 'a bright ember inside a dark room',
    },
    {
      start: 0.25,
      end: 0.5,
      keyword: 'death',
      statement: 'Remembering death strips away everything unnecessary.',
      icon: 'skull',
      hue: '#fbbf24',
      imageHint: 'a fading clock face turning to dust',
    },
    {
      start: 0.5,
      end: 0.75,
      keyword: 'heart',
      statement: 'Do not let fear or dogma drown out your inner voice.',
      icon: 'light',
      hue: '#fcd34d',
      imageHint: 'a voice-wave rising through static',
    },
    {
      start: 0.75,
      end: 1,
      keyword: 'hungry',
      statement: 'Stay hungry. Stay foolish.',
      icon: 'sparkles',
      hue: '#fef3c7',
      imageHint: 'an open horizon with a single golden spark',
    },
  ],
};

export const SCENE_ASSETS: Record<string, SceneAsset[]> = {
  '1': [
    { label: 'question', icon: 'light', hue: '#a78bfa', x: 0.22, y: 0.22, size: 92, drift: 0.18 },
    { label: 'coins', icon: 'rocket', hue: '#7c3aed', x: 0.74, y: 0.28, size: 84, drift: 0.12 },
    { label: 'craft', icon: 'sparkles', hue: '#d946ef', x: 0.52, y: 0.72, size: 110, drift: 0.16 },
  ],
  '2': [
    { label: 'planet', icon: 'globe', hue: '#38bdf8', x: 0.28, y: 0.25, size: 110, drift: 0.08 },
    { label: 'humans', icon: 'heart', hue: '#7dd3fc', x: 0.7, y: 0.32, size: 98, drift: 0.1 },
    { label: 'orbital', icon: 'book', hue: '#bae6fd', x: 0.5, y: 0.72, size: 128, drift: 0.06 },
  ],
  '3': [
    { label: 'ember', icon: 'heart', hue: '#f59e0b', x: 0.2, y: 0.3, size: 92, drift: 0.14 },
    { label: 'clock', icon: 'skull', hue: '#fbbf24', x: 0.74, y: 0.28, size: 92, drift: 0.16 },
    { label: 'horizon', icon: 'sparkles', hue: '#fef3c7', x: 0.52, y: 0.74, size: 128, drift: 0.09 },
  ],
};
