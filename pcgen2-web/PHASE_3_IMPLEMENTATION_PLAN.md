# Phase 3 Implementation Plan

**Status:** Planning
**Date:** October 8, 2025
**Scope:** Character Management, Printing, and Enhancements

---

## Overview

Phase 3 extends the character creation flow with character management capabilities and quality-of-life enhancements. This phase focuses on enabling users to view, edit, delete, and print their characters, plus adds advanced features like prerequisite validation and class skill filtering.

---

## Phase 3 Scope & Roadmap

### 1. Character Management System

#### 1.1 Enhanced Dashboard
**Current State:** Basic character list on `/dashboard`

**Phase 3 Goals:**
- Character cards with quick stats (race, class, level, HP)
- Character actions: view, edit, delete, print
- Search/filter by name or campaign
- Sort by creation/modification date
- Bulk actions (delete multiple)

**New Components:**
- `CharacterCard.tsx` - Individual character preview
- `CharacterFilters.tsx` - Search/filter UI
- `CharacterActions.tsx` - Action dropdown menu

**New Pages:**
- `/characters/[id]/view` - Character sheet viewer
- `/characters/[id]/edit` - Character edit mode
- `/characters/[id]/print` - Print-optimized view

**Backend Endpoints:**
```
GET    /api/characters                    - List all user characters
GET    /api/characters/{id}               - Get character details
PUT    /api/characters/{id}               - Update character
DELETE /api/characters/{id}               - Delete character
GET    /api/characters/{id}/export        - Export character (PDF/JSON)
POST   /api/characters/{id}/duplicate     - Clone character
```

---

### 2. Character Viewing & Editing

#### 2.1 Character Sheet Viewer
**Purpose:** Display complete character information in read-only format

**Content:**
- Basic Info: Name, race, class, level, experience, campaign
- Ability Scores: All six scores with modifiers
- Derived Stats: HP, AC, BAB, CMB, CMD, saving throws, initiative
- Combat Info: Attack bonuses, damage, special abilities
- Skills: All 18 skills with bonuses and class skill indicators
- Equipment: Inventory with total weight/encumbrance
- Feats: All selected feats with descriptions
- Spells: Spell list by level with prepared/known status

**Features:**
- Tabbed interface (Stats | Skills | Equipment | Spells)
- Collapsible sections
- Print-friendly styling
- Edit buttons linking to edit pages

#### 2.2 Character Edit Pages
**Purpose:** Allow modifying character at any step

**Edit Pages (Mirrors Phase 2):**
- `/characters/[id]/edit/abilities` - Recalculate ability scores
- `/characters/[id]/edit/feats` - Modify feats and skills
- `/characters/[id]/edit/equipment` - Update equipment and encumbrance
- `/characters/[id]/edit/spells` - Modify spell selection

**Restrictions:**
- Can only edit characters not in active campaign
- Or implement "draft" vs "active" character states

---

### 3. Character Printing & Export

#### 3.1 Print-Optimized Character Sheet
**Format:** PDF-ready HTML layout

**Content:**
- Single-page or multi-page options
- Grid paper background for notes
- Stat blocks in standard Pathfinder layout
- Equipment list with weight calculations
- Spell sheet with preparation checkboxes
- Combat tracking area

**Features:**
- CSS print stylesheet
- Browser print dialog integration (Ctrl+P)
- PDF export via html2pdf or similar library

**New Endpoint:**
```typescript
GET /api/characters/{id}/export
Query Params:
  - format: 'pdf' | 'json' | 'html'
  - includeNotes: boolean
  - pageSize: 'letter' | 'a4'
```

#### 3.2 Export Formats
- **PDF**: Print-ready character sheet
- **JSON**: Complete character data for backup/transfer
- **Markdown**: Formatted text for sharing

---

### 4. Feat Prerequisite Validation

#### 4.1 Prerequisite Checking System
**Current State:** Prerequisites displayed but not enforced

**Phase 3 Implementation:**

**Backend:** New validation method in characterService
```typescript
validateFeatPrerequisites(character: Character, featId: string): {
  valid: boolean;
  unmetPrerequisites: string[];
}

// Check requirements:
// - Minimum ability scores
// - Required other feats
// - Minimum BAB
// - Class requirements
// - Level requirements
```

