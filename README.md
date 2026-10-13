# STEM Makerspace Loans

A standalone equipment-lending app for teachers and makerspace admins. It's built with plain HTML, CSS and JavaScript, with no build step and no backend.

## Demo accounts

| Role    | ID         | Password     |
|---------|------------|--------------|
| Teacher | `T-204518` | `Maker#2026` |
| Admin   | `A-100234` | `Maker#2026` |

You can also create your own Teacher or Admin account from the Sign up page.

## Features

**Teachers**
- Sign up, log in with "keep me logged in", and reset a forgotten password.
- Browse the catalog with search and category filters, and see live availability.
- Open an item for its details and a quick request.
- Use the 4-step request form: dates, quantity (checked against availability), purpose, and consumables.
- See every request in **My requests**: cancel pending ones, see admin notes, see due and overdue loans.
- Track loans in **My data**: stats, requests by month, a breakdown by category, and recent requests.
- Get notifications for approvals, declines, returns, and due-soon or overdue reminders.

**Admins**
- **Dashboard**: pending, out on loan, overdue and low-stock counts, plus the latest requests, what's due back this week, and low-stock items.
- **Requests**: Pending, Approved and Declined tabs, search, category filter, pagination, and one-click approve or decline with a note.
- **Request detail**: the teacher's history (past loans, late returns), availability for the requested dates, accept or decline with a note, and mark as returned.
- **Inventory**: add, edit and delete items, set reusable or consumable stock, and set low-stock alerts.
- **Insights**: approval rate, average response time, requests by month, inventory in use, top items, a by-school table, and **Export CSV**.

## How data works

- `js/db.js` is the "database": plain JS objects (`users`, `items`, `requests`, `notifications`) persisted to `localStorage`. The first time the app loads, it seeds realistic demo data with dates relative to today.
- `js/auth.js` stores the session in `localStorage` ("keep me logged in", 30 days) or in `sessionStorage` (ends when the browser closes).
- Passwords are hashed before they're stored. This is a front-end-only demo, so it is **not** real security. Don't use real passwords.
- **Settings → Reset demo data** restores the original sample data.

Data is stored per browser, so each visitor to the GitHub Pages site gets their own copy.

## Run locally

Open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 5173
```

Then visit http://localhost:5173.

## Deploy to GitHub Pages

1. Create a new GitHub repository, e.g. `stem-room-loan-app`.
2. Push this folder to it:
   ```bash
   git init
   git add .
   git commit -m "STEM Makerspace Loans app"
   git branch -M main
   git remote add origin https://github.com/<your-username>/stem-room-loan-app.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, then choose `main` and `/ (root)`, and save.
4. After a minute the site is live at `https://<your-username>.github.io/stem-room-loan-app/`.

The app uses hash routes (`#/browse`, `#/admin/requests`, and so on) and relative paths, so it works under the GitHub Pages sub-path with no extra configuration. `.nojekyll` tells Pages to serve the files as-is.

## Project structure

```
index.html            App entry point
css/styles.css        Design tokens, components, responsive layout
js/utils.js           Date formatting, hashing, CSV helpers
js/db.js              Data model, seed data, loan and availability logic
js/auth.js            Sign up, log in and session handling
js/ui.js              Icons, app shell, modals, toasts, shared widgets
js/views/public.js    Landing, sign up, log in
js/views/teacher.js   Browse, item, request form, my requests, my data, charts
js/views/admin.js     Dashboard, requests, request detail, inventory, insights
js/views/settings.js  Profile, password, reset demo data
js/app.js             Hash router and global events
```
