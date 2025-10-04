export interface Slide {
  id: number;
  type: 'title' | 'content' | 'image' | 'stats' | 'closing' | 'divider';
  title: string;
  subtitle?: string;
  content?: string;
  points?: string[];
  stats?: Array<{
    label: string;
    value: string;
    change?: string;
  }>;
  image?: string;
  background?: string;
  
  // New fields for divider slides
  sectionNumber?: number;
  gradient?: string;
}

export interface PresentationProps {
  slides: Slide[];
  autoAdvance?: boolean;
  autoAdvanceTime?: number;
}