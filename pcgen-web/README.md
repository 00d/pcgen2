# PCGen Web - Pathfinder 1E Character Generator

A modern, web-based character generator for Pathfinder 1st Edition. Create, manage, and export level 1 characters with full rules automation.

**Status**: MVP Ready (95% Complete)

## ✨ Features

### Character Creation
- **8-Step Wizard** - Intuitive guided process from name to finalization
- **Core Races** - 7 playable races with complete racial traits
- **26 Classes** - Core, prestige, and NPC classes
- **Point Buy** - 25-point ability score generation system
- **Skills** - 110 skills with automatic point calculation
- **Feats** - 195 feats with automatic prerequisite validation
- **Equipment** - 112 weapons & 14 armor pieces with 150 gp budget

### Character Management
- **Local Storage** - All data saved in browser (IndexedDB)
- **Import/Export** - Share characters as JSON files
- **Full Character Sheet** - Complete stat display with auto-calculations
- **Edit Mode** - Modify existing characters anytime

### Rules Automation
- Base Attack Bonus (full/medium/poor progressions)
- Saving Throws (fortitude, reflex, will)
- Armor Class (total, touch, flat-footed)
- Skill modifiers (ranks + ability + class bonus)
- Hit Points (first level max, average thereafter)
- Initiative, CMB, CMD
- Carrying Capacity

## 📊 Data

1,138 game elements from Pathfinder Core Rulebook:
- 26 classes
- 7 races
- 195 feats
- 110 skills
- 674 spells
- 112 weapons
- 14 armor pieces

## Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm 9+ or later

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

## 🎮 Usage

### Creating Your First Character

1. Click **"Create New"** on the home page
2. Follow the 8-step wizard
3. Click **"Complete Character"** when done

### Importing a Character

1. Click **"Import"** on the home page
2. Select a `.json` file
3. Character appears in your list

### Exporting a Character

1. Open character sheet (click "View")
2. Click **"Export"**
3. JSON file downloads automatically

## Tech Stack

### Core Framework
- **Next.js 14+** - React framework with App Router
- **React 18+** - UI library
- **TypeScript 5+** - Type safety

### Styling
- **Tailwind CSS 4** - Utility-first CSS
- **Custom dark theme** - Optimized for readability

### State Management
- **Redux Toolkit** - State management
- **React Redux** - React bindings
- **LocalForage** - IndexedDB wrapper for persistence

### Forms & Validation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Testing
- **Vitest** - Unit test framework
- **React Testing Library** - Component testing
- **jsdom** - DOM implementation

### Code Quality
- **ESLint** - Linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires IndexedDB support.

## 📝 Known Limitations

- **Level 1 Only** - Character advancement not yet implemented
- **Core Rulebook Only** - Additional sourcebooks planned
- **No Spells** - Spell selection for casters coming soon
- **No Class Features** - Automatic feature grants in progress
- **Single Class** - Multi-classing not yet supported

## 🗺️ Roadmap

### v1.1 (Next Release)
- Character advancement (level up)
- Spell management
- Mobile responsive improvements

### v2.0 (Future)
- Additional sourcebooks
- Multi-classing
- Class features
- Party management

### v3.0 (Long Term)
- Cloud sync (optional)
- PDF export
- Character import from other tools

## License

This is a modernization of the PCGen project. Original PCGen is licensed under LGPL.

## Contributing

This is currently in active development (Phase 0 complete). Contributions welcome once Phase 1 begins.

## Acknowledgments

- Original PCGen team for the excellent Java application
- Paizo for the Pathfinder RPG system
- Open Gaming License community
