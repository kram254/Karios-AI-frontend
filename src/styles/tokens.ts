/**
 * tokens.ts — Single source of truth for the Karios design language.
 *
 * Every colour, radius, shadow, and motion value used in the app should
 * live here and be consumed via:
 *   - This file directly in MUI theme / framer-motion / inline styles
 *   - tailwind.config.js (values mirrored there for Tailwind classes)
 *   - CSS custom properties injected via index.css :root {}
 *
 * Theme: Dark neon — near-black surfaces, cyan primary, magenta accent.
 */

// ---------------------------------------------------------------------------
// Brand / Accent
// ---------------------------------------------------------------------------
export const brand = {
  /** Primary action colour — cyan glow */
  cyan: '#00F3FF',
  /** Secondary accent — magenta/pink */
  magenta: '#FF00B8',
  /** Tertiary accent — violet/purple */
  purple: '#8B5CF6',
  /** Softer purple for canvas backgrounds */
  purpleSoft: 'rgba(139, 92, 246, 0.09)',
  /** Softer cyan for canvas backgrounds */
  cyanSoft: 'rgba(0, 243, 255, 0.07)',
} as const;

// ---------------------------------------------------------------------------
// Surface / Background
// ---------------------------------------------------------------------------
export const surface = {
  /** Page background — deepest layer */
  base: '#080808',
  /** Slightly lifted — sidebar, panels */
  raised: '#0F1012',
  /** Cards, MUI Paper */
  overlay: '#1A1A1A',
  /** Dropdowns, tooltips, elevated modals */
  elevated: '#242428',
  /** Canvas background start */
  canvasStart: '#14171F',
  /** Canvas background mid */
  canvasMid: '#1A1D26',
} as const;

// ---------------------------------------------------------------------------
// Borders
// ---------------------------------------------------------------------------
export const border = {
  /** Default subtle border */
  default: 'rgba(255, 255, 255, 0.08)',
  /** Hover state */
  hover: 'rgba(0, 243, 255, 0.25)',
  /** Active / focused state */
  active: 'rgba(0, 243, 255, 0.50)',
  /** Dividers between sections */
  divider: 'rgba(255, 255, 255, 0.05)',
} as const;

// ---------------------------------------------------------------------------
// Typography / Text
// ---------------------------------------------------------------------------
export const text = {
  primary: '#FFFFFF',
  secondary: 'rgba(255, 255, 255, 0.65)',
  tertiary: 'rgba(255, 255, 255, 0.38)',
  disabled: 'rgba(255, 255, 255, 0.25)',
  accent: '#00F3FF',
  /** For code blocks / monospace spans */
  code: 'rgba(0, 243, 255, 0.85)',
} as const;

export const fontFamily = {
  sans: '"Inter", "Roboto", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", "Source Code Pro", monospace',
} as const;

// ---------------------------------------------------------------------------
// Status colours
// ---------------------------------------------------------------------------
export const status = {
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.12)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.12)',
  info: '#00F3FF',
  infoBg: 'rgba(0, 243, 255, 0.10)',
  /** Agent running / processing */
  running: '#00F3FF',
  /** Agent idle / ready */
  idle: 'rgba(255, 255, 255, 0.38)',
  /** Agent completed */
  done: '#10B981',
  /** Agent errored */
  errored: '#EF4444',
} as const;

// ---------------------------------------------------------------------------
// Border radius
// ---------------------------------------------------------------------------
export const radius = {
  xs: '2px',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '24px',
  full: '9999px',
} as const;

// ---------------------------------------------------------------------------
// Shadows / Glows
// ---------------------------------------------------------------------------
export const shadow = {
  /** Subtle card elevation */
  card: '0 4px 24px rgba(0, 0, 0, 0.60)',
  /** Deep modal elevation */
  modal: '0 8px 48px rgba(0, 0, 0, 0.80)',
  /** Cyan glow — primary action */
  glowCyan: '0 0 16px rgba(0, 243, 255, 0.35)',
  /** Cyan glow — stronger (hover states) */
  glowCyanStrong: '0 0 28px rgba(0, 243, 255, 0.55)',
  /** Magenta glow — secondary accent */
  glowMagenta: '0 0 16px rgba(255, 0, 184, 0.35)',
  /** Purple glow */
  glowPurple: '0 0 16px rgba(139, 92, 246, 0.35)',
  /** Inset glow for active inputs */
  inputActive: 'inset 0 0 0 1.5px rgba(0, 243, 255, 0.50), 0 0 12px rgba(0, 243, 255, 0.20)',
} as const;

