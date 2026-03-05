import {
  Canvas2DBackend,
  CanvasRenderTarget,
  Engine,
  Project,
  createRectLayer,
  createSolidLayer,
  downloadBlob,
  exportFrames,
} from '../../packages/webscene/src/index.ts';

const project = Project.create({ width: 720, height: 720, fps: 24, duration: 2 }).toJSON();
const comp = project.comps[0];

comp.layers.push(
  createSolidLayer({ id: 'bg', name: 'bg', duration: 2, color: [12, 15, 26, 1] }),
  createRectLayer({ id: 'rect', name: 'rect', duration: 2, width: 220, height: 220, color: [255, 140, 74, 1], cornerRadius: 28 }),
);

const rect = comp.layers[1];
rect.transform.position = [80, 250];
rect.effects = [{ id: 'v', type: 'vignette', enabled: true, params: { strength: 0.2 } }];

comp.tracks?.push({
  id: 'x',
  name: 'x',
  valueType: 'number',
  keyframes: [
    { time: 0, value: 80, easing: 'easeInOutCubic' },
    { time: 1, value: 420, easing: 'easeInOutCubic' },
    { time: 2, value: 80, easing: 'easeInOutCubic' },
  ],
});
rect.tracks = [{ path: 'transform.position.0', trackId: 'x' }];

const canvas = document.getElementById('stage') as HTMLCanvasElement;
const engine = new Engine({ project, backend: new Canvas2DBackend(), target: new CanvasRenderTarget(canvas) });
engine.renderAt(0);

const button = document.getElementById('export') as HTMLButtonElement;
button.addEventListener('click', async () => {
  button.disabled = true;
  const exported = await exportFrames({ engine, canvas, format: 'png', startFrame: 0, endFrame: 47 });

  downloadBlob(
    new Blob([JSON.stringify(exported.manifest, null, 2)], { type: 'application/json' }),
    'manifest.json',
  );

  for (let i = 0; i < Math.min(3, exported.files.length); i += 1) {
    const file = exported.files[i];
    downloadBlob(file.blob, file.name);
  }

  button.disabled = false;
});
