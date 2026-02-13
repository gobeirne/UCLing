const CACHE_NAME = "phoneme-cache-v1";
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icon-144.png",
  "/icon-192.png",
  "/icon-256.png",
  "/icon-512.png",
  "/icon-1024.png",
 // Māori sounds
  "/sounds/TeReo_m.mp3",
  "/sounds/TeReo_m_m_m.mp3",
  "/sounds/TeReo_m_m_m_m_m.mp3",
  "/sounds/TeReo_p.mp3",
  "/sounds/TeReo_p_p_p.mp3",
  "/sounds/TeReo_p_p_p_p_p.mp3",
  "/sounds/TeReo_t.mp3",
  "/sounds/TeReo_t_t_t.mp3",
  "/sounds/TeReo_t_t_t_t_t.mp3",
  "/sounds/TeReo_h.mp3",
  "/sounds/TeReo_h_h_h.mp3",
  "/sounds/TeReo_h_h_h_h_h.mp3",
  "/sounds/TeReo_a.mp3",
  "/sounds/TeReo_a_a_a.mp3",
  "/sounds/TeReo_a_a_a_a_a.mp3",
  "/sounds/TeReo_f.mp3",
  "/sounds/TeReo_f_f_f.mp3",
  "/sounds/TeReo_f_f_f_f_f.mp3",
  "/sounds/TeReo_i.mp3",
  "/sounds/TeReo_i_i_i.mp3",
  "/sounds/TeReo_i_i_i_i_i.mp3",
  "/sounds/TeReo_o.mp3",
  "/sounds/TeReo_o_o_o.mp3",
  "/sounds/TeReo_o_o_o_o_o.mp3",
  "/sounds/TeReo_calib.mp3",
  // English sounds
  "/sounds/NZEng_m.mp3",
  "/sounds/NZEng_m_m_m.mp3",
  "/sounds/NZEng_m_m_m_m_m.mp3",
  "/sounds/NZEng_or.mp3",
  "/sounds/NZEng_or_or_or.mp3",
  "/sounds/NZEng_or_or_or_or_or.mp3",
  "/sounds/NZEng_ah.mp3",
  "/sounds/NZEng_ah_ah_ah.mp3",
  "/sounds/NZEng_ah_ah_ah_ah_ah.mp3",
  "/sounds/NZEng_oo.mp3",
  "/sounds/NZEng_oo_oo_oo.mp3",
  "/sounds/NZEng_oo_oo_oo_oo_oo.mp3",
  "/sounds/NZEng_ee.mp3",
  "/sounds/NZEng_ee_ee_ee.mp3",
  "/sounds/NZEng_ee_ee_ee_ee_ee.mp3",
  "/sounds/NZEng_sh.mp3",
  "/sounds/NZEng_sh_sh_sh.mp3",
  "/sounds/NZEng_sh_sh_sh_sh_sh.mp3",
  "/sounds/NZEng_ss.mp3",
  "/sounds/NZEng_ss_ss_ss.mp3",
  "/sounds/NZEng_ss_ss_ss_ss_ss.mp3",
  "/sounds/NZEng_calib.mp3"
];

self.addEventListener("install", evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", evt => {
  evt.waitUntil(
    caches.keys().then(keyList =>
      Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", evt => {
  evt.respondWith(
    caches.match(evt.request).then(response => {
      return response || fetch(evt.request);
    })
  );
});

