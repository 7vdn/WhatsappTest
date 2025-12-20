I will address the two issues you reported:

1.  **Workflow Creation Fix:**
    *   I will remove the code that creates the n8n workflow from the **Register** (`/api/auth/register`) endpoint.
    *   It is already present in the **Verify OTP** (`/api/auth/verify-otp`) endpoint, so removing it from register will ensure it *only* runs after successful verification.

2.  **Registration/Login Deadlock Fix:**
    *   I will modify the **Register** logic to handle the "Unverified User" case.
    *   Instead of immediately blocking you with "Email already exists" (`400`), the system will check if the account is unverified.
    *   If it is unverified, I will trigger a **Resend OTP** action via Supabase and return a "Success" response to the frontend.
    *   This will cause the UI to show the OTP popup again, allowing you to enter the code and complete the verification process, solving the deadlock.

**Technical Steps:**
1.  **Update `server/storage.ts`**: Add a `resendSignupOtp` function to handle re-sending verification codes for existing unverified users.
2.  **Update `server/routes.ts`**:
    *   Remove `createCompanyWorkflow` from the `register` route.
    *   Update the `register` route to call `resendSignupOtp` when a user already exists. If successful (meaning they were unverified), proceed to show the OTP screen. If it fails (meaning they are already verified), show the "Email exists" error.

This approach solves both problems without requiring manual database changes.