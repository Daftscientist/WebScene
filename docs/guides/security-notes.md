# Security Notes

## Asset safety

- Do not trust user-supplied SVG content by default.
- Sanitize SVG assets server-side before serving to browsers.
- Restrict remote fetch domains when building hosted editors.

## Plugin safety

Plugins execute arbitrary code in-process. Treat third-party plugins as untrusted until reviewed.

## Serialization safety

`deserializeProject` assumes trusted JSON. Validate project JSON against your app policy before loading.
