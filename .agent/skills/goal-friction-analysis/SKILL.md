---
name: goal-friction-analysis
description: Use when the user asks which bugs to fix first, mentions GFI or goal drop-offs, asks for a prioritized issue list, or wants to prioritize bugs based on business conversion impact.
---

# Goal Friction Analysis Skill

This skill teaches the model how to read Goal Friction Impact (GFI) scores, drop-off percentages, affected device counts, and goal conversion statuses together to accurately rank what bugs to fix first, rather than sorting by a single raw metric.

---

## 1. Analysis Workflow Overview

```
┌───────────────────────────────┐
│ 1. Discover Active Goals      │ ──▶ get_gfi_goals(appName, platform, version)
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 2. Evaluate Funnel Health     │ ──▶ Evaluate Dropoff % and GFI severity bands
│    & Classify Risk Bands      │     Rank goals by GFI score (> 4.0 = At Risk) & Dropoff Count
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 3. Fetch Goal-Blocking Issues │ ──▶ get_gfi_issues(appName, platform, version, goalName)
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 4. Deep-Dive Top Root Causes  │ ──▶ get_issue_details(issueId) & get_issue_analytics(issueId)
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 5. Output Prioritized Issues  │ ──▶ Render Actionable Overview: Priority (P0/P1/P2), Impact, Root Cause
└───────────────────────────────┘
```

---

## 2. Step-by-Step Analysis Protocol

### Step 1: Query Active Goals & Funnels
Execute `get_gfi_goals` to retrieve all conversion funnels:
* **Tool Call**: `get_gfi_goals(appName="<appName>", platform="<platform>", version="<version>")`
* If `appName`, `platform`, or `version` are omitted, the server defaults to the primary app/platform/latest version.

### Step 2: Multi-Factor Goal Ranking
Evaluate each goal using the multi-factor criteria:
1. **Drop-off Rate**: Percentage of users who abandoned the app (`appDropoffCount` / `attemptedGoals` * 100).
2. **GFI Severity Band**:
   - 🟢 **Healthy (GFI < 2.0)**: Normal baseline; low priority.
   - 🟡 **Warning (GFI 2.0 – 4.0)**: Noticeable user struggle; medium priority.
   - 🔴 **Critical (GFI > 4.0)**: Catastrophic churn; top priority.

### Step 3: Extract Blocking Technical Bugs
For each goal with GFI $> 2.0$ (starting with the highest GFI):
* **Tool Call**: `get_gfi_issues(appName="<appName>", platform="<platform>", version="<version>", goalName="<goalName>")`
* This maps the business drop-off directly to specific exceptions, ANRs, HTTP failures, or UI thread blocks.

### Step 4: Deep-Dive the Blocking Issues
For the top 3 issues with highest `deviceCount` and `occurrenceCount`:
* **Tool Call**: `get_issue_details(issueId="<issueId>")` to examine the stack trace and error origin.
* **Tool Call**: `get_issue_analytics(issueId="<issueId>")` to identify affected OS versions or device models.

### Step 5: Produce Structured Recommendations
Format the response using the standardized **Actionable Summary Table**:

```markdown
### 🎯 Goal Friction Priority Summary

| Priority | Goal Name | GFI Score | Attempted | Drop-offs | Drop-off % | Primary Technical Root Cause | Affected Devices |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 🔴 **P0** | Checkout Flow | **7.8 / 10** | 1,850 | 180 | 9.7% | `PaymentGatewayTimeoutException` | 142 |
| 🟡 **P1** | User Onboarding | **3.4 / 10** | 4,200 | 95 | 2.3% | `ScreenLoadingDelayed` (SMS OTP) | 88 |
| 🟢 **P2** | Profile Update | **1.2 / 10** | 980 | 5 | 0.5% | `TrimMemoryWarning` | 12 |

#### 🚨 Immediate Action Plan (P0 / P1)
1. **[P0] Fix `PaymentGatewayTimeoutException` in Checkout Flow**:
   - **Issue ID**: `01KXJK...` | **Severity**: Fatal
   - **Impact**: Caused 180 users to abandon the app during checkout.
   - **Action**: Increase client-side timeout and add graceful retry handling.
2. **[P1] Optimize SMS OTP Screen Load**:
   - **Issue ID**: `01KXJL...` | **Severity**: Major
   - **Impact**: Delays OTP screen rendering by > 3.5s on Android 13 devices.
```

