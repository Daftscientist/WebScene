# Security Policy

## Reporting a vulnerability

Please report security issues privately to `security@webscene.dev`.

Include:

- affected version(s)
- reproduction details
- impact assessment
- suggested mitigation if available

## Scope notes

- Untrusted SVG content should be sanitized before loading.
- Third-party plugins are code execution surfaces.
- Treat serialized project JSON as untrusted input in hosted environments.

## Disclosure policy

We aim to acknowledge reports within 72 hours and provide a remediation plan as quickly as possible.
