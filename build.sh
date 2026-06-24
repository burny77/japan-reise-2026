#!/bin/bash
set -e

# Build the project
npm run build

# Get asset filenames dynamically
CSS=$(ls dist/client/assets/*.css | head -1 | xargs basename)
JS_ROUTES=$(ls dist/client/assets/routes*.js | head -1 | xargs basename)
JS_MAIN=$(ls dist/client/assets/index*.js | head -1 | xargs basename)

# Create index.html
cat > dist/client/index.html << HTML
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Japan 2026 — 21 Tage Reiseplan</title>
  <meta name="description" content="Tokio · Hakone · Osaka · Kyoto — 2.–22. September 2026" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,700;1,9..144,300&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/assets/${CSS}" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/assets/${JS_ROUTES}"></script>
  <script type="module" src="/assets/${JS_MAIN}"></script>
</body>
</html>
HTML

# SPA redirect for Cloudflare Pages
echo "/* /index.html 200" > dist/client/_redirects

echo "✅ Build complete: dist/client/ ready to deploy"
