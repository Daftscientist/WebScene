import {
  Canvas2DBackend,
  CanvasRenderTarget,
  Engine,
  Player,
  Project,
  createPlayerControls,
  createRectLayer,
  createSolidLayer,
  createTextLayer,
  demoAssetLibrary,
} from '../../packages/webscene/src/index.ts';

const project = Project.create({ width: 1280, height: 720, fps: 30, duration: 10 }).toJSON();
const comp = project.comps[0];
project.assets.push(...demoAssetLibrary);

const bg = createSolidLayer({ id: 'bg', name: 'bg', duration: 10, color: [8, 10, 15, 1] });
bg.effects = [{ id: 'grain', type: 'grain', enabled: true, params: { strength: 0.06 } }];

const band = createRectLayer({
  id: 'band',
  name: 'band',
  duration: 10,
  width: 960,
  height: 280,
  color: [27, 35, 58, 1],
  cornerRadius: 36,
});
band.transform.position = [160, 220];
band.effects = [
  { id: 'band-shadow', type: 'dropShadow', enabled: true, params: { blur: 22, offsetX: 0, offsetY: 14, color: [0, 0, 0, 0.42] } },
  { id: 'band-glow', type: 'glow', enabled: true, params: { radius: 15, intensity: 0.2, color: [115, 150, 255, 0.7] } },
];

const title = createTextLayer({
  id: 'title',
  name: 'title',
  duration: 10,
  text: 'WebScene Advanced Demo',
  fontFamily: 'ui-serif',
  fontSize: 66,
  color: [242, 247, 255, 1],
});
title.transform.position = [200, 300];

const sub = createTextLayer({
  id: 'sub',
  name: 'sub',
  duration: 10,
  text: 'tracks + effects + player controls + deterministic renderAt(t)',
  fontFamily: 'ui-sans-serif',
  fontSize: 30,
  color: [150, 180, 255, 1],
});
sub.transform.position = [205, 388];

comp.layers.push(bg, band, title, sub);
comp.tracks?.push(
  {
    id: 'band-y',
    name: 'band y',
    valueType: 'number',
    keyframes: [
      { time: 0, value: 280, easing: 'easeOutCubic' },
      { time: 1.5, value: 220, easing: 'easeOutCubic' },
      { time: 8, value: 220, easing: 'hold' },
      { time: 10, value: 300, easing: 'easeInQuad' },
    ],
  },
  {
    id: 'title-opacity',
    name: 'title opacity',
    valueType: 'number',
    keyframes: [
      { time: 0, value: 0 },
      { time: 1, value: 1, easing: 'easeOutQuad' },
      { time: 9, value: 1, easing: 'hold' },
      { time: 10, value: 0, easing: 'easeInQuad' },
    ],
  },
);

band.tracks = [{ path: 'transform.position.1', trackId: 'band-y' }];
title.tracks = [{ path: 'transform.opacity', trackId: 'title-opacity' }];

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const engine = new Engine({ project, backend: new Canvas2DBackend(), target: new CanvasRenderTarget(canvas) });
const player = new Player(engine, { loop: true });

createPlayerControls(document.getElementById('controls') as HTMLElement, player, {
  fps: 30,
  duration: 10,
});

player.play();
