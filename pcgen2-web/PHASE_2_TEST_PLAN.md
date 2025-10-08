# Phase 2 Testing Plan

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ installed
- Terminal/Command line access

### 1. Start Services

```bash
cd pcgen2-web

# Start MongoDB and Redis
docker-compose up -d

# Wait for containers to be ready (30-60 seconds)
docker ps
```

Expected output: Two containers running (mongodb and redis)

### 2. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure Environment

**Backend** (.env file in backend/):
```
MONGODB_URI=mongodb://pcgen:pcgen_dev@localhost:27017/pcgen
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

**Frontend** (.env.local file in frontend/):
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 4. Start Backend

```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 5000
MongoDB connected successfully
Redis connected successfully
```

### 5. Seed Game Data

In a new terminal:
```bash
curl -X POST http://localhost:5000/api/game-rules/seed
```

Expected response:
```json
{
  "message": "Game data seeded successfully"
}
```

### 6. Start Frontend

In another terminal:
```bash
cd frontend
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

## Phase 2 Testing Scenarios

### Test 1: API Endpoint Verification

#### 1.1 Get All Feats
```bash
curl http://localhost:5000/api/game-rules/feats
```

Expected: Array of 6 feats with fields: id, name, type, data.benefit, data.prerequisites

#### 1.2 Get All Spells
```bash
curl http://localhost:5000/api/game-rules/spells
```

Expected: Array of 5 spells with fields: id, name, level, school, castingTime, range

#### 1.3 Get Equipment
```bash
curl http://localhost:5000/api/game-rules/equipment
```

Expected: Array of 5 equipment items with weight, cost, armor/weapon stats

#### 1.4 Get Skills
```bash
curl http://localhost:5000/api/game-rules/skills
```

Expected: Array of 18 skills with ability associations

### Test 2: Character Creation Flow (Manual)

#### Step 2.1: Log In or Register
1. Navigate to http://localhost:3000
2. Register new account OR login with test account
3. Verify redirect to dashboard

#### Step 2.2: Create New Character
1. Click "Create New Character" button
2. Enter character name (e.g., "Aragorn")
3. Select campaign (default: "Pathfinder 1e")
4. Click "Next"
5. **Expected**: Redirect to race selection (Phase 1 - should still work)

#### Step 2.3: Select Race
1. Select "Human" race
2. Verify racial traits display
3. Click "Next"
4. **Expected**: Redirect to class selection (Phase 1)

#### Step 2.4: Select Class
1. Select "Wizard" class
2. Verify class details display
3. Click "Finish"
4. **Expected**: Redirect to abilities page (Phase 2 - NEW)

#### Step 2.5: Ability Scores (Phase 2 - PointBuyCalculator)
**✅ Test Point Buy System**
- [ ] Verify point counter shows 15 points
- [ ] Adjust STR to 14 (costs 6 points)
  - Expected: 9 points remaining
- [ ] Adjust DEX to 12 (costs 4 points)
  - Expected: 5 points remaining
- [ ] Adjust CON to 12, INT to 14, WIS to 10, CHA to 10
  - Expected: Total 15 points spent, 0 remaining
- [ ] Verify ability modifiers display correctly:
  - STR 14 = +2 modifier
  - DEX 12 = +1 modifier
  - INT 14 = +2 modifier
- [ ] Test "Use Standard Array" button
  - Should populate: STR 15, DEX 14, CON 13, INT 12, WIS 10, CHA 8
  - Expected: 0 points remaining (array uses exactly 15 points)
- [ ] Test racial modifiers (Human gets +2 to one ability)
  - If +2 applied to STR, should show STR total = base + 2
- [ ] Click "Next"
  - Expected: Redirect to feats page

#### Step 2.6: Feats & Skills (Phase 2 - FeatSelector + SkillAllocator)

**✅ Test Feats Tab**
- [ ] Verify feat list displays 6 feats
- [ ] Expand one feat (e.g., "Power Attack")
  - Should show benefit and prerequisites
- [ ] Select one feat (1st level = 1 feat max)
  - Check counter shows "Feats Remaining: 0/1"
- [ ] Try to select another feat
  - Should be disabled/prevent selection
- [ ] Deselect feat and verify you can select another

**✅ Test Skills Tab**
- [ ] Verify skill points calculation:
  - Base: 2 skills/level (Wizard)
  - INT Mod: +2 (from INT 14)
  - Total: 4 skill points
- [ ] Allocate ranks to skills:
  - Add 2 ranks to "Knowledge (Arcana)"
  - Add 2 ranks to "Spellcraft"
  - Expected: 0 points remaining
- [ ] Verify modifiers display:
  - Knowledge (Arcana) = ranks + INT mod
  - If ranks=2, INT=+2, total=4
- [ ] Verify class skills show +3 bonus
  - Class skills for Wizard: Knowledge (Arcana), Spellcraft, etc.
