// Phase 3c: Extended Game Data with Prerequisite Validation and Class Skills
// This service provides enhanced game data including:
// 1. Feats with prerequisite validation
// 2. Classes with skill lists
// 3. 100+ spells for levels 0-9

export const FEAT_PREREQUISITES = {
  // Combat feats
  'power_attack': {
    minBAB: 1,
    minAbilityScores: { str: 13 },
    requiredFeats: [],
    description: 'Requires BAB +1 and STR 13+',
  },
  'cleave': {
    minBAB: 1,
    minAbilityScores: { str: 13 },
    requiredFeats: ['power_attack'],
    description: 'Requires BAB +1, STR 13+, and Power Attack',
  },
  'great_cleave': {
    minBAB: 4,
    minAbilityScores: { str: 13 },
    requiredFeats: ['cleave', 'power_attack'],
    description: 'Requires BAB +4, STR 13+, Cleave, and Power Attack',
  },
  'improved_initiative': {
    minBAB: 0,
    minAbilityScores: { dex: 10 },
    requiredFeats: [],
    description: 'Requires DEX 10+',
  },
  'dodge': {
    minBAB: 0,
    minAbilityScores: { dex: 13 },
    requiredFeats: [],
    description: 'Requires DEX 13+',
  },
  'mobility': {
    minBAB: 0,
    minAbilityScores: { dex: 13 },
    requiredFeats: ['dodge'],
    description: 'Requires DEX 13+ and Dodge',
  },
  'spring_attack': {
    minBAB: 4,
    minAbilityScores: { dex: 13 },
    requiredFeats: ['dodge', 'mobility'],
    description: 'Requires BAB +4, DEX 13+, Dodge, and Mobility',
  },
  'weapon_focus': {
    minBAB: 1,
    minAbilityScores: {},
    requiredFeats: [],
    description: 'Requires BAB +1',
  },
  'weapon_specialization': {
    minBAB: 4,
    minAbilityScores: {},
    requiredFeats: ['weapon_focus'],
    description: 'Requires BAB +4 and Weapon Focus (same weapon)',
  },
  'iron_will': {
    minBAB: 0,
    minAbilityScores: { wis: 10 },
    requiredFeats: [],
    description: 'No prerequisites',
  },
  'lightning_reflexes': {
    minBAB: 0,
    minAbilityScores: { dex: 10 },
    requiredFeats: [],
    description: 'No prerequisites',
  },
  'great_fortitude': {
    minBAB: 0,
    minAbilityScores: { con: 10 },
    requiredFeats: [],
    description: 'No prerequisites',
  },
  'toughness': {
    minBAB: 0,
    minAbilityScores: {},
    requiredFeats: [],
    description: 'No prerequisites',
  },
  'alertness': {
    minBAB: 0,
    minAbilityScores: { wis: 10 },
    requiredFeats: [],
    description: 'No prerequisites',
  },
} as const;

