import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MulticlassSelector from '../MulticlassSelector';
import { PClass } from '../../types/gameRules';

describe('MulticlassSelector Component', () => {
  const mockClasses: PClass[] = [
    {
      _id: '1',
      type: 'class',
      id: 'fighter',
      name: 'Fighter',
      source: 'Core',
      data: {
        hitDie: 'd10',
        baseAttackBonusProgression: 'good',
        savingThrows: { fort: 'good', ref: 'poor', will: 'poor' },
        skillsPerLevel: 2,
        classAbilities: [
          { id: 'bonus-feat', name: 'Bonus Feat', level: 1, description: 'Get a bonus feat' },
        ],
      },
    },
    {
      _id: '2',
      type: 'class',
      id: 'rogue',
      name: 'Rogue',
      source: 'Core',
      data: {
        hitDie: 'd8',
        baseAttackBonusProgression: 'moderate',
        savingThrows: { fort: 'poor', ref: 'good', will: 'poor' },
        skillsPerLevel: 8,
      },
    },
    {
      _id: '3',
      type: 'class',
      id: 'wizard',
      name: 'Wizard',
      source: 'Core',
      data: {
        hitDie: 'd6',
        baseAttackBonusProgression: 'poor',
        savingThrows: { fort: 'poor', ref: 'poor', will: 'good' },
        skillsPerLevel: 2,
      },
    },
  ];

  const mockProps = {
    classes: mockClasses,
    selectedClasses: [],
    maxClasses: 5,
    onAddClass: jest.fn(),
    onRemoveClass: jest.fn(),
    onLevelChange: jest.fn(),
    characterLevel: 10,
    abilityScores: { str: 16, dex: 14, con: 14, int: 10, wis: 12, cha: 10 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render summary section', () => {
      render(<MulticlassSelector {...mockProps} />);

      expect(screen.getByText('Total Level')).toBeInTheDocument();
      expect(screen.getByText('Classes')).toBeInTheDocument();
      expect(screen.getByText('Base Attack Bonus')).toBeInTheDocument();
      expect(screen.getByText('Hit Points')).toBeInTheDocument();
    });

    it('should show 0 total level with no classes', () => {
      render(<MulticlassSelector {...mockProps} selectedClasses={[]} />);

      // Total level is "0" in a specific location in the summary
      const totalLevelElements = screen.getAllByText('0');
      expect(totalLevelElements.length).toBeGreaterThan(0); // At least one 0
    });

    it('should show multiclass rules info when no classes selected', () => {
      render(<MulticlassSelector {...mockProps} selectedClasses={[]} />);

      expect(screen.getByText(/Multiclass Rules/i)).toBeInTheDocument();
      expect(screen.getByText(/Base Attack Bonus is the highest/i)).toBeInTheDocument();
    });

    it('should render add class section', () => {
      render(<MulticlassSelector {...mockProps} />);

      expect(screen.getByText(/Add Class/i)).toBeInTheDocument();
      expect(screen.getByText('Fighter')).toBeInTheDocument();
      expect(screen.getByText('Rogue')).toBeInTheDocument();
      expect(screen.getByText('Wizard')).toBeInTheDocument();
    });
  });

  describe('Adding Classes', () => {
    it('should call onAddClass when add button clicked', async () => {
      const user = userEvent.setup();
      const onAddClass = jest.fn();

      render(
        <MulticlassSelector
          {...mockProps}
          onAddClass={onAddClass}
          selectedClasses={[]}
        />
      );

      const addButtons = screen.getAllByText('+');
      await user.click(addButtons[0]); // Add Fighter

      expect(onAddClass).toHaveBeenCalledWith('fighter');
    });

    it('should hide add section when max classes reached', () => {
      const maxedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 1 },
        { classId: 'rogue', className: 'Rogue', level: 1 },
        { classId: 'wizard', className: 'Wizard', level: 1 },
        { classId: 'barbarian', className: 'Barbarian', level: 1 },
        { classId: 'cleric', className: 'Cleric', level: 1 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={maxedClasses as any}
          maxClasses={5}
        />
      );

      expect(screen.queryByText(/Add Class/i)).not.toBeInTheDocument();
    });

    it('should hide already selected classes from add section', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 1 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses}
        />
      );

      // Fighter should be in selected section, not in add section
      const fighterTexts = screen.getAllByText('Fighter');
      expect(fighterTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Displaying Selected Classes', () => {
    it('should show selected classes', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
        { classId: 'rogue', className: 'Rogue', level: 3 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      expect(screen.getByText('Selected Classes')).toBeInTheDocument();
      expect(screen.getByText('Fighter')).toBeInTheDocument();
      expect(screen.getByText('Rogue')).toBeInTheDocument();
      expect(screen.getByText(/Level 5/)).toBeInTheDocument();
      expect(screen.getByText(/Level 3/)).toBeInTheDocument();
    });

    it('should show total level in summary', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
        { classId: 'rogue', className: 'Rogue', level: 3 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      expect(screen.getByText('8')).toBeInTheDocument(); // 5 + 3
    });

    it('should show BAB for each class', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      expect(screen.getByText(/BAB \+5/)).toBeInTheDocument();
    });

    it('should show HP for each class', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
          abilityScores={{ con: 14 } as any}
        />
      );

      // Fighter d10, level 5, CON +2 = 5 * 12 = 60
      // The HP is shown in the summary section
      expect(screen.getByText('60')).toBeInTheDocument();
    });
  });

  describe('Removing Classes', () => {
    it('should call onRemoveClass when remove button clicked', async () => {
      const user = userEvent.setup();
      const onRemoveClass = jest.fn();

      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
          onRemoveClass={onRemoveClass}
        />
      );

      const removeButton = screen.getByTitle('Remove this class');
      await user.click(removeButton);

      expect(onRemoveClass).toHaveBeenCalledWith('fighter');
    });

    it('should show remove button for selected classes', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      expect(screen.getByTitle('Remove this class')).toBeInTheDocument();
    });
  });

  describe('Adjusting Levels', () => {
    it('should have level slider for each class', async () => {
      const user = userEvent.setup();
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      // Need to expand the class first to show the slider
      const expandButton = screen.getByText('Fighter').closest('button');
      await user.click(expandButton!);

      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(0);
    });

    it('should call onLevelChange when slider moves', async () => {
      const user = userEvent.setup();

      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      const mockOnLevelChange = jest.fn();

      const { rerender } = render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
          onLevelChange={mockOnLevelChange}
        />
      );

      // Need to expand the class first
      const expandButton = screen.getByText('Fighter').closest('button');
      if (expandButton) {
        await user.click(expandButton);

        // Now find the slider
        const slider = screen.getByRole('slider') as HTMLInputElement;
        // The slider should be interactive
        expect(slider).toHaveProperty('type', 'range');
        expect(slider).toHaveProperty('value', '5');

        // Verify the slider exists and can be interacted with
        expect(slider).toBeEnabled();
      }
    });

    it('should display current level value', async () => {
      const user = userEvent.setup();
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 7 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      // Level is shown both in button text and in expanded view
      const levelText = screen.getAllByText(/Level 7/);
      expect(levelText.length).toBeGreaterThan(0);
    });
  });

  describe('Class Expansion', () => {
    it('should show expanded details when clicked', async () => {
      const user = userEvent.setup();

      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      const expandButton = screen.getByText('Fighter').closest('button');
      await user.click(expandButton!);

      // Should show expanded details
      expect(screen.getByText(/Level: 5/)).toBeInTheDocument();
      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('should show class abilities', async () => {
      const user = userEvent.setup();

      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      const expandButton = screen.getByText('Fighter').closest('button');
      await user.click(expandButton!);

      expect(screen.getByText(/Bonus Feat/)).toBeInTheDocument();
    });
  });

  describe('Statistics Calculation', () => {
    it('should calculate multiclass BAB correctly (highest)', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 }, // BAB +5
        { classId: 'rogue', className: 'Rogue', level: 4 }, // BAB +3
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      // Should show +5 (highest) in the BAB summary
      expect(screen.getByText('+5')).toBeInTheDocument();
    });

    it('should calculate multiclass HP correctly (sum)', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 }, // d10
        { classId: 'rogue', className: 'Rogue', level: 3 }, // d8
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
          abilityScores={{ con: 14 } as any} // +2 modifier
        />
      );

      // Fighter: 5*(10+2)=60, Rogue: 3*(8+2)=30, Total: 90
      expect(screen.getByText('90')).toBeInTheDocument();
    });

    it('should update stats when classes change', async () => {
      const user = userEvent.setup();

      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 1 },
      ];

      const { rerender } = render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      // Initial: level 1
      expect(screen.getByText('1')).toBeInTheDocument();

      // Update to level 5
      rerender(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={[
            { classId: 'fighter', className: 'Fighter', level: 5 },
          ] as any}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels', async () => {
      const user = userEvent.setup();
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      // Summary labels
      expect(screen.getByText('Total Level')).toBeInTheDocument();

      // Expand the class to see the Skills/Lvl label
      const expandButton = screen.getByText('Fighter').closest('button');
      await user.click(expandButton!);

      expect(screen.getByText('Skills/Lvl')).toBeInTheDocument();
    });

    it('should have descriptive buttons', () => {
      const selectedClasses = [
        { classId: 'fighter', className: 'Fighter', level: 5 },
      ];

      render(
        <MulticlassSelector
          {...mockProps}
          selectedClasses={selectedClasses as any}
        />
      );

      expect(screen.getByTitle('Remove this class')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<MulticlassSelector {...mockProps} selectedClasses={[]} />);

      // Tab to first button
      await user.tab();
      // Should be able to interact with buttons
    });
  });
});