**Frontend:** FeatSelector component enhancement
```typescript
// Show prerequisite warnings
<div className="text-yellow-600 text-sm">
  Requires: BAB +5, Strength 13+
</div>

// Disable unavailable feats
<button disabled={!prerequisitesMet}>
  Select {feat.name}
</button>
```

**Feat Data Extension:**
```typescript
interface Feat {
  prerequisites?: {
    minBAB?: number;
    minAbilityScores?: Record<string, number>;
    requiredFeats?: string[];
    minLevel?: number;
    class?: string[];
  };
}
```

---

### 5. Class Skill Filtering

#### 5.1 Class-Specific Skills
**Current State:** All skills shown, +3 bonus for class skills

**Phase 3 Implementation:**

**Backend:** Extend class data with skill list
```typescript
class PClass {
  classSkills: string[]; // ["acrobatics", "climb", "handle_animal", ...]
}
```

**Frontend:** SkillAllocator enhancement
```typescript
// Group skills by class affinity
<section>
  <h3>Class Skills (+3 bonus)</h3>
  {classSkills.map(skill => (
    <SkillRow key={skill.id} skill={skill} isClassSkill={true} />
  ))}
</section>

<section>
  <h3>Cross-Class Skills</h3>
  {crossClassSkills.map(skill => (
    <SkillRow key={skill.id} skill={skill} isClassSkill={false} />
  ))}
</section>
```

**Data Update:**
- Add classSkills array to each class in seeded data
- Example: Wizard class has "Knowledge (Arcana)" as class skill

---

### 6. Higher-Level Spells (Levels 2-9)

#### 6.1 Spell Database Expansion
**Current State:** 5 spells (levels 0-1 only)

**Phase 3 Implementation:**

**New Spells per Level:**
- Level 0: 10 cantrips (Dancing Lights, Acid Splash, etc.)
- Level 1: 15 spells (Magic Missile, Mage Armor, etc.)
- Level 2: 15 spells (Scorching Ray, Mirror Image, etc.)
- Level 3: 15 spells (Fireball, Summon Monster III, etc.)
- Level 4: 12 spells
- Level 5: 10 spells
- Level 6: 8 spells
- Level 7: 6 spells
- Level 8: 5 spells
- Level 9: 4 spells

**Spell Slot Calculation Update:**
```typescript
// Current (Phase 2): 1 + spellModifier
// Phase 3: Variable by level and spellcaster class

// Wizard: 1 slot at 1st level per spell level, +1 per high ability modifier
// Cleric: 1 slot per spell level, bonus slots for high WIS
// Sorcerer: Known spells + slots per WIS/CHA modifier
// Druid: Similar to Cleric
```

**Spell Selector Update:**
- Grid layout for spell levels 0-9
- Slot tracking by level
- Known vs Prepared spells
- Spell school colors for quick identification

---

## Implementation Phases

### Phase 3a: Character Management (Weeks 1-2)
**Tasks:**
1. Create CharacterCard, CharacterFilters, CharacterActions components
2. Build `/characters/[id]/view` and `/characters/[id]/edit/*` pages
3. Implement backend endpoints for CRUD operations
4. Add search/filter Redux actions
5. Update dashboard with new UI

**Deliverables:**
- Enhanced character dashboard
- Character viewer page
- Character edit pages (6 pages total)
- 4 new backend endpoints

### Phase 3b: Printing & Export (Week 3)
**Tasks:**
1. Create print-optimized character sheet layout
2. Implement PDF export (html2pdf or pdfkit)
3. Add JSON/Markdown export endpoints
4. Create `/characters/[id]/print` page
5. Test printing and exports

**Deliverables:**
- Print-ready character sheet
- PDF export functionality
- JSON/Markdown export options
- Print preview page

### Phase 3c: Advanced Features (Week 4)
**Tasks:**
1. Implement feat prerequisite validation
2. Add class skill filtering to SkillAllocator
3. Expand spell database (100+ spells across levels 2-9)
4. Update SpellSelector for higher levels
5. Test all enhancements

**Deliverables:**
- Prerequisite validation system
- Class skill filtering
- 100+ new spells
- Enhanced spell selector

---

## Component Specification

### New Components

#### CharacterCard.tsx (150 lines)
```typescript
interface Props {
  character: Character;
  onEdit: (id: string) => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onPrint: (id: string) => void;
}

// Displays: Name, Race, Class, Level, HP, AC
// Actions: View | Edit | Print | Delete
```

