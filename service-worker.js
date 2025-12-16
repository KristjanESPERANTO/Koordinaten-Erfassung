const CACHE_NAME = 'koordinaten-erfassung-v1';
const urlsToCache = [
  // index.html und manifest.json NICHT cachen - immer vom Netzwerk holen
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/MarkerCluster.Default.css',
  'https://unpkg.com/leaflet.markercluster@1.4.1/dist/leaflet.markercluster.js'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache geöffnet');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache-Fehler:', err);
      })
  );
  self.skipWaiting();
});

// Aktivierung
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Alte Cache löschen:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - Network First mit Cache Fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Nur http/https URLs cachen - chrome-extension etc. überspringen
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // index.html und manifest.json immer vom Netzwerk holen (keine Cache-Verzögerung bei Updates)
  if (url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/') || url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Nur bei Offline: Fallback auf gecachte Version (falls vorhanden)
          if (url.pathname.endsWith('manifest.json')) {
            return caches.match('./manifest.json');
          }
          return caches.match('./index.html');
        })
    );
    return;
  }

  // Für alle anderen Ressourcen: Network First mit Cache Fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Erfolgreiche Antwort - in Cache speichern
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache).catch(err => {
              // Fehler beim Cachen ignorieren (z.B. bei unsupported schemes)
              console.log('Cache put failed:', err);
            });
          });
        }
        return response;
      })
      .catch(() => {
        // Netzwerkfehler - versuche aus Cache
        return caches.match(event.request);
      })
  );
});
