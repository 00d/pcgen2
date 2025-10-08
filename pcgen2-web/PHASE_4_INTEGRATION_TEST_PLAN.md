# Phase 4 Integration Test Plan

**Date:** October 8, 2025
**Status:** 🚧 IN PROGRESS
**Scope:** Multiclass Support, PWA, Campaign Management

---

## Test Objectives

1. Verify multiclass calculations (BAB, saves, HP, skills)
2. Validate campaign CRUD operations
3. Test character-campaign linking
4. Verify PWA offline functionality
5. Test frontend component integration
6. Ensure backward compatibility with single-class characters

---

## Test Categories

### 1. Multiclass Service Tests

#### 1.1 BAB Calculation Tests

**Test Case 1.1.1: Single Class BAB (Good Progression)**
```
Input:  1 Fighter (Level 5)
Expected: BAB = 5
```

**Test Case 1.1.2: Single Class BAB (Moderate Progression)**
```
Input:  1 Rogue (Level 4)
Expected: BAB = 3 (floor(4 * 0.75))
```

**Test Case 1.1.3: Single Class BAB (Poor Progression)**
```
Input:  1 Wizard (Level 6)
Expected: BAB = 3 (floor(6 * 0.5))
```

**Test Case 1.1.4: Multiclass BAB (Highest Wins)**
```
Input:  Fighter 5 (good, BAB +5) + Wizard 3 (poor, BAB +1)
Expected: BAB = 5 (highest of all classes)
```

**Test Case 1.1.5: Multiclass BAB (Three Classes)**
```
Input:  Barbarian 3 (good, BAB +3) + Ranger 4 (good, BAB +4) + Rogue 2 (mod, BAB +1)
Expected: BAB = 4 (highest)
```

#### 1.2 Saving Throws Tests

**Test Case 1.2.1: Single Class Saves**
```
Input:  Fighter 5 (good fort, poor ref, poor will)
Expected: Fort +?, Ref +?, Will +?
```

**Test Case 1.2.2: Multiclass Saves (Best-Of)**
```
Input:  Fighter 5 (fort good) + Wizard 3 (will good)
Expected: Fort = best(fighter), Ref = best(either), Will = best(wizard)
```

#### 1.3 Hit Points Tests

**Test Case 1.3.1: Single Class HP**
```
Input:  Fighter (d10) Level 5, CON mod +2
Expected: 5 * (10 + 2) = 60 HP
```

**Test Case 1.3.2: Multiclass HP (Sum)**
```
Input:  Barbarian (d12) 3 + Rogue (d8) 2, CON mod +1
Expected: 3*(12+1) + 2*(8+1) = 39 + 18 = 57 HP
```

**Test Case 1.3.3: Minimum HP Enforcement**
```
Input:  Wizard (d6) Level 10, CON mod -2 (would be negative)
Expected: Minimum 10 HP (1 per level)
```

#### 1.4 Skill Points Tests

**Test Case 1.4.1: Single Class Skills**
```
Input:  Rogue (8 skills/level) Level 5, INT mod +2
Expected: 5 * (8 + 2) = 50 skill points
```

**Test Case 1.4.2: Multiclass Skills**
```
Input:  Rogue (8) 3 + Fighter (2) 2, INT mod +1
Expected: 3*(8+1) + 2*(2+1) = 27 + 6 = 33 skill points
```

#### 1.5 Total Level Tests

**Test Case 1.5.1: Single Class Level**
```
Input:  Fighter Level 10
Expected: Total Level = 10
```

**Test Case 1.5.2: Multiclass Level**
```
Input:  Fighter 5, Rogue 3, Ranger 2
Expected: Total Level = 10
```

#### 1.6 Validation Tests

**Test Case 1.6.1: Valid Multiclass (2 Different Classes)**
```
Input:  Fighter 5, Rogue 3
Expected: valid = true
```

**Test Case 1.6.2: Invalid - No Classes**
```
Input:  []
Expected: valid = false, error = "Character must have at least one class"
```

**Test Case 1.6.3: Invalid - Too Many Classes**
```
Input:  [Class1, Class2, Class3, Class4, Class5, Class6]
Expected: valid = false, error = "Cannot exceed 5 classes"
```

**Test Case 1.6.4: Invalid - Duplicate Classes**
```
Input:  [Fighter, Fighter]
Expected: valid = false, error = "No duplicate classes"
```

---

### 2. Campaign API Tests

