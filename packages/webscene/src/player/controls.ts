import type { Player } from './player';

const createButton = (label: string): HTMLButtonElement => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  return button;
};

export interface PlayerControlsHandle {
  root: HTMLElement;
  destroy(): void;
}

export const createPlayerControls = (
  container: HTMLElement,
  player: Player,
  options: { fps: number; duration: number },
): PlayerControlsHandle => {
  const root = document.createElement('div');
  root.style.display = 'grid';
  root.style.gridTemplateColumns = 'auto auto 1fr auto';
  root.style.gap = '8px';
  root.style.alignItems = 'center';
  root.style.fontFamily = 'monospace';

  const playButton = createButton('Play');
  const pauseButton = createButton('Pause');
  const scrubber = document.createElement('input');
  scrubber.type = 'range';
  scrubber.min = '0';
  scrubber.max = String(options.duration);
  scrubber.step = String(1 / options.fps);
  scrubber.value = '0';

  const label = document.createElement('div');
  label.textContent = '0.00s / f0';

  root.append(playButton, pauseButton, scrubber, label);
  container.append(root);

  const offTick = player.on('tick', ({ time, frame }) => {
    scrubber.value = time.toFixed(3);
    label.textContent = `${time.toFixed(2)}s / f${frame}`;
  });

  const offSeek = player.on('seek', ({ time, frame }) => {
    scrubber.value = time.toFixed(3);
    label.textContent = `${time.toFixed(2)}s / f${frame}`;
  });

  playButton.addEventListener('click', () => player.play());
  pauseButton.addEventListener('click', () => player.pause());
  scrubber.addEventListener('input', () => {
    player.seek(Number(scrubber.value));
  });

  return {
    root,
    destroy() {
      offTick();
      offSeek();
      root.remove();
    },
  };
};
