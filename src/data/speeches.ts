export type VisualTheme = {
  colors: string[];
  shape: 'circle' | 'square' | 'triangle' | 'star';
  speedMult: number;
  background: string;
};

export type Speech = {
  id: string;
  speaker: string;
  title: string;
  audioUrl: string;
  lesson: string;
  visualTheme: VisualTheme;
};

export const SPEECHES: Speech[] = [
  {
    id: '1',
    speaker: 'Alan Watts',
    title: 'What if money was no object?',
    audioUrl: '/audio/alan_watts.mp3',
    lesson: 'Do what you desire, not what pays well. A life spent doing what you hate to earn money to keep doing what you hate is a wasted life. Follow your passion, and the mastery will follow.',
    visualTheme: {
      colors: ['#4f46e5', '#818cf8', '#c084fc', '#e879f9', '#ffffff'],
      shape: 'circle',
      speedMult: 1.2,
      background: 'rgba(10, 5, 20, 0.1)',
    }
  },
  {
    id: '2',
    speaker: 'Carl Sagan',
    title: 'Pale Blue Dot',
    audioUrl: '/audio/carl_sagan.mp3',
    lesson: 'Look again at that dot. That\'s here. That\'s home. That\'s us. In our obscurity, in all this vastness, there is no hint that help will come from elsewhere to save us from ourselves. It underscores our responsibility to deal more kindly with one another.',
    visualTheme: {
      colors: ['#0ea5e9', '#38bdf8', '#bae6fd', '#f0f9ff', '#ffffff'],
      shape: 'circle',
      speedMult: 0.8,
      background: 'rgba(5, 10, 20, 0.15)',
    }
  },
  {
    id: '3',
    speaker: 'Steve Jobs',
    title: 'Stay Hungry, Stay Foolish',
    audioUrl: '/audio/steve_jobs.mp3',
    lesson: 'Your time is limited, so don\'t waste it living someone else\'s life. Don\'t let the noise of others\' opinions drown out your own inner voice. And most important, have the courage to follow your heart and intuition.',
    visualTheme: {
      colors: ['#f59e0b', '#fbbf24', '#fcd34d', '#fef3c7', '#ffffff'],
      shape: 'circle',
      speedMult: 1.0,
      background: 'rgba(20, 15, 5, 0.1)',
    }
  }
];
