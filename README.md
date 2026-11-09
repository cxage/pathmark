# PathMark – File Path Marker

[![GitHub Release](https://img.shields.io/github/v/release/cxage/pathmark)](https://github.com/cxage/pathmark/releases/latest)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Marketplace-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=CXAGE.pathmark)
[![Version](https://img.shields.io/badge/version-0.1.0-green)](https://github.com/cxage/pathmark/releases/tag/v0.1.0)

> **PathMark** is a lightweight VS Code extension that maintains consistent project-relative file-path markers at the beginning of supported source files.

It identifies each file's location within your project and keeps that path directly inside the file as a comment.

PathMark helps developers maintain clear file identification without changing, rearranging, or reformatting the rest of their source code.

With a safe check mode and an explicit apply mode, you remain in control of every modification.

## Features

- **Automatic marker detection:** Identifies missing, incorrect, and invalid file-path markers.
- **Automatic marker creation:** Adds missing file-path markers.
- **Marker correction:** Replaces invalid markers at the designated marker position.
- **Content preservation:** Preserves existing source code and unrelated comments.
- **Multiple comment syntaxes:** Supports different programming languages and file formats.
- **Shebang support:** Handles executable scripts without disturbing their shebang lines.
- **Newline preservation:** Maintains existing CRLF and LF newline styles when modifying files.
- **Safe check mode:** Analyzes files without modifying them.
- **Explicit apply mode:** Applies changes only when you choose to do so.
- **Built-in exclusions:** Automatically skips generated and dependency-managed directories.
- **Custom exclusions:** Supports project-specific ignore rules through `.pathmarkignore`.
- **Wildcard support:** Supports filename patterns such as `*.log`, `*.map`, and `*.xxx`.
- **Workspace-wide processing:** Processes all folders in the current VS Code workspace.

## Requirements

- Visual Studio Code.
- Windows operating system (for the currently distributed version).
- A workspace containing files supported by PathMark.

## Getting Started

### 1\. Install PathMark

Install **PathMark – File Path Marker** from the Visual Studio Code Marketplace.

### 2\. Open your project

Open the project or workspace you want PathMark to process in VS Code.

### 3\. Open the Command Palette

Press:

`Ctrl + Shift + P`

Search for:

`PathMark`

You will find two commands:

- **PathMark: Check Workspace**
- **PathMark: Apply Changes**

### 4\. Check your workspace

Select:

`PathMark: Check Workspace`

PathMark analyzes supported files throughout your workspace and reports their marker status.

No files are modified during this operation.

### 5\. Apply changes

After reviewing the proposed changes, select:

`PathMark: Apply Changes`

PathMark displays a confirmation before applying modifications.

Only files requiring missing or invalid markers are modified.

## Check Workspace

Check Workspace is the safe analysis mode.

It:

- Reads supported files.
- Identifies correct markers.
- Detects missing markers.
- Detects invalid markers.
- Displays proposed marker changes.
- Reports skipped files.
- Does not modify project files.

Example output:

text

```text
PathMark

Check mode
No files will be modified.

✓ src/app/layout.tsx
! src/app/example.tsx — missing marker
  + // src/app/example.tsx
- .next/cache/example.json — skipped

Summary: 1 correct, 1 missing, 0 invalid, 1 skipped

1 change(s) would be applied.
```

## Apply Changes

Apply Changes executes the planned modifications.

Before proceeding, PathMark asks for confirmation because this operation modifies project files.

Example output:

text

```text
PathMark

Run mode

Applying 2 change(s)...

✓ src/app/example.tsx
✓ src/app/page.tsx

Applied 2 change(s).

Summary: 3 correct, 2 missing, 0 invalid, 1 skipped
```

If no modifications are required, PathMark reports:

text

```text
No changes to apply.
```

**Recommended workflow:** Run Check Workspace first, review the proposed changes, and then use Apply Changes when you are ready.

## The `.pathmarkignore` File

`.pathmarkignore` controls which project files and directories PathMark should exclude from processing.

This configuration file belongs in the root directory of your project.

### Automatic configuration file creation

If `.pathmarkignore` is missing, PathMark offers to create it automatically.

Select **Create .pathmarkignore** when prompted.

The file is created in the appropriate workspace folder. Run PathMark again to continue processing.

You can then add your own exclusion patterns whenever required.

### Example project structure

text

```text
my-project/
├── .pathmarkignore
├── package.json
├── src/
├── public/
└── .next/
```

### Example configuration

text

```text
# Generated Next.js output
.next

# Dependency directories
node_modules

# Build output
dist
build

# Log files
*.log

# Source maps
*.map

# Temporary or project-specific files
*.xxx
tsconfig.tsbuildinfo

# Project-relative directory
docs/bkp
```

Save the file as plain text, with one pattern per line.

Configuration rules:

- Lines beginning with `#` are treated as comments.
- Blank lines are ignored.
- Built-in exclusions remain enabled automatically.
- Custom patterns are added to the built-in exclusions.
- Excluded directories are skipped before PathMark scans their contents.
- The same exclusion rules apply in both check and apply modes.
- Paths are interpreted relative to the project root.
- The `.pathmarkignore` file itself is excluded from marker processing.

### Editing `.pathmarkignore` in VS Code

For the best experience, use Plain Text mode when editing `.pathmarkignore`.

To change the language mode:

1. Open `.pathmarkignore` in VS Code.
2. Select the language mode indicator in the bottom-right corner.
3. Choose **Plain Text**.
4. Save the file.

Make sure wildcard patterns remain exactly as intended:

text

```text
*.log
*.map
*.xxx
```

## Built-in Exclusions

PathMark automatically excludes directories that are generated, dependency-managed, or normally unnecessary to process.

The built-in exclusions include:

- `.git`
- `.svn`
- `.hg`
- `node_modules`
- `vendor`
- `dist`
- `build`
- `target`
- `out`
- `bin`
- `testdata`

These exclusions remain active even if they are not listed in `.pathmarkignore`.

Additional directories can be excluded through `.pathmarkignore`.

## Supported Ignore Patterns

PathMark supports exact names, directory exclusions, project-relative paths, and wildcard patterns.

| Pattern                | Meaning                                      |
| ---------------------- | -------------------------------------------- |
| `.next`                | Ignore directories named `.next`             |
| `node_modules`         | Ignore dependency directories                |
| `docs/bkp`             | Ignore a specific project-relative directory |
| `README.md`            | Ignore files with that name                  |
| `*.log`                | Ignore log files at any directory depth      |
| `*.map`                | Ignore source map files                      |
| `*.xxx`                | Ignore files ending in `.xxx`                |
| `src/*.test.ts`        | Match files directly under `src`             |
| `tsconfig.tsbuildinfo` | Ignore files with that name                  |

The `*` wildcard matches characters within a single path segment.

For example, `*.map` matches:

text

```text
app.js.map
src/app.js.map
src/components/chart.js.map
```

When an excluded directory is encountered, PathMark skips that directory and does not scan its contents.

## How PathMark Works

PathMark uses the file's path relative to the project root as the marker value.

For example, a Go file:

go

```go
// internal/app/app.go

package app
```

A Python file:

python

```python
# scripts/build.py

print("hello")
```

A Markdown file:

markdown

```markdown
<!-- README.md -->

# My Project
```

Windows path separators are normalized to `/` inside markers.

For example, this file path:

text

```text
internal\app\app.go
```

becomes:

go

```go
// internal/app/app.go
```

Paths are always relative to the project root. Absolute filesystem paths are never used as marker values.

## Marker Position Rules

PathMark follows a simple rule:

**Only the first non-empty line of a normal file is considered the marker position.**

Leading blank lines are ignored when determining where the marker belongs.

PathMark does not search the entire file for comments containing a path.

Existing comments outside the designated marker position are preserved and are not moved or modified.

## Shebang Files

Executable scripts containing a shebang are handled specially.

The marker belongs immediately after the shebang.

For example:

python

```python
#!/usr/bin/env python3
# scripts/example.py

print("hello")
```

The shebang remains untouched.

Existing comments following the shebang are preserved. PathMark does not treat every comment as a valid PathMark marker.

## Missing Markers

A marker is considered missing when the designated marker position does not contain a recognizable PathMark marker.

For example, a Go file containing:

go

```go
package app
```

May become:

go

```go
// internal/app/app.go

package app
```

Existing comments farther down in the file are not searched for or moved.

## Invalid Markers

A marker is invalid when a recognizable PathMark marker exists at the correct position, but its path does not match the actual project-relative path.

For example, if the actual file is:

text

```text
special-cases/example.go
```

But its marker is:

go

```go
// special-cases/wrong.go
```

PathMark identifies the marker as invalid and replaces it with:

go

```go
// special-cases/example.go
```

Unrelated comments are not treated as invalid markers.

## Supported File Types

PathMark supports comment styles appropriate for the following configured file types:

- `.cs`
- `.css`
- `.env`
- `.go`
- `.html`
- `.js`
- `.jsx`
- `.md`
- `.ps1`
- `.py`
- `.rs`
- `.scss`
- `.sh`
- `.sql`
- `.ts`
- `.tsx`
- `.vue`
- `.yaml`
- `.yml`

Files without a supported comment style are skipped.

For example, JSON files are currently unsupported.

Unsupported files are never modified.

## Newline Preservation

When PathMark modifies a file, it attempts to preserve its existing newline style.

- CRLF files continue using CRLF.
- LF files continue using LF.
- Files without a final newline are handled without requiring unrelated content changes.

## Safety and File Preservation

PathMark separates analysis from modification.

**Check Workspace**

- Reads supported files.
- Analyzes markers.
- Reports missing and invalid markers.
- Shows proposed changes.
- Does not modify project files.

**Apply Changes**

- Reads supported files.
- Analyzes markers.
- Builds a change plan.
- Applies the planned changes after confirmation.

PathMark does not:

- Reformat source code.
- Move existing comments.
- Remove unrelated comments.
- Rearrange imports.
- Change indentation.
- Modify application logic.
- Search the entire file for markers.
- Modify unsupported file types.
- Traverse excluded directories.

Its responsibility is limited to maintaining the PathMark marker at its designated position.

## Design Principle

PathMark follows one simple principle:

> Maintain the file-path marker without interfering with the user's source code.

**The marker is ours. Everything else belongs to the user.**

## 🏢 About PathMark

**PathMark – File Path Marker** is developed and maintained by **CXAGE**.

PathMark is a free-to-use Visual Studio Code extension designed to help developers maintain consistent project-relative file-path markers across supported source files.

### Developer

**CXAGE**

Website: https://cxage.com

### Pricing

PathMark is free to use for both personal and commercial projects.

No subscription or payment is required.

### License

PathMark is proprietary software. Users are permitted to use the extension under the terms specified in the accompanying LICENSE file.

Redistribution, resale, and unauthorized modification of the extension are not permitted.

### Privacy

PathMark processes workspace files locally. It does not collect telemetry, analytics, or personal information.

See Privacy Policy for details.

### Support

- Report a Bug
- Request a Feature
- GitHub Repository

Copyright © 2026 CXAGE. All rights reserved.