---

## 3. Domain Terminology & Glossary

| Metric / Term | Definition | Impact on Prioritization |
| :--- | :--- | :--- |
| **`GFI` (Goal Friction Impact)** | A normalized metric between `0.0` and `10.0` that quantifies user friction during a funnel or business goal. | Lower is better. Scores $> 4.0$ indicate critical funnel blockage. |
| **`attemptedGoals`** | Total number of times users initiated this goal journey. | Baseline volume for calculating dropoff percentage. |
| **`completedGoals`** | Total goal instances that reached the completion milestone without terminating. | High conversion indicator. |
| **`goalsNotCompleted`** | Total goal instances interrupted or not completed. | Incomplete goal count. |
| **`affectedInstallations`** | Number of unique physical devices/installations experiencing at least one error during goal. | Reach of the problem across the user base. |
| **`appDropoffCount`** | Critical failure instances where the user encountered an error during the goal and immediately abandoned the application (closed, uninstalled, or switched away). | **Highest-impact failure mode** (represents lost revenue / churn). |
| **`appReturnCount`** | Number of users who hit an error but reopened or retried the app. | Measures user persistence vs. friction tolerance. |

---

## 4. GFI Mechanics, Score Ranges & Prioritization Guidelines

The Goal Friction Impact (GFI) score is automatically calculated by the Appxiom server on a normalized scale between `0.0` and `10.0` (rounded to 2 decimal places).

### Drop-off Impact vs Recoverable Errors
A bug that causes a user to abandon during a business goal has a significantly higher negative impact on the GFI score compared to a bug where the user retries and completes the flow.

### Score Ranges & Recommended Actions
| GFI Score | Health Status | Funnel State | Recommended Action |
| :--- | :--- | :--- | :--- |
| **`0.0 – 2.0`** | 🟢 **Healthy** | Smooth user journey; negligible errors (< 2% dropoff). | Monitor in weekly digest; no urgent action required. |
| **`2.1 – 4.0`** | 🟡 **Warning** | Noticeable friction; intermittent API timeouts or UI stalls. | Schedule bug fixes in next sprint backlog. |
| **`4.1 – 10.0`** | 🔴 **At Risk** | Majority of users fail or abandon the app; catastrophic churn. | **Immediate P0 Hotfix required.** Halt release rollout if in progress. |

### Multi-Factor Prioritization Guidelines
When ranking multiple issues across goals, do not sort solely by raw issue count. Balance the following dimensions:
1. **GFI Severity Band**: Give highest priority to goals in the **At Risk (> 4.0)** band.
2. **Drop-off Volume & Rate**: Focus on issues driving direct churn (`appDropoffCount`).
3. **Affected Device Reach**: Prioritize issues impacting a larger number of unique devices (`affectedInstallations` / `deviceCount`).

---

## 5. DTO Data Mapping Reference

### `GoalConversionRatioView` (`get_gfi_goals`)
* `name` (`String`): Goal name (e.g., `"Checkout Flow"`, `"Subscription Upgrade"`).
* `version` (`String`): Application version.
* `installationCount` (`Long`): Active devices running this version.
* `attemptedGoals` (`Long`): Total goal starts.
* `completedGoals` (`Long`): Completed goals.
* `goalsNotCompleted` (`Long`): Incomplete goal journeys.
* `affectedInstallations` (`Long`): Devices affected by errors which influenced goal journey.
* `appDropoffCount` (`Long`): Devices that dropped off/abandoned.
* `appReturnCount` (`Long`): Devices that recovered and completed.
* `gfi` (`Double`): Calculated GFI score (`0.0`–`10.0`).

### `GcrIssueResponseView` (`get_gfi_issues`)
* `issue` (`IssueView`): Embedded issue details (`id`, `description`, `severity`, `occurredAt`, `lastOccurredAt`).
* `occurrenceCount` (`Long`): Total occurrences in this goal.
* `deviceCount` (`Long`): Unique devices hitting this issue during the goal.
