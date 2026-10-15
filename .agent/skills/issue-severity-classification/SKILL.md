---
name: issue-severity-classification
description: Use when the user asks to list issues, filter bugs by severity, prioritize bugs, or understand Appxiom issue severity levels (fatal, major, minor).
---

# Issue Severity Classification Skill

This skill provides a standardized workflow for querying, filtering, and investigating Appxiom issues against severity levels (`fatal`, `major`, `minor`).

---

## 1. Investigation Workflow

```
┌───────────────────────────────┐
│ 1. Filter Issues by Severity  │ ──▶ list_issues(appName, platform, version, severity)
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 2. Fetch Deep Technical Info  │ ──▶ get_issue_details(issueId)
│    (Stack Trace & Occurrence) │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 3. Analyze Device Scope       │ ──▶ get_issue_analytics(issueId)
│    (OS Versions, Models, Geo) │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 4. Output Summary Report      │ ──▶ Render structured issue report with severity & impact
└───────────────────────────────┘
```

---

## 2. Step-by-Step Protocol

### Step 1: List and Filter Issues
Execute `list_issues` with optional filters and pagination:
* **Tool Call**: `list_issues(appName="<appName>", platform="<platform>", version="<version>", severity="fatal|major|minor", page=0, pageSize=20)`
* **Response DTO (`PaginatedIssueResponseView`)**:
  - `page` (`int`): Current page index (`0`-indexed).
  - `pageSize` (`int`): Items per page.
  - `totalCount` (`long`): Total matching issues.
  - `totalPages` (`int`): Total available pages.
  - `hasNextPage` (`boolean`): Whether additional pages exist.
  - `issues` (`List<IssueView>`): Issue items on current page (`id`, `description`, `occurrenceCount`, `deviceCount`, `severity` (`2`=Fatal, `1`=Major, `0`=Minor), `occurredAt`, `lastOccurredAt`).

### Step 2: Fetch Deep Technical Details
For high-priority issues:
* **Tool Call**: `get_issue_details(issueId="<issueId>")`
  - Retrieves root stack trace, culprit function name, parameter dumps, and error timestamps.
* **Tool Call**: `list_issue_occurrences(issueId="<issueId>")`
  - Retrieves distinct occurrence IDs.
* **Tool Call**: `get_issue_occurrence_details(occurrenceId="<occurrenceId>")`
  - Retrieves device state, free memory, battery level, network connection state, and user activity trail.

### Step 3: Analyze Blast Radius
* **Tool Call**: `get_issue_analytics(issueId="<issueId>")`
  - Inspect OS version breakdown (e.g., isolated to specific OS version).
  - Inspect Device Model breakdown (e.g., specific hardware models).
  - Inspect Country / Geo distribution.

---

## 3. Issue Severity Codes & Tier Mapping

In the Appxiom database, DTOs, and MCP filtering tools, severity is codified as:

| Numeric Code | String Filter | Default Impact Tier | Definition & Behavior |
| :--- | :--- | :--- | :--- |
| **`2`** | `fatal` | 🔴 **Critical / P0** | Process termination, uncaught crash, fatal ANR, or app exit. Prevents app usage entirely. |
| **`1`** | `major` | 🟡 **High / P1** | Severe UI hangs (>250ms), HTTP 500 API failures, memory leaks, broken functional flows. |
| **`0`** | `minor` | 🟢 **Medium / P2** | Handled non-fatal exceptions, slow frames, low memory warnings, non-critical startup delays. |

---

## 4. Platform Codes

| Code | Platform Name | Notes |
| :--- | :--- | :--- |
| **`0`** | `android` | Android Native / Android Flutter / Kotlin |
| **`1`** | `ios` | iOS Native / iOS Flutter / Swift / Obj-C |
| **`3`** | `ipad` / `ipados` | iPadOS Native |
| **`4`** | `web` | Web / Browser Client |
