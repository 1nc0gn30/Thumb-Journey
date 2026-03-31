import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioPlayer } from './AudioPlayer';
import { JourneyCanvas } from './JourneyCanvas';
import { RewardScreen } from './RewardScreen';
import { SelectionScreen } from './SelectionScreen';
import { SPEECHES, Speech } from '../data/speeches';
import { BEAT_ICONS, TRANSCRIPT_BEATS, TranscriptBeat } from '../data/transcriptBeats';

type ViewState = 'home' | 'journey' | 'reward' | 'selection';

export function MobileExperience() {
  const [view, setView] = useState<ViewState>('home');
  const [isHolding, setIsHolding] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [audioTime, setAudioTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [thumbPos, setThumbPos] = useState({ x: 0, y: 0 });
  const [dragHue, setDragHue] = useState<string | null>(null);
  const [dragIntensity, setDragIntensity] = useState(0);
  const [glitchPulse, setGlitchPulse] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const dragCooldownRef = useRef(0);
  
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [currentSpeech, setCurrentSpeech] = useState<Speech>(SPEECHES[0]);

  const updatePointerFromEvent = (e: React.TouchEvent | React.MouseEvent) => {
    const point = 'touches' in e
      ? e.touches[0] ?? e.changedTouches[0]
      : e;
    if (!point) return;
    const next = { x: point.clientX, y: point.clientY };
    const dx = next.x - lastPointerRef.current.x;
    const dy = next.y - lastPointerRef.current.y;
    lastPointerRef.current = next;
    setThumbPos(next);

    if (!isHolding) return;
    const movement = Math.hypot(dx, dy);
    const movedEnough = movement > 6;
    if (!movedEnough) return;

    if (dragCooldownRef.current > 0) {
      dragCooldownRef.current -= 1;
    }

    setDragIntensity((value) => Math.min(1, Math.max(value * 0.82, movement / 28)));

    if (dragCooldownRef.current === 0) {
      dragCooldownRef.current = 4;
      setDragHue(randomDragHue());

      if (Math.random() < 0.38) {
        setGlitchPulse((value) => Math.min(1, value + 0.4));
      }
    }
  };

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('thumbJourneyProgress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCompletedIds(parsed);
        
        // Find next uncompleted speech
        const nextUncompleted = SPEECHES.find(s => !parsed.includes(s.id));
        if (nextUncompleted) {
          setCurrentSpeech(nextUncompleted);
        } else if (parsed.length >= SPEECHES.length) {
          // All completed, go to selection
          setView('selection');
        }
      } catch (e) {
        console.error('Failed to parse progress', e);
      }
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (view !== 'home' && view !== 'journey') return;
    if (e.cancelable) e.preventDefault();
    updatePointerFromEvent(e);
    
    setIsHolding(true);
    setView('journey');
    setDragHue(null);
    setDragIntensity(0);
    setGlitchPulse(0);
    
    // Fade in audio
    let vol = audioVolume;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdTimerRef.current = setInterval(() => {
      vol = Math.min(vol + 4, 100);
      console.log('Fading in volume:', vol);
      setAudioVolume(vol);
      if (vol >= 100) clearInterval(holdTimerRef.current!);
    }, 100);
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (view !== 'journey') return;
    if (e.cancelable) e.preventDefault();
    updatePointerFromEvent(e);

    if (completedAll && isOverMenuButton(lastPointerRef.current.x, lastPointerRef.current.y)) {
      setIsHolding(false);
      setAudioVolume(0);
      setAudioTime(0);
      setView('selection');
      return;
    }
    
    setIsHolding(false);
    setView('home');
    setDragIntensity(0);
    setGlitchPulse(0);

    // Fade out audio
    let vol = audioVolume;
    if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    holdTimerRef.current = setInterval(() => {
      vol = Math.max(vol - 8, 0);
      setAudioVolume(vol);
      if (vol <= 0) clearInterval(holdTimerRef.current!);
    }, 100);
  };

  const handleAudioEnd = () => {
    // Mark as completed
    const newCompleted = [...new Set([...completedIds, currentSpeech.id])];
    setCompletedIds(newCompleted);
    localStorage.setItem('thumbJourneyProgress', JSON.stringify(newCompleted));
    
    setIsHolding(false);
    setAudioVolume(0);
    setAudioTime(0);
    setView('reward');
  };

  const handleNext = () => {
    if (completedIds.length >= SPEECHES.length) {
      setView('selection');
    } else {
      const nextUncompleted = SPEECHES.find(s => !completedIds.includes(s.id)) || SPEECHES[0];
      setCurrentSpeech(nextUncompleted);
      setView('home');
    }
  };

  const handleSelectSpeech = (speech: Speech) => {
    setCurrentSpeech(speech);
    setView('home');
    setAudioTime(0);
    setAudioDuration(0);
  };

  const beats = TRANSCRIPT_BEATS[currentSpeech.id] ?? [];
  const activeBeat = getActiveBeat(beats, audioTime, audioDuration);
  const ActiveIcon = activeBeat ? BEAT_ICONS[activeBeat.icon] : null;
  const beatProgress = getBeatProgress(activeBeat, audioTime, audioDuration);
  const completedAll = completedIds.length >= SPEECHES.length;

  // Prevent context menu on long press and cleanup timers
  useEffect(() => {
    const preventContext = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', preventContext);
    return () => {
      document.removeEventListener('contextmenu', preventContext);
      if (holdTimerRef.current) clearInterval(holdTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (glitchPulse <= 0) return;
    const timer = setInterval(() => {
      setGlitchPulse((value) => Math.max(0, value - 0.05));
    }, 90);
    return () => clearInterval(timer);
  }, [glitchPulse]);

  useEffect(() => {
    if (dragIntensity <= 0) return;
    const timer = setInterval(() => {
      setDragIntensity((value) => Math.max(0, value - 0.035));
    }, 70);
    return () => clearInterval(timer);
  }, [dragIntensity]);

  return (
    <div 
      className="w-full h-full relative overflow-hidden bg-black touch-none"
      onMouseDown={handleTouchStart}
      onMouseMove={updatePointerFromEvent}
      onTouchMove={updatePointerFromEvent}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <AudioPlayer 
        isPlaying={view === 'journey' && isHolding} 
        volume={audioVolume} 
        audioUrl={currentSpeech.audioUrl}
        onEnd={handleAudioEnd}
        onTimeUpdate={(time, duration) => {
          setAudioTime(time);
          setAudioDuration(duration);
        }}
      />
      
      {/* The Immersive Journey Canvas */}
      <JourneyCanvas 
        isHolding={isHolding} 
        hasStarted={view === 'journey'} 
        theme={currentSpeech.visualTheme}
        currentBeat={activeBeat}
        speechId={currentSpeech.id}
        audioTime={audioTime}
        audioDuration={audioDuration}
        thumbX={thumbPos.x}
        thumbY={thumbPos.y}
        hasThumb={isHolding}
        dragHue={dragHue}
        dragIntensity={dragIntensity}
        glitchPulse={glitchPulse}
      />

      <AnimatePresence>
        {view === 'journey' && isHolding && activeBeat && ActiveIcon && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute left-3 right-3 top-3 z-30 pointer-events-none"
          >
            <div
              className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.2),rgba(255,255,255,0)_42%),linear-gradient(135deg,rgba(255,255,255,0.13),rgba(255,255,255,0.04)_35%,rgba(0,0,0,0.5))] backdrop-blur-xl p-4 shadow-2xl"
              style={{ boxShadow: `0 0 0 1px ${activeBeat.hue}26, 0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)` }}
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl"
                style={{ background: `${activeBeat.hue}44` }}
              />
              <div className="flex items-start gap-3">
                <div
                  className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 bg-black/25"
                  style={{ color: activeBeat.hue, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.24), 0 0 0 1px ${activeBeat.hue}55` }}
                >
                  <ActiveIcon size={24} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.33em] text-white/45">
                    {currentSpeech.speaker}
                  </div>
                  <div
                    className="text-[22px] text-white font-semibold leading-tight mt-1 transition-all duration-300"
                    style={{
                      opacity: 0.72 + (1 - beatProgress) * 0.28,
                      transform: `translateY(${Math.sin(audioTime * 4.5) * 1.5}px)`,
                      filter: `blur(${beatProgress > 0.88 ? 0.9 : 0}px)`,
                      textShadow: `0 0 24px ${activeBeat.hue}33`,
                    }}
                  >
                    {activeBeat.keyword}
                  </div>
                  <RotatingTranscriptLine
                    statement={activeBeat.statement}
                    hue={activeBeat.hue}
                    audioTime={audioTime}
                    beatProgress={beatProgress}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {completedAll && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          ref={menuButtonRef}
          data-menu-button="true"
          onClick={() => setView('selection')}
          className="absolute right-4 bottom-4 z-[60] rounded-full border border-white/20 bg-[linear-gradient(125deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04)_45%,rgba(0,0,0,0.56))] backdrop-blur-xl px-5 py-3 text-xs uppercase tracking-[0.3em] text-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.55)] pointer-events-auto"
          style={{ boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.55)' }}
        >
          Menu
        </motion.button>
      )}

      {/* Home Screen Overlay */}
      <AnimatePresence>
        {view === 'home' && !isHolding && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1, ease: 'easeInOut' } }}
            transition={{ duration: 2, ease: 'easeInOut' }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),rgba(0,0,0,0.7)_40%),radial-gradient(circle_at_80%_100%,rgba(255,255,255,0.1),rgba(0,0,0,0.85)_50%)] backdrop-blur-sm" />
            
            <motion.div 
              animate={{ scale: [1, 1.05, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              className="z-30 flex flex-col items-center rounded-[34px] border border-white/10 bg-black/35 px-8 py-10 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            >
              <div className="w-24 h-32 border-2 border-white/25 rounded-[40px] flex items-center justify-center mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-white/12 to-transparent" />
                <div className="w-12 h-16 border border-white/45 rounded-[20px] flex items-center justify-center">
                  <div className="w-6 h-8 bg-white/80 rounded-[10px] animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-xl font-light tracking-[0.16em] text-white/90 uppercase text-center px-2">
                Hold to Enter
              </h2>
              <p className="text-sm font-light tracking-[0.2em] text-white/65 mt-4 uppercase text-center">
                {currentSpeech.speaker}
              </p>
              <p className="text-xs font-light tracking-[0.12em] text-white/45 mt-2 italic text-center">
                "{currentSpeech.title}"
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward Screen */}
      <AnimatePresence>
        {view === 'reward' && (
          <RewardScreen speech={currentSpeech} onNext={handleNext} />
        )}
      </AnimatePresence>

      {/* Selection Screen */}
      <AnimatePresence>
        {view === 'selection' && (
          <SelectionScreen onSelect={handleSelectSpeech} />
        )}
      </AnimatePresence>
    </div>
  );
}

function getActiveBeat(beats: TranscriptBeat[], currentTime: number, duration: number) {
  if (!beats.length) return null;
  if (!duration || duration <= 0) return beats[0];
  const progress = Math.min(1, Math.max(0, currentTime / duration));
  return beats.find((beat) => progress >= beat.start && progress < beat.end) ?? beats[beats.length - 1];
}

function getBeatProgress(beat: TranscriptBeat | null, currentTime: number, duration: number) {
  if (!beat || !duration || duration <= 0) return 0;
  const progress = Math.min(1, Math.max(0, currentTime / duration));
  return Math.min(1, Math.max(0, (progress - beat.start) / Math.max(0.0001, beat.end - beat.start)));
}

function randomDragHue() {
  const hues = ['#7c3aed', '#06b6d4', '#f59e0b', '#ec4899', '#22c55e', '#f97316', '#a855f7'];
  return hues[Math.floor(Math.random() * hues.length)];
}

function isOverMenuButton(x: number, y: number) {
  const el = document.querySelector('[data-menu-button="true"]') as HTMLElement | null;
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function RotatingTranscriptLine({
  statement,
  hue,
  audioTime,
  beatProgress,
}: {
  statement: string;
  hue: string;
  audioTime: number;
  beatProgress: number;
}) {
  const segments = splitStatement(statement);
  const segmentDuration = 3.5;
  const index = Math.min(segments.length - 1, Math.floor(audioTime / segmentDuration) % segments.length);
  const segment = segments[index];
  const segmentProgress = (audioTime % segmentDuration) / segmentDuration;

  return (
    <div className="mt-3 min-h-[108px] rounded-2xl border border-white/10 bg-black/30 px-3 py-3 backdrop-blur-md">
      <div className="mb-3 flex flex-wrap gap-2">
        {segments.map((entry, entryIndex) => {
          const isActive = entryIndex === index;
          const isComplete = entryIndex < index;
          return (
            <div
              key={`${entry}-${entryIndex}`}
              className="h-[3px] flex-1 min-w-[30px] overflow-hidden rounded-full bg-white/15"
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: hue }}
                initial={false}
                animate={{
                  width: isComplete ? '100%' : isActive ? `${Math.max(8, segmentProgress * 100)}%` : '8%',
                  opacity: isActive ? 1 : isComplete ? 0.75 : 0.32,
                }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              />
            </div>
          );
        })}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${segment}`}
          initial={{ opacity: 0, y: 16, filter: 'blur(12px)' }}
          animate={{
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
          }}
          exit={{ opacity: 0, y: -14, filter: 'blur(8px)' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="text-[15px] leading-relaxed font-medium tracking-[0.01em]"
          style={{
            color: '#f6f6f7',
            opacity: 0.82 + (1 - beatProgress) * 0.16,
            textShadow: `0 0 16px ${hue}44`,
          }}
        >
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 text-[10px] text-white/70 align-middle">
            {index + 1}
          </span>
          <span
            style={{
              backgroundImage: `linear-gradient(100deg, #ffffff 0%, #ffffff 60%, ${hue} 100%)`,
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {segment}
          </span>
        </motion.div>
      </AnimatePresence>
      <div className="mt-3 h-[2px] overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${hue}, #ffffff)` }}
          initial={false}
          animate={{ width: `${Math.max(6, Math.min(100, beatProgress * 100))}%` }}
          transition={{ duration: 0.25, ease: 'linear' }}
        />
      </div>
    </div>
  );
}

function splitStatement(statement: string) {
  const parts = statement
    .split(/(?<=[.!?])\s+|,\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) return parts;

  const words = statement.split(/\s+/).filter(Boolean);
  if (words.length <= 8) return [statement];

  const chunkSize = Math.max(5, Math.ceil(words.length / 3));
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(' '));
  }
  return chunks;
}
