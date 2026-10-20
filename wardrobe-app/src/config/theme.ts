export const colors = {
  background: '#FAF8F5',
  surface: '#FFFFFF',
  text: '#1F1B16',
  textMuted: '#6B645C',
  primary: '#2F4A3A',
  primaryText: '#FFFFFF',
  border: '#E3DED6',
  chip: '#F1EDE7',
  chipSelected: '#2F4A3A',
  danger: '#B3261E',
  warning: '#8A6100',
  warningBackground: '#FFF4D6',
  infoBackground: '#E8F0EA',
  overlay: 'rgba(0,0,0,0.45)',
  tier: {
    premium: '#2F6B3F',
    good: '#4E7D3A',
    average: '#8A6100',
    low: '#B3261E',
    unknown: '#6B645C',
  },
} as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const radius = { sm: 8, md: 12, lg: 20, pill: 999 } as const;

export const fontSize = { sm: 13, md: 15, lg: 18, xl: 22, xxl: 28 } as const;

/** Plan §2: minimum 48 dp touch targets. */
export const MIN_TOUCH = 48;
