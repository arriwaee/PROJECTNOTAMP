// Nama cache (versi)
const CACHE_NAME = 'nota-scaffolding-cache-v1';

// Daftar file yang perlu di-cache (cangkang aplikasi)
const URLS_TO_CACHE = [
  './', // Ini adalah index.html
  './script.js',
  './logo.png', // Logo CV Anda
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/idb@7/build/umd.js'
];

// Event: Install
// Saat Service Worker di-install, buka cache dan masukkan semua file
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka, menambahkan file cangkang...');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// Event: Fetch
// Setiap kali aplikasi meminta file (misal: script.js atau CDN)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 1. Jika file ada di cache, langsung berikan dari cache (super cepat/offline)
        if (response) {
          return response;
        }
        
        // 2. Jika tidak ada di cache, ambil dari internet
        return fetch(event.request);
      })
  );
});