import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'GUESS IT — Think. Guess. Outsmart.',
    short_name: 'GUESS IT',
    description:
      'The universal guessing game. Actors, movies, heroes, numbers, anything — crack it with clues, codes and deduction against AI opponents.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0B0E14',
    theme_color: '#0B0E14',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
