import { performance } from 'node:perf_hooks';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const distPath = resolve(scriptDir, '../dist/index.js');
if (!existsSync(distPath)) {
  throw new Error('Build output missing. Run `npm run build` before `npm run perf`.');
}

const mod = await import(distPath);

const { KeyframeTrack, getInterpolator } = mod;

const scenario = (name, fn, budgetMs) => {
  const start = performance.now();
  const score = fn();
  const elapsed = performance.now() - start;
  const status = elapsed <= budgetMs ? 'OK' : 'FAIL';
  console.log(`${status} ${name}: ${elapsed.toFixed(2)}ms (budget ${budgetMs}ms, score ${score.toFixed(2)})`);
  if (elapsed > budgetMs) {
    throw new Error(`${name} exceeded performance budget`);
  }
};

scenario(
  'number-track-300k',
  () => {
    const track = new KeyframeTrack(
      [
        { time: 0, value: 0, easing: 'easeInOutCubic' },
        { time: 0.5, value: 100, easing: 'easeInOutCubic' },
        { time: 1, value: 0, easing: 'easeInOutCubic' },
      ],
      getInterpolator('number'),
    );

    let acc = 0;
    for (let i = 0; i < 300_000; i += 1) {
      acc += track.evaluate((i % 1000) / 1000);
    }
    return acc;
  },
  Number(process.env.WEBSCENE_PERF_BUDGET_TRACK_MS ?? 900),
);

scenario(
  'vec3-track-250k',
  () => {
    const track = new KeyframeTrack(
      [
        { time: 0, value: [0, 0, 0], easing: 'easeInOutSine' },
        { time: 1, value: [10, 20, 30], easing: 'easeInOutSine' },
      ],
      getInterpolator('vec3'),
    );

    let acc = 0;
    for (let i = 0; i < 250_000; i += 1) {
      const value = track.evaluate((i % 1200) / 1200);
      acc += value[0] + value[1] + value[2];
    }
    return acc;
  },
  Number(process.env.WEBSCENE_PERF_BUDGET_VEC3_MS ?? 1200),
);

console.log('WebScene performance check passed');
