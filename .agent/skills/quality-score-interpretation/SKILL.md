---
name: quality-score-interpretation
description: Use when the user asks about application health, Quality Score (QS), what a QS value means, asks to evaluate release stability, or wants to understand why their score dropped.
---

# Quality Score Interpretation Skill

This skill teaches the model how to interpret App Quality Score (QS) ranges, evaluate release stability, and explain health trends and severity drivers to engineers and engineering leaders rather than just reciting a raw number.

---

## 1. Quality Score Evaluation Workflow

```
┌───────────────────────────────┐
│ 1. Fetch Quality Score Data   │ ──▶ get_quality_score(appName, platform, version)
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 2. Deconstruct Penalties      │ ──▶ Analyze Severity Drivers from issueDetails:
│    (Fatal, Major, Minor)      │     - Fatal (2): Highest impact on stability
│                               │     - Major (1): Moderate impact
│                               │     - Minor (0): Low impact
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 3. Map to Health Bands        │ ──▶ 9.0-10.0 (🟢 Healthy), 7.5-8.9 (🟢 Stable),
│                               │     6.0-7.4 (🟡 Warning), < 6.0 (🔴 Critical)
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ 4. Render Analytical Insight  │ ──▶ Executive summary with penalty drivers & recommended actions
└───────────────────────────────┘
```

---

## 2. Step-by-Step Interpretation Protocol

### Step 1: Query Quality Score Telemetry
Call `get_quality_score`:
* **Tool Call**: `get_quality_score(appName="<appName>", platform="<platform>", version="<version>")`
* **Response DTO (`QsResponseView`)**:
  - `version` (`String`): Release version string evaluated (e.g., `1.0.0`).
  - `qsValue` (`Double`): Normalized App Quality Score (`0.0` to `10.0`).
  - `installations` (`Long`): Total devices / installations recorded.
  - `affectedInstallations` (`Long`): Number of installations that experienced a bug.
  - `issues` (`Long`): Count of distinct issue types detected.
  - `issueDetails` (`List<IssueDetail>`): Breakdown list of severity buckets (`severityType`: `2`=Fatal, `1`=Major, `0`=Minor) and `deviceCount`.

### Step 2: Deconstruct Penalty Contributors
Identify which severity group caused the largest reduction in Quality Score:
* **Fatal Issues (`severityType = 2`)**: Fatal crashes and unhandled exceptions have the highest impact and cause significant score drops.
* **Major Issues (`severityType = 1`)**: Severe UI hangs, HTTP 500 errors, and memory leaks moderately reduce stability scores.
* **Minor Issues (`severityType = 0`)**: Handled exceptions, slow frames, and low memory warnings have minimal degradation unless device reach is massive.

### Step 3: Format the Quality Score Report

```markdown
### 📊 App Quality Score Analysis: v`2.1.0`

| Metric | Value | Health Status |
| :--- | :--- | :--- |
| **Quality Score (QS)** | **6.40 / 10.0** | 🟡 **Warning (Elevated Issues)** |
| **Release Version** | `2.1.0` | — |
| **Total Installations** | 25,000 devices | — |
| **Affected Installations** | 1,850 devices | **7.4% of user base experienced a bug** |
| **Total Active Issues** | 14 issue groups | 2 Fatal, 5 Major, 7 Minor |

#### 🔬 Issue Severity Breakdown
* 🔴 **Fatal Issues (2)**: 2 issue groups affecting 120 devices (primary driver of score degradation).
* 🟡 **Major Issues (1)**: 5 issue groups affecting 380 devices.
* 🟢 **Minor Issues (0)**: 7 issue groups affecting 1,350 devices.

#### 💡 Key Takeaway & Recommendation
> Quality Score is **6.40 / 10.0**, suppressed primarily by 2 fatal crash clusters affecting 120 users. Resolving the top Fatal issue will immediately boost your Quality Score back to **~8.36 / 10.0 (🟢 Stable)**.
```

---

## 3. Domain Terminology & Glossary

| Metric / Term | Field Name | Type | Definition |
| :--- | :--- | :--- | :--- |
| **Version** | `version` | `String` | Release version string evaluated (e.g. `1.0.0`). |
| **Quality Score (`QS`)** | `qsValue` | `Double` | A normalized rating between `0.0` and `10.0` measuring overall software quality and user stability for a release version. **Higher is better.** |
| **Installations** | `installations` | `Long` | Total number of unique devices/installations running the specific release version. |
| **Affected Installations** | `affectedInstallations` | `Long` | Number of installations that experienced a bug (Fatal, Major, or Minor). |
| **Total Issues** | `issues` | `Long` | Total unique issue types/groups detected in this version. |
| **Severity Type** | `severityType` | `int` | Severity classification: `2` = Fatal, `1` = Major, `0` = Minor. |
| **Fatal Issues** | `severityType = 2` | `int` | Uncaught crashes, fatal ANRs, and catastrophic unhandled exceptions. |
| **Major Issues** | `severityType = 1` | `int` | Severe UI hangs, HTTP 500 errors, memory leaks, and broken core flows. |
| **Minor Issues** | `severityType = 0` | `int` | Handled exceptions, slow frames, low memory warnings, non-blocking glitches. |

---

## 4. Severity Impact & Scoring Mechanics

Appxiom normalizes Quality Score on a scale from `0.0` to `10.0` (higher is better).

### Severity Tiers
* **Fatal Issues (`2`)**: Fatal crashes and ANRs inflict the heaviest score degradation. Fatal issues affecting a device cohort quickly push the QS into Warning or Critical bands.
* **Major Issues (`1`)**: Severe UI hangs, HTTP 500 failures, and memory leaks moderately reduce stability scores.
* **Minor Issues (`0`)**: Handled exceptions, slow frames, and low memory warnings have a low impact on QS unless they reach a wide fraction of total active devices.

### Release Health Ranges
| Score Range | Status | Release Health & Impact |
| :--- | :--- | :--- |
| **`9.0 – 10.0`** | 🟢 **Healthy** | Optimal stability; negligible user-impacting defects. |
| **`7.5 – 8.9`** | 🟢 **Stable** | Production baseline; acceptable minor background issues. |
| **`6.0 – 7.4`** | 🟡 **Warning** | Elevated failure rate; noticeable user friction. Target fixes in current sprint. |
| **`< 6.0`** | 🔴 **Critical** | Severe stability failure; immediate hotfix / rollout freeze required. |

---

## 5. Contextualizing Scores in Model Responses

### Good Model Interpretation Example:
> *"Version **2.4.0** has an App Quality Score of **6.20 / 10.0** (🟡 Warning), indicating elevated stability issues. This score drop is primarily driven by **84 devices hitting Fatal crashes** (`OutOfMemoryError`), representing the primary driver of score degradation."*