- [ ] Click "Next"
  - Expected: Redirect to equipment page

#### Step 2.7: Equipment (Phase 2 - EquipmentSelector)
**✅ Test Equipment Selection**
- [ ] Verify encumbrance limits display based on STR
  - STR 14: Light ≤140, Medium ≤280, Heavy ≤420
- [ ] Add equipment:
  - Add 1x Leather Armor (10 lbs)
  - Add 1x Dagger (1 lb)
  - Add 1x Spellbook (3 lbs)
  - Expected: Total weight = 14 lbs, status = "light"
- [ ] Expand armor item to see armor bonus and penalties
- [ ] Add heavy items to test encumbrance:
  - Add 10x Rope coils (300 lbs total)
  - Expected: Total weight >> light load, status changes to "heavy"
- [ ] Verify weight calculation updates in real-time
- [ ] Remove items and verify weight decreases
- [ ] Since class is Wizard (spellcaster), click "Next"
  - Expected: Redirect to spells page

#### Step 2.8: Spells (Phase 2 - SpellSelector)
**✅ Test Spellcaster Check**
- [ ] Page should only appear for spellcasters (Cleric, Druid, Sorcerer, Wizard)
- [ ] Verify spell slots calculation:
  - Cantrips: Unlimited
  - 1st level: 1 + spell modifier (CHA or WIS)
  - For Wizard with INT 14 (+2 INT mod): 1+2=3 slots

**✅ Test Spell Selection**
- [ ] View spells grouped by level:
  - Level 0 (Cantrips): Unlimited - "Acid Splash", "Dancing Lights"
  - Level 1: Max 3 - "Mage Armor", "Magic Missile", "Shield"
- [ ] Select cantrips (both should be selectable)
  - Expected: Unlimited cantrips, counter shows "Unlimited"
- [ ] Select 1st level spells:
  - Select "Mage Armor", "Magic Missile", "Shield"
  - Counter shows "3/3" for 1st level
  - Try to select 4th spell - should be prevented
- [ ] Expand spell to see description and school
- [ ] Click "Next"
  - Expected: Redirect to finish/review page

#### Step 2.9: Character Review & Finish (Phase 2 - CharacterSummary)
**✅ Test Character Summary**
- [ ] Verify character name displays: "Aragorn"
- [ ] Verify basic info shows:
  - Race: Human
  - Class: Wizard
- [ ] Verify ability scores section displays all 6 abilities:
  - Each shows: Total Score + Modifier
  - STR 14 (+2), DEX 12 (+1), etc.
- [ ] Verify feats section shows selected feat(s)
- [ ] Verify skills section shows allocated skills with ranks and totals
- [ ] Verify equipment section shows:
  - All selected equipment
  - Total weight
- [ ] Verify spells section shows:
  - Cantrips listed
  - 1st level spells listed under "Level 1"
- [ ] Verify derived stats display:
  - Hit Points: Should be calculated based on Class HD + CON mod
  - Armor Class: Should account for armor + DEX
  - BAB: Should show appropriate for Class
  - Saving Throws: Should show FORT/REF/WILL
- [ ] Click "✓ Finish & Save Character"
  - Expected: Success message appears
  - Auto-redirect to dashboard after 2 seconds

#### Step 2.10: Verify Character Saved
1. After redirect to dashboard
2. Click "View" on saved character
3. Verify all data is persisted and displays correctly:
   - All ability scores
   - All feats
   - All skills
   - All equipment
   - All spells

---

## Component Unit Tests

### PointBuyCalculator Tests
```javascript
// Test: Point calculation
describe('PointBuyCalculator', () => {
  test('correctly calculates points spent', () => {
    // STR 14 = 6 points
    // Total should be 6, remaining 9
  });

  test('prevents exceeding 15 points', () => {
    // Should not allow setting scores that exceed 15 total points
  });

  test('applies racial modifiers', () => {
    // With +2 STR, total should show base + 2
  });

  test('standard array preset works', () => {
    // Should set STR 15, DEX 14, CON 13, INT 12, WIS 10, CHA 8
  });
});
```

### FeatSelector Tests
```javascript
describe('FeatSelector', () => {
  test('displays all feats', () => {
    // Should show 6 feats
  });

  test('enforces maximum feats', () => {
    // Should prevent selecting more than maxFeats
  });

  test('expands feat details', () => {
    // Should show benefit and prerequisites when clicked
  });
});
```

### SkillAllocator Tests
```javascript
describe('SkillAllocator', () => {
  test('calculates skill points correctly', () => {
    // Skills/level + INT modifier = total points
  });

  test('prevents overallocating points', () => {
    // Should not allow more ranks than available points
  });

  test('calculates skill bonuses', () => {
    // Bonus = ranks + ability mod + (class skill bonus if applicable)
  });
});
```