// ---------------------------------------------------------------------------
// Motion
// ---------------------------------------------------------------------------
export const motion = {
  /** Very quick micro-interactions (icon swaps, badge counts) */
  fast: 120,
  /** Standard transitions (hover, focus) */
  base: 200,
  /** Page transitions, panel slides */
  slow: 350,
  /** Spring for cards/modals appearing */
  spring: [0.34, 1.56, 0.64, 1] as [number, number, number, number],
  /** Standard ease */
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  /** Ease out — for elements leaving the screen */
  easeOut: [0.0, 0, 0.2, 1] as [number, number, number, number],
} as const;

// ---------------------------------------------------------------------------
// Spacing scale (mirrors Tailwind's 4px grid, exported for programmatic use)
// ---------------------------------------------------------------------------
export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// ---------------------------------------------------------------------------
// Z-index scale
// ---------------------------------------------------------------------------
export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ---------------------------------------------------------------------------
// MUI theme object — import and spread into createTheme()
// ---------------------------------------------------------------------------
export const muiTheme = {
  palette: {
    mode: 'dark' as const,
    primary: {
      main: brand.cyan,
      contrastText: '#000000',
    },
    secondary: {
      main: brand.magenta,
      contrastText: '#000000',
    },
    background: {
      default: surface.base,
      paper: surface.overlay,
    },
    text: {
      primary: text.primary,
      secondary: text.secondary,
      disabled: text.disabled,
    },
    success: { main: status.success },
    warning: { main: status.warning },
    error: { main: status.error },
    info: { main: status.info },
    divider: border.divider,
  },
  typography: {
    fontFamily: fontFamily.sans,
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        contained: {
          backgroundColor: brand.cyan,
          color: '#000000',
          fontWeight: 600,
          '&:hover': {
            backgroundColor: '#00D1DD',
            boxShadow: shadow.glowCyan,
          },
        },
        outlined: {
          borderColor: border.default,
          color: text.primary,
          '&:hover': {
            borderColor: border.hover,
            color: brand.cyan,
            backgroundColor: 'rgba(0, 243, 255, 0.05)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: surface.overlay,
          backgroundImage: 'none',
          border: `1px solid ${border.default}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: border.divider },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: surface.elevated,
          border: `1px solid ${border.default}`,
          color: text.primary,
          fontSize: '12px',
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            boxShadow: shadow.inputActive,
          },
        },
      },
    },
  },
} as const;

// ---------------------------------------------------------------------------
// CSS Custom Properties string (inject into :root in index.css or a style tag)
// ---------------------------------------------------------------------------
export const cssVars = `
  --color-brand-cyan: ${brand.cyan};
  --color-brand-magenta: ${brand.magenta};
  --color-brand-purple: ${brand.purple};
  --color-surface-base: ${surface.base};
  --color-surface-raised: ${surface.raised};
  --color-surface-overlay: ${surface.overlay};
  --color-surface-elevated: ${surface.elevated};
  --color-border-default: ${border.default};
  --color-border-hover: ${border.hover};
  --color-border-active: ${border.active};
  --color-text-primary: ${text.primary};
  --color-text-secondary: ${text.secondary};
  --color-text-tertiary: ${text.tertiary};
  --color-text-accent: ${text.accent};
  --color-status-success: ${status.success};
  --color-status-warning: ${status.warning};
  --color-status-error: ${status.error};
  --color-status-info: ${status.info};
  --shadow-card: ${shadow.card};
  --shadow-glow-cyan: ${shadow.glowCyan};
  --radius-md: ${radius.md};
  --radius-lg: ${radius.lg};
  --radius-xl: ${radius.xl};
  --motion-fast: ${motion.fast}ms;
  --motion-base: ${motion.base}ms;
  --motion-slow: ${motion.slow}ms;
`;
