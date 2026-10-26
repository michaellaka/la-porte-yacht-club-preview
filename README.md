# La Porte Yacht Club website
Static GitHub Pages site served from main / root at https://lpyc.club.

## Update the calendar and kitchen special
Edit club-data.js. Publish only dates and specials confirmed by the club.
Events need id, date (YYYY-MM-DD), time (24-hour HH:MM), title, category
(social, dining or club), description and optional durationMinutes.
Events support date selection, category filters and .ics downloads.
Set special to an object with title, description and validThrough (YYYY-MM-DD).
Expired specials automatically revert to the call-the-club card.
No credentials, paid hosting, backend or member data are needed.

## Sources checked October 14, 2026
- https://laporteyachtclub.com/ and /contact/: location and phone
- https://laporteyachtclub.com/bar-dining/: menu links and call for weekly specials
- https://laporteyachtclub.com/events/: no current confirmed event dates found
- Membership application revised 11.4.2023 at the public club website:
  membership waiting list, board interview, dues upon acceptance, separate slip list
- Photos are copied from the existing public club website and credited on the page:
  lake.jpg: /wp-content/uploads/2021/05/coming-soon-yacht-club.jpg
  club-1.jpg: /wp-content/uploads/2021/05/DSC_0009-1200x798.jpg
  pine-lake.jpg: /wp-content/uploads/2024/01/Resized_Resized_20230909_180812_57039471556677-1200x900.jpeg
  The original site's permissions are not documented; club review should confirm reuse.
The existing concept's board-review status is preserved. No event dates, prices,
operating hours or weekly specials were invented.

## Domain
CNAME: lpyc.club
GoDaddy apex A: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
www CNAME: michaellaka.github.io
Enable Enforce HTTPS once GitHub issues the certificate.

## Local preview
Run python -m http.server 8765 in this folder and open http://127.0.0.1:8765.

Commodore's Corner has a dedicated section at #commodore. Replace its clearly labeled pending message with club-approved text and attribution.

Brand asset: lpyc-logo.png is the user-provided LPYC sunset logo, used without alteration in the header and footer.

Search preparation: canonical URL, club name/location title, social metadata, LocalBusiness/WebSite structured data, robots.txt and sitemap.xml. Search Console and Bing verification/submission require the owner's authenticated account.

IndexNow: lpyc-indexnow-key.txt is the public website-ownership proof used to notify participating search engines when the homepage changes. It is not an account login credential.

Staff desk: https://lpyc.club/staff.html uses Firebase Authentication and role-restricted Firestore editing. See STAFF-SETUP.md for account setup and current validation status.

## Member event RSVPs (October 26, 2026)
Upcoming published events show Going / Interested / Not Going. Counts require a verified, active membership sign-in (or event staff access). Members can change or clear their response. The response key stays attached to the membership ID across roster updates, preventing duplicate responses when a membership email changes. RSVP is an expression of attendance intent; it does not collect payment or reserve paid tickets.

The homepage Member RSVPs panel uses existing Firebase Google or email/password sign-in. Email/password accounts must verify their email. Importing a roster does not create accounts or send invitations. Member IDs are identifiers, not passwords.

Administrators see Membership roster after sign-in. Upload a CSV with Member ID and Email columns, preview the record count, then Import memberships. Other columns are retained privately for organizers. IDs preserve leading zeroes and support letters, numbers, hyphens and underscores (max 80). Each email and ID must be unique in a file. Shared household emails need a designated membership record before import. Imports update existing IDs and do not deactivate omitted members. Conflicting email ownership blocks the import; batches of 100 report partial progress on connection failures and can be retried. Keep the original source CSV as the roster backup.

Administrators and Events staff can use View attendee list on an event to see responding members and their contact information. Other members see counts and their own selection; response documents contain only status, timestamp and an opaque key, never names/contact details. Staff permissions remain unchanged.

Validation: JavaScript syntax, CSV parser/duplicate/malformed-file checks, 30 Firebase Rules API simulations (including positive responses and access denials), and signed-out browser layout checked. No real membership roster has been supplied/imported; real-member sign-in, import and RSVP flow remain to be verified after roster onboarding. Security rules are deployed to existing lpyc-staff; site remains on GitHub Pages.
