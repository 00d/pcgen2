# Phase 4 Implementation Plan: Multiclass Support & PWA

**Status:** 🚧 IN PROGRESS
**Date:** October 8, 2025
**Scope:** Multiclass characters, PWA features, campaign management

---

## Overview

Phase 4 builds upon the complete Phase 1-3c foundation to add advanced features:
- **Multiclass Support:** Allow characters to have multiple classes with proper level calculation
- **PWA Features:** Make the app installable, offline-capable, and app-like
- **Campaign Management:** Organize characters into campaigns

---

## 1. Multiclass Support Implementation

### 1.1 Data Model Changes

#### Character Schema Enhancement

**Current Model (single class):**
```typescript
class: string; // 'barbarian', 'fighter', etc.
classLevel: number; // Total level
```

**Phase 4 Model (multiclass):**
```typescript
classes: Array<{
  classId: string;  // 'barbarian', 'fighter'
  level: number;    // Levels in this class
  hitDice: string; // Hit die result (e.g., 'd12', 'd10')
}>;

// Calculated fields:
totalLevel: number; // Sum of all class levels
```

#### Backend Changes Required

**File:** `backend/src/models/Character.ts`

1. Update ICharacter interface to support multiclass
2. Add computed properties for BAB, saves, skills
3. Add validation for multiclass restrictions

**File:** `backend/src/services/characterService.ts`

1. Update `applyClassToCharacter()` → `addClassToCharacter()`
2. Add `removeClassFromCharacter()`
3. Add `recalculateCharacterStats()` - recalculate BAB, saves, etc.
4. Add `calculateBABByLevel()` - compute BAB for each class progression
5. Add `calculateSavesByClass()` - combine saves from all classes

### 1.2 BAB Calculation Logic

Pathfinder multiclass BAB calculation:
- Use the **higher** of all BABs from each class
- Each class contributes its BAB separately

```typescript
function calculateMulticlassBAB(character: Character): {
  totalBAB: number;
  perClass: Record<string, number>;
} {
  const perClass: Record<string, number> = {};

  for (const charClass of character.classes) {
    const baseClass = getClassData(charClass.classId);
    const progression = baseClass.baseAttackBonusProgression; // 'good', 'moderate', 'poor'

    // Calculate BAB for this class
    const bab = calculateBAB(charClass.level, progression);
    perClass[charClass.classId] = bab;
  }

  // Total BAB is the highest
  const totalBAB = Math.max(...Object.values(perClass));

  return { totalBAB, perClass };
}
```

**BAB Progressions:**
- Good: +1 per level (BAB = level)
- Moderate: +0.75 per level (BAB = floor(level * 0.75))
- Poor: +0.5 per level (BAB = floor(level * 0.5))

### 1.3 Saving Throw Calculation

Pathfinder multiclass saves:
- Take the **best save** from all classes at each save type

```typescript
function calculateMulticlassSaves(character: Character): {
  fort: number;
  ref: number;
  will: number;
} {
  const saves = { fort: 0, ref: 0, will: 0 };

  for (const charClass of character.classes) {
    const baseClass = getClassData(charClass.classId);
    const progression = baseClass.savingThrows;

    // Calculate saves for this class
    const classSaves = calculateSaves(charClass.level, progression);

    // Keep best saves
    saves.fort = Math.max(saves.fort, classSaves.fort);
    saves.ref = Math.max(saves.ref, classSaves.ref);
    saves.will = Math.max(saves.will, classSaves.will);
  }

  return saves;
}
```

### 1.4 Hit Points & Hit Dice

```typescript
function calculateMulticlassHP(character: Character): {
  totalHP: number;
  perClass: Record<string, number>;
} {
  let totalHP = 0;
  const perClass: Record<string, number> = {};

  for (const charClass of character.classes) {
    const baseClass = getClassData(charClass.classId);
    const hitDie = parseInt(baseClass.hitDie.replace('d', ''));

    // HP = hitDie per level + CON modifier per level
    const classHP = charClass.level * (hitDie + character.attributes.conModifier);
    perClass[charClass.classId] = classHP;
    totalHP += classHP;
  }

  return { totalHP, perClass };
}
```

