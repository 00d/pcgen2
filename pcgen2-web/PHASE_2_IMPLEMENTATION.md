# PCGen2 Phase 2 Implementation Guide

## Overview

Phase 2 extends the character creation system with complete character builder functionality. This document outlines what has been prepared for Phase 2 and how to implement the remaining pages.

## What's Prepared for Phase 2

### Backend Enhancements ✅
- **Game Data Expansion**: Added 6 feats, 5 spells, 5 equipment items, and 18 core skills
- **Data Caching**: Redis caching for all game rules (feats, spells, equipment, skills)
- **Seeding**: Extended `seedPathfinderData()` to include all new game rules
- **API Endpoints**: New `/api/game-rules/skills` endpoint

### Database Schemas Ready
- Character model supports: feats, skills, equipment, spells
- All derived stats are pre-calculated and cached

## Architecture for Phase 2

### Character Creation Flow (5 Steps Total)

```
Step 1: Race ✓ (COMPLETED)
   └─ Select race and apply racial modifiers

Step 2: Class ✓ (COMPLETED)
   └─ Select primary class

Step 3: Ability Scores (PHASE 2)
   └─ Point buy system (15 points)
   └─ Assign to STR, DEX, CON, INT, WIS, CHA
   └─ Show real-time modifiers

Step 4: Feats & Skills (PHASE 2)
   └─ Select feats with prerequisite validation
   └─ Allocate skill ranks

Step 5: Equipment & Spells (PHASE 2)
   └─ Select starting equipment
   └─ If spellcaster: select spells known
```

## Frontend Pages to Create

### 1. **Ability Scores Page** (`/create/abilities/[id]`)

**Purpose**: Implement Pathfinder's point buy system

**Features**:
- Point buy totaling 15 points
- Standard ability score array option
- Real-time display of ability modifiers
- Apply racial modifiers
- Visual feedback on valid/invalid builds

**State Management**:
- Redux slice `characterSlice.setAbilityScores()`
- Stores user's score selections

**Key Components**:
```typescript
interface AbilityScore {
  base: number;      // User-selected (8-15)
  racial: number;    // Applied from race
  total: number;     // base + racial
  modifier: number;  // (total - 10) / 2
}

// Point buy costs (Pathfinder standard):
// 8: 0 pts | 9: 1 pt | 10: 2 pts | 11: 3 pts | 12: 4 pts
// 13: 5 pts | 14: 6 pts | 15: 7 pts
```

### 2. **Feats & Skills Page** (`/create/feats/[id]`)

**Purpose**: Select feats and allocate skill ranks

**Features Part 1 - Feats**:
- Expandable list of available feats
- Prerequisites validation
- Display benefits and requirements
- Feat counter (1 feat at 1st level)

**Features Part 2 - Skills**:
- Skill pool = INT modifier + class skills/level
- Class skills show +3 bonus
- Ability modifiers auto-calculated
- Armor penalties for applicable skills

**State Management**:
- Redux: `characterSlice.addFeat()`, `characterSlice.setSkillRanks()`

**Key Components**:
```typescript
interface FeatSelection {
  featId: string;
  name: string;
  prerequisitesMet: boolean;
  prerequisites: string[];
}

interface SkillAllocation {
  skillId: string;
  ranks: number;
  abilityModifier: number;
  total: number;
  isClassSkill: boolean;
}
```

### 3. **Equipment Page** (`/create/equipment/[id]`)

**Purpose**: Select starting equipment and track weight

**Features**:
- Equipment list with prices and weights
- Multiple equipment categories (armor, weapons, gear)
- Weight tracking and encumbrance calculation
- Armor bonus and AC impact
- Weapon damage display

**Equipment Categories**:
- Light Armor
- Heavy Armor
- Melee Weapons
- Ranged Weapons
- Adventuring Gear
- Misc Items

**State Management**:
- Redux: `characterSlice.addEquipment()`, `characterSlice.removeEquipment()`

**Key Components**:
```typescript
interface EquipmentSelection {
  equipmentId: string;
  name: string;
  type: string;
  quantity: number;
  weight: number;
  equipped: boolean;
  totalWeight: number;
}

// Encumbrance calculation:
// Light Load: ≤ STR score × 10 lbs
// Medium Load: STR score × 10 to × 20
// Heavy Load: STR score × 20 to × 30
```

