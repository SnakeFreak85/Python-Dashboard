const CACHE_NAME = "python-dashboard-v1.0.4";
const APP_ASSETS = [
  "./",
  "./index.html",
  "./install.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./v1.css",
  "./v1-core.js",
  "./v1-dashboard.js",
  "./v1-profile.js",
  "./v1-mobile.js",
  "./v1-fixes.js"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_ASSETS)).catch(() => undefined)
  );
});

self.addEventListener("message", event => {
  if(event.data && event.data.type === "SKIP_WAITING"){
    self.skipWaiting();
  }
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

function patchLegacyHtml(html){
  if(!html) return "";
  return html
    .replace(/goBackToSection\('koenig'\)/g, "goBackToSection(\\'koenig\\')")
    .replace(/goBackToSection\('boas'\)/g, "goBackToSection(\\'boas\\')")
    .replace(/goBackToSection\('geckos'\)/g, "goBackToSection(\\'geckos\\')")
    .replace(/goBackToSection\('spinnen'\)/g, "goBackToSection(\\'spinnen\\')");
}

function withV1Assets(html){
  html = patchLegacyHtml(html);
  if(html.indexOf("v1-core.js") !== -1) return html;
  const css = '<link rel="stylesheet" href="./v1.css">';
  const scriptOpen = '<scr' + 'ipt src="./';
  const scriptClose = '"></scr' + 'ipt>';
  const scripts = scriptOpen + 'v1-core.js' + scriptClose + scriptOpen + 'v1-profile.js' + scriptClose + scriptOpen + 'v1-dashboard.js' + scriptClose + scriptOpen + 'v1-mobile.js' + scriptClose + scriptOpen + 'v1-fixes.js' + scriptClose;
  return html.replace("</head>", css + "</head>").replace("</body>", scripts + "</body>");
}

function htmlResponse(html){
  return new Response(withV1Assets(html), {headers:{"Content-Type":"text/html; charset=utf-8"}});
}

async function navigationResponse(request){
  try{
    const response = await fetch(request, {cache:"no-store"});
    const html = await response.text();
    return htmlResponse(html);
  }catch(error){
    const cached = await caches.match("./index.html");
    if(cached){
      const html = await cached.text();
      return htmlResponse(html);
    }
    return htmlResponse("<!DOCTYPE html><html lang=\"de\"><head><meta charset=\"UTF-8\"><title>NG Terrarium</title></head><body><h1>NG Terrarium</h1><p>Offline-Daten sind noch nicht verfügbar.</p></body></html>");
  }
}

self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET") return;

  if(request.mode === "navigate"){
    event.respondWith(navigationResponse(request));
    return;
  }

  event.respondWith(caches.match(request).then(response => response || fetch(request)));
});
