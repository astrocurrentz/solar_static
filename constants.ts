import { Artwork, NavItem } from './types';

// NOTE: Replace these placeholder URLs with the actual paths to your uploaded images.
export const ARTWORKS: Artwork[] = [
  {
    id: '01',
    title: 'CUBIC_DECAY',
    description: 'Structural integrity failure. Analysis of digital entropy on geometric forms.',
    imageUrl: 'https://picsum.photos/800/800?random=1', // Placeholder for Skull Cube
    type: 'graphic',
    year: '2023'
  },
  {
    id: '02',
    title: 'VECTOR_TEAR',
    description: 'Velocity induced fragmentation. High-speed data packet loss visualization.',
    imageUrl: 'https://picsum.photos/800/800?random=2', // Placeholder for Spiked Shape
    type: 'motion',
    year: '2024'
  },
  {
    id: '03',
    title: 'THERMAL_MELT',
    description: 'System overheat. Liquid state transition of rigid logic gates.',
    imageUrl: 'https://picsum.photos/800/800?random=3', // Placeholder for Melting Cube
    type: 'graphic',
    year: '2023'
  }
];

export const NAV_ITEMS: NavItem[] = [
  { label: 'INDEX', href: '#hero' },
  { label: 'WORKS', href: '#gallery' },
  { label: 'AUDIO', href: '#audio' },
  { label: 'CONTACT', href: '#contact' },
];