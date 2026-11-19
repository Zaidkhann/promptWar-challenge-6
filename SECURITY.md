# Security Policy

SaansAI takes platform security, data isolation, and user privacy seriously. This document outlines our security policies, defensible architectural principles, and responsible disclosure process.

---

## 1. Supported Versions

| Version | Supported | Security Maintenance |
| :--- | :---: | :--- |
| `0.1.x` (Current Production) | Yes | Continuous active security monitoring and immediate patching. |

---

## 2. Defensive Security Controls

SaansAI implements defense-in-depth across the entire stack:

- **Strict Content Security Policy (CSP)**: Prohibits unauthorized script execution and frame embedding (`frame-ancestors 'none'`).
- **HTTP Transport Hardening**: Global `Strict-Transport-Security` (HSTS preload, 2 years), `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`.
- **Sliding-Window IP Rate Limiter**: Enforces a strict 120 req/min limit per IP address at the Edge with `429 Too Many Requests` responses.
- **Payload Size Ceiling**: Rejects request bodies exceeding 1MB with `413 Payload Too Large` to prevent DoS attacks.
- **Traversal & Injection Defense**: Proactively terminates requests containing directory traversal (`..`) or null-byte characters (`%00`, `\0`) with `400 Bad Request`.
- **Multi-Tenant User Isolation**: In-memory stores enforce strict per-user boundaries; users cannot inspect or mutate conversations or room configurations belonging to other user IDs.
- **Zero Hallucination Tool Gating**: Agent tools reject unconfirmed preference or room mutations unless explicitly flagged `isConfirmed: true`.

---

## 3. Reporting a Vulnerability

If you discover a security vulnerability or potential exposure in SaansAI, please report it privately:

1. **Email**: Open an issue or submit disclosure directly to the repository maintainer.
2. **Details to Include**:
   - Description of the vulnerability and attack vector.
   - Minimal reproduction steps, request payload, or PoC script.
   - Assessment of potential impact.
3. **Response Timeline**:
   - Initial acknowledgement: within 24 hours.
   - Assessment and remediation timeline: within 48 to 72 hours.
   - Release of patched version: immediately following verification.

Please do not open public GitHub issues for sensitive security vulnerabilities until a patch has been merged.
