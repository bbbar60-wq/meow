import { create } from 'zustand';

const useStore = create((set, get) => ({
  // --- 3D Model State ---
  modelUrl: null,
  isUploading: false,
  uploadError: null,
  setModelUrl: (url) => set({ modelUrl: url, uploadError: null }),
  setUploading: (status) => set({ isUploading: status }),
  setError: (error) => set({ uploadError: error }),

  // --- Environment State ---
  backgroundColor: '#252525',
  setBackgroundColor: (color) => set({ backgroundColor: color }),

  // --- Export State ---
  isExporting: false,
  exportProgress: 0,
  isCancelled: false,
  startExport: () => set({ isExporting: true, exportProgress: 0, isCancelled: false }),
  updateProgress: (val) => set({ exportProgress: val }),
  cancelExport: () => set({ isExporting: false, isCancelled: true, exportProgress: 0 }),
  finishExport: () => set({ isExporting: false, exportProgress: 100 }),

  // --- Interaction / Tools State ---
  interactionMode: 'view', // 'view' | 'color'
  setInteractionMode: (mode) => set({ interactionMode: mode }),
}));

export default useStore;