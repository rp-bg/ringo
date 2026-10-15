---
name: occurrence-telemetry-analysis
description: Use when the user asks about telemetry data fields, data models (IssueView, IssueOccurrenceView, IssueDetail, IssueAnalyticsSummary, AppView, PlatformView, Version, VersionAnalyticsResponseView, MemberView, InvitationView), device specs, device state, activity trails, function parameters, or network parameters.
---

# Appxiom Telemetry & Data Model Reference

This skill provides the comprehensive data dictionary and field definitions for all Appxiom MCP tool responses and deep occurrence telemetry payloads.

---

## 1. Deep Occurrence Telemetry Payloads

### A. Activity Trail (`activityTrail`)
Chronological breadcrumb trail of user interactions, screen views, and lifecycle functions leading up to the issue:

| Field | Description |
| :--- | :--- |
| **`Activity`** | Name of the user action, screen/view, or lifecycle function executed. |
| **`Date`** | Calendar date when the activity occurred. |
| **`Time`** | Exact timestamp with timezone format (e.g. `(zzzz)`). |
| **`Time Taken (ms)`** | Duration of the activity/function execution in milliseconds. |
| **`Free Memory`** | Free system memory available at the time of that activity. |

---

### B. Function Parameters (`functionParameters`)
Method execution context and argument values captured at the moment of failure:

| Field | Description |
| :--- | :--- |
| **`name`** | Parameter variable name. |
| **`value`** | Actual runtime value passed into the method. |
| **`type`** | Data type of the argument (e.g., `String`, `Integer`, `Map`, `Object`). |

---

### C. Network Parameters (`networkParameters`)
Full HTTP request and response payload for API calls and network-related errors:

| Field | Description |
| :--- | :--- |
| **`network method`** | HTTP request method (`GET`, `POST`, `PUT`, `DELETE`, `PATCH`). |
| **`url`** | Full API endpoint URL. |
| **`query parms`** | URL query parameters sent with the request. |
| **`request header`** | Request headers sent by the client. |
| **`request body`** | Request payload body sent to the server. |
| **`request body size`** | Size of the request payload in bytes. |
| **`response header`** | Headers returned by the server. |
| **`status code`** | HTTP status code received (e.g. `200`, `400`, `401`, `404`, `500`, `503`). |
| **`response body size`** | Size of the response payload in bytes. |
| **`response body`** | Response data received from the server. |

---

### D. Device Hardware Profile (`device`)
Static specifications and capabilities of the client device:

| Field | Description |
| :--- | :--- |
| **`brand`** | Device commercial brand (e.g. `Apple`, `Samsung`, `Google`, `Xiaomi`). |
| **`manufacturer`** | Hardware manufacturer name. |
| **`model`** | Specific hardware model identifier (e.g. `iPhone 15 Pro`, `SM-S918B`, `Pixel 8`). |
| **`OS`** | Operating system platform (`0`=Android, `1`=iOS, `3`=iPadOS, `4`=Web). |
| **`custom OS`** | Custom OS / ROM variant name if modified (e.g. MIUI, ColorOS, OneUI). |
| **`screen size`** | Display dimensions and resolution. |
| **`memory`** | Total installed device RAM. |
| **`storage`** | Total internal storage capacity. |
| **`serial`** | Device hardware serial identifier. |
| **`Sim slot count`** | Number of physical/eSIM slots available. |
| **`voice call enabled`**| Whether telephony and voice calling are supported (`true`/`false`). |
| **`hearing AID supported`** | Hearing aid compatibility indicator (`true`/`false`). |
| **`TTY supported`** | Teletypewriter support flag (`true`/`false`). |

---

### E. Device Runtime State (`deviceState`)
Dynamic snapshot of device resources and environmental state at the exact moment of failure:

| Field | Description |
| :--- | :--- |
| **`bandwidth`** | Current network bandwidth / connection throughput. |
| **`availableMemory`** | Total usable RAM remaining on the device. |
| **`freeMemory`** | Unallocated free RAM at incident time. |
| **`availableStorage`** | Remaining usable internal storage space. |
| **`freeStorage`** | Unallocated free disk storage. |
| **`batteryLevel`** | Device battery percentage (0–100%). |
| **`isRoaming`** | Whether the device was connected via mobile data roaming. |
| **`rootedDevice`** | Root / Jailbreak status (`true` if rooted/jailbroken, `false` otherwise). |
| **`isSimSmsCapable`** | Whether the SIM card and device support SMS messaging. |
| **`isWorldSim`** | Global / World SIM support flag. |
| **`lastRebootTime`** | Timestamp of the device's last system reboot. |

---

## 2. Tool Response Data Models

### A. Issue Models

#### `PaginatedIssueResponseView` (`list_issues`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `page` | `int` | Current page index (`0`-indexed). |
| `pageSize` | `int` | Maximum number of items returned per page. |
| `totalCount` | `long` | Total number of issues matching the search/filter criteria. |
| `totalPages` | `int` | Total number of pages available (`ceil(totalCount / pageSize)`). |
| `hasNextPage` | `boolean` | `true` if there are subsequent pages available. |
| `hasPreviousPage` | `boolean` | `true` if previous pages exist (`page > 0`). |
| `issues` | `List<IssueView>` | List of issue items for the current page. |

#### `IssueView` (`get_issue_details`, and embedded in `PaginatedIssueResponseView`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique issue ID. |
| `appId` | `String` | Associated application ID. |
| `platformId` | `String` | Associated platform ID. |
| `versionId` | `String` | Associated version ID. |
| `issueKey` | `String` | Unique hash key representing the error group. |
| `description` | `String` | Error title, message, or exception name. |
| `severity` | `Byte` | Severity level: `2` = Fatal, `1` = Major, `0` = Minor. |
| `typeId` | `Byte` | Category type ID (Crash, ANR, Exception, etc.). |
| `os` | `Byte` | OS code: `0` = Android, `1` = iOS, `3` = iPadOS, `4` = Web. |
| `occurrenceCount` | `Long` | Total times this bug was triggered across all devices. |
| `deviceCount` | `Long` | Total unique devices that encountered this issue. |
| `occurredAt` | `String` | Formatted timestamp of first occurrence. |
| `lastOccurredAt` | `String` | Formatted timestamp of most recent occurrence. |
| `createdAt` | `String` | Record creation timestamp. |
| `updatedAt` | `String` | Record update timestamp. |
| `hint` | `String` | Automated troubleshooting hint. |
| `occurrenceCustomId`| `String`| Custom user/session ID passed by SDK. |
| `device` | `Map` | Static device profile map (see Device Hardware Profile). |
| `occurrenceData` | `Map` | Occurrence payload (`activityTrail`, `functionParameters`, `networkParameters`). |

#### `IssueDetail` (`get_quality_score`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `severityType` | `int` | Severity classification: `2` = Fatal, `1` = Major, `0` = Minor. |
| `deviceCount` | `Long` | Count of unique devices impacted in this severity bucket. |

#### `IssueOccurrenceView` (`get_issue_occurrence_details`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique occurrence identifier. |
| `issueId` | `String` | Parent issue identifier. |
| `appId` | `String` | Application ID. |
| `platformId` | `String` | Platform ID. |
| `versionId` | `String` | Version ID. |
| `deviceId` | `String` | Encrypted/encoded device ID. |
| `customId` | `String` | Custom user/session identifier. |
| `occurredAt` | `String` | Formatted timestamp of this occurrence. |
| `createdAt` | `Long` | Creation epoch timestamp (ms). |
| `updatedAt` | `Long` | Last update epoch timestamp (ms). |
| `device` | `Map` | Hardware specifications at occurrence time. |
| `occurrenceData` | `Map` | Occurrence telemetry payload (`activityTrail`, `functionParameters`, `networkParameters`, `deviceState`). |

