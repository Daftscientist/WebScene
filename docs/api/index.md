# API Reference (v1)

## Core

- `Project`
- `Comp`
- `Layer`
- `Track`
- `Engine`
- `createEngine`
- `createCamera`
- `createPatch`
- `serializeProject` / `deserializeProject`

## Layer factories

- `createSolidLayer`
- `createRectLayer`
- `createTextLayer`
- `createImageLayer`
- `createPrecompLayer`

## Animation

- `KeyframeTrack`
- `easing`
- `registerInterpolator`
- `WiggleBehavior`
- `SpringBehavior`

## Rendering

- `Canvas2DBackend`
- `CanvasRenderTarget`
- `createOffscreenTarget`

## Effects

- `EffectRegistry`
- `registerBuiltInEffects`

## Assets

- `AssetRegistry`
- `ImageAssetLoader`
- `AudioAssetLoader`
- `JsonAssetLoader`
- `demoAssetLibrary`

## Player / Audio

- `Player`
- `createPlayerControls` (reference UI)
- `AudioMixer`

## Export

- `exportFrames`
- `createZipArchiveBuilder` / `ZipArchiveBuilder`
- `exportVideoWebCodecs` (experimental)
- `exportVideoWebM` (experimental)
- `downloadBlob`

See TypeScript declarations in `packages/webscene/dist/index.d.ts` for full signatures.