### 1.5 Skill Points

**Multiclass skill point rules:**
- Each class grants skill points based on its progression
- Rogue's "rogue level" skill points don't stack
- Cross-class skills cost 2 points per rank

```typescript
function calculateMulticlassSkillPoints(character: Character): number {
  let totalSkillPoints = 0;

  for (const charClass of character.classes) {
    const baseClass = getClassData(charClass.classId);
    const skillsPerLevel = baseClass.skillsPerLevel;
    const intMod = Math.max(0, character.attributes.intModifier);

    // Skills = (base + INT modifier) * levels
    const classSkillPoints = (skillsPerLevel + intMod) * charClass.level;
    totalSkillPoints += classSkillPoints;
  }

  return totalSkillPoints;
}
```

### 1.6 Spell Progression (Multiclass Casters)

For multiclass spellcasters:
- **Separate spell progression per class**
- Wizard/Cleric/Druid/Sorcerer each track spells independently
- Must be appropriate caster level for each class

```typescript
interface SpellCasterClass {
  classId: 'wizard' | 'cleric' | 'druid' | 'sorcerer' | 'bard' | 'ranger' | 'paladin';
  level: number;
  spellSlots: Record<number, number>; // Level -> slots available
  spellsKnown: Array<{
    spellId: string;
    level: number;
    classId: string;
  }>;
}
```

### 1.7 Frontend Components for Multiclass

**New Component:** `MulticlassSelector.tsx`
- Show current classes and levels
- Button to add new class
- Display BAB, saves, HP recalculation
- Validate multiclass restrictions (if any)

**Modified Component:** `CharacterViewer.tsx`
- Show all classes and levels
- Display per-class BAB, saves, HP
- Show spell slots per class

---

## 2. PWA Implementation

### 2.1 Web App Manifest

**File:** `frontend/public/manifest.json`

```json
{
  "name": "PCGen 2.0",
  "short_name": "PCGen",
  "description": "Pathfinder Character Generator",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "categories": ["games", "productivity"],
  "screenshots": [
    {
      "src": "/screenshots/mobile.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ]
}
```

### 2.2 Service Worker

**File:** `frontend/public/sw.js`

Features:
- Cache static assets (JS, CSS, images)
- Cache API responses (24hr TTL)
- Offline fallback pages
- Background sync for character saves

```javascript
const CACHE_NAME = 'pcgen-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  // CSS, JS bundles
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Network first for API calls, cache fallback
// Cache first for static assets
```

### 2.3 Offline Support

**Offline Functionality:**
- View existing characters
- Edit character locally
- Queue edits for sync when online
- Show offline indicator

**File:** `frontend/hooks/useOfflineSync.ts`

### 2.4 Install Prompt

**File:** `frontend/components/InstallPrompt.tsx`

- Detect if PWA is installable
- Show install prompt on iOS/Android
- Track installation

### 2.5 App Shell Architecture

```
Frontend Architecture:
├── App Shell (persistent)
│   ├── Navigation
│   ├── Bottom sheet (mobile)
│   └── Offline indicator
├── Dynamic Content
│   ├── Dashboard
│   ├── Character pages
│   └── Settings
```

---

## 3. Campaign Management

### 3.1 Campaign Data Model

**File:** `backend/src/models/Campaign.ts`

