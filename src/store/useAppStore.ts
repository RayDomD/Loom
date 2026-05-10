import { create } from 'zustand';

type Pillar = 'notebook' | 'library' | 'tempdump' | 'collections' | 'settings';

interface AppState {
  activePillar: Pillar;
  setActivePillar: (pillar: Pillar) => void;
  activeItemId: string | null;
  setActiveItemId: (id: string | null) => void;
  isListPanelCollapsed: boolean;
  setListPanelCollapsed: (collapsed: boolean) => void;
  isWidgetExpanded: boolean;
  setWidgetExpanded: (expanded: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activePillar: 'notebook',
  setActivePillar: (pillar) => set({ activePillar: pillar, activeItemId: null }),
  activeItemId: null,
  setActiveItemId: (id) => set({ activeItemId: id }),
  isListPanelCollapsed: false,
  setListPanelCollapsed: (collapsed) => set({ isListPanelCollapsed: collapsed }),
  isWidgetExpanded: false,
  setWidgetExpanded: (expanded) => set({ isWidgetExpanded: expanded }),
}));
