import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UIState } from '../../types';

const initialState: UIState = {
  loading: false,
  notification: {
    message: '',
    type: 'info',
    visible: false,
  },
  activeScreen: 'MainMenu',
  selectedPlayer: null,
  showModalDialog: false,
  dialogContent: {
    title: '',
    message: '',
    options: [],
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    showNotification: (
      state,
      action: PayloadAction<{
        message: string;
        type: 'info' | 'warning' | 'error' | 'success';
      }>
    ) => {
      state.notification = {
        message: action.payload.message,
        type: action.payload.type,
        visible: true,
      };
    },
    hideNotification: (state) => {
      state.notification.visible = false;
    },
    setActiveScreen: (state, action: PayloadAction<string>) => {
      state.activeScreen = action.payload;
    },
    setSelectedPlayer: (state, action: PayloadAction<number | null>) => {
      state.selectedPlayer = action.payload;
    },
    showModalDialog: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        options: string[];
      }>
    ) => {
      state.showModalDialog = true;
      state.dialogContent = action.payload;
    },
    hideModalDialog: (state) => {
      state.showModalDialog = false;
    },
    resetUI: () => initialState,
  },
});

export const {
  setLoading,
  showNotification,
  hideNotification,
  setActiveScreen,
  setSelectedPlayer,
  showModalDialog,
  hideModalDialog,
  resetUI,
} = uiSlice.actions;

export default uiSlice.reducer;
