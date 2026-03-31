import { useEffect, useRef } from 'react';
import { VisualTheme } from '../data/speeches';
import { SCENE_ASSETS, TranscriptBeat } from '../data/transcriptBeats';

interface JourneyCanvasProps {
  isHolding: boolean;
  hasStarted: boolean;
  theme: VisualTheme;
  currentBeat?: TranscriptBeat | null;
  speechId?: string;
  audioTime?: number;
  audioDuration?: number;
  thumbX?: number;
  thumbY?: number;
  hasThumb?: boolean;
  dragHue?: string | null;
  dragIntensity?: number;
  glitchPulse?: number;
}

interface Entity {
  x: number;
  y: number;
  z: number;
  img: HTMLImageElement | null;
  color: string;
  size: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

interface TrailPoint {
  x: number;
  y: number;
  life: number;
  hue: number;
  strength: number;
}

export function JourneyCanvas({ isHolding, hasStarted, theme, currentBeat, speechId, audioTime = 0, audioDuration = 0, thumbX = 0, thumbY = 0, hasThumb = false, dragHue = null, dragIntensity = 0, glitchPulse = 0 }: JourneyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const entitiesRef = useRef<Entity[]>([]);
  const isHoldingRef = useRef(isHolding);
  const themeRef = useRef(theme);
  const beatRef = useRef<TranscriptBeat | null | undefined>(currentBeat);
  const speechIdRef = useRef(speechId);
  const moshProgressRef = useRef(0); // 0 to 1
  const timeRef = useRef(0);
  const trailRef = useRef<TrailPoint[]>([]);
  const lastTrailPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  useEffect(() => {
    themeRef.current = theme;
    // Re-color existing entities when theme changes
    entitiesRef.current.forEach(entity => {
      entity.color = theme.colors[Math.floor(Math.random() * theme.colors.length)];
    });
  }, [theme]);

  useEffect(() => {
    beatRef.current = currentBeat;
  }, [currentBeat]);

  useEffect(() => {
    speechIdRef.current = speechId;
  }, [speechId]);

  useEffect(() => {
    if (!isHolding) {
      lastTrailPointRef.current = null;
      return;
    }

    const last = lastTrailPointRef.current;
    const moved = !last || Math.hypot(thumbX - last.x, thumbY - last.y) > 4;
    if (!moved) return;

    const hueBase = ((Date.now() / 18) % 360 + dragIntensity * 90) % 360;
    trailRef.current.push({
      x: thumbX,
      y: thumbY,
      life: 1,
      hue: hueBase,
      strength: 0.4 + dragIntensity * 0.8,
    });
    if (trailRef.current.length > 36) {
      trailRef.current.splice(0, trailRef.current.length - 36);
    }
    lastTrailPointRef.current = { x: thumbX, y: thumbY };
  }, [thumbX, thumbY, dragIntensity, isHolding]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    window.addEventListener('resize', handleResize);

    // Image pool to prevent creating too many Image objects
    const imagePool: HTMLImageElement[] = [];
    for (let i = 0; i < 10; i++) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => {
        img.removeAttribute('src');
      };
      img.src = `https://picsum.photos/seed/${Math.random()}/300/300?blur=2`;
      imagePool.push(img);
    }

    const createEntity = (zStart: number): Entity => {
      const currentTheme = themeRef.current;
      return {
        x: (Math.random() - 0.5) * width * 3,
        y: (Math.random() - 0.5) * height * 3,
        z: zStart,
        img: Math.random() > 0.8 ? imagePool[Math.floor(Math.random() * imagePool.length)] : null,
        color: currentTheme.colors[Math.floor(Math.random() * currentTheme.colors.length)],
        size: Math.random() * 200 + 50,
        speed: (Math.random() * 2 + 1) * currentTheme.speedMult,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
      };
    };

    // Initialize entities - reduced count
    for (let i = 0; i < 20; i++) {
      entitiesRef.current.push(createEntity(Math.random() * 2000));
    }

    // Pre-create offscreen canvas for pixelation effect to avoid memory pressure
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');

    const render = () => {
      try {
        if (!ctx) return;
        const currentTheme = themeRef.current;
        const currentBeatValue = beatRef.current;
        const currentSpeechId = speechIdRef.current;
        timeRef.current += 0.01;

        const targetMosh = isHoldingRef.current ? Math.min(0.92, glitchPulse * 1.15 + dragIntensity * 0.42) : 1;
        const moshStep = isHoldingRef.current ? 0.05 : 0.015;
        if (moshProgressRef.current < targetMosh) {
          moshProgressRef.current = Math.min(targetMosh, moshProgressRef.current + moshStep);
        } else if (moshProgressRef.current > targetMosh) {
          moshProgressRef.current = Math.max(targetMosh, moshProgressRef.current - moshStep);
        }

        // Trail effect: draw semi-transparent background
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = isHoldingRef.current ? currentTheme.background : 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, width, height);

        // Center of screen
        const cx = width / 2;
        const cy = height / 2;

        // Sort entities by Z (painters algorithm)
        entitiesRef.current.sort((a, b) => b.z - a.z);

        ctx.globalCompositeOperation = 'screen';

        if (currentBeatValue) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.05 + dragIntensity * 0.16 + glitchPulse * 0.08;
          ctx.fillStyle = dragHue ?? currentBeatValue.hue;
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }

        if (currentSpeechId) {
          drawSceneAssets(ctx, currentSpeechId, width, height, timeRef.current, moshProgressRef.current);
        }

        drawAudioStrings(ctx, width, height, timeRef.current, currentBeatValue, audioTime, audioDuration, isHoldingRef.current, dragIntensity, glitchPulse);
        drawLiquidTrail(ctx, trailRef.current, dragIntensity, glitchPulse);
        if (isHoldingRef.current) {
          drawThumbCursor(ctx, thumbX, thumbY, true, dragHue ?? currentBeatValue?.hue ?? '#ffffff', moshProgressRef.current, dragIntensity);
          drawDragField(ctx, width, height, thumbX, thumbY, dragHue ?? currentBeatValue?.hue ?? '#ffffff', dragIntensity, glitchPulse, timeRef.current);
        }

        for (const point of trailRef.current) {
          point.life = Math.max(0, point.life - (0.022 + glitchPulse * 0.01));
        }
        trailRef.current = trailRef.current.filter((point) => point.life > 0.02);

        entitiesRef.current.forEach((entity) => {
          // Move entity
          const beatSpeed = currentBeatValue ? 1 + (currentBeatValue.end - currentBeatValue.start) * 2 : 1;
          const speedMult = isHoldingRef.current ? 5 * beatSpeed : 0.5;
          entity.z -= entity.speed * speedMult;
          entity.rotation += entity.rotationSpeed;

          // Recycle if passed camera
          if (entity.z < 1) {
            Object.assign(entity, createEntity(2000));
          }

          // 3D to 2D projection
          const fov = 500;
          const scale = fov / (fov + entity.z);
          const x2d = cx + entity.x * scale;
          const y2d = cy + entity.y * scale;
          
          // Add some sine wave movement for "trance-y" vibe
          const waveX = Math.sin(timeRef.current + entity.z * 0.01) * 50 * scale;
          const waveY = Math.cos(timeRef.current + entity.z * 0.01) * 50 * scale;

          const finalX = x2d + waveX;
          const finalY = y2d + waveY;
          const finalSize = entity.size * scale;

          // Draw
          ctx.save();
          ctx.translate(finalX, finalY);
          ctx.rotate(entity.rotation);
          
          // Opacity based on Z (fade in from distance)
          const opacity = Math.min(1, (2000 - entity.z) / 500) * (1 - moshProgressRef.current * 0.8);
          ctx.globalAlpha = Math.max(0, opacity);

          if (entity.img && entity.img.complete && entity.img.naturalWidth > 0) {
            // Draw image
            ctx.drawImage(entity.img, -finalSize / 2, -finalSize / 2, finalSize, finalSize);
          } else {
            // Draw abstract shape based on theme
            const halfSize = finalSize / 2;
            
            if (currentTheme.shape === 'circle') {
              const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, halfSize);
              gradient.addColorStop(0, `${entity.color}ff`);
              gradient.addColorStop(1, `${entity.color}00`);
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
              ctx.fill();
            } else if (currentTheme.shape === 'square') {
              ctx.fillStyle = `${entity.color}aa`;
              ctx.fillRect(-halfSize, -halfSize, finalSize, finalSize);
              ctx.strokeStyle = entity.color;
              ctx.lineWidth = 2;
              ctx.strokeRect(-halfSize, -halfSize, finalSize, finalSize);
            } else if (currentTheme.shape === 'triangle') {
              ctx.fillStyle = `${entity.color}aa`;
              ctx.beginPath();
              ctx.moveTo(0, -halfSize);
              ctx.lineTo(halfSize, halfSize);
              ctx.lineTo(-halfSize, halfSize);
              ctx.closePath();
              ctx.fill();
            } else if (currentTheme.shape === 'star') {
              ctx.fillStyle = `${entity.color}aa`;
              ctx.beginPath();
              for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * halfSize,
                           -Math.sin((18 + i * 72) / 180 * Math.PI) * halfSize);
                ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * (halfSize / 2),
                           -Math.sin((54 + i * 72) / 180 * Math.PI) * (halfSize / 2));
              }
              ctx.closePath();
              ctx.fill();
            }
          }

          ctx.restore();
        });

        if (currentBeatValue) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = currentBeatValue.hue;
          ctx.globalAlpha = 0.08;
          ctx.beginPath();
          ctx.arc(cx, cy, 80 + Math.sin(timeRef.current * 2) * 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Data mosh / pixelation effect when releasing
        if (moshProgressRef.current > 0) {
          const moshAmount = moshProgressRef.current;
          // Pixel size goes from 1 to 40
          const pixelSize = 1 + Math.floor(moshAmount * 40);
          
          if (pixelSize > 1 && offCtx) {
            // Draw current canvas to a smaller size, then scale it back up
            const smallW = Math.max(1, Math.floor(width / pixelSize));
            const smallH = Math.max(1, Math.floor(height / pixelSize));
            
            // Resize offscreen canvas only if needed
            if (offscreen.width !== smallW || offscreen.height !== smallH) {
              offscreen.width = smallW;
              offscreen.height = smallH;
            }
            
            offCtx.imageSmoothingEnabled = false;
            offCtx.drawImage(canvas, 0, 0, smallW, smallH);
            
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1;
            ctx.imageSmoothingEnabled = false;
            
            ctx.drawImage(offscreen, 0, 0, width, height);
            
            // Add some color shifting for the "mosh" vibe
            if (moshAmount > 0.5) {
               ctx.globalCompositeOperation = 'hue';
               ctx.fillStyle = `hsl(${timeRef.current * 100}, 50%, 50%)`;
               ctx.fillRect(0, 0, width, height);
               ctx.globalCompositeOperation = 'source-over';
            }
            
            ctx.imageSmoothingEnabled = true;
          }
          
          // Fade to black at the end
          if (moshAmount > 0.8) {
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = `rgba(0, 0, 0, ${(moshAmount - 0.8) * 5})`;
            ctx.fillRect(0, 0, width, height);
          }
        }

        animationFrameId = requestAnimationFrame(render);
      } catch (e) {
        console.warn('Canvas render error:', e);
        // Still try to continue the loop
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        filter: isHolding
          ? `contrast(${1.2 + dragIntensity * 0.32 + glitchPulse * 0.12}) saturate(${1.45 + dragIntensity * 0.75}) brightness(${1 + dragIntensity * 0.12}) hue-rotate(${Math.round(dragIntensity * 16 + glitchPulse * 22)}deg)`
          : 'contrast(1) saturate(1)',
        transition: 'filter 1s ease-in-out',
      }}
    />
  );
}

