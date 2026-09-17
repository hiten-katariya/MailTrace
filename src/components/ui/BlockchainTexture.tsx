import React from 'react';

interface BlockchainTextureProps {
  className?: string;
  opacity?: number;
}

export const BlockchainTexture: React.FC<BlockchainTextureProps> = ({
  className = '',
  opacity = 0.22,
}) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      style={{ opacity }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* ISOMETRIC BLOCKCHAIN BLOCK PATTERN */}
          <pattern
            id="blockchain-pattern"
            width="160"
            height="140"
            patternUnits="userSpaceOnUse"
          >
            {/* 1. Consensus Grid & Chain Link Lines */}
            <line
              x1="0"
              y1="70"
              x2="160"
              y2="70"
              stroke="#334155"
              strokeWidth="0.75"
              strokeDasharray="4 6"
            />
            <line
              x1="80"
              y1="0"
              x2="80"
              y2="140"
              stroke="#334155"
              strokeWidth="0.75"
              strokeDasharray="4 6"
            />
            <line
              x1="0"
              y1="0"
              x2="160"
              y2="140"
              stroke="#1e293b"
              strokeWidth="0.5"
            />
            <line
              x1="160"
              y1="0"
              x2="0"
              y2="140"
              stroke="#1e293b"
              strokeWidth="0.5"
            />

            {/* 2. Primary Isometric Blockchain Block (Center: 80, 70) */}
            {/* Top Facet (Lightest) */}
            <polygon
              points="80,44 104,58 80,72 56,58"
              fill="#1e293b"
              stroke="#475569"
              strokeWidth="1"
            />
            {/* Left Facet (Medium Dark) */}
            <polygon
              points="56,58 80,72 80,98 56,84"
              fill="#0f172a"
              stroke="#334155"
              strokeWidth="1"
            />
            {/* Right Facet (Darkest / Shaded) */}
            <polygon
              points="80,72 104,58 104,84 80,98"
              fill="#0b1120"
              stroke="#334155"
              strokeWidth="1"
            />

            {/* Micro Block Header Label inside the block */}
            <text
              x="80"
              y="60"
              textAnchor="middle"
              fill="#94a3b8"
              fontSize="6"
              fontFamily="monospace"
              letterSpacing="0.5"
            >
              0x8F
            </text>

            {/* 3. Corner Secondary Isometric Blocks */}
            {/* Corner Top-Left (0, 0) */}
            <polygon
              points="0,0 24,14 0,28 -24,14"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.75"
            />
            <polygon
              points="-24,14 0,28 0,54 -24,40"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="0.75"
            />
            <polygon
              points="0,28 24,14 24,40 0,54"
              fill="#0b1120"
              stroke="#1e293b"
              strokeWidth="0.75"
            />

            {/* Corner Bottom-Right (160, 140) */}
            <polygon
              points="160,114 184,128 160,142 136,128"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="0.75"
            />
            <polygon
              points="136,128 160,142 160,168 136,154"
              fill="#0f172a"
              stroke="#1e293b"
              strokeWidth="0.75"
            />
            <polygon
              points="160,142 184,128 184,154 160,168"
              fill="#0b1120"
              stroke="#1e293b"
              strokeWidth="0.75"
            />

            {/* 4. Chain Link Connectors (Dashed Ledger Hashing) */}
            <line
              x1="24"
              y1="28"
              x2="56"
              y2="58"
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 3"
            />
            <line
              x1="104"
              y1="84"
              x2="136"
              y2="114"
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="2 3"
            />

            {/* Consensus Node Points */}
            <circle cx="80" cy="44" r="1.5" fill="#38bdf8" />
            <circle cx="104" cy="84" r="1.5" fill="#94a3b8" />
            <circle cx="56" cy="84" r="1.5" fill="#94a3b8" />
            <circle cx="40" cy="43" r="1" fill="#475569" />
            <circle cx="120" cy="99" r="1" fill="#475569" />

            {/* Micro Hash Stamping */}
            <text
              x="118"
              y="48"
              fill="#475569"
              fontSize="5"
              fontFamily="monospace"
            >
              #BLK.02
            </text>
            <text
              x="22"
              y="105"
              fill="#475569"
              fontSize="5"
              fontFamily="monospace"
            >
              HASH:7E
            </text>
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#blockchain-pattern)" />
      </svg>
    </div>
  );
};

export default BlockchainTexture;
