# LPYC staff desk

Backend activated October 16, 2026 using Firebase project lpyc-staff. No billing was added. GitHub Pages remains the website host.

Administrator: mike@options-abc.com. Backend owner: mikelaka@gmail.com. These are separate accounts.

## Sign in

Open https://lpyc.club/staff.html. Use the approved Google account, or enter your email and a personal password and choose First time? Set up my staff account. Verify your email using the message Firebase sends, then return to sign in. Keep credentials private.

The administrator has Kitchen Specials, Commodore's Corner, Events & Calendar, and Staff access. The three staff emails are pending the owner's weekend update. After the administrator assigns each email its role, that person can set up their account. No unassigned user receives editing access.

## Publishing

Create an update, preview it, then Save draft or Publish to website. Specials require an expiration date. Events use La Porte time. Archive removes an update from public view and preserves the record. Drafts are restricted to the appropriate role and administrator. Visitors see published updates when the website loads.

Photo uploads and recurring events are not included. Commodore questions display as text; they do not collect replies. Member email campaigns and volunteer responses are separate systems.

## Backend and verification

Standard Firebase Authentication: Google and Email/Password enabled. Authorized domains: lpyc.club, www.lpyc.club and Firebase's project domains. Standard Firestore database (default), nam5, deletion protection enabled. Rules compiled and deployed. Only public Firebase web configuration is published; CLI credentials stay outside the website.

Thirty Rules API simulations passed for published reads, private drafts, section isolation, admin access, unverified/unassigned users and unauthorized writes. JavaScript syntax and content scheduling/validation tests passed. Positive authenticated publishing and archive still require the administrator's first real sign-in and must not be represented as already tested. No real staff emails or production content have been added.
