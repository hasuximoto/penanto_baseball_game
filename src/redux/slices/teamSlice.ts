import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Team, TeamId } from '../../types';

interface TeamState {
  teams: Record<TeamId, Team>;
  selectedTeamId: TeamId | null;
  standings: Array<{ rank: number; teamId: TeamId; wins: number; losses: number }>;
  loading: boolean;
}

const initialState: TeamState = {
  teams: {} as Record<TeamId, Team>,
  selectedTeamId: null,
  standings: [],
  loading: false,
};

const teamSlice = createSlice({
  name: 'team',
  initialState,
  reducers: {
    setTeams: (state, action: PayloadAction<Record<TeamId, Team>>) => {
      state.teams = action.payload;
    },
    updateTeam: (state, action: PayloadAction<{ teamId: TeamId; data: Partial<Team> }>) => {
      if (state.teams[action.payload.teamId]) {
        state.teams[action.payload.teamId] = {
          ...state.teams[action.payload.teamId],
          ...action.payload.data,
        };
      }
    },
    setSelectedTeam: (state, action: PayloadAction<TeamId>) => {
      state.selectedTeamId = action.payload;
    },
    updateStandings: (
      state,
      action: PayloadAction<Array<{ rank: number; teamId: TeamId; wins: number; losses: number }>>
    ) => {
      state.standings = action.payload;
    },
    setTeamLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    addPlayerToTeam: (
      state,
      action: PayloadAction<{ teamId: TeamId; playerId: number }>
    ) => {
      // プレイヤーを追加するロジック
    },
    removePlayerFromTeam: (
      state,
      action: PayloadAction<{ teamId: TeamId; playerId: number }>
    ) => {
      // プレイヤーを削除するロジック
    },
  },
});

export const {
  setTeams,
  updateTeam,
  setSelectedTeam,
  updateStandings,
  setTeamLoading,
  addPlayerToTeam,
  removePlayerFromTeam,
} = teamSlice.actions;

export default teamSlice.reducer;
