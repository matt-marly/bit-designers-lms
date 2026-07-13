export const tokens = {
  colors: {
    // Fill in from brand assets when ready.
    // Placeholders for now — we will replace in art direction stage.
    background: '#0A0A0A',
    surface: '#111111',
    surfaceElevated: '#1A1A1A',
    border: '#222222',
    borderSubtle: '#1A1A1A',
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A0A0',
    textMuted: '#555555',
    accent: '#F7931A',       // Bitcoin orange — use sparingly
    accentSubtle: '#1A1100',
    success: '#22C55E',
    warning: '#EAB308',
    error: '#EF4444',
    info: '#3B82F6',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  font: {
    sans: 'var(--font-sans)',
    mono: 'var(--font-mono)',
  },
  spacing: {
    page: '1rem',         // mobile page padding
    pageDesktop: '2rem',  // desktop page padding
    maxWidth: '1200px',
  },
} as const

export type Tokens = typeof tokens