#### CharacterFilters.tsx (100 lines)
```typescript
interface Props {
  onFilterChange: (filters: CharacterFilters) => void;
}

// Search by name
// Filter by campaign
// Sort by date/name
```

#### CharacterActions.tsx (80 lines)
```typescript
interface Props {
  characterId: string;
  onAction: (action: string) => void;
}

// Dropdown menu: Edit | Print | Export | Delete
```

### New Pages

#### `/characters/[id]/view/page.tsx` (200 lines)
- Character sheet display
- Tabbed interface
- Edit buttons

#### `/characters/[id]/edit/[section]/page.tsx` (Multiple)
- Abilities, feats, equipment, spells edit pages
- Similar to Phase 2 pages but with existing data

#### `/characters/[id]/print/page.tsx` (250 lines)
- Print-optimized layout
- PDF styling
- Spell sheet section

---

## Redux Extensions

### characterSlice.ts Updates
```typescript
export const updateCharacter = createAsyncThunk(...)
export const deleteCharacter = createAsyncThunk(...)
export const duplicateCharacter = createAsyncThunk(...)
export const exportCharacter = createAsyncThunk(...)
export const searchCharacters = createAsyncThunk(...)
```

### gameDataSlice.ts Updates
```typescript
export const fetchSpells = createAsyncThunk(...) // Extended
// Fetch all spells (levels 0-9) with pagination
```

---

## Backend API Additions

### Game Rules Endpoints (Extended)
```typescript
// Get spells by level
GET /api/game-rules/spells?level=2

// Get spells for class
GET /api/game-rules/spells?class=wizard

// Get class skills
GET /api/game-rules/classes/{classId}/skills
```

### Character Endpoints (New)
```typescript
// Export endpoints
GET /api/characters/{id}/export?format=pdf
GET /api/characters/{id}/export?format=json

// Duplication
POST /api/characters/{id}/duplicate

// Validation
POST /api/characters/{id}/validate-feats
POST /api/characters/{id}/validate-equipment
```

---

## Database Schema Updates

### Class Schema Extension
```typescript
classSkills: [string] // ["acrobatics", "climb", ...]
```

### Spell Schema Extension
```typescript
level: 0-9 (currently 0-1)
preparable: boolean // Can be prepared vs known
minCasterLevel?: number
```

### Character Schema Extension
```typescript
status: 'draft' | 'active' | 'archived'
notes: string
lastModified: Date
exportedAt?: Date
```

---

## Testing Strategy

### Unit Tests
- Prerequisite validation logic
- Skill grouping by class
- Spell slot calculation
- Export format generation

### Integration Tests
- Full character edit flow
- Export and reimport
- Prerequisite blocking
- Character duplication

### E2E Tests
- View character flow
- Edit character flow
- Print character flow
- Export character flow

---

## Estimated Timeline

**Total Phase 3 Duration:** 4 weeks

| Week | Tasks | Deliverables |
|------|-------|--------------|
| 1 | Character management (view/edit) | Dashboard, viewer, edit pages |
| 2 | Character CRUD operations | Backend endpoints, Redux thunks |
| 3 | Printing & export | PDF/JSON export, print page |
| 4 | Advanced features & testing | Feats, skills, spells, tests |

---

## Success Criteria

- ✅ All character management features working
- ✅ Print/export functionality tested
- ✅ Feat prerequisites properly enforced
- ✅ Class skills properly filtered
- ✅ 100+ spells available
- ✅ All E2E tests passing
- ✅ No type errors in TypeScript
- ✅ User can create, view, edit, and print characters

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| PDF library incompatibility | Test early, use proven library (html2pdf) |
| Performance with large spell list | Implement pagination/lazy loading |
| Prerequisite rule complexity | Start with simple rules, expand gradually |
| Character edit state management | Use Redux carefully to prevent conflicts |

---

## Next Steps

1. **Review & Approve:** Get feedback on Phase 3 scope
2. **Week 1:** Begin character management components
3. **Week 2:** Build character edit pages and backend
4. **Week 3:** Implement printing and export
5. **Week 4:** Add advanced features and test

---

**Status:** READY FOR IMPLEMENTATION
**Next Action:** Begin Phase 3a (Character Management)

