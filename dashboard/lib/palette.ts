// Dark-mode categorical + ordinal steps from the design system's validated default
// palette (references/palette.md in the dataviz skill). This app is dark-only.
export const CATEGORICAL = [
  '#3987e5', // 1 blue
  '#008300', // 2 green
  '#d55181', // 3 magenta
  '#c98500', // 4 yellow
  '#199e70', // 5 aqua
  '#d95926', // 6 orange
  '#9085e9', // 7 violet
  '#e66767', // 8 red
] as const;

// Ordinal ramp (single hue, monotone lightness) for ordered categories like age bands.
export const ORDINAL_BLUE = ['#6da7ec', '#3987e5', '#256abf', '#184f95'] as const;

export const CHART_TOKENS = {
  surface: '#1a1a19',
  gridline: '#2c2c2a',
  axis: '#383835',
  textPrimary: '#ffffff',
  textSecondary: '#c3c2b7',
  textMuted: '#898781',
} as const;
