import type { CameraJSON } from './schema';

export const createCamera = (id: string, x = 0, y = 0, z = 0, zoom = 1000): CameraJSON => ({
  id,
  position: [x, y, z],
  zoom,
});
