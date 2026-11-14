# Selavu

A phone app for tracking card spending by **billing cycle**. It opens from a link, installs to the Home Screen on iPhone and Android, works offline, and keeps each person's data on their own phone. It needs no App Store, no account and no server.

- Log a payment in about 5 seconds: amount → card → category → Save
- Credit cards follow their own cycle (e.g. SBI 23rd → 22nd, Axis 18th → 17th). Debit, UPI and cash use the calendar month.
- **Bills** tab: every statement with its total, due date and a *Mark paid* toggle
- Charts: category donut, 6-month trend by card, daily spend
- **Syncs to your own Google Sheet** automatically: a row per entry, a tab per bill month, charts. It downloads as Excel and doubles as your backup.
- **Family mode:** each family member uses their own phone (iPhone or Android) with their own cards and sees only their own spending, while everything lands in one shared sheet with **who spent it**.
- **Insights:** where the money went this month compared with your usual, and where you can cut back.

---

## Contents

1. [Put the app online](#1-put-the-app-online) (once, by the person sharing it)
2. [Install on a phone](#2-install-on-a-phone)
3. [What to keep ready](#3-what-to-keep-ready)
4. [Add your cards](#4-add-your-cards)
5. [Log a payment every day](#5-log-a-payment-every-day)
6. [One tap from anywhere](#6-one-tap-from-anywhere-optional)
7. [Connect your Google Sheet](#7-connect-your-google-sheet)
8. [Track spending as a family](#8-track-spending-as-a-family)
9. [Bring in your old tracker history](#9-bring-in-your-old-tracker-history-optional)
10. [Keep your data safe](#10-keep-your-data-safe)
11. [Updating the sheet script](#11-updating-the-sheet-script)
12. [FAQ](#faq)
13. [For developers](#for-developers)

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

### Make the Google Sheet template (once)

So people can connect a sheet in a few taps, make one template they can copy:

1. Create a new Google Sheet and name it **Selavu**.
2. **Extensions → Apps Script.** Delete what's there, paste everything from [`sheet/Code.gs`](sheet/Code.gs), and click **Save**.
3. Back in the sheet, reload it. Choose **Selavu → 1. Set up this sheet** and allow the permissions.
4. **Share → General access → Anyone with the link → Viewer.**
5. Copy the sheet's address and change the ending from `/edit…` to **`/copy`**, for example `https://docs.google.com/spreadsheets/d/<id>/copy`. Opening that link gives each person their own copy, script included.

Share that `/copy` link along with the app link. Nobody can see your data through it, because they only get an empty copy of the template.

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

On Samsung phones, **Samsung Internet** works too: **≡ menu → Add page to → Home screen**. Chrome gives the more app-like install.

After the first open, the app works **without internet**. Entries made offline are sent to your Google Sheet when you're back online.

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
- **Settings:** cards, budgets and your Google Sheet connection.

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

## 7. Connect your Google Sheet

Every entry you save, edit or delete in Selavu is copied to **your own** Google Sheet within a second or two. The sheet has:

- **Summary:** spending by bill month and card, this month by category, and spending by person, with charts
- **Transactions:** one row per entry, with **For** (who spent it) and **Logged by**
- **Cards:** your cards, their statement and due days, and their **Owner**
- **One tab per bill month** (e.g. `Nov-2026`): card totals, category chart and that month's entries

It works offline too: entries wait on the phone and go out when you're back online. The dot next to **Selavu** at the top shows the state: green = synced, amber = waiting, red = problem.

### Set it up (about 3 minutes, on a computer is easiest)

1. Open the **template link** you were given (it ends in `/copy`) → **Make a copy**. The copy lands in your own Google Drive.
   *No template link?* Create a blank Google Sheet, then **Extensions → Apps Script**, paste [`sheet/Code.gs`](sheet/Code.gs), and **Save**.
2. In your copy, reload the page. Choose **Selavu → 1. Set up this sheet** → **Continue** → pick your Google account → **Advanced → Go to … (unsafe)** → **Allow**.
   Google shows this warning for any personal script that hasn't been reviewed by Google. The script is in your own sheet and only touches that sheet.
3. **Extensions → Apps Script → Deploy → New deployment.** Click the gear → **Web app**:
   - Execute as: **Me**
   - Who has access: **Anyone**
   - **Deploy**, and copy the **Web app URL** (it ends in `/exec`).
4. Back in the sheet: **Selavu → 2. Get connection link for the app** → paste the Web app URL → **OK** → **Copy link**.
5. Send that link to your phone (e.g. WhatsApp it to yourself and copy it).
6. In Selavu: **Settings → Connect Google Sheet** → paste → **Connect**.
   - Phone has entries, sheet is empty: they're all sent to the sheet.
   - Sheet has entries, phone is empty: they're brought to the phone.
   - Both have entries: choose **Add this phone's entries to the sheet** (keeps both; cards and people with the same name are joined) or **Use only the sheet**.

> **Keep the connection link private.** Anyone with it can read and change the entries in your sheet. If it leaks, run **Deploy → Manage deployments → Archive** and deploy again.

### In Settings after connecting

- **Sync now:** sends anything waiting and picks up changes from the other phone straight away. (It also happens on its own when you open the app, and every 2 minutes while it's open.)
- **Open sheet:** opens your Google Sheet.
- **Reload from Google Sheet:** throws away this phone's copy and takes the sheet's. Rarely needed.
- **Disconnect:** stops syncing. The sheet keeps everything already sent.

**Excel:** in Google Sheets, **File → Download → Microsoft Excel (.xlsx)** gives you a real Excel file any time, month tabs included.

---

## 8. Track spending as a family

Each person uses Selavu on **their own phone** with **their own cards**, and everything they log also goes into **one shared Google Sheet**.

| | Your phone | Your spouse's phone | Google Sheet |
|---|---|---|---|
| Cards | Your cards | Their cards | Everyone's cards, with an **Owner** column |
| Entries, totals, insights, bills | Only yours | Only theirs | Everything, with **For** and **Logged by** columns |

The sheet is where you see the household together: the **Summary** tab has *Spending by person* per month, and every month tab has a *Spent by* table. Anyone can also use Selavu on their own without a sheet, or with their own sheet.

> This keeps each phone tidy; it is not a privacy wall. Everyone on the same link can open the sheet. For data nobody else can see, use separate sheets.

**One sheet per household.** Another household (for example your parents) makes **their own copy** of the template sheet and gets their own connection link. Their data never mixes with yours.

**What gets recorded with each entry**

| | What it means | Set by |
|---|---|---|
| **Spent by** | **Me**, or **Family** for shared costs | Automatically **Me**. Groceries, Rent, Bills and Home repairs default to **Family**. Change it with one tap. |
| **Logged by** | Which person's phone entered it | Automatically |
| **Owner** (on each card) | Whose card it is. **Joint** cards appear on every phone. | Automatically the phone's person when a card is added |

If your spouse pays with your add-on card, they can add it on their phone as their own card (e.g. "SBI add-on"), or you can mark your card **Joint** so it appears on both phones.

**Set it up**

1. **On your phone** (connected to the sheet): **Settings → People → Add my name**. Your existing cards and entries become yours. Add the other family members with **+ Add person** (optional; they can also add themselves).
2. **Install Selavu on their phone** (step 2; on Android use **Chrome → ⋮ → Add to Home screen / Install app**).
3. On their phone: **Settings → Connect Google Sheet** → paste **the same connection link** → **Connect** → choose their name under **Who uses this phone?** (or type it).
4. They add their own cards (**Settings → + Add card**) and start logging.

> Every phone in the household must use the same connection link, and the sheet must run the latest script (see [Updating the sheet script](#11-updating-the-sheet-script)).

---

## 9. Bring in your old tracker history (optional)

1. In your Selavu sheet, choose **Selavu → Import old tracker rows**. It creates an **Old data** tab.
2. Paste your old rows there with a header row: **Date**, **Card**, **Amount**, **Category**.
3. Run **Selavu → Import old tracker rows** again. Old categories (e.g. "Outside food", "Zepto", "Chit amount") are matched to the new list, and the original text goes in the Note column.
4. In Selavu: **Settings → Sync now** (the rows come to the phone).
5. Set the **statement day** for any credit card the app points out. The app then sorts every entry into its bill month and updates the sheet.

---

## 10. Keep your data safe

With a Google Sheet connected, your sheet **is** your backup:

- **New phone, or you deleted the app:** install Selavu (step 2) → **Settings → Connect Google Sheet** with the same link. Everything comes back.
- Check that the dot at the top is green before deleting the app or changing phones, so nothing is still waiting.

Without a sheet connected, entries live **only on the phone**. These erase them:

- deleting the Selavu icon from the Home Screen
- iPhone: Settings → Safari → *Clear History and Website Data*
- Android: clearing the browser's site data for the app's address

---

## 11. Updating the sheet script

When Selavu gets a new feature that needs the sheet (like Family mode), the script in your sheet must be updated once. If it's out of date, Selavu says *"Your sheet's script is older than the app"*.

1. Open your Selavu sheet → **Extensions → Apps Script**.
2. Select everything in `Code.gs`, delete it, paste the new [`sheet/Code.gs`](sheet/Code.gs) → **Save**.
3. **Deploy → Manage deployments** → ✏️ (edit) → **Version: New version** → **Deploy**.
   The Web app URL and your connection link **stay the same**, so nothing changes on the phones.
4. In Selavu: **Settings → Sync now**.

---

## FAQ

**Is it free? Do I need an Apple developer account?**
Yes, it's free, and no account is needed. It's a web app, so it skips the App Store entirely.

**Can two phones share the same data?**
Yes. Connect them with the same link (see [Track spending as a family](#8-track-spending-as-a-family)). Each phone sends only what changed, so nothing is overwritten; each phone shows its own person's entries and the sheet shows everyone's. If both phones edit the *same* entry at the same time, the later one wins.

**Can I edit entries in the Google Sheet?**
Yes, small fixes (a note, a category, an amount) come back to the phones on their next sync. Don't change the ID column. For anything bigger, use the app.

**Who can see my sheet?**
Only you, plus anyone you share the sheet with. The **connection link**, though, can read and change your entries through the app, so treat it like a password: share it only with your own household.

**I changed a card's statement day. What happens to old entries?**
They're re-sorted into bills using the new day straight away.

**I logged something on the wrong card or date.**
History → tap the entry → change it → Save. To remove it, tap Delete twice.

**The dot is red.**
Open **Settings** to see the message. Usually the Web app was deployed with access other than **Anyone**, the connection link was replaced, or the sheet script needs [updating](#11-updating-the-sheet-script). Get a new link with **Selavu → 2. Get connection link for the app** and connect again.

---

## For developers

```
app.html      The whole app: markup, styles and script in one file (the source to edit)
build.py      Builds docs/ (adds PWA head tags, manifest, offline service worker, icons)
icons/        icon.svg (the source) and the PNGs rendered from it
sheet/        Code.gs, the Google Apps Script that receives the sync (pasted into the template sheet)
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

- No dependencies.
- Data is stored in `localStorage` under the key `selavu.v1`. Unsent changes are queued there by entry ID (`sync.ops`).
- Sync: the app `POST`s JSON (`text/plain`, so there's no CORS preflight) to the Apps Script web app with `action` = `ping`, `push` (incremental `ops`, or `full` with every entry) or `pull`. A secret key from the connection link is checked on every call.
- Billing rule: a purchase on day *d* with statement day *s* belongs to the statement of the same month if *d* < *s*, otherwise the next month's.
