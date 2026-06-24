#!/bin/bash
set -e

npm run build

CSS=$(ls dist/client/assets/*.css | head -1 | xargs basename)
JS_MAIN=$(ls dist/client/assets/index*.js | head -1 | xargs basename)

mkdir -p public/assets
cp dist/client/assets/* public/assets/

# Write index.html - match RootShell structure exactly (lang=en, no #root div)
# window.$_TSR init makes TanStack Start fall into SPA mode (no SSR hydration needed)
cat > public/index.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,700;1,9..144,300&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
  <link rel="stylesheet" href="__CSS__" />
</head>
<body>
<script>window.$_TSR={initialized:false,router:{matches:[],manifest:{routes:{}},dehydratedData:undefined,lastMatchId:""},buffer:[],h:function(){}};</script>
<script type="module" src="__JS__"></script>
</body>
</html>
HTMLEOF

# Substitute asset paths
sed -i "s|__CSS__|/assets/${CSS}|g" public/index.html
sed -i "s|__JS__|/assets/${JS_MAIN}|g" public/index.html

echo "/* /index.html 200" > public/_redirects
echo "Build done. public/ ready."
ls public/
