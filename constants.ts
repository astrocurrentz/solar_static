import { Artwork, NavItem } from './types';

// NOTE: Ensure your file names match exactly what is in your public/assets folder!

export const ARTWORKS: Artwork[] = [
  {
    id: 'fire_1', // Represents Growth/Creativity (BaZi Element)
    title: 'THE_APEX_ARC',
    description: 'Sever the noise. Lethal focus.',
    // Path starts with /assets because 'public' is the root folder for the browser
    imageUrl: 'public/assets/images/fire_series-01.png', 
    type: 'graphic',
    year: '2026'
  },
  {
    id: 'fire_2', // Represents Passion/Visuality
    title: 'THE_CORE_CRUCIBLE',
    description: 'Pain into fuel. Internal combustion.',
    imageUrl: 'public/assets/images/fire_series-02.png',
    type: 'motion',
    year: '2026'
  },
  {
    id: 'fire_3', // Represents Structure/Code
    title: 'PROTOCOL_WILDFILRE',
    description: 'Total release. Uncontained energy.',
    imageUrl: 'public/assets/images/fire_series-03.png',
    type: 'graphic',
    year: '2026'
  }
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'DESTINY', href: '#hero' },
  { label: 'KARMA', href: '#gallery' },
  { label: 'RITUALS', href: '#audio' },
  { label: 'CONNECT', href: '#contact' },
];