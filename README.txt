LA PORTE YACHT CLUB — PRIVATE WORKING WEBSITE (LOCAL PROTOTYPE)

This is an actual local website application, not just an HTML mockup.
It runs entirely on your Windows computer and does not touch the live club website.
No software installation or outside service is required beyond Python 3.10+.

START ON WINDOWS
1. Download and unzip the project folder.
2. Install Python from python.org if not already installed. During installation, check "Add Python to PATH".
3. Double-click START_WINDOWS.bat (or open a terminal in this folder and run: py server.py).
4. In your browser, open http://127.0.0.1:8765
5. On the first visit, create your administrator account and a strong password.
6. Sign in to the Dashboard to add/edit/delete events and food specials, approve member accounts, and approve/reject photos.
7. Test a member account using a second browser/private window. Register, approve it from your administrator dashboard, then log in as the member.

FUNCTIONS IMPLEMENTED
- Public homepage, monthly/yearly event calendar, upcoming food specials.
- One-time and weekly recurring events, with start and end dates.
- Staff dashboard for event creation, editing, and deletion.
- Local user registration, password-protected login, admin membership approval.
- Members-only community posts.
- Members-only photo uploads (5 MB max), admin approval/rejection, gallery.
- Local SQLite database that persists across restarts.

IMPORTANT LIMITATIONS
- The site is PRIVATE to the computer running it (localhost only). It is NOT published on the Internet, and cannot yet be viewed remotely by the commodore.
- This is a DEVELOPMENT PROTOTYPE, not a security-audited production website. Do not enter real member personal data or expose the server to the public Internet.
- Member posts are immediately visible to approved members; photo uploads require approval.
- No automatic email notifications, password reset, payment processing, or production backups yet.
- The website uses illustrative design and copy; official club facts, addresses, photography and event data must be confirmed before launch.
- The local database is club.sqlite3. Back it up if you want to retain test content. Photo uploads are in private_uploads/.
- Do not put this on public hosting without HTTPS, production authentication/security review, backups, privacy policy, and content moderation policies.

NEXT STEPS
Review locally with the board, approve design and workflow, then choose hosting and deploy a secured staging environment with separate test member accounts.
