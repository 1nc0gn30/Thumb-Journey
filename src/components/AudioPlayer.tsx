import { useEffect, useRef } from 'react';

interface AudioPlayerProps {
  isPlaying: boolean;
  volume: number; // 0 to 100
  audioUrl: string;
  onEnd: () => void;
  onTimeUpdate?: (time: number, duration: number) => void;
}

export function AudioPlayer({ isPlaying, volume, audioUrl, onEnd, onTimeUpdate }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn('Audio play failed:', error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Handle source changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(e => console.warn('Audio play failed on source change:', e));
      }
    }
  }, [audioUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current && onTimeUpdate) {
      onTimeUpdate(audioRef.current.currentTime, audioRef.current.duration || 0);
    }
  };

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      onEnded={onEnd}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleTimeUpdate}
      className="hidden"
      preload="auto"
    />
  );
}
