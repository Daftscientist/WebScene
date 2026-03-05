# Server Rendering + ffmpeg Guide

## Browser/client frames to MP4

```bash
ffmpeg -framerate 30 -i frame_%05d.png -i audio.wav -c:v libx264 -pix_fmt yuv420p -c:a aac output.mp4
```

## Browser/client frames to WebM

```bash
ffmpeg -framerate 30 -i frame_%05d.webp -c:v libvpx-vp9 -pix_fmt yuv420p output.webm
```

## Headless rendering notes

WebScene core is platform-agnostic, but server rendering requires a canvas implementation (e.g. node-canvas or headless browser) supplied by your runtime.
