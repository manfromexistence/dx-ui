import { create } from 'zustand';
import {
  AudioLines, AudioWaveform, Blocks, BoomBox, Brush, Chrome, Clapperboard,
  ClockFading, Code, Crop, FastForward, GalleryVerticalEnd, Gem, Globe,
  Hourglass, Image, Laptop, LucideProps, MicVocal, Microscope, Music,
  Podcast, Search, Smartphone, Speaker, CircleSlash2, Terminal, TrainFront,
  Type, Video, Webcam,
} from 'lucide-react';

export interface CategoryItem {
  label: string;
  icon: React.ComponentType<LucideProps>;
}

export interface ChildSubcategoryItem extends CategoryItem {
  id: string;
}

export const mediaCategories: Record<string, CategoryItem> = {
  text: { label: 'Text', icon: Type },
  image: { label: 'Image', icon: Image },
  audio: { label: 'Audio', icon: AudioWaveform },
  video: { label: 'Video', icon: Video },
};

export const parentSubcategories: Record<string, CategoryItem> = {
  'text-default': { label: 'Default', icon: CircleSlash2 },
  canvas: { label: 'Canvas', icon: Brush },
  search: { label: 'Search', icon: Search },
  'deep-research': { label: 'Deep Research', icon: Microscope },
  code: { label: 'Code', icon: Code },
  'image-fast': { label: 'Image Fast', icon: ClockFading },
  'image-quality': { label: 'Image Quality', icon: Gem },
  'video-fast': { label: 'Video Fast', icon: FastForward },
  'video-quality': { label: 'Video Quality', icon: Clapperboard },
  translation: { label: 'Translation', icon: AudioLines },
  music: { label: 'Music', icon: Music },
};

export const childSubcategories: Record<string, ChildSubcategoryItem[]> = {
  'text-default': [
    { id: 'fast', label: 'Fast', icon: TrainFront },
    { id: 'think', label: 'Think', icon: Hourglass },
  ],
  code: [
    { id: 'web', label: 'Web', icon: Globe },
    { id: 'mobile', label: 'Mobile Apps', icon: Smartphone },
    { id: 'desktop', label: 'Desktop Apps', icon: Laptop },
  ],
  'image-fast': [
    { id: '1:1', label: '1:1', icon: Crop },
    { id: '16:9', label: '16:9', icon: Crop },
    { id: '9:16', label: '9:16', icon: Crop },
  ],
  'image-quality': [
    { id: '1:1', label: '1:1', icon: Crop },
    { id: '16:9', label: '16:9', icon: Crop },
    { id: '9:16', label: '9:16', icon: Crop },
  ],
  'video-fast': [
    { id: '16:9-8s', label: '16:9 (8s)', icon: Crop },
    { id: '9:16-8s', label: '9:16 (8s)', icon: Crop },
  ],
  'video-quality': [
    { id: '16:9-30s', label: '16:9 (30s)', icon: Crop },
    { id: '9:16-30s', label: '9:16 (30s)', icon: Crop },
  ],
};

export type MediaCategoryKey = keyof typeof mediaCategories;
export type ParentSubcategoryKey = keyof typeof parentSubcategories;
export type ChildSubcategoryKey = string;

export const getDefaultParent = (mediaKey: MediaCategoryKey): ParentSubcategoryKey => {
  switch (mediaKey) {
    case 'image': return 'image-fast';
    case 'video': return 'video-fast';
    case 'audio': return 'music';
    case 'text':
    default:
      return 'text-default';
  }
};

export const getDefaultChild = (mediaKey: MediaCategoryKey, parentKey: ParentSubcategoryKey): ChildSubcategoryKey | null => {
  switch (parentKey) {
    case 'text-default': return 'fast';
    case 'image-fast':
    case 'image-quality': return '16:9';
    case 'video-fast': return '16:9-8s';
    case 'video-quality': return '16:9-30s';
    case 'translation': return 'tts';
    case 'music': return 'background';
    case 'code': return 'web';
    default: return null;
  }
};

interface ChatOptionsState {
  selectedMedia: MediaCategoryKey;
  selectedParent: ParentSubcategoryKey;
  selectedChild: ChildSubcategoryKey | null;
  setSelectedMedia: (mediaKey: MediaCategoryKey) => void;
  setSelectedParent: (parentKey: ParentSubcategoryKey) => void;
  setSelectedChild: (childId: ChildSubcategoryKey | null) => void;
}

export const useChatOptionsStore = create<ChatOptionsState>()((set) => ({
  selectedMedia: 'text',
  selectedParent: getDefaultParent('text'),
  selectedChild: getDefaultChild('text', getDefaultParent('text')),

  setSelectedMedia: (mediaKey) => set(() => {
    const defaultParent = getDefaultParent(mediaKey);
    const defaultChild = getDefaultChild(mediaKey, defaultParent);
    return {
      selectedMedia: mediaKey,
      selectedParent: defaultParent,
      selectedChild: defaultChild,
    };
  }),

  setSelectedParent: (parentKey) => set((state) => ({
    selectedParent: parentKey,
    selectedChild: getDefaultChild(state.selectedMedia, parentKey),
  })),

  setSelectedChild: (childId) => set({ selectedChild: childId }),
}));