```typescript
interface ICampaign {
  _id: ObjectId;
  userId: string;
  name: string;
  description?: string;
  setting?: string; // Pathfinder, Golarion, custom
  dungeon_master?: string;
  characters: string[]; // Character IDs
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 Campaign Routes

**File:** `backend/src/routes/campaigns.ts`

```
POST   /api/campaigns              Create campaign
GET    /api/campaigns              List user's campaigns
GET    /api/campaigns/:id          Get campaign details
PUT    /api/campaigns/:id          Update campaign
DELETE /api/campaigns/:id          Delete campaign
POST   /api/campaigns/:id/characters Add character to campaign
DELETE /api/campaigns/:id/characters/:charId Remove character
GET    /api/campaigns/:id/characters List campaign characters
```

### 3.3 Campaign Frontend

**New Pages:**
- `/campaigns` - List campaigns
- `/campaigns/new` - Create campaign
- `/campaigns/[id]` - View campaign
- `/campaigns/[id]/edit` - Edit campaign

**New Components:**
- `CampaignCard.tsx`
- `CampaignForm.tsx`
- `CampaignCharacterList.tsx`

---

## 4. Implementation Timeline

### Week 1: Multiclass Foundation
- Update Character model and schema
- Implement BAB calculation
- Implement save calculation
- Update characterService

### Week 2: Multiclass Frontend
- Create MulticlassSelector component
- Update character viewer for multiclass
- Add multiclass API endpoints
- Test multiclass calculations

### Week 3: PWA Implementation
- Create manifest.json
- Implement service worker
- Add offline support
- Create install prompt

### Week 4: Campaign Management & Polish
- Implement campaign model and routes
- Create campaign frontend
- Add campaign to character display
- Final testing and documentation

**Estimated Total:** 100-120 hours

---

## 5. Estimated Lines of Code

### Backend
- Character model updates: 150 lines
- Character service updates: 300 lines
- Campaign model: 100 lines
- Campaign routes: 200 lines
- **Backend Total:** ~750 lines

### Frontend
- Multiclass components: 400 lines
- Campaign pages/components: 500 lines
- PWA setup: 200 lines
- Offline support: 200 lines
- **Frontend Total:** ~1,300 lines

**Phase 4 Total:** ~2,050 lines

---

## 6. Multiclass Restrictions & Rules

### Pathfinder Multiclass Rules

**Allowed:**
- Any class combination
- No BAB or save penalties
- Spell slots stack per class

**Restrictions to Enforce:**
- Prestige classes only after prerequisites
- Some races have class restrictions (e.g., Sorcerer requirements)
- Hit die limits (can't exceed class hit die)

**Implementation:**
```typescript
function validateMulticlass(
  newClass: string,
  existingClasses: ClassRecord[]
): { valid: boolean; error?: string }
```

---

## 7. Testing Strategy

### Unit Tests
- Multiclass BAB calculation
- Multiclass saves calculation
- Multiclass HP calculation
- Multiclass skill points

### Integration Tests
- Add class to character
- Remove class from character
- Recalculate all stats
- Save/load multiclass character

### E2E Tests
- Create multiclass character
- Edit multiclass character
- View multiclass character sheet
- Campaign character management

---

## 8. Known Challenges

1. **Prestige Classes:** Require level 6+ in other class
   - Solution: Track prerequisite classes and levels

2. **Spell Slot Stacking:** Different for different casters
   - Solution: Per-class spell tracking

3. **Feat Requirements:** Must apply per class
   - Solution: Check against highest BAB

4. **Feature Interaction:** Some features don't stack
   - Solution: Document and implement carefully

---

## 9. Success Criteria

✅ Characters can have 2-5 classes
✅ BAB calculated correctly for all progressions
✅ Saves calculated as best-of
✅ HP calculated per class
✅ Skill points calculated correctly
✅ Spells tracked per class
✅ PWA installable on all platforms
✅ Works offline with local cache
✅ Campaign system functional
✅ All tests pass

---

## 10. Future Enhancements (Phase 5+)

- Prestige class support
- Character advancement (level up wizard)
- Campaign sessions with battle tracking
- Character sheet PDF export with multiclass
- Mobile app wrapper (React Native)

---

**Status:** Plan ready for implementation
**Next Action:** Implement multiclass character model changes
