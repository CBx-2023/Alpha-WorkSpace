# Implementation Plan - Add Custom App Feature

The goal is to allow users to add their own shortcuts (Web URLs or Local Files) to the workspace.

## User Interface Changes

### [NEW] Add Button
- Position: Top-left corner of the UI.
- Icon: "+" symbol.
- Action: Opens the "Add Custom App" dialog.

### [NEW] Add Custom App Dialog
- Inputs:
    1. **Name**: Name of the application or service.
    2. **Target**: URL (http/https) or Local File Path (e.g., C:\Program Files\...).
    3. **Icon**: Image upload (png, jpg).
- Actions:
    - **Cancel**: Close dialog.
    - **Add**: Validate inputs, create app card, add to workspace, save to local storage.

### [NEW] Reset Layout Button
- Position: Inside "Help" dialog or as a separate icon in top-bar (refresh icon).
- Action: Resets all card positions to their default hardcoded values.
- Logic:
    1. Clear `alpha-workspace-layout` from `localStorage`.
    2. Reset `cards` state to initial values (but keep custom added apps if possible? Or wipe them? User said "Reset Default Position", usually implies keeping apps but resetting coordinates. However, custom apps don't have "default positions". I will preserve custom apps but move them to center, and reset default apps to original spots).
    3. Show success toast.

## Technical Implementation

### Data Model
- Update `AppCard` interface (already compatible, just need to ensure `type` field is handled correctly, maybe introduce `custom` type or just reuse `url`/`app`).
- For icons: Convert uploaded images to Base64 strings to ensure they persist correctly in `localStorage` and display without path issues.

### Components
- `App.tsx`:
    - Add `showAddDialog` state.
    - Add `newAppFormData` state.
    - Implement `handleAddApp` function:
        - Read file input for icon (FileReader to Base64).
        - Create new `AppCard` object with unique ID (UUID or timestamp).
        - Update `cards` state.
        - Save to `localStorage`.

### Styling
- `App.css`:
    - Style the `.add-btn` (top-left).
    - Style the `.add-dialog` (form layout, file input preview).

## Verification
- Test adding a website (e.g., `https://google.com`).
- Test adding a local file (e.g., `notepad.exe`).
- Test persistent storage (reload app).
- Test drag-and-drop for the new items.
