# LPYC staff desk — activation checklist

Prepared October 15, 2026. This is not an active login service yet.

## Accounts and roles

Website administrator: mike@options-abc.com (verified email required).
Chef, Commodore and event coordinator email addresses are pending the owner's weekend update. No staff access is assigned yet.

The signed-in Google backend owner is mikelaka@gmail.com. Two-step verification is enabled. The owner approved Firebase terms acceptance. Google Cloud now lists LPYC Staff (project ID lpyc-staff), but Firebase provisioning failed and its console reports an error checking terms acceptance status. Verify this project before retrying creation; do not create duplicates. A Google account owning the backend is distinct from the website administrator. Do not share passwords or change that security setup for the owner.

## Free backend activation

1. Owner completes the Firebase console's required two-step verification. If Firebase presents new terms, obtain the owner's action-time confirmation before accepting.
2. Create a separate LPYC Firebase project on the Spark plan, with Analytics/Gemini optional features off. Do not attach billing or enable paid Storage or Functions.
3. Register the LPYC web app. Put only the public Firebase web configuration in firebase-config.js. No service-account files or private keys belong in the website.
4. Enable Authentication: Google sign-in and Email/Password. Add lpyc.club and www.lpyc.club to authorized domains; localhost is only needed for local testing. Use a private staff session rather than a persistent shared-device login.
5. Create Cloud Firestore in production mode. Deploy firestore.rules before activating the website configuration. Rules deny all unspecified reads/writes, require verified accounts for editors, limit each role to its section and prevent client deletion of content. Drafts are private. Public visitors can read only published items.
6. Establish the verified mike@options-abc.com account. If that address has a Google account, use Google sign-in. Otherwise create a Firebase Authentication user and send a password setup link and verification email; the owner personally sets the password. Do not invent a password or send credentials through chat.
7. Verify rules in the Firebase emulator or Rules Playground: anonymous published reads allowed; anonymous draft reads/writes denied; unassigned verified account writes denied; unverified account denied; chef can edit specials but not notes/events; Commodore can edit notes only; event role can edit events only; admin can assign/remove roles; staff cannot self-promote; malformed writes denied.
8. Publish firebase-config.js only after rules and authentication are configured. Then test a real draft, preview, publish, public refresh, archive, role isolation and sign-out. Use clearly marked test content and archive it after verification. Do not claim live authentication is tested before this step.
9. Add a Staff desk footer link to /staff.html after activation.

## Dashboard behavior

Kitchen: title, description, optional price, start date and expiration date.
Commodore: title, message/topic/question, signature, start date and optional end date. This displays questions; it does not collect member replies.
Events: title, description, date, time, duration, location and calendar category. One event per record; recurring-event rules and photo uploads are not implemented in this version.
All sections support private drafts, preview, publishing and reversible archive. Text is rendered as text rather than injected HTML. Timestamp checks prevent silently overwriting another editor's saved version. Admin can assign one staff role per email and revoke it. Revocation is enforced by database rules on future requests.
The public homepage reads published content on load. Scheduled/expired specials and notes are filtered in La Porte time. The calendar retains downloadable event files and category filtering. No member email list or volunteer responses are stored in this backend.

## Verification so far

JavaScript syntax checks passed. Pure content tests cover validation, invalid dates, scheduling, special expiry, draft exclusion, local timezone and calendar data mapping. Local sample-adapter tests verified draft save and publish; this is not proof of live Firebase authentication or rule enforcement. The local mock adapter under qa/staff must never be deployed.
