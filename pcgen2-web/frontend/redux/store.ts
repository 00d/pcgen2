import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import characterReducer from './slices/characterSlice';
import gameDataReducer from './slices/gameDataSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    character: characterReducer,
    gameData: gameDataReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
