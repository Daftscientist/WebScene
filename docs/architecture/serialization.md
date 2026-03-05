# Serialization Format

WebScene project files are plain JSON (`ProjectJSON`, version `1.0`).

## Top-level shape

```json
{
  "version": "1.0",
  "id": "project_1",
  "rootCompId": "comp_1",
  "revision": 0,
  "settings": { "width": 1920, "height": 1080, "fps": 30, "duration": 6, "colorSpace": "srgb" },
  "comps": [],
  "assets": [],
  "markers": [],
  "idCounter": 42
}
```

## IDs and editor readiness

All major entities have stable IDs for timeline/editor operations.

## Undo/redo-ready updates

Use `StatePatch` operations (`set`, `insert`, `remove`) to mutate state and capture reversible history in external editor tooling.
