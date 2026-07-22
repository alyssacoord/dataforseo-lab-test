export const LOCATIONS = [
  { label: 'United Kingdom', location_code: 2826, language_code: 'en' },
  { label: 'United States', location_code: 2840, language_code: 'en' },
  { label: 'Germany', location_code: 2276, language_code: 'de' },
  { label: 'France', location_code: 2250, language_code: 'fr' },
] as const;

export type Location = (typeof LOCATIONS)[number];