### EquipmentSelector Tests
```javascript
describe('EquipmentSelector', () => {
  test('calculates total weight', () => {
    // Sum of all items with quantities
  });

  test('determines encumbrance level', () => {
    // Light, Medium, Heavy, or Overencumbered based on STR and weight
  });

  test('displays armor stats', () => {
    // Armor bonus, max DEX bonus, check penalty
  });
});
```

### SpellSelector Tests
```javascript
describe('SpellSelector', () => {
  test('limits spells per level', () => {
    // Should not allow more spells than maxSpellsPerLevel
  });

  test('allows unlimited cantrips', () => {
    // Level 0 spells should be selectable without limit
  });

  test('groups spells by level', () => {
    // Should display cantrips, 1st level, etc.
  });
});
```

---

## Redux State Tests

### gameDataSlice Tests
```javascript
describe('gameDataSlice', () => {
  test('fetchFeats loads feats data', async () => {
    // Should load feats and update state
  });

  test('fetchSpells loads spells data', async () => {
    // Should load spells and update state
  });

  test('handles errors gracefully', () => {
    // Should set error state on failed fetch
  });
});
```

### characterSlice Tests
```javascript
describe('characterSlice', () => {
  test('setAbilityScores saves and progresses', () => {
    // Should update character and move to next step
  });

  test('addFeat updates character feats', () => {
    // Should add feat to character.feats array
  });

  test('setSkillRanks updates skills', () => {
    // Should save skill allocations
  });

  test('finishCharacter completes creation', () => {
    // Should save character to database
  });
});
```

---

## Edge Case Tests

### Test 3: Negative Scenarios

#### 3.1 Invalid Point Buy
- [ ] Try to allocate more than 15 points
  - Should block ability increase
- [ ] Try to set score below 8 or above 15
  - Should block invalid input

#### 3.2 Overweight Equipment
- [ ] Load character with > STR*30 lbs of equipment
  - Should show "Overencumbered" with red warning

#### 3.3 Non-Spellcaster Skip
- [ ] Create a Barbarian (non-spellcaster)
- [ ] At equipment step, click "Next"
  - Expected: Should skip spells page and go to finish
- [ ] Spells section in summary should not display

#### 3.4 Feat Deselection
- [ ] Select 1 feat
- [ ] Deselect it
- [ ] Select different feat
- [ ] Verify character only has 1 feat selected

### Test 4: Data Persistence

- [ ] Create character through full flow
- [ ] Refresh browser page
- [ ] Go back to dashboard
- [ ] Click "View" character
  - All data should be loaded from database
  - No data should be lost

### Test 5: Navigation

- [ ] Use "Previous" button to go back steps
  - Data should be preserved
- [ ] Edit buttons in review page
  - Should navigate to appropriate step
  - Should retain other data

---

## Success Criteria

✅ **Phase 2 Testing is Complete When:**

1. **All API endpoints return correct data**
   - [ ] /api/game-rules/feats
   - [ ] /api/game-rules/spells
   - [ ] /api/game-rules/equipment
   - [ ] /api/game-rules/skills

2. **All components render correctly**
   - [ ] PointBuyCalculator displays and calculates correctly
   - [ ] FeatSelector lists and selects feats
   - [ ] SkillAllocator allocates and calculates
   - [ ] EquipmentSelector manages weight
   - [ ] SpellSelector selects spells
   - [ ] CharacterSummary displays all data

3. **Complete character creation workflow succeeds**
   - [ ] Can create character from race → class → abilities → feats/skills → equipment → spells → finish
   - [ ] Data is saved to database
   - [ ] Character appears on dashboard

4. **Navigation works end-to-end**
   - [ ] Next/Previous buttons work
   - [ ] Edit buttons navigate correctly
   - [ ] Auto-progression works

5. **Data validation works**
   - [ ] Point buy enforces 15 point limit
   - [ ] Feat selection enforces maximum
   - [ ] Skill points tracked correctly
   - [ ] Spell slots enforced

---

## Known Issues to Monitor

1. **Class skill filtering** - Currently shows all skills, should filter by class
2. **Feat prerequisite validation** - Prerequisites shown but not validated
3. **Spell slots for higher levels** - Only supports level 0-1 spells currently
4. **Multiclass** - Single class only

These are intentional Phase 2 scope limitations documented in PHASE_2_IMPLEMENTATION.md

---

## Test Results Log

**Test Date**: ___________
**Tester**: ___________

| Test | Status | Notes |
|------|--------|-------|
| API Endpoints | ⬜ | |
| UI Components | ⬜ | |
| Create Flow | ⬜ | |
| Data Persistence | ⬜ | |
| Navigation | ⬜ | |
| Edge Cases | ⬜ | |

**Overall Status**: ⬜ PENDING
