import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { YearlyStats } from '../../types';

interface StatsState {
  yearlyStats: YearlyStats[];
}

const initialState: StatsState = {
  yearlyStats: [],
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    addYearlyStats: (state, action: PayloadAction<YearlyStats>) => {
      state.yearlyStats.push(action.payload);
    },
    addMultipleYearlyStats: (state, action: PayloadAction<YearlyStats[]>) => {
      state.yearlyStats.push(...action.payload);
    },
    clearStats: (state) => {
      state.yearlyStats = [];
    },
  },
});

export const { addYearlyStats, addMultipleYearlyStats, clearStats } = statsSlice.actions;
export default statsSlice.reducer;
