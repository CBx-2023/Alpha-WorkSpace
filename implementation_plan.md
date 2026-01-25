# Implementation Plan - Refine Reset Layout UI

The goal is to replace the browser-native `confirm()` dialog with a custom, modern modal for the "Reset Layout" feature.

## User Interface Changes

### [MODIFY] Reset Button Action
- Clicking the reset button will no longer trigger `window.confirm`.
- Instead, it will set `showResetConfirm` state to `true`.

### [NEW] Reset Confirmation Dialog
- **Style**: Consistent with existing dark/glassmorphism theme.
- **Content**:
    - Header: "确认重置" (Confirm Reset)
    - Body: "您确定要恢复默认布局吗？这将重置所有图标的位置。" (Are you sure? This will reset positions.)
    - Actions:
        - **Cancel**: Close dialog.
        - **Confirm**: A red/danger button "确认重置" (Confirm Reset).

## Technical Implementation

### App.tsx
- Add state: `const [showResetConfirm, setShowResetConfirm] = useState(false);`
- Update `handleResetLayout`: Remove confirm logic, just set state.
- Add `confirmReset` function: Executes the actual reset logic and closes dialog.
- Render new dialog JSX at the bottom of the component tree.

### App.css
- Reuse existing `.dialog` styles.
- Add `.btn-danger` for the destructive action.

## Verification
- Click reset button -> Verify custom dialog appears.
- Click cancel -> Dialog closes, nothing happens.
- Click confirm -> Layout resets, dialog closes, toast appears.
