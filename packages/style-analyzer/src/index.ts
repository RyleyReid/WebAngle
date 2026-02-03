export interface StyleSignals {
  fontCount: number;
  colorCount: number;
  baseFontSize: number;
  lineHeight: number;
  usesCssVariables: boolean;
  maxContentWidth: number;
}

export interface StyleScore {
  score: number;
  notes: string[];
}

export function scoreStyles(s: StyleSignals): StyleScore {
  let score = 100;
  const notes: string[] = [];

  if (s.fontCount > 3) {
    score -= 15;
    notes.push("Too many fonts used");
  }

  if (s.colorCount > 12) {
    score -= 15;
    notes.push("Excessive number of colors");
  }

  if (!s.usesCssVariables) {
    score -= 20;
    notes.push("No CSS variables / design tokens detected");
  }

  if (s.baseFontSize < 14) {
    score -= 10;
    notes.push("Small base font size");
  }

  if (s.maxContentWidth > 1600) {
    score -= 10;
    notes.push("Very wide layout reduces readability");
  }

  return {
    score: Math.max(score, 30), // never zero unless truly broken
    notes,
  };
}
