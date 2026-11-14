# Selavu

A phone app for tracking card spending by **billing cycle**. It opens from a link, installs to the Home Screen on iPhone and Android, works offline, and keeps each person's data on their own phone. It needs no App Store, no account and no server.

- Log a payment in about 5 seconds: amount → card → category → Save
- Credit cards follow their own cycle (e.g. SBI 23rd → 22nd, Axis 18th → 17th). Debit, UPI and cash use the calendar month.
- **Bills** tab: every statement with its total, due date and a *Mark paid* toggle
- Charts: category donut, 6-month trend by card, daily spend
- Export to Excel (one tab per month), CSV, backup and restore, and import from an old Google Sheet

---

## Contents

1. [Put the app online](#1-put-the-app-online) (once, by the person sharing it)
2. [Install on a phone](#2-install-on-a-phone)
3. [What to keep ready](#3-what-to-keep-ready)
4. [Add your cards](#4-add-your-cards)
5. [Log a payment every day](#5-log-a-payment-every-day)
6. [One tap from anywhere](#6-one-tap-from-anywhere-optional)
7. [Bring in your Google Sheet history](#7-bring-in-your-google-sheet-history-optional)
8. [Keep your data safe](#8-keep-your-data-safe)
9. [FAQ](#faq)
10. [For developers](#for-developers)

---

## 1. Put the app online

The built app is in the [`docs/`](docs) folder. Any static host works. Pick one option.

### Option A: GitHub Pages (this repository)

1. Push this repository to GitHub. It must be **public** for free Pages.
2. Go to **Settings → Pages → Build and deployment**.
3. Source: **Deploy from a branch** → Branch: **main** → Folder: **/docs** → **Save**.
4. After a minute or two, the app is live at `https://<your-username>.github.io/<repository-name>/`.

To update: change `app.html`, run `python build.py`, then commit and push. Pages redeploys automatically.

### Option B: Netlify Drop (no Git needed)

1. Open **app.netlify.com/drop** on a computer and sign up free.
2. Drag the **`docs`** folder (the whole folder) onto the page.
3. You get an address like `https://random-name-123.netlify.app`. Rename it under **Site configuration → Change site name**.
4. To update: **Deploys** → drag the new `docs` folder in again.

### Then share it

Test the link on your own phone first: tap **Try with sample data**, look around, then clear the sample. Then send the link on WhatsApp or any chat. **Everyone gets their own empty copy.** Nobody can see anyone else's cards or spending.

Updates reach phones the next time they open the app with internet. Users' data is not touched.

---

## 2. Install on a phone

### iPhone

1. Open the link in **Safari**. If it opened inside WhatsApp, tap *Open in Safari* first.
2. Tap **Share** (square with an arrow) → **Add to Home Screen** → **Add**.
3. Open **Selavu from the Home Screen icon**. It runs full screen, like an app.

> **Important on iPhone:** add your cards inside the **Home Screen app**, not in the Safari tab. iOS keeps the two copies' data separate, so install first, then set up.

### Android

1. Open the link in **Chrome**.
2. Tap **Install** on the banner, or use the **⋮** menu → **Add to Home screen / Install app**.
3. Open **Selavu** from the Home Screen or app drawer.

After the first open, the app works **without internet**. Only *Export to Excel* needs internet, and only the first time.

---

## 3. What to keep ready

For each **credit card**, open last month's statement (bank app, PDF email or paper):

| Detail | Where to find it | Example |
|---|---|---|
| **Statement day** | "Statement date" on the bill | 23 Oct → **23** |
| **Payment due day** | "Payment due date" on the bill | 12 Nov → **12** |
| **Credit limit** (optional) | "Total credit limit" | ₹1,50,000 |

Debit cards, UPI and cash need only a name.

> A purchase made **on** the statement day goes to the **next** bill, the same way banks count it.

---

## 4. Add your cards

1. Open Selavu → **Add my first card**. Later, use **Settings → + Add card**.
2. **Name:** anything you'll recognise, like `SBI CC 6478`, `Axis CC`, `GPay (SBI)` or `Cash`.
3. **Type:** Credit / Debit / UPI / Cash.
4. For **Credit**, tap **Statement day** and **Payment due day**. Each opens a small calendar; tap the day. Add the credit limit if you want the "% used" bar.
5. Pick a **colour** (used in charts) → **Add card**. Repeat for each card.
6. Optional: **Settings → Monthly budgets.** Set a limit for any category. Bars turn amber at 80% and red at 100%.

---

## 5. Log a payment every day

1. Tap the blue **+**.
2. Type the **amount**. The box is already selected.
3. Tap the **card**. The last-used card is pre-selected.
4. Tap a **category**, and add a note if you like.
5. **Save.** A message shows that card's running total for the bill.

Choose what kind of money it is. **Only Expense counts as spending.**

| Kind | Use it for |
|---|---|
| **Expense** | Food, fuel, shopping, bills |
| **Transfer** | Sending money, chit, ATM cash |
| **Lent** | Money you gave a friend |
| **Received** | Money paid back to you |

### The tabs

- **Home:** the month's spending, each card's bill, category chart, 6-month trend and daily chart. Use **‹ ›** to change month.
- **History:** every entry for the month. Search, filter by card, and tap an entry to edit or delete it.
- **Bills:** every credit card statement with its total and due date. Tap **Mark paid** after paying; bills due within 3 days turn red.
- **Settings:** cards, budgets, export, backup, import.

Months follow the bill. The **Nov** page shows the SBI bill made on 23 Nov (purchases 23 Oct – 22 Nov), the Axis bill made on 18 Nov (18 Oct – 17 Nov), and debit/UPI/cash spending dated in November.

---

## 6. One tap from anywhere (optional)

The app opens straight to the add screen when its address ends in `#add`, for example `https://<your-site>/#add`.

### iPhone: Back Tap

1. Open the **Shortcuts** app → **+** → **Add Action** → search **Open URLs**.
2. Paste your app address with `#add` at the end, e.g. `https://yourname.github.io/selavu/#add`.
3. Name the shortcut **Log Expense**.
4. iPhone **Settings → Accessibility → Touch → Back Tap → Double Tap → Log Expense**.

Double-tap the back of the phone and the add screen opens. You can also add the shortcut to the Home Screen or say "Hey Siri, Log Expense".

### Android

Long-press the Selavu icon → **Log a payment**. Drag it out to make its own icon.

### Pre-filled links

These also work, for example from a Shortcut that asks for the amount:

```
https://<your-site>/?amount=250&card=Axis%20CC&category=Food%20%26%20Dining&note=Lunch
```

`card` must match a card name exactly, and `category` must be one of the app's categories. `kind` is optional (Expense, Transfer, Lent, Received).

> **Fully automatic logging isn't possible.** Neither iPhone nor web apps can read bank SMS or UPI apps, and Apple Pay isn't available in India. Every entry is a quick manual tap, which is also why the app is safe to share: it never touches bank data.

---

## 7. Bring in your Google Sheet history (optional)

1. In Google Sheets, open the transactions tab → **File → Download → Comma-separated values (.csv)**.
2. Move the file to the phone (Files, Google Drive or AirDrop).
3. In Selavu: **Settings → Import from a spreadsheet (CSV)** → pick the file.
4. Check how the first date was read. Keep **DD/MM** for Indian dates → **Import**.
5. Missing cards are created automatically. Open each new credit card in **Settings** and set its **statement day** and **payment due day**, so old entries land in the right bills.

The file needs columns named **Date**, **Card** and **Amount**. *Category*, *Kind* and *Note* are used if present. Old free-text categories (e.g. "Outside food", "Zepto", "Chit amount") are mapped to the new list, and the original words go into the note.

---

## 8. Keep your data safe

Entries live **only on the phone**. That keeps them private, but nothing is backed up automatically.

- **Once a month:** **Settings → Save backup file** → save to Files, iCloud Drive or Google Drive.
- **New phone:** install Selavu (step 2) → **Settings → Restore backup**.
- **Excel:** **Settings → Export to Excel** creates a Summary sheet, all entries, **one tab per month**, card bills and cards.

**These erase the data. Back up first:**

- deleting the Selavu icon from the Home Screen
- iPhone: Settings → Safari → *Clear History and Website Data*
- Android: clearing Chrome's site data for the app's address

---

## FAQ

**Is it free? Do I need an Apple developer account?**
Yes, it's free, and no account is needed. It's a web app, so it skips the App Store entirely.

**Can two phones share the same data?**
Not live. Each phone has its own copy. Move data with backup and restore.

**I changed a card's statement day. What happens to old entries?**
They're re-sorted into bills using the new day straight away.

**I logged something on the wrong card or date.**
History → tap the entry → change it → Save. To remove it, tap Delete twice.

**"Export to Excel" says it needs internet.**
The Excel builder downloads the first time you use it. *Export CSV* always works offline and also opens in Excel.

---

## For developers

```
app.html      The whole app: markup, styles and script in one file (the source to edit)
build.py      Builds docs/ (adds PWA head tags, manifest, offline service worker, icons)
icons/        icon.svg (the source) and the PNGs rendered from it
docs/         Built site, served by GitHub Pages or any static host
```

To change the app icon, edit `icons/icon.svg`, then run `python icons/render.py` (needs Chrome or Edge, plus internet for the Montserrat font) and `python build.py`.

```bash
python build.py
```

```bash
python -m http.server 8765 --directory docs
```

Then open `http://localhost:8765`. Install-to-Home-Screen and offline mode only work over **https**, so test those on the hosted link.

- No dependencies. The Excel export loads SheetJS from cdnjs on first use.
- Data is stored in `localStorage` under the key `selavu.v1`.
- Billing rule: a purchase on day *d* with statement day *s* belongs to the statement of the same month if *d* < *s*, otherwise the next month's.
