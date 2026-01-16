export interface Slide {
  id: string;
  html: string;
  prompt: string;
  variant: 'original' | 'remix';
  timestamp: number;
  isGenerating?: boolean; // For streaming/loading states
}

export interface Project {
  id: string;
  title: string;
  slides: Slide[];
  createdAt: number;
  lastModified: number;
}

export interface GenerationRequest {
  topic: string;
  slideCount?: number;
}

export type ViewMode = 'grid' | 'presentation';

export interface SlideStyle {
  layout: 'centered' | 'split' | 'visual' | 'list';
  theme: 'dark' | 'light' | 'gradient';
}