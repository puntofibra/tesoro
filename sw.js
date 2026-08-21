/* Service worker de La Isla del Tesoro.
   Solo guarda el envoltorio (icono, manifiesto, pantalla de carga).
   El juego vive en Apps Script y nunca se cachea: siempre va a la red. */
var CACHE = 'tesoro-v1';
var ESTATICOS = [
  './',
  './index.html',
  './manifest.json',
  './icon192.png',
  './icon512.png',
  './appletouch.png',
  './maskable512.png'
];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(ESTATICOS.map(function(u){
        return c.add(u).catch(function(){});
      }));
    })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){
        return k === CACHE ? null : caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  /* todo lo que no sea de esta misma carpeta (Apps Script, QR, fuentes) va directo a la red */
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(function(r){
      var copia = r.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copia).catch(function(){}); });
      return r;
    }).catch(function(){
      return caches.match(req).then(function(r){ return r || caches.match('./index.html'); });
    })
  );
});
