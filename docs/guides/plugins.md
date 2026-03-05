# Plugin System Guide

WebScene plugins let you register custom layers, effects, and importers.

## Register plugin

```ts
const plugins = new PluginHost();
plugins.register({
  name: 'custom-layers',
  layers: [
    {
      type: 'custom:circle-grid',
      render(ctx, layer) {
        // draw custom behavior
        return true;
      },
    },
  ],
});
```

Pass the host into `Engine` options.

## Layer plugins

- Use deterministic math only.
- Avoid hidden global state.
- Return `true` only when draw calls occur.

## Effect plugins

Effect plugins receive the active layer, comp, effect params, and time.
Keep allocations low and avoid per-frame object creation.

## Importer plugins

Importer plugins convert external payloads into partial `ProjectJSON` structures.