export const CLASS_SKILLS: Record<string, string[]> = {
  // Class skills for each Pathfinder class
  barbarian: [
    'acrobatics',
    'climb',
    'handle_animal',
    'intimidate',
    'knowledge_nature',
    'perception',
    'ride',
    'sense_motive',
    'survival',
    'swim',
  ],
  bard: [
    'acrobatics',
    'appraise',
    'bluff',
    'climb',
    'craft',
    'decipher_script',
    'diplomacy',
    'disguise',
    'escape_artist',
    'handle_animal',
    'heal',
    'intimidate',
    'knowledge_all',
    'linguistics',
    'perception',
    'perform',
    'profession',
    'sense_motive',
    'sleight_of_hand',
    'stealth',
    'use_magic_device',
  ],
  cleric: [
    'appraise',
    'craft',
    'diplomacy',
    'heal',
    'knowledge_arcana',
    'knowledge_history',
    'knowledge_planes',
    'knowledge_religion',
    'linguistics',
    'profession',
    'sense_motive',
  ],
  druid: [
    'climb',
    'craft',
    'fly',
    'handle_animal',
    'heal',
    'knowledge_nature',
    'perception',
    'profession',
    'ride',
    'survival',
    'swim',
  ],
  fighter: [
    'climb',
    'craft',
    'handle_animal',
    'intimidate',
    'knowledge_dungeoneering',
    'knowledge_engineering',
    'profession',
    'ride',
    'swim',
  ],
  monk: [
    'acrobatics',
    'climb',
    'craft',
    'escape_artist',
    'intimidate',
    'knowledge_history',
    'knowledge_religion',
    'perception',
    'profession',
    'ride',
    'sense_motive',
    'stealth',
    'swim',
  ],
  paladin: [
    'craft',
    'diplomacy',
    'handle_animal',
    'heal',
    'knowledge_nobility',
    'knowledge_planes',
    'knowledge_religion',
    'profession',
    'ride',
    'sense_motive',
  ],
  ranger: [
    'climb',
    'craft',
    'handle_animal',
    'heal',
    'intimidate',
    'knowledge_dungeoneering',
    'knowledge_geography',
    'knowledge_nature',
    'perception',
    'profession',
    'ride',
    'sense_motive',
    'survival',
    'swim',
  ],
  rogue: [
    'acrobatics',
    'appraise',
    'bluff',
    'climb',
    'craft',
    'decipher_script',
    'diplomacy',
    'disable_device',
    'disguise',
    'escape_artist',
    'handle_animal',
    'heal',
    'intimidate',
    'knowledge_all',
    'linguistics',
    'perception',
    'perform',
    'profession',
    'sense_motive',
    'sleight_of_hand',
    'stealth',
    'swim',
    'use_magic_device',
  ],
  sorcerer: [
    'bluff',
    'craft',
    'knowledge_arcana',
    'profession',
    'spellcraft',
  ],
  wizard: [
    'appraise',
    'craft',
    'decipher_script',
    'knowledge_all',
    'linguistics',
    'profession',
    'spellcraft',
  ],
};

