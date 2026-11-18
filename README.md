# Everyday AI Labs (static site for GitHub Pages)

## 1. Put the site on GitHub Pages
1. Create a GitHub repository (e.g. `everyday-ai-labs`) and upload all files from this folder to the root.
2. Repo > Settings > Pages > Source: "Deploy from a branch", Branch: `main`, folder `/ (root)`. Save.
3. Your site appears at `https://USERNAME.github.io/REPO/`. Admin is at `/admin.html`.

## 2. Create a publish token (one time)
1. GitHub > Settings > Developer settings > Personal access tokens > Fine-grained tokens > Generate new token.
2. Repository access: "Only select repositories" > choose this repo.
3. Permissions > Repository permissions > Contents: **Read and write**.
4. Copy the token, open `admin.html`, expand "GitHub connection", paste it with your username, repo and branch.

## 3. Daily use
Add/edit products in the admin, click **Publish to live site**. The admin commits `products.json`
for you and the live site updates in 1 to 2 minutes. No manual commits needed.

## Notes
- Anyone can open `admin.html`, but nobody can publish without your token. Never share the token or commit it to the repo.
- The token is kept only in your browser (tick "Remember" to keep it between visits). Use a private device.
- Update the contact email in `index.html` and replace the sample testimonials.
- "Popup checkout": set `USE_OVERLAY = true` in `app.js` to open Gumroad checkout on your page.
