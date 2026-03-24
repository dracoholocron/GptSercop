/**
 * GlobalCMX Logo Component
 * Hexagonal logo inspired by OpenAI style with GCX letters
 */

import { Box } from '@chakra-ui/react';

interface GlobalCMXLogoProps {
  size?: number;
  isDark?: boolean;
  animated?: boolean;
}

export const GlobalCMXLogo = ({
  size = 56,
  isDark = true,
  animated = true
}: GlobalCMXLogoProps) => {
  const primaryColor = isDark ? '#60A5FA' : '#3B82F6';
  const secondaryColor = isDark ? '#38BDF8' : '#0EA5E9';
  const accentColor = isDark ? '#2DD4BF' : '#14B8A6';
  const textColor = isDark ? '#F1F5F9' : '#1E293B';
  const glowColor = isDark ? 'rgba(96, 165, 250, 0.4)' : 'rgba(59, 130, 246, 0.3)';

  return (
    <Box
      width={`${size}px`}
      height={`${size}px`}
      position="relative"
      sx={animated ? {
        '& .logo-ring': {
          animation: 'rotate 20s linear infinite',
        },
        '& .logo-pulse': {
          animation: 'pulse-glow 3s ease-in-out infinite',
        },
        '@keyframes rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        '@keyframes pulse-glow': {
          '0%, 100%': { opacity: 0.6 },
          '50%': { opacity: 1 },
        },
      } : {}}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for the hexagon */}
          <linearGradient id="hexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="50%" stopColor={secondaryColor} />
            <stop offset="100%" stopColor={accentColor} />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Inner shadow */}
          <filter id="innerShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feOffset dx="0" dy="1" />
            <feGaussianBlur stdDeviation="1" result="offset-blur" />
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" />
            <feFlood floodColor="black" floodOpacity="0.2" result="color" />
            <feComposite operator="in" in="color" in2="inverse" result="shadow" />
            <feComposite operator="over" in="shadow" in2="SourceGraphic" />
          </filter>
        </defs>

        {/* Background glow pulse */}
        <circle
          className="logo-pulse"
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={glowColor}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Outer rotating ring with segments */}
        <g className="logo-ring" style={{ transformOrigin: '50px 50px' }}>
          {/* Hexagon outline segments */}
          <path
            d="M50 8 L85 27 L85 73 L50 92 L15 73 L15 27 Z"
            fill="none"
            stroke="url(#hexGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="30 10"
            filter="url(#glow)"
          />
        </g>

        {/* Inner hexagon - static */}
        <path
          d="M50 16 L78 32 L78 68 L50 84 L22 68 L22 32 Z"
          fill={isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(248, 250, 252, 0.9)'}
          stroke="url(#hexGradient)"
          strokeWidth="1.5"
          filter="url(#innerShadow)"
        />

        {/* Decorative corner nodes */}
        <circle cx="50" cy="16" r="3" fill={primaryColor} filter="url(#glow)" />
        <circle cx="78" cy="32" r="2.5" fill={secondaryColor} filter="url(#glow)" />
        <circle cx="78" cy="68" r="2.5" fill={secondaryColor} filter="url(#glow)" />
        <circle cx="50" cy="84" r="3" fill={accentColor} filter="url(#glow)" />
        <circle cx="22" cy="68" r="2.5" fill={secondaryColor} filter="url(#glow)" />
        <circle cx="22" cy="32" r="2.5" fill={secondaryColor} filter="url(#glow)" />

        {/* Connecting lines from center */}
        <g opacity="0.3">
          <line x1="50" y1="50" x2="50" y2="20" stroke={primaryColor} strokeWidth="0.5" />
          <line x1="50" y1="50" x2="76" y2="35" stroke={secondaryColor} strokeWidth="0.5" />
          <line x1="50" y1="50" x2="76" y2="65" stroke={secondaryColor} strokeWidth="0.5" />
          <line x1="50" y1="50" x2="50" y2="80" stroke={accentColor} strokeWidth="0.5" />
          <line x1="50" y1="50" x2="24" y2="65" stroke={secondaryColor} strokeWidth="0.5" />
          <line x1="50" y1="50" x2="24" y2="35" stroke={secondaryColor} strokeWidth="0.5" />
        </g>

        {/* GCX Text */}
        <text
          x="50"
          y="56"
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="18"
          fontWeight="bold"
          fill={textColor}
          letterSpacing="1"
        >
          GCX
        </text>

        {/* Subtle underline accent */}
        <line
          x1="32"
          y1="62"
          x2="68"
          y2="62"
          stroke="url(#hexGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
    </Box>
  );
};

export default GlobalCMXLogo;
