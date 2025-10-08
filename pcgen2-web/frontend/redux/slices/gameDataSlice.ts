import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { GameDataState, Race, PClass, Feat, Spell, Equipment, Skill } from '../../types/gameRules';
import { api } from '../../lib/api';

const initialState: GameDataState = {
  races: [],
  classes: [],
  feats: [],
  spells: [],
  equipment: [],
  skills: [],
  isLoading: false,
  error: null,
};

export const fetchRaces = createAsyncThunk(
  'gameData/fetchRaces',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getRaces();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch races');
    }
  }
);

export const fetchClasses = createAsyncThunk(
  'gameData/fetchClasses',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getClasses();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch classes');
    }
  }
);

export const fetchFeats = createAsyncThunk(
  'gameData/fetchFeats',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getFeats();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch feats');
    }
  }
);

export const fetchSpells = createAsyncThunk(
  'gameData/fetchSpells',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getSpells();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch spells');
    }
  }
);

export const fetchEquipment = createAsyncThunk(
  'gameData/fetchEquipment',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getEquipment();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch equipment');
    }
  }
);

export const fetchSkills = createAsyncThunk(
  'gameData/fetchSkills',
  async (_, { rejectWithValue }) => {
    try {
      return await api.getSkills();
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch skills');
    }
  }
);

const gameDataSlice = createSlice({
  name: 'gameData',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch races
    builder
      .addCase(fetchRaces.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRaces.fulfilled, (state, action) => {
        state.isLoading = false;
        state.races = action.payload;
      })
      .addCase(fetchRaces.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch classes
    builder
      .addCase(fetchClasses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchClasses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.classes = action.payload;
      })
      .addCase(fetchClasses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch feats
    builder
      .addCase(fetchFeats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.feats = action.payload;
      })
      .addCase(fetchFeats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch spells
    builder
      .addCase(fetchSpells.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSpells.fulfilled, (state, action) => {
        state.isLoading = false;
        state.spells = action.payload;
      })
      .addCase(fetchSpells.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch equipment
    builder
      .addCase(fetchEquipment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEquipment.fulfilled, (state, action) => {
        state.isLoading = false;
        state.equipment = action.payload;
      })
      .addCase(fetchEquipment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch skills
    builder
      .addCase(fetchSkills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSkills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.skills = action.payload;
      })
      .addCase(fetchSkills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = gameDataSlice.actions;
export default gameDataSlice.reducer;
