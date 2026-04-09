# HTML Wrapper Project Plan

## Project Name
HTML Runner

## Course Context
- Course: `SWE402`
- Goal: build a client-side HTML, CSS, and JavaScript wrapper for live previewing code in multiple device sizes.
- Deployment target: `https://htmlrunner.h190k.com`
- Hosting platform: Cloudflare
- Language constraints: plain `HTML`, `CSS`, and `JavaScript` only. Do not use TypeScript.
- Data policy: client-side only. No database, no server-side persistence, no user accounts.

## Product Summary
Build a web app where a user can:
- type or paste `HTML`, `CSS`, and `JavaScript`
- click `Run` to render the code in a live preview
- switch the preview between `Desktop`, `Tablet`, and `Mobile`
- click `Rerun` after edits to refresh the preview
- click `Save` to download the code as a zip file

The interface must use a two-panel layout:
- left side: code input area
- right side: live preview area with device mode controls

The footer must include:
- clickable text `Designed by H190K` linking to `https://h190k.com`
- `All rights reserved` with a dynamic year that updates automatically

## Core Requirements

### Functional Requirements
1. Provide three code input sections:
   - HTML
   - CSS
   - JavaScript
2. Run user code in an isolated preview environment.
3. Show output in three responsive modes:
   - Desktop
   - Tablet
   - Mobile
4. Support `Run` and `Rerun` behavior.
5. Support `Save` as a downloadable zip archive.
6. Keep the whole system client-side.
7. Make the UI responsive and usable on smaller screens.
8. Footer year must be generated dynamically from the current year.

### Non-Functional Requirements
1. Keep the implementation simple and maintainable.
2. Avoid framework lock-in unless explicitly needed for deployment packaging.
3. Make the UI polished enough for a course presentation.
4. Ensure preview isolation so user code does not break the application shell.
5. Ensure the code is easy to explain in class.

## Proposed Architecture

### Standard Repo Structure
- Keep the main HTML file in the repository root.
- Store all CSS assets in a dedicated CSS-related folder, such as `css/`.
- Store all JavaScript assets in a dedicated script-related folder, such as `js/`.
- Keep the structure simple and predictable so the project is easy to explain and grade.
- Example layout:
  - `index.html`
  - `css/`
  - `js/`

### Frontend Shell
- Single-page layout with two main columns.
- Left column contains code editors.
- Right column contains preview frame and device toggles.

### Preview Engine
- Use an `iframe` sandbox for safe rendering.
- Inject HTML, CSS, and JavaScript into the preview document.
- Rebuild the iframe content on `Run` or `Rerun`.
- Handle errors gracefully so broken code does not crash the page.

### Device Modes
- Desktop mode: wide viewport.
- Tablet mode: medium viewport.
- Mobile mode: narrow viewport.
- Device selection should update the preview frame dimensions and styling.

### Download Flow
- On `Save`, bundle the current HTML, CSS, and JavaScript into a downloadable zip file.
- File naming should be consistent and course-friendly.
- If zip support is implemented with a library, keep the usage client-side only.

### Footer Logic
- Render the current year with `new Date().getFullYear()`.
- Make `Designed by H190K` a normal anchor element.
- Ensure the footer is visible and professional.

## Agent And Skill Plan

Use multiple agents and skills intentionally rather than doing everything in one pass.

### Primary Roles
1. UI Design Agent
   - Use the UI design skill set to define the visual language, spacing, colors, and layout hierarchy.
   - Focus on a presentation-ready interface for a software engineering course.
2. UI/UX Agent
   - Validate usability, task flow, clarity of controls, preview feedback, and responsive behavior.
   - Check that the interface is intuitive for first-time users.
3. Frontend Implementation Agent
   - Build the actual HTML/CSS/JavaScript interface.
   - Implement code editing, preview rendering, device switching, rerun behavior, and download behavior.
4. QA / Testing Agent
   - Verify the app in desktop, tablet, and mobile viewports.
   - Check that preview updates correctly and that the zip download works.
5. Deployment Agent
   - Prepare the static deployment for Cloudflare.
   - Confirm the final site works under the assigned domain.

### Skill Usage Guidance
- Use the `figma` or `figma-implement-design` skill if the team wants a visual mockup before coding.
- Use the `playwright` skill for browser-based validation of the preview and responsive screens.
- Use the `cloudflare-deploy` skill for the final hosting workflow.
- Use the `gh-fix-ci` skill only if the project is connected to GitHub Actions and checks fail.

### Delegation Strategy
- Delegate design definition first.
- Run UX review in parallel with implementation planning.
- Split implementation into bounded sub-tasks:
  - shell layout and styling
  - editor and state management
  - iframe preview renderer
  - device switcher
  - download zip logic
  - footer and branding
  - responsive polish
- Use QA after implementation, not before the UI shell exists.

## Phased Delivery Plan

### Phase 1: Discovery And Scope Lock
Goal: define exactly what the project will include.

Tasks:
- confirm the application is fully client-side
- confirm the code inputs are plain text areas or editors
- confirm desktop, tablet, and mobile widths
- confirm zip download behavior
- confirm footer branding and dynamic year requirement

Outputs:
- final feature list
- screen layout sketch
- implementation constraints

Acceptance:
- scope is short and explainable in a class presentation
- no backend dependencies are introduced

### Phase 2: UX And Visual Design
Goal: make the interface look intentional and easy to use.

