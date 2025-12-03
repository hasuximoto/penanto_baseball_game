import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GameState, GameStatus, OffSeasonStep } from '../../types';

const initialState: GameState = {
  currentDate: 1,
  season: 2026,
  day: 1,
  gameStatus: 'before' as GameStatus,
  playableFlags: {
    canPlayGame: false,
    gameExecuted: false,
    seasonEnded: false,
  },
  autoPlay: false,
  selectedTeamId: null,
  homeTeamScore: 0,
  awayTeamScore: 0,
  currentInning: 1,
  currentOuts: 0,
  baseRunners: [false, false, false],
  selectedDifficulty: 1,
  selectedTeamHuman: null,
  offSeasonStep: 'draft', // Default to draft when off-season starts
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setGameStatus: (state, action: PayloadAction<GameStatus>) => {
      state.gameStatus = action.payload;
    },
    incrementDate: (state) => {
      state.currentDate += 1;
      state.day += 1;
    },
    addDays: (state, action: PayloadAction<number>) => {
      state.currentDate += action.payload;
      state.day += action.payload;
    },
    updateScores: (state, action: PayloadAction<{ home: number; away: number }>) => {
      state.homeTeamScore = action.payload.home;
      state.awayTeamScore = action.payload.away;
    },
    setAutoPlay: (state, action: PayloadAction<boolean>) => {
      state.autoPlay = action.payload;
    },
    setSelectedTeam: (state, action: PayloadAction<string>) => {
      state.selectedTeamId = action.payload as any;
    },
    resetGame: (state) => {
      return initialState;
    },
    setPlayableFlags: (state, action: PayloadAction<Partial<typeof initialState.playableFlags>>) => {
      state.playableFlags = { ...state.playableFlags, ...action.payload };
    },
    incrementInning: (state) => {
      state.currentInning += 1;
    },
    resetOuts: (state) => {
      state.currentOuts = 0;
    },
    incrementOuts: (state) => {
      state.currentOuts += 1;
    },
    updateBaseRunners: (state, action: PayloadAction<[boolean, boolean, boolean]>) => {
      state.baseRunners = action.payload;
    },
    setSeason: (state, action: PayloadAction<number>) => {
      state.season = action.payload;
    },
    setDifficulty: (state, action: PayloadAction<number>) => {
      state.selectedDifficulty = action.payload;
    },
    setGameState: (state, action: PayloadAction<GameState>) => {
      return action.payload;
    },
    setOffSeasonStep: (state, action: PayloadAction<OffSeasonStep>) => {
      state.offSeasonStep = action.payload;
    },
    startNewSeason: (state) => {
      state.season += 1;
      state.currentDate = 1;
      state.day = 1;
      state.gameStatus = 'before';
      state.playableFlags = {
        canPlayGame: true, // Assuming we can start playing immediately or after some setup
        gameExecuted: false,
        seasonEnded: false,
      };
      // Reset in-game state
      state.homeTeamScore = 0;
      state.awayTeamScore = 0;
      state.currentInning = 1;
      state.currentOuts = 0;
      state.baseRunners = [false, false, false];
      state.offSeasonStep = 'draft'; // Reset for next off-season
    },
    resetGameState: () => initialState,
  },
});

export const {
  setGameStatus,
  incrementDate,
  addDays,
  updateScores,
  setAutoPlay,
  setSelectedTeam,
  setPlayableFlags,
  incrementInning,
  resetOuts,
  incrementOuts,
  updateBaseRunners,
  setSeason,
  setDifficulty,
  setGameState,
  setOffSeasonStep,
  startNewSeason,
  resetGameState,
  resetGame,
} = gameSlice.actions;

export default gameSlice.reducer;