### 4. **Spells Page** (`/create/spells/[id]`)

**Purpose**: Select spells for spellcasting classes

**Features**:
- Only shown if character class is spellcaster
- Spells by level with descriptions
- Cantrips (level 0) always available
- Higher level spells limited by class/level
- Display casting time, range, duration

**Spellcaster Classes** (from Phase 1):
- Cleric, Druid, Sorcerer, Wizard

**State Management**:
- Redux: `characterSlice.addSpell()`, `characterSlice.removeSpell()`
- Conditional rendering based on class

**Key Components**:
```typescript
interface SpellSelection {
  spellId: string;
  name: string;
  level: number;
  school: string;
  prepared: boolean;
  known: boolean;
}

// Spell slots (example for 1st level caster):
// Level 0: Unlimited cantrips
// Level 1: 1 slot (+ CHA/INT modifier if applicable)
```

### 5. **Character Review & Save** (`/create/finish/[id]`)

**Purpose**: Review complete character and save to database

**Features**:
- Display full character sheet preview
- Summary of selections (race, class, abilities, feats, etc.)
- Edit buttons for each section
- Finalize and save to database
- Redirect to dashboard

**Character Summary**:
- Name and campaign
- Race and racial modifiers
- Class and hit points
- Ability scores with modifiers
- Feats and skills
- Equipment and weapons
- Spells (if applicable)

**State Management**:
- Redux: `characterSlice.finishCharacter()`
- Calls API to save character

## Updated Redux Slices

### characterSlice Extensions

```typescript
// New actions:
export const setAbilityScores = createAsyncThunk(...)
export const addFeat = createAsyncThunk(...)
export const setSkillRanks = createAsyncThunk(...)
export const addEquipment = createAsyncThunk(...)
export const addSpell = createAsyncThunk(...)
export const finishCharacter = createAsyncThunk(...)

// New state:
interface CharacterState {
  currentCharacter: Character;
  selectedFeats: Feat[];
  selectedSkills: SkillAllocation[];
  selectedEquipment: EquipmentSelection[];
  selectedSpells: SpellSelection[];
  currentStep: 'race' | 'class' | 'abilities' | 'feats' | 'equipment' | 'finish';
  isLoading: boolean;
  error: null | string;
}
```

### gameDataSlice Extensions

```typescript
// Add methods for:
export const fetchFeats = createAsyncThunk(...)
export const fetchSpells = createAsyncThunk(...)
export const fetchEquipment = createAsyncThunk(...)
export const fetchSkills = createAsyncThunk(...)

// New state:
interface GameDataState {
  races: Race[];
  classes: PClass[];
  feats: Feat[];
  spells: Spell[];
  equipment: Equipment[];
  skills: Skill[];
  isLoading: boolean;
  error: null | string;
}
```

## Page Implementation Checklist

### Step 3: Abilities (`/create/abilities/[id]/page.tsx`)
- [ ] Point buy calculator
- [ ] Score input fields for each ability
- [ ] Display modifiers real-time
- [ ] Apply racial modifiers
- [ ] Standard array option
- [ ] Validation (total 15 points)
- [ ] Next button to feats step

### Step 4: Feats & Skills (`/create/feats/[id]/page.tsx`)
- [ ] Feat selection UI
- [ ] Prerequisite validation
- [ ] Feat descriptions and benefits
- [ ] Skill allocation table
- [ ] Class skill identification
- [ ] Ability modifier display
- [ ] Remaining skill points counter
- [ ] Next button to equipment step

### Step 5: Equipment (`/create/equipment/[id]/page.tsx`)
- [ ] Equipment list/categories
- [ ] Add to inventory button
- [ ] Remove from inventory button
- [ ] Weight tracking
- [ ] Total weight display
- [ ] Encumbrance indicator
- [ ] Equipment preview
- [ ] Next button to spells step

### Step 5b: Spells (`/create/spells/[id]/page.tsx`)
- [ ] Conditional rendering (spellcasters only)
- [ ] Spell list by level
- [ ] Spell descriptions
- [ ] Add spell known checkbox
- [ ] Spell slot display
- [ ] Next button to review step

