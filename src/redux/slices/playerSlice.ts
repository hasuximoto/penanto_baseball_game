import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Player } from '../../types';

interface PlayerState {
  players: Player[];
  selectedPlayer: Player | null;
  filteredPlayers: Player[];
  loading: boolean;
  filterCriteria: {
    position?: string;
    teamId?: string;
    minAverage?: number;
    maxAverage?: number;
  };
}

const initialState: PlayerState = {
  players: [],
  selectedPlayer: null,
  filteredPlayers: [],
  loading: false,
  filterCriteria: {},
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlayers: (state, action: PayloadAction<Player[]>) => {
      state.players = action.payload;
      state.filteredPlayers = action.payload;
    },
    selectPlayer: (state, action: PayloadAction<Player>) => {
      state.selectedPlayer = action.payload;
    },
    clearSelectedPlayer: (state) => {
      state.selectedPlayer = null;
    },
    updatePlayer: (state, action: PayloadAction<Player>) => {
      const index = state.players.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.players[index] = action.payload;
      }
    },
    setPlayerLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    filterPlayers: (
      state,
      action: PayloadAction<{
        position?: string;
        teamId?: string;
        minAverage?: number;
        maxAverage?: number;
      }>
    ) => {
      state.filterCriteria = action.payload;
      state.filteredPlayers = state.players.filter(player => {
        if (action.payload.position && player.position !== action.payload.position) {
          return false;
        }
        if (action.payload.teamId && player.team !== action.payload.teamId) {
          return false;
        }
        if (action.payload.minAverage && player.stats.average < action.payload.minAverage) {
          return false;
        }
        if (action.payload.maxAverage && player.stats.average > action.payload.maxAverage) {
          return false;
        }
        return true;
      });
    },
    clearFilters: (state) => {
      state.filterCriteria = {};
      state.filteredPlayers = state.players;
    },
  },
});

export const {
  setPlayers,
  selectPlayer,
  clearSelectedPlayer,
  updatePlayer,
  setPlayerLoading,
  filterPlayers,
  clearFilters,
} = playerSlice.actions;

export default playerSlice.reducer;
