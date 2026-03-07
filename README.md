# Sportstyle Palette — Deployment Guide

## Zero-to-live in 5 steps

---

### STEP 1 — Install Node.js
Go to https://nodejs.org and download the "LTS" version. Install it (just click through).

---

### STEP 2 — Put these files on your computer
Create a folder called `sportstyle-palette` somewhere on your computer (Desktop is fine).
Put all the files from this zip inside it, keeping the folder structure exactly as-is.

---

### STEP 3 — Install dependencies
Open Terminal (Mac) or Command Prompt (Windows).
Type this and press Enter:

```
cd Desktop/sportstyle-palette
npm install
```

Wait for it to finish (takes ~1 minute).

---

### STEP 4 — Push to GitHub
1. Go to github.com and create a free account
2. Click the + icon → "New repository"
3. Name it `sportstyle-palette`, keep it Private, click "Create repository"
4. On the next page, copy the commands under "…or push an existing repository"
   They look like:
   ```
   git init
   git add .
   git commit -m "first commit"
   git remote add origin https://github.com/YOURNAME/sportstyle-palette.git
   git push -u origin main
   ```
5. Paste and run each one in Terminal from your project folder

---

### STEP 5 — Deploy on Vercel
1. Go to vercel.com and sign up (use your GitHub account to sign in — easiest)
2. Click "Add New Project"
3. Find `sportstyle-palette` in the list and click "Import"
4. On the configuration page, open "Environment Variables"
5. Add this variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your API key from console.anthropic.com (starts with sk-ant-)
6. Click "Deploy"
7. Wait ~2 minutes — Vercel gives you a live URL like `sportstyle-palette.vercel.app` 🎉

---

### Your API key is safe
The key lives only in Vercel's secure environment — it never appears in your code or in the browser.
