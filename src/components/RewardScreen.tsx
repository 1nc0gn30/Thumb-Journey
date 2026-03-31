import { motion } from 'motion/react';
import { Speech } from '../data/speeches';

interface RewardScreenProps {
  speech: Speech;
  onNext: () => void;
}

export function RewardScreen({ speech, onNext }: RewardScreenProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex flex-col items-center justify-center z-50 p-6 text-center overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.17),rgba(24,24,27,0.88)_35%,rgba(0,0,0,0.98)_70%)]" />
      <div
        className="absolute -left-14 top-20 h-48 w-48 rounded-full blur-3xl"
        style={{ background: `${speech.visualTheme.colors[0]}55` }}
      />
      <div
        className="absolute -right-8 bottom-24 h-56 w-56 rounded-full blur-3xl"
        style={{ background: `${speech.visualTheme.colors[1] ?? speech.visualTheme.colors[0]}44` }}
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="max-w-md w-full relative"
      >
        <div className="rounded-[32px] border border-white/15 bg-black/35 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <p className="text-white/55 uppercase tracking-[0.28em] text-[10px] mb-3">Journey Completed</p>
          <h2 className="text-3xl font-light text-white mb-2">{speech.speaker}</h2>
          <h3 className="text-lg text-white/65 font-light mb-6 italic">"{speech.title}"</h3>
        
          <div className="relative overflow-hidden border border-white/10 rounded-2xl p-5 mb-7 bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03)_40%,rgba(0,0,0,0.4))]">
            <div
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${speech.visualTheme.colors[0]}, ${speech.visualTheme.colors[1] ?? '#ffffff'})` }}
            />
            <p className="text-white/85 leading-relaxed font-light text-[17px]">
              {speech.lesson}
            </p>
          </div>

          <button 
            onClick={onNext}
            className="w-full px-8 py-4 rounded-full font-medium tracking-[0.08em] text-black transition-transform hover:scale-[1.01] active:scale-95"
            style={{
              background: `linear-gradient(105deg, ${speech.visualTheme.colors[0]}, ${speech.visualTheme.colors[1] ?? '#ffffff'})`,
              boxShadow: `0 12px 30px ${speech.visualTheme.colors[0]}44`,
            }}
          >
            Next Journey Ready
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
