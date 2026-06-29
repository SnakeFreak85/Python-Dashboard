const CACHE_NAME = "python-dashboard-v1.0.0";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./v1.css",
  "./v1-core.js",
  "./v1-dashboard.js",
  "./v1-profile.js"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)));
});

self.addEventListener("activate", event => {
  self.clients.claim();
});

function withV1Assets(html){
  if(html.indexOf("v1-core.js") !== -1) return html;
  const css = '<link rel="stylesheet" href="./v1.css">';
  const scriptOpen = '<scr' + 'ipt src="./';
  const scriptClose = '"></scr' + 'ipt>';
  const scripts = scriptOpen + 'v1-core.js' + scriptClose + scriptOpen + 'v1-profile.js' + scriptClose + scriptOpen + 'v1-dashboard.js' + scriptClose;
  return html.replace("</head>", css + "</head>").replace("</body>", scripts + "</body>");
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  if(request.mode === "navigate"){
    event.respondWith(
      fetch(request)
        .then(response => response.text())
        .then(html => new Response(withV1Assets(html), {headers:{"Content-Type":"text/html; charset=utf-8"}}))
        .catch(() => caches.match("./index.html").then(response => response.text()).then(html => new Response(withV1Assets(html), {headers:{"Content-Type":"text/html; charset=utf-8"}})))
    );
    return;
  }

  event.respondWith(caches.match(request).then(response => response || fetch(request)));
});