function drawSceneAssets(
  ctx: CanvasRenderingContext2D,
  speechId: string,
  width: number,
  height: number,
  time: number,
  moshProgress: number,
) {
  const assets = SCENE_ASSETS[speechId] ?? [];
  assets.forEach((asset, index) => {
    const x = width * asset.x + Math.sin(time * (1 + asset.drift) + index) * 18;
    const y = height * asset.y + Math.cos(time * (1 + asset.drift) + index * 0.7) * 18;
    const size = asset.size * (1 - moshProgress * 0.55);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.translate(x, y);
    ctx.rotate(Math.sin(time * 0.5 + index) * 0.08);
    ctx.globalAlpha = Math.max(0.08, 0.5 - moshProgress * 0.35);

    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.75);
    glow.addColorStop(0, `${asset.hue}55`);
    glow.addColorStop(1, `${asset.hue}00`);
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `${asset.hue}aa`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = asset.hue;
    drawIconShape(ctx, asset.icon, size * 0.26);

    ctx.globalAlpha = 0.24;
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${Math.max(10, Math.round(size * 0.11))}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(asset.label.toUpperCase(), 0, size * 0.62);
    ctx.restore();
  });
}

function drawIconShape(ctx: CanvasRenderingContext2D, icon: TranscriptBeat['icon'], size: number) {
  const half = size / 2;
  ctx.beginPath();
  switch (icon) {
    case 'globe':
      ctx.arc(0, 0, half, 0, Math.PI * 2);
      ctx.moveTo(-half, 0);
      ctx.lineTo(half, 0);
      ctx.moveTo(0, -half);
      ctx.lineTo(0, half);
      break;
    case 'heart':
      ctx.moveTo(0, half * 0.9);
      ctx.bezierCurveTo(-half, half * 0.3, -half, -half * 0.5, 0, -half * 0.1);
      ctx.bezierCurveTo(half, -half * 0.5, half, half * 0.3, 0, half * 0.9);
      break;
    case 'book':
      ctx.rect(-half, -half, half, size);
      ctx.rect(0, -half, half, size);
      break;
    case 'light':
      ctx.moveTo(0, -half);
      ctx.lineTo(half * 0.45, -half * 0.1);
      ctx.lineTo(half * 0.2, half * 0.45);
      ctx.lineTo(-half * 0.2, half * 0.45);
      ctx.lineTo(-half * 0.45, -half * 0.1);
      ctx.closePath();
      break;
    case 'rocket':
      ctx.moveTo(0, -half);
      ctx.lineTo(half * 0.55, half * 0.15);
      ctx.lineTo(0, half);
      ctx.lineTo(-half * 0.55, half * 0.15);
      ctx.closePath();
      break;
    case 'skull':
      ctx.arc(0, -half * 0.15, half * 0.55, 0, Math.PI * 2);
      ctx.rect(-half * 0.25, half * 0.2, half * 0.5, half * 0.35);
      break;
    case 'sparkles':
      for (let i = 0; i < 4; i++) {
        const angle = (Math.PI / 4) * i;
        ctx.moveTo(Math.cos(angle) * half, Math.sin(angle) * half);
        ctx.lineTo(Math.cos(angle + Math.PI / 8) * half * 0.2, Math.sin(angle + Math.PI / 8) * half * 0.2);
      }
      break;
    case 'paths':
      ctx.moveTo(-half, half * 0.35);
      ctx.quadraticCurveTo(0, -half, half, -half * 0.1);
      ctx.moveTo(-half * 0.8, half * 0.8);
      ctx.quadraticCurveTo(0, half * 0.25, half * 0.8, half * 0.65);
      break;
  }
  ctx.strokeStyle = ctx.fillStyle as string;
  ctx.lineWidth = Math.max(1.5, size * 0.12);
  ctx.stroke();
}

