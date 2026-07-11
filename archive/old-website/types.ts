export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  type: 'graphic' | 'motion' | 'sound';
  year: string;
}

export interface NavItem {
  label: string;
  href: string;
}