#### 2.1 Campaign CRUD Tests

**Test Case 2.1.1: Create Campaign**
```
POST /api/campaigns
Body: {
  name: "Rise of the Runelords",
  description: "Classic Pathfinder campaign",
  setting: "Golarion",
  dungeon_master: "John"
}
Expected: 201 Created, campaign with _id
```

**Test Case 2.1.2: Get Campaign**
```
GET /api/campaigns/:id
Expected: 200 OK, full campaign data
```

**Test Case 2.1.3: List Campaigns**
```
GET /api/campaigns
Expected: 200 OK, array of campaigns for user
```

**Test Case 2.1.4: Update Campaign**
```
PUT /api/campaigns/:id
Body: { name: "New Name" }
Expected: 200 OK, updated campaign
```

**Test Case 2.1.5: Delete Campaign**
```
DELETE /api/campaigns/:id
Expected: 200 OK, campaign deleted
```

#### 2.2 Character-Campaign Linking Tests

**Test Case 2.2.1: Add Character to Campaign**
```
POST /api/campaigns/:id/characters
Body: { characterId: "char_id" }
Expected: 200 OK, character added to campaign.characters
```

**Test Case 2.2.2: Remove Character from Campaign**
```
DELETE /api/campaigns/:id/characters/:characterId
Expected: 200 OK, character removed
```

**Test Case 2.2.3: List Campaign Characters**
```
GET /api/campaigns/:id/characters
Expected: 200 OK, array of characters in campaign
```

**Test Case 2.2.4: Add Duplicate Character**
```
POST /api/campaigns/:id/characters
Body: { characterId: "same_char" } (twice)
Expected: 400 Error "Already in campaign"
```

#### 2.3 Authorization Tests

**Test Case 2.3.1: Unauthorized Access**
```
GET /api/campaigns/:other_user_campaign
Expected: 404 Not Found (or 403 Forbidden)
```

**Test Case 2.3.2: Missing Auth Token**
```
GET /api/campaigns (no token)
Expected: 401 Unauthorized
```

---

### 3. Frontend Component Tests

#### 3.1 MulticlassSelector Component Tests

**Test Case 3.1.1: Add Class**
- Initial state: no classes
- Click "Add Fighter"
- Expected: Fighter appears in selected classes

**Test Case 3.1.2: Adjust Level**
- State: Fighter selected at level 1
- Move slider to level 5
- Expected: Level updates, BAB recalculates

**Test Case 3.1.3: Remove Class**
- State: Fighter 5, Rogue 3 selected
- Click remove on Fighter
- Expected: Fighter removed, total level = 3

**Test Case 3.1.4: Class Abilities Display**
- State: Fighter selected
- Expand class details
- Expected: Show class abilities available at current level

**Test Case 3.1.5: Real-time Stats**
- State: Change levels
- Expected: BAB, HP, saves update immediately

#### 3.2 CampaignCard Component Tests

**Test Case 3.2.1: Display Campaign Info**
- Render campaign card
- Expected: Name, description, DM, setting visible

**Test Case 3.2.2: Show Character Count**
- Campaign with 3 characters
- Expected: Display "3 Characters"

**Test Case 3.2.3: Calculate Average Level**
- Characters: Level 5, 7, 9
- Expected: Avg Level = 7

**Test Case 3.2.4: Show Menu Actions**
- Click more button (⋮)
- Expected: Edit, Delete, View options appear

#### 3.3 CampaignForm Component Tests

**Test Case 3.3.1: Form Validation**
- Submit empty form
- Expected: Error "Campaign name required"

**Test Case 3.3.2: Create Campaign**
- Fill form with valid data
- Click Create
- Expected: Form submits, success

**Test Case 3.3.3: Edit Campaign**
- Load existing campaign
- Change name
- Click Update
- Expected: Campaign updated

**Test Case 3.3.4: Setting Selection**
- Select "Golarion"
- Expected: Setting field updated

---

### 4. PWA Integration Tests

#### 4.1 Service Worker Tests

**Test Case 4.1.1: Service Worker Registration**
```
Expected: SW registers without errors
console log: "[SW] Service worker loaded"
```

**Test Case 4.1.2: Static Asset Caching**
- Load page online
- Check cache storage
- Expected: JS, CSS cached in STATIC_CACHE

**Test Case 4.1.3: API Response Caching**
- Fetch /api/characters
- Check cache storage
- Expected: Response cached in API_CACHE

