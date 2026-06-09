const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

const SIGN_NAMES_HI = [
  'मेष', 'वृष', 'मिथुन', 'कर्क', 'सिंह', 'कन्या',
  'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन',
];

const PLANET_ABBR = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', Rahu: 'Ra', Ketu: 'Ke',
};

const PLANET_ABBR_HI = {
  Sun: 'सू', Moon: 'च', Mars: 'मं', Mercury: 'बु', Jupiter: 'गु',
  Venus: 'शु', Saturn: 'श', Rahu: 'रा', Ketu: 'के',
};

const DASHA_SEQUENCE = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const TOTAL_DASHA_YEARS = 120;

const NAKSHATRA_LORDS = [];
for (let i = 0; i < 27; i += 1) {
  NAKSHATRA_LORDS.push(DASHA_SEQUENCE[i % 9]);
}

const EXALTATION = {
  Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo',
  Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
};
const DEBILITATION = {
  Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces',
  Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
};

const SIGN_LORDS = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon',
  Leo: 'Sun', Virgo: 'Mercury', Libra: 'Venus', Scorpio: 'Mars',
  Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

const KENDRA_HOUSES = [1, 4, 7, 10];
const TRIKONA_HOUSES = [1, 5, 9];

const HOUSE_CAREER_THEMES = {
  1: 'self-drive, personal brand, and how you initiate professional life',
  2: 'earned income, speech-based careers, and family business resources',
  3: 'communication, sales, media, short travels, and skill-based hustle',
  4: 'home-based work, education, property, and emotional security in career',
  5: 'creativity, speculation, teaching, advisory roles, and intellectual authority',
  6: 'service, healthcare, litigation, competition, and daily work discipline',
  7: 'partnerships, clients, public contracts, and business alliances',
  8: 'research, occult sciences, insurance, transformation, and crisis management',
  9: 'higher education, law, philosophy, long-distance ventures, and mentorship',
  10: 'career status, public reputation, authority, and professional destiny',
  11: 'networks, large organizations, gains from profession, and ambition fulfillment',
  12: 'foreign lands, isolation, spirituality, and behind-the-scenes institutions',
};

module.exports = {
  SIGN_NAMES,
  SIGN_NAMES_HI,
  PLANET_ABBR,
  PLANET_ABBR_HI,
  DASHA_SEQUENCE,
  DASHA_YEARS,
  TOTAL_DASHA_YEARS,
  NAKSHATRA_LORDS,
  EXALTATION,
  DEBILITATION,
  SIGN_LORDS,
  KENDRA_HOUSES,
  TRIKONA_HOUSES,
  HOUSE_CAREER_THEMES,
};
