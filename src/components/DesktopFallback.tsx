import { motion } from 'motion/react';

export function DesktopFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-zinc-300 overflow-hidden relative">
      {/* Abstract background shapes */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="z-10 text-center max-w-md px-6"
      >
        <h1 className="text-4xl md:text-6xl font-light tracking-widest mb-6 text-white uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>
          Mobile Only
        </h1>
        <p className="text-lg md:text-xl font-light text-zinc-400 tracking-wide leading-relaxed">
          This journey requires the intimacy of touch. Please return on your mobile device to begin.
        </p>
        
        <div className="mt-12 flex justify-center">
          <div className="w-16 h-24 border border-zinc-700 rounded-3xl flex items-center justify-center relative">
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="w-1 h-3 bg-zinc-500 rounded-full absolute top-4"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
