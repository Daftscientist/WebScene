# Concepts: Timelines, Comps, Layers, Tracks

WebScene composes frames from timeline state at time `t`.

## Timeline model

- Time is frame-accurate (`fps` + quantized seconds).
- `Project` contains one root `Comp` plus nested precomps.
- Each `Layer` is active in `[startTime, startTime + duration]`.
- `Track` keyframes drive properties like transform or effect params.

## Layer stack

Layers render in array order (first = back, last = front).

Common layer fields:

- `transform`: position, scale, rotation, anchor, opacity
- `depth`: optional pseudo-3D depth for camera parallax
- `blendMode`
- `masks`
- `effects`
- `tracks` property bindings

## Camera and pseudo-3D

`Comp.camera` supports a simple perspective model (`position` + `zoom`).  
When layers include `depth`, camera motion creates parallax and perspective scaling.

## Track value kinds

- `number`
- `vec2`
- `vec3`
- `color`
- `boolean`
- `string` (hold behavior)
- custom interpolators via `registerInterpolator`

## Easing

Built-ins include `linear`, `easeInOutCubic`, `easeInOutSine`, and `hold`.

## Markers

Both projects and comps support markers for beats, cue points, or notes.