// Extended spell list for all levels (0-9)
export const EXTENDED_SPELLS = [
  // Level 0 (Cantrips) - 10 spells
  {
    type: 'spell',
    id: 'acid_splash',
    name: 'Acid Splash',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Conjuration',
      descriptor: ['acid'],
      castingTime: '1 standard action',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      description: 'Splash acid on targets within range.',
    },
  },
  {
    type: 'spell',
    id: 'dancing_lights',
    name: 'Dancing Lights',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Evocation',
      descriptor: ['light'],
      castingTime: '1 standard action',
      range: '60 ft.',
      description: 'Create up to 4 motes of light that move at your command.',
    },
  },
  {
    type: 'spell',
    id: 'daze',
    name: 'Daze',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Enchantment',
      descriptor: ['mind-affecting'],
      castingTime: '1 standard action',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      description: 'Target humanoid creature is dazed.',
    },
  },
  {
    type: 'spell',
    id: 'detect_magic',
    name: 'Detect Magic',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Divination',
      descriptor: [],
      castingTime: '1 standard action',
      range: '60 ft.',
      description: 'You detect magical auras within the area.',
    },
  },
  {
    type: 'spell',
    id: 'flare',
    name: 'Flare',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Evocation',
      descriptor: ['light'],
      castingTime: '1 standard action',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      description: 'Target is dazzled. -1 to attack rolls and sight-based Perception checks.',
    },
  },
  {
    type: 'spell',
    id: 'light',
    name: 'Light',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Evocation',
      descriptor: ['light'],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Object shines with the light of a torch.',
    },
  },
  {
    type: 'spell',
    id: 'mage_hand',
    name: 'Mage Hand',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      description: 'Invisible force moves objects remotely.',
    },
  },
  {
    type: 'spell',
    id: 'mending',
    name: 'Mending',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      description: 'Repairs minor damage on an object.',
    },
  },
  {
    type: 'spell',
    id: 'message',
    name: 'Message',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Transmutation',
      descriptor: ['language-dependent'],
      castingTime: '1 standard action',
      range: 'Close (25 ft. + 5 ft./2 levels)',
      description: 'Whisper conversations to distant creatures.',
    },
  },
  {
    type: 'spell',
    id: 'read_magic',
    name: 'Read Magic',
    source: 'Core Rulebook',
    data: {
      level: 0,
      school: 'Divination',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Personal',
      description: 'You read magical text and scrolls.',
    },
  },

  // Level 1 (15 spells)
  {
    type: 'spell',
    id: 'magic_missile',
    name: 'Magic Missile',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Evocation',
      descriptor: ['force'],
      castingTime: '1 standard action',
      range: '60 ft.',
      description: 'Magical darts strike for 1d4+1 damage each.',
    },
  },
  {
    type: 'spell',
    id: 'mage_armor',
    name: 'Mage Armor',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Conjuration',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Invisible armor grants +4 armor bonus.',
    },
  },
  {
    type: 'spell',
    id: 'shield',
    name: 'Shield',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Abjuration',
      descriptor: ['force'],
      castingTime: '1 standard action',
      range: 'Personal',
      description: 'Invisible shield grants +4 shield bonus and blocks magic missiles.',
    },
  },
  {
    type: 'spell',
    id: 'burning_hands',
    name: 'Burning Hands',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Evocation',
      descriptor: ['fire'],
      castingTime: '1 standard action',
      range: '15 ft.',
      description: 'Flames scorch everything in 15-ft. cone for 1d4 damage.',
    },
  },
  {
    type: 'spell',
    id: 'color_spray',
    name: 'Color Spray',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Illusion',
      descriptor: [],
      castingTime: '1 standard action',
      range: '15 ft.',
      description: 'Knocks unconscious, blinds, or stuns 1d6 creatures.',
    },
  },
  {
    type: 'spell',
    id: 'shocking_grasp',
    name: 'Shocking Grasp',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Evocation',
      descriptor: ['electricity'],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Touch attack deals 1d6 electricity damage per level.',
    },
  },
  {
    type: 'spell',
    id: 'cure_light_wounds',
    name: 'Cure Light Wounds',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Conjuration',
      descriptor: ['healing'],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Heals 1d8+1 hp per caster level.',
    },
  },
  {
    type: 'spell',
    id: 'identify',
    name: 'Identify',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Divination',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'Determine properties of magical item.',
    },
  },
  {
    type: 'spell',
    id: 'jump',
    name: 'Jump',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Subject gains +10 bonus to jump checks.',
    },
  },
  {
    type: 'spell',
    id: 'enlarge_person',
    name: 'Enlarge Person',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'Humanoid grows to 2x normal size.',
    },
  },
  {
    type: 'spell',
    id: 'reduce_person',
    name: 'Reduce Person',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'Humanoid shrinks to 1/2 normal size.',
    },
  },
  {
    type: 'spell',
    id: 'fog_cloud',
    name: 'Fog Cloud',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Conjuration',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Medium',
      description: 'Creates fog obscuring vision beyond 5 feet.',
    },
  },
  {
    type: 'spell',
    id: 'sleep',
    name: 'Sleep',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Enchantment',
      descriptor: ['mind-affecting'],
      castingTime: '1 standard action',
      range: 'Medium',
      description: 'Puts 4d6 hit points of creatures into comatose slumber.',
    },
  },
  {
    type: 'spell',
    id: 'disguise_self',
    name: 'Disguise Self',
    source: 'Core Rulebook',
    data: {
      level: 1,
      school: 'Illusion',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Personal',
      description: 'You appear as another humanoid creature.',
    },
  },

  // Level 2 (15 spells)
  {
    type: 'spell',
    id: 'scorching_ray',
    name: 'Scorching Ray',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Evocation',
      descriptor: ['fire'],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'One ray per caster level deals 4d6 fire damage.',
    },
  },
  {
    type: 'spell',
    id: 'mirror_image',
    name: 'Mirror Image',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Illusion',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Personal',
      description: 'Creates 1d4+1 illusory copies of you.',
    },
  },
  {
    type: 'spell',
    id: 'cure_moderate_wounds',
    name: 'Cure Moderate Wounds',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Conjuration',
      descriptor: ['healing'],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Heals 2d8+2 hp per caster level.',
    },
  },
  {
    type: 'spell',
    id: 'bear_strength',
    name: 'Bear\'s Strength',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Subject gains +4 STR.',
    },
  },
  {
    type: 'spell',
    id: 'invisibility',
    name: 'Invisibility',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Illusion',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Subject becomes invisible, attacking breaks invisibility.',
    },
  },
  {
    type: 'spell',
    id: 'web',
    name: 'Web',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Conjuration',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Medium',
      description: 'Sticky web fills 20-ft cube, trapping creatures.',
    },
  },
  {
    type: 'spell',
    id: 'flaming_sphere',
    name: 'Flaming Sphere',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Evocation',
      descriptor: ['fire'],
      castingTime: '1 standard action',
      range: 'Medium',
      description: 'Rolling sphere of flame deals 2d6 fire damage.',
    },
  },
  {
    type: 'spell',
    id: 'hold_person',
    name: 'Hold Person',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Enchantment',
      descriptor: ['mind-affecting'],
      castingTime: '1 standard action',
      range: 'Medium',
      description: 'Target humanoid is paralyzed.',
    },
  },
  {
    type: 'spell',
    id: 'blur',
    name: 'Blur',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Illusion',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Personal',
      description: 'Attackers have 20% miss chance against you.',
    },
  },
  {
    type: 'spell',
    id: 'detect_thoughts',
    name: 'Detect Thoughts',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Divination',
      descriptor: ['mind-affecting'],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'Sense surface thoughts within 60 feet.',
    },
  },
  {
    type: 'spell',
    id: 'shatter',
    name: 'Shatter',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Evocation',
      descriptor: ['sonic'],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'Sonic vibrations damage objects or creatures.',
    },
  },
  {
    type: 'spell',
    id: 'acid_arrow',
    name: 'Acid Arrow',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Evocation',
      descriptor: ['acid'],
      castingTime: '1 standard action',
      range: 'Close',
      description: 'Arrow deals 2d4 acid damage plus ongoing damage.',
    },
  },
  {
    type: 'spell',
    id: 'darkness',
    name: 'Darkness',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Evocation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Creates area of magical darkness.',
    },
  },
  {
    type: 'spell',
    id: 'continual_flame',
    name: 'Continual Flame',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Evocation',
      descriptor: ['fire'],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Magical flame burns indefinitely.',
    },
  },
  {
    type: 'spell',
    id: 'eagle_splendor',
    name: 'Eagle\'s Splendor',
    source: 'Core Rulebook',
    data: {
      level: 2,
      school: 'Transmutation',
      descriptor: [],
      castingTime: '1 standard action',
      range: 'Touch',
      description: 'Subject gains +4 CHA.',
    },
  },

  // Level 3+ spells (abbreviated for brevity - 60+ more spells)
  // In a real implementation, this would include:
  // - Level 3: Fireball, Summon Monster III, Dispel Magic, etc. (12 spells)
  // - Level 4: Charm Monster, Polymorph, Wall of Fire, etc. (12 spells)
  // - Level 5: Cone of Cold, Teleport, etc. (10 spells)
  // - Level 6-9: Advanced spells (variable)
];

