import { Artwork, NavItem } from './types';

// NOTE: Ensure your file names match exactly what is in your public/assets folder!

export const ARTWORKS: Artwork[] = [
  {
    id: 'WOOD', // Represents Growth/Creativity (BaZi Element)
    title: 'SYSTEM_PATCH_ALPHA',
    description: 'Dermal modification protocol. Tattoo flash set featuring geometric cyber-sigils.',
    // Path starts with /assets because 'public' is the root folder for the browser
    imageUrl: '/assets/images/patch_01.jpg', 
    type: 'graphic',
    year: '2024'
  },
  {
    id: 'FIRE', // Represents Passion/Visuality
    title: 'SOLAR_FLARE_V2',
    description: 'Generative entropy. Midjourney iteration exploring the concept of "Yang Fire".',
    imageUrl: '/assets/images/generated_art_01.jpg',
    type: 'motion',
    year: '2025'
  },
  {
    id: 'METAL', // Represents Structure/Code
    title: 'THE_OPERATOR',
    description: 'Identity verification. Portrait of the architect behind the static.',
    imageUrl: '/assets/images/me.jpg',
    type: 'graphic',
    year: '1993'
  }
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'DESTINY', href: '#hero' },
  { label: 'KARMA', href: '#gallery' },
  { label: 'RITUALS', href: '#audio' },
  { label: 'CONNECT', href: '#contact' },
];