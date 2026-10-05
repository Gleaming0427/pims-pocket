const canvas = '#F3F5F9';
const surface = '#FFFFFF';
const canvasMuted = '#E5E9F0';

const colors = {
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#5A4BD1',

  secondary: '#00CEC9',
  accent: '#FDCB6E',
  accentOrange: '#F39C12',

  success: '#00B894',
  warning: '#FDCB6E',
  error: '#E17055',
  info: '#74B9FF',

  background: canvas,
  canvas,
  canvasMuted,
  surface,
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#7B8386',
  border: canvasMuted,

  childBg: canvas,
  childSurface: surface,
  starGold: '#FFD93D',
} as const;

export default colors;
