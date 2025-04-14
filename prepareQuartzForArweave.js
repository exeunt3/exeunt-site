// prepareQuartzForArweave.js
// Run this with `node prepareQuartzForArweave.js` from your Quartz root directory

const fs = require("fs");
const path = require("path");

const publicDir = path.resolve("public");

// 1. Write 404.html
const notFoundHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    (function() {
      var path = window.location.pathname;
      var cleanPath = path.replace(/\.html$/, '');
      if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
      if (!cleanPath || cleanPath === '404') {
        window.location.href = '/';
      } else {
        window.location.href = '/#/' + cleanPath;
      }
    })();
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, "404.html"), notFoundHtml);

// 2. Write router.js
const routerJs = `document.addEventListener('DOMContentLoaded', function() {
  document.body.addEventListener('click', function(e) {
    let target = e.target;
    while (target && target.tagName !== 'A') {
      target = target.parentNode;
      if (!target || target === document.body) return;
    }
    if (target && target.tagName === 'A') {
      const href = target.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto:')) {
        e.preventDefault();
        let cleanPath = href.replace(/\.html$/, '');
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        window.location.href = '/#/' + cleanPath;
      }
    }
  });

  function handleRouting() {
    const hash = window.location.hash;
    if (hash.startsWith('#/')) {
      const path = hash.substring(2);
      fetch(path + '.html')
        .then(response => {
          if (!response.ok) throw new Error('Page not found');
          return response.text();
        })
        .then(html => {
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = html;
          const content = tempDiv.querySelector('#quartz-content');
          if (content) {
            document.querySelector('#quartz-content').innerHTML = content.innerHTML;
            const title = tempDiv.querySelector('title');
            if (title) document.title = title.textContent;
          }
        })
        .catch(err => console.error('Routing error:', err));
    }
  }

  handleRouting();
  window.addEventListener('hashchange', handleRouting);
});`;

fs.writeFileSync(path.join(publicDir, "router.js"), routerJs);

// 3. Inject router.js into index.html
const indexPath = path.join(publicDir, "index.html");
if (fs.existsSync(indexPath)) {
  let indexContent = fs.readFileSync(indexPath, "utf8");
  if (!indexContent.includes("router.js")) {
    indexContent = indexContent.replace("</head>", '<script src="/router.js"></script></head>');
    fs.writeFileSync(indexPath, indexContent);
    console.log("Injected router.js into index.html");
  }
}

console.log("✅ Quartz site prepared for Arweave client-side routing.");
