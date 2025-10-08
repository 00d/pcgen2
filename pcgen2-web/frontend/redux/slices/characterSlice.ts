import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { CharacterState, Character, AbilityScore, Feat, SkillAllocation, EquipmentSelection, SpellSelection } from '../../types/character';
import { api } from '../../lib/api';

const initialState: CharacterState = {
  characters: [],
  currentCharacter: null,
  isLoading: false,
  error: null,
  step: 'race',
};

export const fetchCharacters = createAsyncThunk(
  'character/fetchCharacters',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getCharacters();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch characters');
    }
  }
);

export const createCharacter = createAsyncThunk(
  'character/createCharacter',
  async ({ name, campaign }: { name: string; campaign?: string }, { rejectWithValue }) => {
    try {
      return await api.createCharacter(name, campaign);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to create character');
    }
  }
);

export const getCharacterById = createAsyncThunk(
  'character/getCharacterById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await api.getCharacterById(id);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch character');
    }
  }
);

export const setCharacterRace = createAsyncThunk(
  'character/setRace',
  async ({ characterId, raceId }: { characterId: string; raceId: string }, { rejectWithValue }) => {
    try {
      return await api.setCharacterRace(characterId, raceId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to set race');
    }
  }
);

export const addCharacterClass = createAsyncThunk(
  'character/addClass',
  async ({ characterId, classId }: { characterId: string; classId: string }, { rejectWithValue }) => {
    try {
      return await api.addCharacterClass(characterId, classId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add class');
    }
  }
);

export const setAbilityScores = createAsyncThunk(
  'character/setAbilityScores',
  async ({ characterId, scores }: { characterId: string; scores: Record<string, number> }, { rejectWithValue }) => {
    try {
      return await api.updateCharacter(characterId, { attributes: { abilityScores: scores } });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to set ability scores');
    }
  }
);

export const addFeat = createAsyncThunk(
  'character/addFeat',
  async ({ characterId, feat }: { characterId: string; feat: Feat }, { rejectWithValue }) => {
    try {
      return await api.updateCharacter(characterId, { feats: [feat] });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add feat');
    }
  }
);

export const setSkillRanks = createAsyncThunk(
  'character/setSkillRanks',
  async ({ characterId, skills }: { characterId: string; skills: SkillAllocation[] }, { rejectWithValue }) => {
    try {
      return await api.updateCharacter(characterId, { skills });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to set skill ranks');
    }
  }
);

export const addEquipment = createAsyncThunk(
  'character/addEquipment',
  async ({ characterId, equipment }: { characterId: string; equipment: EquipmentSelection[] }, { rejectWithValue }) => {
    try {
      return await api.updateCharacter(characterId, { equipment });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add equipment');
    }
  }
);

export const addSpell = createAsyncThunk(
  'character/addSpell',
  async ({ characterId, spells }: { characterId: string; spells: SpellSelection[] }, { rejectWithValue }) => {
    try {
      return await api.updateCharacter(characterId, { spells });
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to add spell');
    }
  }
);

export const finishCharacter = createAsyncThunk(
  'character/finishCharacter',
  async (characterId: string, { rejectWithValue }) => {
    try {
      return await api.getCharacterById(characterId);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to finish character');
    }
  }
);

const characterSlice = createSlice({
  name: 'character',
  initialState,
  reducers: {
    setCurrentCharacter: (state, action) => {
      state.currentCharacter = action.payload;
    },
    setStep: (state, action) => {
      state.step = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch characters
    builder
      .addCase(fetchCharacters.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCharacters.fulfilled, (state, action) => {
        state.isLoading = false;
        state.characters = action.payload;
      })
      .addCase(fetchCharacters.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create character
    builder
      .addCase(createCharacter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCharacter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.characters.push(action.payload);
        state.step = 'race';
      })
      .addCase(createCharacter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Get character by ID
    builder
      .addCase(getCharacterById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCharacterById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
      })
      .addCase(getCharacterById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set race
    builder
      .addCase(setCharacterRace.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setCharacterRace.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.step = 'class';
      })
      .addCase(setCharacterRace.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add class
    builder
      .addCase(addCharacterClass.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addCharacterClass.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.step = 'abilities';
      })
      .addCase(addCharacterClass.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set ability scores
    builder
      .addCase(setAbilityScores.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setAbilityScores.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.step = 'feats';
      })
      .addCase(setAbilityScores.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add feat
    builder
      .addCase(addFeat.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addFeat.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
      })
      .addCase(addFeat.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Set skill ranks
    builder
      .addCase(setSkillRanks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setSkillRanks.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.step = 'equipment';
      })
      .addCase(setSkillRanks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add equipment
    builder
      .addCase(addEquipment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addEquipment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.step = 'spells';
      })
      .addCase(addEquipment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Add spell
    builder
      .addCase(addSpell.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addSpell.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
        state.step = 'finish';
      })
      .addCase(addSpell.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Finish character
    builder
      .addCase(finishCharacter.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(finishCharacter.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentCharacter = action.payload;
      })
      .addCase(finishCharacter.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCurrentCharacter, setStep, clearError } = characterSlice.actions;
export default characterSlice.reducer;
