# FAQ

## Is WebScene a UI framework?

No. It is a rendering/composition engine. UI controls are optional reference modules.

## Does WebScene require React/Vue?

No. It is framework-agnostic.

## Is WebGL supported?

Not in v1. The backend API is designed so WebGL/WebGPU can be added later.

## Can I export MP4 directly?

Not in stable v1. Use frame export + ffmpeg, or experimental WebCodecs + muxer pipeline.

## Is output deterministic?

Yes for a fixed project state and input time, assuming deterministic plugins and assets.
