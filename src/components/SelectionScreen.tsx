import { motion } from 'motion/react';
import { Speech, SPEECHES } from '../data/speeches';

interface SelectionScreenProps {
  onSelect: (speech: Speech) => void;
}

export function SelectionScreen({ onSelect }: SelectionScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-start z-50 p-6 overflow-y-auto"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.18),rgba(39,39,42,0.85)_35%,rgba(0,0,0,0.98)_72%)]" />
      <div className="max-w-md w-full pt-12 pb-24 relative">
        <div className="mb-10 rounded-[30px] border border-white/10 bg-black/30 p-6 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
          <h1 className="text-[30px] font-light text-white mb-2 text-center uppercase tracking-[0.12em]">Mastery Achieved</h1>
          <p className="text-white/60 text-center text-sm tracking-wide">
          You have completed all journeys. You may now choose your path.
          </p>
        </div>

        <div className="space-y-4">
          {SPEECHES.map((speech, index) => (
            <motion.button
              key={speech.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(speech)}
              className="w-full text-left border border-white/12 rounded-2xl p-5 transition-all active:scale-95 bg-[linear-gradient(130deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03)_38%,rgba(0,0,0,0.45))] backdrop-blur-md hover:border-white/20 hover:translate-y-[-1px]"
              style={{ boxShadow: `0 12px 26px rgba(0,0,0,0.35)` }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/55 text-[11px] tracking-[0.24em] uppercase">Journey {index + 1}</span>
                <div 
                  className="h-2.5 w-14 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${speech.visualTheme.colors[0]}, ${speech.visualTheme.colors[1] ?? '#ffffff'})` }}
                />
              </div>
              <h2 className="text-[22px] text-white font-light mb-1">{speech.speaker}</h2>
              <p className="text-white/60 text-sm italic">"{speech.title}"</p>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