**Test Case 4.1.4: Network-First for API**
- Online: Fetch /api/campaigns
- Expected: From network, response cached
- Offline: Fetch /api/campaigns
- Expected: From cache

**Test Case 4.1.5: Cache-First for Assets**
- Online: Load CSS
- Expected: From cache if available, else network
- Offline: Load CSS
- Expected: From cache

#### 4.2 Offline Functionality Tests

**Test Case 4.2.1: Offline Page Display**
- Disable network
- Navigate to /offline.html
- Expected: Professional offline UI

**Test Case 4.2.2: View Characters Offline**
- Cache characters when online
- Go offline
- Navigate to dashboard
- Expected: See cached characters (read-only)

**Test Case 4.2.3: Offline Indicator**
- Go offline
- Check page
- Expected: Offline indicator visible

**Test Case 4.2.4: Connection Check**
- Offline, click "Check Connection"
- Expected: Connection check attempt
- Still offline: Show message
- Online: Redirect to app

#### 4.3 Manifest Tests

**Test Case 4.3.1: Manifest Valid**
- Load manifest.json
- Expected: Valid JSON, all required fields

**Test Case 4.3.2: App Icon**
- Check manifest icons
- Expected: Icons referenced in manifest exist

**Test Case 4.3.3: PWA Installable**
- Chrome DevTools: PWA section
- Expected: "This app is installable"

---

### 5. Data Persistence Tests

**Test Case 5.1: Save Multiclass Character**
- Create multiclass character
- Save to database
- Reload page
- Expected: Data persists, stats recalculate correctly

**Test Case 5.2: Campaign Character Linking**
- Create campaign
- Add character
- Reload page
- Expected: Character still linked

---

## Test Execution Plan

### Phase 1: Unit Tests (Service Layer)
1. Test multiclass BAB calculations
2. Test save calculations
3. Test HP calculations
4. Test skill point calculations

### Phase 2: API Integration Tests
1. Campaign CRUD
2. Character-campaign linking
3. Authorization

### Phase 3: Frontend Component Tests
1. MulticlassSelector functionality
2. CampaignCard rendering
3. CampaignForm validation

### Phase 4: PWA Tests
1. Service worker registration
2. Offline functionality
3. Cache validation

### Phase 5: End-to-End Tests
1. Create multiclass character workflow
2. Create campaign and link characters
3. Go offline and view characters
4. Return online and verify sync

---

## Test Success Criteria

### Backend Tests
- ✅ All multiclass calculations accurate
- ✅ All campaign operations succeed
- ✅ Authorization enforced
- ✅ Data persistence verified

### Frontend Tests
- ✅ Components render correctly
- ✅ User interactions work
- ✅ Validation functions properly
- ✅ State updates correctly

### PWA Tests
- ✅ Service worker registers
- ✅ Offline page displays
- ✅ Cache strategies work
- ✅ Online/offline transitions smooth

### Overall
- ✅ No console errors
- ✅ No console warnings
- ✅ Performance acceptable
- ✅ Backward compatible with Phase 1-3

---

## Known Test Limitations

1. **Manual Testing Required**
   - PWA installation prompt (browser-specific)
   - Service worker cache inspection (DevTools)
   - Network throttling (DevTools needed)

2. **Requires Test Data**
   - Valid user accounts
   - Existing characters
   - Test campaigns

3. **Browser-Specific**
   - Chrome PWA features differ from Safari/Firefox
   - Service worker support varies
   - Offline page appearance varies

---

## Test Execution Timeline

| Phase | Tests | Est. Time |
|-------|-------|-----------|
| Unit Tests | Calculations | 30 min |
| API Tests | CRUD + Linking | 45 min |
| Component Tests | 3 components | 60 min |
| PWA Tests | SW + Offline | 45 min |
| E2E Tests | Full workflows | 60 min |
| **Total** | **~18 tests** | **~240 min** |

---

## Deliverables

1. ✅ Integration test code
2. ✅ Test execution results
3. ✅ Bug reports (if any)
4. ✅ Coverage report
5. ✅ Test summary document

---

## Next Steps

1. Execute Phase 1: Unit tests
2. Execute Phase 2: API tests
3. Execute Phase 3: Component tests
4. Execute Phase 4: PWA tests
5. Execute Phase 5: E2E tests
6. Create final test report

---

**Status:** Test plan created, ready for execution