Tasks:
- define a two-panel desktop layout
- define mobile stacking behavior
- define button hierarchy for `Run`, `Rerun`, and `Save`
- define clear labels and placeholder text for HTML, CSS, and JavaScript sections
- define preview mode controls for Desktop, Tablet, and Mobile
- define footer treatment and branding

Outputs:
- design direction
- component list
- interaction states

Acceptance:
- the design reads clearly at a glance
- preview controls are obvious
- the interface feels like a real developer tool, not a generic form

### Phase 3: Application Shell
Goal: build the outer structure of the app.

Tasks:
- create the main page layout
- create the left editor panel
- create the right preview panel
- add header, toolbar, and footer
- add responsive breakpoints for narrow screens

Outputs:
- static UI shell
- responsive layout

Acceptance:
- the app is usable before any preview logic is added
- the layout remains stable on desktop and mobile

### Phase 4: Code Input And State Management
Goal: capture user code reliably.

Tasks:
- create HTML, CSS, and JavaScript inputs
- store current editor values in memory only
- track the selected device mode
- preserve entered code between runs during the current session

Outputs:
- editor state model
- controlled input behavior

Acceptance:
- user can edit all three languages independently
- switching preview modes does not clear input

### Phase 5: Live Preview Engine
Goal: render code safely and predictably.

Tasks:
- build iframe sandbox rendering
- inject HTML, CSS, and JavaScript into one preview document
- make `Run` generate the preview from current code
- make `Rerun` rebuild the preview after edits
- add graceful error handling for JavaScript failures

Outputs:
- working preview system
- visible preview updates

Acceptance:
- changing code and rerunning updates the right panel
- broken user code does not break the whole site

### Phase 6: Device Modes
Goal: make the same output readable as desktop, tablet, and mobile.

Tasks:
- create device presets
- update preview width and scaling per preset
- show the active device state clearly
- keep preview centered and readable

Suggested widths:
- Desktop: full-width or large viewport
- Tablet: medium-width viewport
- Mobile: narrow-width viewport

Outputs:
- device switcher
- responsive preview framing

Acceptance:
- each mode looks distinct
- the selected mode is obvious to the user

### Phase 7: Save As Zip
Goal: let users download their work.

Tasks:
- package HTML, CSS, and JavaScript into separate files or a single structured archive
- create a client-side zip download
- name the file clearly
- verify browser download behavior

Outputs:
- zip download feature

Acceptance:
- clicking `Save` downloads a usable zip file
- no server upload is required

### Phase 8: Footer And Branding
Goal: satisfy the assignment branding requirements.

Tasks:
- add `Designed by H190K` as a clickable link to `https://h190k.com`
- render the current year dynamically
- append `All rights reserved`

Outputs:
- compliant footer

Acceptance:
- the year updates automatically without code changes
- branding is clickable and correct

### Phase 9: Testing And Polish
Goal: make the site reliable enough for submission.

Tasks:
- test desktop, tablet, and mobile layouts
- test valid code and invalid code
- test rerun after editing
- test zip download
- test footer year and link
- polish spacing, typography, and button states

Outputs:
- tested release candidate

Acceptance:
- no major usability issues remain
- no obvious layout breaks on common screen sizes

### Phase 10: Cloudflare Deployment
Goal: publish the app to the target domain.

Tasks:
- prepare static build assets
- deploy to Cloudflare Pages or the chosen Cloudflare workflow
- connect the domain `htmlrunner.h190k.com`
- verify the live site in a browser

Outputs:
- public deployment
- final URL verification

Acceptance:
- the app loads correctly on the live domain
- the deployed version matches the local build

## Suggested Implementation Notes

### Recommended UI Behavior
- Use a visible `Run` button as the primary action.
- Switch the action label to `Rerun` after a successful execution or after edits.
- Keep `Save` secondary but available without extra navigation.
- Show a clear active state for the chosen device mode.

### Recommended Preview Safety
- Use an isolated `iframe` with a sandbox attribute.
- Avoid executing user scripts in the main page context.
- If possible, show lightweight error output rather than a blank screen.

### Recommended Styling Direction
- Use a clean developer-tool aesthetic.
- Keep typography readable.
- Use clear contrast between editor and preview panes.
- Avoid overcrowding the interface.

## Delivery Checklist
- [ ] Two-panel layout implemented
- [ ] HTML, CSS, and JavaScript inputs implemented
- [ ] Run and Rerun work correctly
- [ ] Desktop, tablet, and mobile preview modes work
- [ ] Save downloads a zip file
- [ ] Footer contains clickable `Designed by H190K`
- [ ] Footer year updates dynamically
- [ ] No database or backend is used
- [ ] Deployment works on Cloudflare
- [ ] Final domain is reachable at `htmlrunner.h190k.com`

## Final Build Prompt
Build a client-side HTML wrapper application for `SWE402` using plain `HTML`, `CSS`, and `JavaScript` only. The app must let the user enter `HTML`, `CSS`, and `JavaScript` in a left-side editor panel, then run the code into a right-side preview panel that can switch between `Desktop`, `Tablet`, and `Mobile` views. Include `Run`, `Rerun`, and `Save` actions, where `Save` downloads the current code as a zip file without any backend. Add a footer with a clickable `Designed by H190K` link to `https://h190k.com` and an `All rights reserved` line that uses the current year dynamically. Keep the whole project client-side, make the UI polished and responsive, and prepare it for deployment to Cloudflare at `htmlrunner.h190k.com`.
