import React, { useState, useRef } from 'react';
import { Shield } from 'lucide-react';

interface CybeeLockHeroProps {
  onCtaClick?: () => void;
  ctaText?: string;
  className?: string;
}

export const CybeeLockHero: React.FC<CybeeLockHeroProps> = ({
  onCtaClick,
  ctaText = 'Explore Live Sensor',
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [cursorAngle, setCursorAngle] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    // Calculate angle in degrees
    const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    setCursorAngle(deg);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCursorAngle(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative flex flex-col items-center justify-center select-none cursor-pointer ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* 1. REACTIVE AMBIENT HALO (EXPANDS ON HOVER) */}
      <div
        className={`absolute -inset-10 rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
          isHovered
            ? 'bg-cyan-500/15 opacity-100 scale-110'
            : 'bg-slate-900/40 opacity-50 scale-95'
        }`}
      />

      {/* 2. TECHNICAL HUD WIREFRAME BLOCKCHAIN CROSSHAIRS */}
      <div className="relative w-64 sm:w-72 h-64 sm:h-72 flex items-center justify-center">
        {/* Corner Crosshairs */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top-Left Bracket */}
          <div
            className={`absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 transition-colors duration-300 ${
              isHovered ? 'border-cyan-400' : 'border-slate-600'
            }`}
          />
          <div className="absolute top-1 left-6 text-[8px] font-mono text-slate-400 tracking-wider">
            [BLK_LOCK.01]
          </div>

          {/* Top-Right Bracket */}
          <div
            className={`absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 transition-colors duration-300 ${
              isHovered ? 'border-cyan-400' : 'border-slate-600'
            }`}
          />
          <div className="absolute top-6 right-1 text-[8px] font-mono text-slate-400">
            SHA-256
          </div>

          {/* Bottom-Left Bracket */}
          <div
            className={`absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 transition-colors duration-300 ${
              isHovered ? 'border-cyan-400' : 'border-slate-600'
            }`}
          />
          <div className="absolute bottom-1 left-6 text-[8px] font-mono text-slate-400 tracking-wider">
            MERKLE_OK
          </div>

          {/* Bottom-Right Bracket */}
          <div
            className={`absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 transition-colors duration-300 ${
              isHovered ? 'border-cyan-400' : 'border-slate-600'
            }`}
          />
        </div>

        {/* 3. MONOCHROME CYBERNETIC 4-POINT STARS */}
        {/* Star 1: Top-Left */}
        <div
          className={`absolute top-3 left-4 pointer-events-none animate-cybee-twinkle-1 transition-colors duration-300 ${
            isHovered
              ? 'text-cyan-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]'
              : 'text-slate-300/80 drop-shadow-[0_0_4px_rgba(255,255,255,0.4)]'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* Star 2: Bottom-Left */}
        <div
          className={`absolute bottom-6 left-8 pointer-events-none animate-cybee-twinkle-2 transition-colors duration-300 ${
            isHovered
              ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]'
              : 'text-slate-400/70 drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* Star 3: Top-Right */}
        <div className="absolute top-8 right-6 pointer-events-none animate-cybee-twinkle-3 text-slate-400/60">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
          </svg>
        </div>

        {/* 4. REACTIVELY GLOWING 3D PERSPECTIVE ORBITAL TRAJECTORY */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 280 280"
            fill="none"
          >
            <defs>
              {/* SVG Gaussian Filter for High-Luminance Plasma Glow */}
              <filter id="reactiveGlowFilter" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="3.5" result="blur1" />
                <feGaussianBlur stdDeviation="7" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Reactive Laser Pulse Gradient */}
              <linearGradient id="laserBeamGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* A. Outer Diffuse Luminous Underglow Tube (Intensifies on Hover) */}
            <ellipse
              cx="140"
              cy="140"
              rx="125"
              ry="52"
              transform="rotate(-18 140 140)"
              stroke="#06b6d4"
              strokeWidth={isHovered ? '6' : '3'}
              strokeOpacity={isHovered ? '0.5' : '0.15'}
              filter="url(#reactiveGlowFilter)"
              className="transition-all duration-500 ease-out"
            />

            {/* B. Base High-Precision Dashed Track Ring */}
            <ellipse
              cx="140"
              cy="140"
              rx="125"
              ry="52"
              transform="rotate(-18 140 140)"
              stroke={isHovered ? '#38bdf8' : 'rgba(148, 163, 184, 0.35)'}
              strokeWidth={isHovered ? '1.8' : '1.2'}
              strokeDasharray="4 6"
              className="transition-all duration-300"
              style={{
                filter: isHovered
                  ? 'drop-shadow(0 0 6px #38bdf8) drop-shadow(0 0 14px rgba(6,182,212,0.8))'
                  : 'drop-shadow(0 0 2px rgba(56,189,248,0.2))',
              }}
            />

            {/* C. Traveling Reactive Laser Comet Wave (Continuously Races Around the Orbit) */}
            <ellipse
              cx="140"
              cy="140"
              rx="125"
              ry="52"
              transform="rotate(-18 140 140)"
              stroke="url(#laserBeamGrad)"
              strokeWidth={isHovered ? '2.5' : '2'}
              strokeDasharray="65 240"
              className="animate-laser-surge"
              style={{
                filter: 'drop-shadow(0 0 5px #38bdf8) drop-shadow(0 0 10px #06b6d4)',
              }}
            />

            {/* D. Interactive Cursor Follower Node along the Orbit (When Active) */}
            {cursorAngle !== null && (
              <g
                transform={`rotate(${cursorAngle - 18} 140 140)`}
                className="transition-transform duration-75 ease-out pointer-events-none"
              >
                <circle
                  cx="265"
                  cy="140"
                  r="4"
                  fill="#ffffff"
                  filter="url(#reactiveGlowFilter)"
                  className="animate-ping"
                />
                <circle
                  cx="265"
                  cy="140"
                  r="2.5"
                  fill="#38bdf8"
                />
              </g>
            )}
          </svg>

          {/* E. Orbiting Cryptographic Block Node Badge with Intense Luminous Flare */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="animate-cybee-orbit relative w-0 h-0">
              {/* Luminous Moving Flare over the Orbit Path */}
              <div
                className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 p-1 px-2 rounded bg-[#090e17] border transition-all duration-300 backdrop-blur-md ${
                  isHovered
                    ? 'border-cyan-400 shadow-[0_0_20px_#38bdf8,0_0_35px_rgba(6,182,212,0.8)] scale-110'
                    : 'border-slate-600 shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-100'
                }`}
              >
                <Shield
                  className={`w-3.5 h-3.5 transition-colors duration-300 ${
                    isHovered ? 'text-cyan-300' : 'text-slate-200'
                  }`}
                />
                <span className="text-[8px] font-mono text-slate-200 font-bold tracking-tight">
                  BLK #8492
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400 shadow-[0_0_6px_#38bdf8]" />
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 5. THE OSCILLATING / TILTING 3D BLOCKCHAIN VAULT PADLOCK */}
        <div
          className={`relative z-10 transition-transform duration-700 ease-out cursor-pointer ${
            isHovered ? 'scale-105' : 'scale-100'
          }`}
          style={{
            animation: 'cybee-sway 3.6s ease-in-out infinite alternate',
          }}
        >
          <svg
            width="120"
            height="148"
            viewBox="0 0 120 148"
            fill="none"
            className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.9)] overflow-visible"
          >
            <defs>
              {/* Monochromatic Surgical Steel Shackle Shading */}
              <linearGradient id="monoSteelShackle" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="35%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>

              {/* Shackle Metallic Chamfer Highlight */}
              <linearGradient id="shackleHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.5" />
              </linearGradient>

              {/* Blockchain Lock Body Matte Chassis */}
              <linearGradient id="bodyChassis" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="40%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#090d16" />
              </linearGradient>
            </defs>

            {/* A. PADLOCK SHACKLE (MONOCHROME SURGICAL STEEL) */}
            <path
              d="M32 68 V38 C32 22.5 44.5 10 60 10 C75.5 10 88 22.5 88 38 V68"
              stroke="url(#monoSteelShackle)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Shackle Highlight Inner Curve */}
            <path
              d="M32 68 V38 C32 22.5 44.5 10 60 10 C75.5 10 88 22.5 88 38 V68"
              stroke="url(#shackleHighlight)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />

            {/* B. PADLOCK MAIN BODY (TACTICAL BLOCKCHAIN CHASSIS) */}
            <rect
              x="12"
              y="58"
              width="96"
              height="80"
              rx="14"
              fill="url(#bodyChassis)"
              stroke={isHovered ? '#38bdf8' : '#475569'}
              strokeWidth="1.5"
              className="transition-colors duration-300"
            />

            {/* C. ETCHED BLOCKCHAIN LEDGER & HASH TEXTURE ON LOCK FACE */}
            {/* Header divider line */}
            <line
              x1="18"
              y1="70"
              x2="102"
              y2="70"
              stroke="#334155"
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {/* Etched Block Micro-Header */}
            <text
              x="20"
              y="67"
              fill={isHovered ? '#94a3b8' : '#64748b'}
              fontSize="5.5"
              fontFamily="monospace"
              letterSpacing="0.5"
              className="transition-colors duration-300"
            >
              BLOCK:0x4F8B // SHA-256
            </text>

            {/* Etched Merkle Branch Lines */}
            <line x1="20" y1="78" x2="40" y2="78" stroke="#1e293b" strokeWidth="1" />
            <line x1="40" y1="78" x2="40" y2="88" stroke="#1e293b" strokeWidth="1" />
            <line x1="80" y1="78" x2="100" y2="78" stroke="#1e293b" strokeWidth="1" />
            <line x1="80" y1="78" x2="80" y2="88" stroke="#1e293b" strokeWidth="1" />

            {/* Micro Block Node Rectangles */}
            <rect x="20" y="86" width="10" height="6" rx="1" fill="#0b0f19" stroke="#334155" strokeWidth="0.75" />
            <rect x="90" y="86" width="10" height="6" rx="1" fill="#0b0f19" stroke="#334155" strokeWidth="0.75" />

            {/* D. KEYHOLE & CRYPTOGRAPHIC CORE */}
            {/* Keyhole Outer Bezel */}
            <circle
              cx="60"
              cy="92"
              r="13"
              fill="#06090f"
              stroke={isHovered ? '#38bdf8' : '#334155'}
              strokeWidth="1"
              className="transition-colors duration-300"
            />
            {/* Keyhole Slot */}
            <path
              d="M60 86 A5 5 0 0 0 56 94.5 L57 105 A3 3 0 0 0 63 105 L64 94.5 A5 5 0 0 0 60 86 Z"
              fill="#020408"
            />
            {/* Center Status Core Pin */}
            <circle
              cx="60"
              cy="91"
              r="2.5"
              fill="#38bdf8"
              className="animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 4px #38bdf8)',
              }}
            />

            {/* Bottom Ledger Footprint */}
            <text
              x="60"
              y="131"
              textAnchor="middle"
              fill="#475569"
              fontSize="5"
              fontFamily="monospace"
              letterSpacing="0.8"
            >
              IMMUTABLE // VERIFIED
            </text>
          </svg>

          {/* Dotted indicator (3 dots) next to lock */}
          <div className="absolute -right-3 top-10 flex flex-col gap-1 pointer-events-none opacity-60">
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="w-1 h-1 rounded-full bg-slate-500" />
          </div>
        </div>
      </div>

      {/* 6. CLEAN SOLID TACTICAL CTA BUTTON (CENTERED) */}
      <div className="mt-4 relative z-20 flex items-center justify-center w-full">
        <button
          onClick={onCtaClick}
          type="button"
          className="group relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded bg-[#090e17] hover:bg-[#0f172a] border border-slate-700 hover:border-cyan-500/60 text-slate-200 hover:text-white font-mono text-xs tracking-wider shadow-sm transition-all duration-300"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-200 group-hover:text-white font-semibold uppercase">
            {ctaText}
          </span>
          <span className="text-[10px] text-cyan-400 font-mono group-hover:translate-x-0.5 transition-transform">
            [+]
          </span>
        </button>
      </div>

      {/* 7. EMBEDDED CSS ANIMATIONS FOR 60FPS PERFORMANCE */}
      <style>{`
        @keyframes cybee-sway {
          0% {
            transform: translateY(-8px) rotate(9deg);
          }
          50% {
            transform: translateY(2px) rotate(-1deg);
          }
          100% {
            transform: translateY(8px) rotate(-11deg);
          }
        }

        @keyframes cybee-orbit {
          0% {
            transform: rotate(-18deg) translate(125px, 0px) rotate(18deg);
          }
          25% {
            transform: rotate(72deg) translate(85px, 0px) rotate(-72deg);
          }
          50% {
            transform: rotate(162deg) translate(125px, 0px) rotate(-162deg);
          }
          75% {
            transform: rotate(252deg) translate(85px, 0px) rotate(-252deg);
          }
          100% {
            transform: rotate(342deg) translate(125px, 0px) rotate(-342deg);
          }
        }

        @keyframes laser-surge {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -610;
          }
        }

        .animate-laser-surge {
          animation: laser-surge 4.5s linear infinite;
        }

        @keyframes cybee-twinkle-1 {
          0%, 100% { opacity: 0.35; transform: scale(0.75); }
          50% { opacity: 1; transform: scale(1.25); }
        }

        @keyframes cybee-twinkle-2 {
          0%, 100% { opacity: 0.9; transform: scale(1.15); }
          50% { opacity: 0.3; transform: scale(0.7); }
        }

        @keyframes cybee-twinkle-3 {
          0%, 100% { opacity: 0.4; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .animate-cybee-twinkle-1 {
          animation: cybee-twinkle-1 2.8s ease-in-out infinite;
        }
        .animate-cybee-twinkle-2 {
          animation: cybee-twinkle-2 3.2s ease-in-out infinite;
        }
        .animate-cybee-twinkle-3 {
          animation: cybee-twinkle-3 2.4s ease-in-out infinite;
        }
        .animate-cybee-orbit {
          animation: cybee-orbit 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default CybeeLockHero;
