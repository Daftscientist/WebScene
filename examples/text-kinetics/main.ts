import {
  Canvas2DBackend,
  CanvasRenderTarget,
  Engine,
  Project,
  createSolidLayer,
  createTextLayer,
} from '../../packages/webscene/src/index.ts';

const project = Project.create({ width: 1080, height: 1080, fps: 30, duration: 5 }).toJSON();
const comp = project.comps[0];

const bg = createSolidLayer({ id: 'bg', name: 'bg', duration: 5, color: [10, 11, 16, 1] });
const title = createTextLayer({
  id: 'title',
  name: 'title',
  duration: 5,
  text: 'Motion Typography',
  fontSize: 96,
  fontFamily: 'ui-serif',
  color: [242, 245, 255, 1],
  maxWidth: 860,
});

const subtitle = createTextLayer({
  id: 'subtitle',
  name: 'subtitle',
  duration: 5,
  text: 'Track-driven position, opacity, and color',
  fontSize: 34,
  fontFamily: 'ui-sans-serif',
  color: [115, 145, 255, 1],
  maxWidth: 760,
});

title.transform.position = [120, 340];
subtitle.transform.position = [120, 520];

comp.layers.push(bg, title, subtitle);
comp.tracks?.push(
  {
    id: 'title-y',
    name: 'title y',
    valueType: 'number',
    keyframes: [
      { time: 0, value: 430, easing: 'easeOutCubic' },
      { time: 1.2, value: 340, easing: 'easeOutCubic' },
      { time: 5, value: 340, easing: 'hold' },
    ],
  },
  {
    id: 'title-opacity',
    name: 'title opacity',
    valueType: 'number',
    keyframes: [
      { time: 0, value: 0, easing: 'easeOutQuad' },
      { time: 0.8, value: 1, easing: 'easeOutQuad' },
      { time: 5, value: 1, easing: 'hold' },
    ],
  },
  {
    id: 'subtitle-color',
    name: 'subtitle color',
    valueType: 'color',
    keyframes: [
      { time: 0, value: [115, 145, 255, 1], easing: 'easeInOutSine' },
      { time: 2.5, value: [120, 255, 190, 1], easing: 'easeInOutSine' },
      { time: 5, value: [115, 145, 255, 1], easing: 'easeInOutSine' },
    ],
  },
);

title.tracks = [
  { path: 'transform.position.1', trackId: 'title-y' },
  { path: 'transform.opacity', trackId: 'title-opacity' },
];
subtitle.tracks = [{ path: 'color', trackId: 'subtitle-color' }];

const engine = new Engine({
  project,
  backend: new Canvas2DBackend(),
  target: new CanvasRenderTarget(document.getElementById('stage') as HTMLCanvasElement),
});

const start = performance.now();
const loop = (): void => {
  const t = ((performance.now() - start) / 1000) % 5;
  engine.renderAt(t);
  requestAnimationFrame(loop);
};

loop();
