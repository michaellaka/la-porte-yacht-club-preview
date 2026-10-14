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
