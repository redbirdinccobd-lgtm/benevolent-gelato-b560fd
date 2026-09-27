import React from 'react';

interface LogoSymbolProps {
  type: 'tricircle' | 'geometric' | 'arc' | 'star' | 'bolt' | 'leaf' | 'wave';
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  size?: number;
  className?: string;
  letterMark?: string;
}

export const LogoSymbol: React.FC<LogoSymbolProps> = ({
  type,
  primaryColor,
  secondaryColor,
  accentColor,
  size = 120,
  className = "",
  letterMark = ""
}) => {
  const p = primaryColor;
  const s = secondaryColor;
  const a = accentColor;

  const renderSymbol = () => {
    switch (type) {
      case 'tricircle':
        // Three overlapping dynamic circles representing Hanwha's iconic structure
        return (
          <g>
            {/* Left Circle/Curve */}
            <path
              d="M 35 50 C 35 30, 65 30, 65 50 C 65 70, 35 70, 35 50 Z"
              fill="none"
              stroke={p}
              strokeWidth="12"
              opacity="0.9"
            />
            {/* Top Right Circle/Curve */}
            <path
              d="M 55 35 C 55 15, 85 15, 85 35 C 85 55, 55 55, 55 35 Z"
              fill="none"
              stroke={s}
              strokeWidth="12"
              opacity="0.85"
            />
            {/* Bottom Right Circle/Curve */}
            <path
              d="M 55 65 C 55 45, 85 45, 85 65 C 85 85, 55 85, 55 65 Z"
              fill="none"
              stroke={a}
              strokeWidth="12"
              opacity="0.85"
            />
            {/* Center Intersection Glow / Letter Mark if provided */}
            {letterMark && (
              <text
                x="50"
                y="54"
                fill={p}
                fontSize="12"
                fontWeight="900"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {letterMark.substring(0, 1).toUpperCase()}
              </text>
            )}
          </g>
        );

      case 'geometric':
        // Futuristic diamond composite
        return (
          <g>
            <polygon points="50,15 80,45 50,75 20,45" fill={p} opacity="0.85" />
            <polygon points="50,25 70,45 50,65 30,45" fill={s} />
            <polygon points="50,35 60,45 50,55 40,45" fill={a} />
            <line x1="50" y1="15" x2="50" y2="75" stroke="#fff" strokeWidth="2" opacity="0.4" />
            <line x1="20" y1="45" x2="80" y2="45" stroke="#fff" strokeWidth="2" opacity="0.4" />
          </g>
        );

      case 'arc':
        // Modern circular arcs
        return (
          <g>
            <circle cx="50" cy="50" r="35" fill="none" stroke={p} strokeWidth="8" strokeDasharray="160 80" />
            <circle cx="50" cy="50" r="25" fill="none" stroke={s} strokeWidth="6" strokeDasharray="120 40" transform="rotate(120 50 50)" />
            <circle cx="50" cy="50" r="15" fill="none" stroke={a} strokeWidth="4" strokeDasharray="80 20" transform="rotate(240 50 50)" />
            {letterMark && (
              <text x="50" y="55" fill={p} fontSize="14" fontWeight="800" textAnchor="middle">
                {letterMark.substring(0, 1).toUpperCase()}
              </text>
            )}
          </g>
        );

      case 'star':
        // Dynamic Premium Star symbol
        return (
          <g>
            <polygon
              points="50,12 61,38 88,38 66,54 74,80 50,63 26,80 34,54 12,38 39,38"
              fill={p}
            />
            <polygon
              points="50,25 57,43 76,43 61,54 66,72 50,60 34,72 39,54 24,43 43,43"
              fill={s}
              opacity="0.9"
            />
            <circle cx="50" cy="50" r="6" fill={a} />
          </g>
        );

      case 'bolt':
        // High-energy bolt
        return (
          <g>
            <polygon points="60,10 25,50 48,50 40,90 75,50 52,50" fill={p} />
            <polygon points="55,18 29,48 48,48 41,80 67,48 48,48" fill={s} />
            <circle cx="48" cy="48" r="4" fill={a} />
          </g>
        );

      case 'leaf':
        // Double sustainability leaves
        return (
          <g transform="translate(10, 10) scale(0.8)">
            {/* Primary Leaf */}
            <path
              d="M 50 0 C 75 25, 75 75, 50 100 C 25 75, 25 25, 50 0 Z"
              fill={p}
              opacity="0.9"
            />
            {/* Accent Leaf overlay */}
            <path
              d="M 50 20 C 65 35, 65 70, 50 85 C 35 70, 35 35, 50 20 Z"
              fill={s}
            />
            {/* Center vein */}
            <path
              d="M 50 0 L 50 100"
              stroke={a}
              strokeWidth="4"
              strokeLinecap="round"
              opacity="0.8"
            />
          </g>
        );

      case 'wave':
        // Fluid waves represent energy/expansion
        return (
          <g>
            <path d="M 15 35 Q 32.5 15, 50 35 T 85 35" fill="none" stroke={p} strokeWidth="10" strokeLinecap="round" />
            <path d="M 15 50 Q 32.5 30, 50 50 T 85 50" fill="none" stroke={s} strokeWidth="10" strokeLinecap="round" />
            <path d="M 15 65 Q 32.5 45, 50 65 T 85 65" fill="none" stroke={a} strokeWidth="10" strokeLinecap="round" />
          </g>
        );

      default:
        return <circle cx="50" cy="50" r="40" fill={p} />;
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`select-none ${className}`}
      id="brand-guideline-svg-logo"
    >
      <defs>
        <filter id="logo-shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.1" />
        </filter>
      </defs>
      {renderSymbol()}
    </svg>
  );
};
