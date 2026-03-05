import type { AssetDescriptorJSON } from '../core/schema';

const toDataUri = (svg: string): string => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const circleIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="24" fill="#4b7bec"/></svg>`;
const triangleIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><polygon points="32,8 56,56 8,56" fill="#eb3b5a"/></svg>`;
const squareIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="10" y="10" width="44" height="44" rx="8" fill="#20bf6b"/></svg>`;
const stickFigure = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 220" fill="none" stroke="#111" stroke-width="8" stroke-linecap="round"><circle cx="60" cy="30" r="20"/><line x1="60" y1="50" x2="60" y2="120"/><line x1="60" y1="70" x2="20" y2="95"/><line x1="60" y1="70" x2="100" y2="95"/><line x1="60" y1="120" x2="30" y2="190"/><line x1="60" y1="120" x2="90" y2="190"/></svg>`;

const spriteMeta = {
  frameWidth: 32,
  frameHeight: 32,
  frames: [
    { name: 'idle', x: 0, y: 0, w: 32, h: 32 },
    { name: 'walk_1', x: 32, y: 0, w: 32, h: 32 },
    { name: 'walk_2', x: 64, y: 0, w: 32, h: 32 },
  ],
};

const tinyBeep =
  'data:audio/wav;base64,UklGRjoAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YRYAAAAA////AAAA////AAAA////AAAA';

export const demoAssetLibrary: ReadonlyArray<AssetDescriptorJSON> = [
  { id: 'icon-circle', type: 'svg', src: toDataUri(circleIcon) },
  { id: 'icon-triangle', type: 'svg', src: toDataUri(triangleIcon) },
  { id: 'icon-square', type: 'svg', src: toDataUri(squareIcon) },
  { id: 'character-stick', type: 'svg', src: toDataUri(stickFigure) },
  {
    id: 'sprite-meta',
    type: 'json',
    src: `data:application/json;utf8,${encodeURIComponent(JSON.stringify(spriteMeta))}`,
  },
  { id: 'sfx-beep', type: 'audio', src: tinyBeep },
];