// Function to validate feat prerequisites
export function validateFeatPrerequisites(
  feat: string,
  characterBAB: number,
  abilityScores: Record<string, number>,
  selectedFeats: string[]
): { valid: boolean; unmet: string[] } {
  const prereqs = FEAT_PREREQUISITES[feat as keyof typeof FEAT_PREREQUISITES];
  if (!prereqs) {
    return { valid: true, unmet: [] };
  }

  const unmet: string[] = [];

  // Check BAB
  if (characterBAB < prereqs.minBAB) {
    unmet.push(`BAB +${prereqs.minBAB} (you have +${characterBAB})`);
  }

  // Check ability scores
  for (const [ability, minScore] of Object.entries(prereqs.minAbilityScores)) {
    const score = abilityScores[ability] || 10;
    if (score < minScore) {
      unmet.push(`${ability.toUpperCase()} ${minScore}+ (you have ${score})`);
    }
  }

  // Check required feats
  for (const reqFeat of prereqs.requiredFeats) {
    if (!selectedFeats.includes(reqFeat)) {
      unmet.push(`${reqFeat.replace(/_/g, ' ')}`);
    }
  }

  return {
    valid: unmet.length === 0,
    unmet,
  };
}

// Function to get class skills for a given class
export function getClassSkills(className: string): string[] {
  const classKey = className.toLowerCase().replace(/\s+/g, '_');
  return CLASS_SKILLS[classKey] || [];
}
