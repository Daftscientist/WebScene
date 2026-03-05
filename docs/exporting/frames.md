# Exporting

## Frame export (v1)

Use `exportFrames` to render PNG/WebP sequences and emit a manifest.

```ts
const result = await exportFrames({ engine, canvas, format: 'png' });
console.log(result.manifest);
```

Manifest fields:

- width / height
- fps
- format
- frame list with timestamp + filename

## ZIP output

ZIP is intentionally pluggable via `FrameArchiveBuilder` to avoid heavy default dependencies.

## Experimental WebCodecs (v1.5)

`exportVideoWebCodecs` returns encoded chunks behind `experimental: true`.

Limitations:

- Returns raw chunks; not a final MP4/WebM container.
- Requires a muxer integration for production delivery.
- Browser support varies.

## Server-side guide

For stable production encoding:

1. Export frames + manifest from browser or headless runtime.
2. Use ffmpeg on server/CI to combine frames and audio.
