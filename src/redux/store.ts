import { configureStore } from '@reduxjs/toolkit';
import gameReducer from './slices/gameSlice';
import teamReducer from './slices/teamSlice';
import playerReducer from './slices/playerSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    game: gameReducer,
    team: teamReducer,
    player: playerReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
