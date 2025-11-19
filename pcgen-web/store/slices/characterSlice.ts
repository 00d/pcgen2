/**
 * Character management Redux slice
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { PF1ECharacter, PF2ECharacter } from '@/types';

type Character = PF1ECharacter | PF2ECharacter;

interface CharacterCreation {
  step: number;
  gameSystem?: 'pathfinder1e' | 'pathfinder2e';
  data: Partial<Character>;
}

interface CharacterState {
  current: Character | null;
  list: Character[];
  creation: CharacterCreation;
  loading: boolean;
  error: string | null;
}

const initialState: CharacterState = {
  current: null,
  list: [],
  creation: {
    step: 1,
    data: {},
  },
  loading: false,
  error: null,
};

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    // Character list management
    setCurrentCharacter: (state, action: PayloadAction<string>) => {
      state.current = state.list.find(c => c.id === action.payload) || null;
    },
    addCharacter: (state, action: PayloadAction<Character>) => {
      state.list.push(action.payload);
    },
    updateCharacter: (state, action: PayloadAction<Character>) => {
      const index = state.list.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.list[index] = action.payload;
        if (state.current?.id === action.payload.id) {
          state.current = action.payload;
        }
      }
    },
    deleteCharacter: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(c => c.id !== action.payload);
      if (state.current?.id === action.payload) {
        state.current = null;
      }
    },

    // Character creation wizard
    setCreationStep: (state, action: PayloadAction<number>) => {
      state.creation.step = action.payload;
    },
    setGameSystem: (state, action: PayloadAction<'pathfinder1e' | 'pathfinder2e'>) => {
      state.creation.gameSystem = action.payload;
      state.creation.data = { gameSystem: action.payload } as Partial<Character>;
    },
    updateCreationData: (state, action: PayloadAction<Partial<Character>>) => {
      state.creation.data = { ...state.creation.data, ...action.payload };
    },
    resetCreation: state => {
      state.creation = initialState.creation;
    },
    finalizeCharacter: state => {
      if (state.creation.data.gameSystem) {
        const newCharacter = {
          ...state.creation.data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Character;
        state.list.push(newCharacter);
        state.current = newCharacter;
        state.creation = initialState.creation;
      }
    },

    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Bulk operations
    setCharacterList: (state, action: PayloadAction<Character[]>) => {
      state.list = action.payload;
    },
  },
});

export const {
  setCurrentCharacter,
  addCharacter,
  updateCharacter,
  deleteCharacter,
  setCreationStep,
  setGameSystem,
  updateCreationData,
  resetCreation,
  finalizeCharacter,
  setLoading,
  setError,
  setCharacterList,
} = characterSlice.actions;

export default characterSlice.reducer;
