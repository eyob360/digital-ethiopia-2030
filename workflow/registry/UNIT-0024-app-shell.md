---
id: UNIT-0024
name: App shell
kind: component
path: src/components/layout/app-shell.tsx
status: active
---

# UNIT-0024: App shell

**Purpose:** Shared authenticated application frame with product header, role-aware navigation, and constrained main content.

**Interface:** `AppShell({ session, children })`.

**Variants/options:** Operator sessions receive KPI admin and pipeline navigation; viewers receive dashboard/account navigation.
