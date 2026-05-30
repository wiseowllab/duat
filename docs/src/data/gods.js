import { COFFIN_METER } from './balance.js';

const TIER_REQUIRED_METER = COFFIN_METER.requiredByTier;

const TIER_NAMES = {
  1: 'Small Coffin',
  2: 'Medium Coffin',
  3: 'Large Coffin',
  4: 'Maximum Coffin',
};

const COFFIN_SIZES = {
  1: 'small',
  2: 'medium',
  3: 'large',
  4: 'maximum',
};

function createGod(id, name, tier, futureBombType, description) {
  return {
    id,
    name,
    tier,
    tierName: TIER_NAMES[tier],
    coffinSize: COFFIN_SIZES[tier],
    requiredMeter: TIER_REQUIRED_METER[tier],
    futureBombType,
    description,
  };
}

const GOD_DEFINITIONS = [
  createGod('imsety', 'Imsety', 1, 'vertical_clear', 'One of the Four Sons of Horus and guardian of the liver.'),
  createGod('hapy', 'Hapy', 1, 'horizontal_clear', 'One of the Four Sons of Horus and guardian of the lungs.'),
  createGod('duamutef', 'Duamutef', 1, 'cross_clear', 'One of the Four Sons of Horus and guardian of the stomach.'),
  createGod('qebehsenuef', 'Qebehsenuef', 1, 'surround_clear', 'One of the Four Sons of Horus and guardian of the intestines.'),
  createGod('anubis', 'Anubis', 2, 'brain_clear', 'God of mummification and guide through the afterlife.'),
  createGod('thoth', 'Thoth', 2, 'knowledge_convert', 'God of wisdom, writing, and sacred measurement.'),
  createGod('maat', 'Maat', 2, 'protective_clear', 'Goddess of truth, balance, order, and cosmic harmony.'),
  createGod('sekhmet', 'Sekhmet', 2, 'war_burst', 'Lioness goddess of war, fire, and fierce protection.'),
  createGod('horus', 'Horus', 3, 'triple_column_clear', 'Sky god and heir whose restored eye symbolizes protection.'),
  createGod('isis', 'Isis', 3, 'piece_transform', 'Great goddess of magic, restoration, and motherhood.'),
  createGod('osiris', 'Osiris', 3, 'half_board_reset', 'Revived lord of the dead and ruler of the afterlife.'),
  createGod('hathor', 'Hathor', 3, 'chaos_clear', 'Goddess of joy, music, love, and protective renewal.'),
  createGod('ra', 'Ra', 4, 'full_board_clear', 'Sun god whose awakening points toward DUAT\'s ending.'),
  createGod('amun_ra', 'Amun-Ra', 4, 'maximum_coffin_burst', 'King of gods and the final maximum-coffin unlock.'),
];

export const GODS = GOD_DEFINITIONS.map((god, index) => ({
  ...god,
  stage: index + 1,
}));

export const TOTAL_GOD_COUNT = GODS.length;