#### `IssueAnalyticsSummary` (`get_issue_analytics`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `countriesSummary` | `List<IssueCountries>` | Breakdown of occurrences and devices by country (`countryCode`, `occurrenceCount`, `deviceCount`). |
| `devicesSummary` | `List<IssueDevices>` | Breakdown of occurrences and devices by hardware model (`deviceModel`, `occurrenceCount`, `deviceCount`). |
| `osSummary` | `List<IssueDeviceOSVersions>`| Breakdown of occurrences and devices by OS version (`osVersion`, `occurrenceCount`, `deviceCount`). |

---

### B. Application & Platform Models

#### `AppView` (`list_apps`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique application ID. |
| `name` | `String` | Application name. |
| `customerId` | `String` | Owning customer / organization ID. |
| `active` | `Boolean` | Application active status. |
| `appKey` | `String` | Application SDK key. |
| `deviceCount` | `Long` | Total devices registered with this app. |
| `createdAt` | `Long` | Creation epoch timestamp (ms). |
| `updatedAt` | `Long` | Last update epoch timestamp (ms). |

#### `PlatformView` (`list_platforms`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique platform registration ID. |
| `appId` | `String` | Associated application ID. |
| `typeId` | `Byte` | Platform type: `0` = Android, `1` = iOS, `3` = iPadOS, `4` = Web. |
| `uniqueCode` | `String` | Decrypted bundle identifier (e.g. `com.company.app`). |
| `platformKey` | `String` | Platform-specific SDK key. |
| `createdAt` | `Long` | Creation epoch timestamp (ms). |
| `updatedAt` | `Long` | Last update epoch timestamp (ms). |

---

### C. Version Models

#### `Version` (`list_versions`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Unique version ID. |
| `appId` | `String` | Associated application ID. |
| `platformId` | `String` | Associated platform ID. |
| `platformTypeId`| `Byte` | Platform type: `0` = Android, `1` = iOS, `3` = iPadOS, `4` = Web. |
| `version` | `String` | Release version string (e.g., `1.0.0`). |
| `buildIdentifier`| `String` | Build identifier or commit hash. |
| `sdkType` | `Byte` | SDK integration type (Native, Flutter, React Native). |
| `deviceCount` | `Long` | Total devices on this version. |
| `createdAt` | `Long` | Creation epoch timestamp (ms). |
| `updatedAt` | `Long` | Last update epoch timestamp (ms). |

#### `VersionAnalyticsResponseView` (`get_version_analytics`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `deviceCount` | `Long` | Total active devices for the version. |
| `versionAnalytics`| `List<VersionAnalytics>` | Breakdown list with `typeId`, `deviceCount`, and `occurrenceCount`. |

---

### D. Team & Member Models

#### `MemberView` (`list_members`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Member assignment ID. |
| `appId` | `String` | Application ID. |
| `appName` | `String` | Application name. |
| `customerId` | `String` | Customer / Organization ID. |
| `customerName` | `String` | Full name of the member. |
| `email` | `String` | Email address of the member. |
| `role` | `Byte` | Role permission level. |
| `createdAt` | `Long` | Creation epoch timestamp (ms). |
| `updatedAt` | `Long` | Last update epoch timestamp (ms). |

#### `InvitationView` (`list_invitations`)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` | Invitation ID. |
| `appId` | `String` | Application ID. |
| `appName` | `String` | Application name. |
| `email` | `String` | Invitee's email address. |
| `inviterEmail` | `String` | Email of the user who sent the invite. |
| `inviterName` | `String` | Name of the user who sent the invite. |
| `role` | `Byte` | Assigned role. |
| `createdAt` | `Long` | Creation epoch timestamp (ms). |
| `updatedAt` | `Long` | Last update epoch timestamp (ms). |