function drawAudioStrings(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  currentBeat: TranscriptBeat | null | undefined,
  audioTime: number,
  audioDuration: number,
  isHolding: boolean,
  dragIntensity: number,
  glitchPulse: number,
) {
  const progress = audioDuration > 0 ? audioTime / audioDuration : 0;
  const baseY = height * 0.82;
  const strings = 4;
  const hue = currentBeat?.hue ?? '#ffffff';

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = isHolding ? 0.55 : 0.3;

  for (let i = 0; i < strings; i++) {
    const y = baseY + i * 18;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 20) {
      const wobble = Math.sin(time * 1.8 + x * 0.02 + i) * (10 + progress * 18 + dragIntensity * 36 + glitchPulse * 18);
      const beatPulse = currentBeat ? Math.sin(progress * Math.PI * 2 + i) * 10 : 0;
      const py = y + wobble + beatPulse;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.strokeStyle = `${hue}${Math.round((0.08 + i * 0.04) * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1.25 + i * 0.2;
    ctx.stroke();
  }

  if (currentBeat) {
    ctx.fillStyle = `${hue}22`;
    ctx.beginPath();
    ctx.arc(width * 0.5, baseY - 22, 36 + Math.sin(time * 3) * 6, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawThumbCursor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHolding: boolean,
  hue: string,
  moshProgress: number,
  dragIntensity: number,
) {
  if (!isHolding) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(x, y);
  ctx.globalAlpha = 0.65;
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 54);
  glow.addColorStop(0, `${hue}dd`);
  glow.addColorStop(1, `${hue}00`);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, 28 + moshProgress * 12 + dragIntensity * 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `${hue}bb`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 14 + moshProgress * 7 + dragIntensity * 8, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawLiquidTrail(
  ctx: CanvasRenderingContext2D,
  points: TrailPoint[],
  dragIntensity: number,
  glitchPulse: number,
) {
  if (points.length < 2) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    const alpha = Math.min(prev.life, current.life) * (0.35 + dragIntensity * 0.45);
    const width = (10 + i * 0.9) * (0.6 + current.strength * 0.7) + glitchPulse * 10;
    const gradient = ctx.createLinearGradient(prev.x, prev.y, current.x, current.y);
    gradient.addColorStop(0, `hsla(${prev.hue}, 95%, 62%, ${alpha})`);
    gradient.addColorStop(0.5, `hsla(${(prev.hue + current.hue) / 2 + 36}, 100%, 68%, ${alpha * 0.95})`);
    gradient.addColorStop(1, `hsla(${current.hue + 72}, 95%, 62%, ${alpha * 0.8})`);

    ctx.strokeStyle = gradient;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    const mx = (prev.x + current.x) / 2;
    const my = (prev.y + current.y) / 2;
    ctx.quadraticCurveTo(prev.x, prev.y, mx, my);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDragField(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  thumbX: number,
  thumbY: number,
  hue: string,
  dragIntensity: number,
  glitchPulse: number,
  time: number,
) {
  if (dragIntensity <= 0.02 && glitchPulse <= 0.02) return;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const radius = 140 + dragIntensity * 180 + glitchPulse * 130;
  const glow = ctx.createRadialGradient(thumbX, thumbY, 0, thumbX, thumbY, radius);
  glow.addColorStop(0, `${hue}${Math.round((0.24 + dragIntensity * 0.18 + glitchPulse * 0.2) * 255).toString(16).padStart(2, '0')}`);
  glow.addColorStop(1, `${hue}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  ctx.globalAlpha = 0.24 + dragIntensity * 0.34 + glitchPulse * 0.18;
  ctx.strokeStyle = hue;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const y = thumbY + (i - 1) * 36;
    for (let x = 0; x <= width; x += 24) {
      const bend = Math.sin(time * 3 + x * 0.018 + i) * (10 + dragIntensity * 44 + glitchPulse * 28);
      const py = y + bend;
      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}
