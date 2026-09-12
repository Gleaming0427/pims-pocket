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

  background: '#FDF3E0',
  surface: '#FFFFFF',
  textPrimary: '#2D3436',
  textSecondary: '#636E72',
  textLight: '#B2BEC3',
  border: '#EAE6DC',

  // Même fond chaud partout : parent et enfant partagent le même canvas
  childBg: '#FDF3E0',
  // Surface des cartes côté enfant : blanc chaud qui se détache du fond crème
  childSurface: '#FFFDF8',
  starGold: '#FFD93D',
} as const;

export default colors;