### Step 6: Finish (`/create/finish/[id]/page.tsx`)
- [ ] Character summary display
- [ ] Edit buttons for each section
- [ ] Character sheet preview
- [ ] Save character API call
- [ ] Success message
- [ ] Redirect to dashboard

## Development Order

**Recommended order for implementation**:

1. **Update Redux slices** (gameDataSlice, characterSlice)
   - Add async thunks for new game data
   - Add new state properties
   - Add reducers for updates

2. **Create components** (reusable)
   - PointBuyCalculator
   - FeatSelector
   - SkillAllocator
   - EquipmentSelector
   - SpellSelector
   - CharacterSummary

3. **Create pages** (in order)
   - `/create/abilities/[id]/page.tsx`
   - `/create/feats/[id]/page.tsx`
   - `/create/equipment/[id]/page.tsx`
   - `/create/spells/[id]/page.tsx`
   - `/create/finish/[id]/page.tsx`

4. **Integration**
   - Update characterSlice to handle step progression
   - Update character creation flow to navigate through all steps
   - Test full workflow

## Testing Strategy

### Unit Tests
- Point buy calculator validation
- Skill point calculations
- Prerequisite validation logic
- Weight calculations

### Integration Tests
- Full character creation flow
- Data persistence
- Step navigation
- Redux state updates

### Manual Testing
- Try invalid feat prerequisites
- Max out skill points and verify error
- Test encumbrance at different weights
- Verify spells only shown for casters

## Performance Considerations

1. **Data Caching**: All game rules cached in Redis (24-hour TTL)
2. **Client-side Calculations**: Point buy, modifiers, weight - all calculated on frontend
3. **Lazy Loading**: Only load feats/spells/equipment when step is visited
4. **Memoization**: Use React.memo for expensive components

## Estimated Implementation Time

- Redux Setup: 2-3 hours
- Components: 6-8 hours
- Pages: 8-10 hours
- Testing & Polish: 4-6 hours
- **Total: 20-27 hours (~3 weeks)**

## Known Challenges & Solutions

### Challenge: Feat Prerequisites
**Solution**: Validate against character BAB, level, ability scores, and selected feats

### Challenge: Skill Point Calculations
**Solution**: Use formula: class skills/level + INT modifier, recalculate if class changes

### Challenge: Equipment Weight
**Solution**: Track per-item weight, sum for total, check encumbrance limits

### Challenge: Spellcaster Detection
**Solution**: Check if selected class is in spellcasting classes list

## Files Modified/Created in Phase 2

**Backend**:
- ✅ `src/services/gameDataService.ts` - Extended with feats, spells, equipment, skills
- ✅ `src/routes/gameRules.ts` - Added `/skills` endpoint

**Frontend**:
- ✅ `lib/api.ts` - Added `getSkills()`, `getFeats()`, `getEquipment()`, `getSpells()`
- TBD: `redux/slices/gameDataSlice.ts` - Add new async thunks
- TBD: `redux/slices/characterSlice.ts` - Add ability/feat/skill/equipment/spell management
- TBD: `components/PointBuyCalculator.tsx`
- TBD: `components/SkillAllocator.tsx`
- TBD: `components/FeatSelector.tsx`
- TBD: `components/EquipmentSelector.tsx`
- TBD: `components/SpellSelector.tsx`
- TBD: `app/create/abilities/[id]/page.tsx`
- TBD: `app/create/feats/[id]/page.tsx`
- TBD: `app/create/equipment/[id]/page.tsx`
- TBD: `app/create/spells/[id]/page.tsx`
- TBD: `app/create/finish/[id]/page.tsx`

## Next Steps

After Phase 2:

**Phase 3: Character Management & Printing**
- Character editing
- Character deletion
- Print-friendly HTML sheets
- PDF export
- Character list improvements

**Phase 4: Polish & PWA**
- Offline support via PWA
- Performance optimization
- Comprehensive testing
- Edge case handling

---

**Phase 2 Status**: Ready for Implementation
**Estimated Completion**: 3-4 weeks
**Total Lines of Code**: +3000-4000 (backend prepared, frontend to be built)
