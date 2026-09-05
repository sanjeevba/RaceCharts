// Fictional annual sales, in thousands. Values follow the order of the countries.
export const countries = [
  { name: 'Canada', code: 'ca', flag: import.meta.env.BASE_URL + 'flags/ca.png', color: '#1565c0' },
  {
    name: 'United States',
    code: 'us',
    flag: import.meta.env.BASE_URL + 'flags/us.png',
    color: '#00897b',
  },
  {
    name: 'Germany',
    code: 'de',
    flag: import.meta.env.BASE_URL + 'flags/de.png',
    color: '#7e57c2',
  },
  { name: 'Japan', code: 'jp', flag: import.meta.env.BASE_URL + 'flags/jp.png', color: '#e07b13' },
  { name: 'India', code: 'in', flag: import.meta.env.BASE_URL + 'flags/in.png', color: '#d14970' },
  { name: 'Brazil', code: 'br', flag: import.meta.env.BASE_URL + 'flags/br.png', color: '#0086a8' },
]

export const raceFrames = [
  { year: 2019, values: [120, 95, 150, 80, 110, 65] },
  { year: 2020, values: [145, 160, 155, 105, 130, 100] },
  { year: 2021, values: [190, 175, 180, 155, 145, 205] },
  { year: 2022, values: [220, 210, 260, 195, 180, 235] },
  { year: 2023, values: [280, 300, 275, 240, 225, 265] },
  { year: 2024, values: [320, 335, 310, 365, 290, 345] },
  { year: 2025, values: [410, 380, 360, 395, 425, 400] },
  { year: 2026, values: [460, 440, 420, 475, 455, 510] },
]
