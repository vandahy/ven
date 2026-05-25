export const Colors = {
  primary: '#937DFF',
  primaryDark: '#7B68D9',
  primaryLight: '#CABEFF',
  primarySubtle: 'rgba(147, 125, 255, 0.2)',

  secondary: '#45DFA4',
  secondaryDark: '#3BC990',

  background: '#111319',
  backgroundAlt: '#1E1332',
  surface: '#1E1F26',
  surfaceLight: '#282A30',
  surfaceCard: '#1A1B23',
  surfaceDim: '#191B22',
  surfaceTab: '#33343B',

  textPrimary: '#E2E2EB',
  textSecondary: '#C9C4D8',
  textMuted: '#484555',
  textDimmed: '#938EA1',

  danger: '#FFB4AB',
  dangerDark: '#E8968E',
  warning: '#FFD93D',
  success: '#45DFA4',

  border: 'rgba(72, 69, 85, 0.3)',
  borderSubtle: 'rgba(72, 69, 85, 0.1)',
  borderFaint: 'rgba(72, 69, 85, 0.05)',

  badgeActiveBg: 'rgba(147, 125, 255, 0.2)',
  badgeActiveBorder: 'rgba(202, 190, 255, 0.2)',
  badgeCompletedBg: '#33343B',
  badgeCompletedBorder: 'rgba(147, 142, 161, 0.2)',

  navBackground: 'rgba(30, 31, 38, 0.8)',

  overlay: 'rgba(0, 0, 0, 0.5)',
  white: '#FFFFFF',
} as const;

export const AvatarColors = [
  '#6366F1',
  '#EC4899',
  '#EAB308',
  '#22C55E',
  '#3B82F6',
  '#F97316',
  '#14B8A6',
  '#8B5CF6',
  '#EF4444',
  '#06B6D4',
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 28,
  hero: 30,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;
