# Project Guidelines & Rules

## UI/UX Rules

### 1. No Toast Notifications
- **Strictly Prohibited**: Do not use toast notifications (e.g., `sonner`, `react-hot-toast`) for any user feedback.
- **Alternative**: Use **Modals** for confirmations, inputs, and important alerts. For passive status updates (e.g., "Saved"), use subtle inline indicators (status bars, icons) instead of popping up ephemeral messages.
- **Reason**: Toasts can be missed or distract the user. Modals ensure the user acknowledges the information or action.

### 2. New Document Creation
- When creating a new document, always present a **Modal** (e.g., `CreateDocumentModal`) to confirm the action or input initial metadata (like Title), rather than immediately executing the action or showing a success toast.

## Architecture Guidelines
- (Previous rules can be added here as needed)
