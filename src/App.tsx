/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { DesktopFallback } from './components/DesktopFallback';
import { MobileExperience } from './components/MobileExperience';

export default function App() {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="w-full h-[100dvh] bg-black text-white overflow-hidden select-none">
      {isMobile ? <MobileExperience /> : <DesktopFallback />}
    </div>
  );
}
