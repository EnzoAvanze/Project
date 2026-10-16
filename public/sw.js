// Cache app shell only. Never cache API requests or health data.
const CACHE = "cuidali-shell-v1";
self.addEventListener("install", (e) => {
  self.skipWaiting();
});
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const u = new URL(e.request.url);
  if (u.origin !== self.location.origin || u.pathname.startsWith("/api/"))
    return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then(async (r) => {
          if (r.ok) {
            const c = await caches.open(CACHE);
            await c.put("/", r.clone());
          }
          return r;
        })
        .catch(() =>
          caches
            .match("/")
            .then(
              (r) =>
                r ||
                new Response(
                  "Sem conexão. Abra o Cuidali com internet primeiro.",
                  { status: 503 },
                ),
            ),
        ),
    );
  } else if (
    u.pathname.startsWith("/assets/") ||
    ["/icon.svg", "/manifest.webmanifest"].includes(u.pathname)
  ) {
    e.respondWith(
      caches.match(e.request).then(
        (r) =>
          r ||
          fetch(e.request).then(async (r) => {
            if (r.ok) {
              const c = await caches.open(CACHE);
              await c.put(e.request, r.clone());
            }
            return r;
          }),
      ),
    );
  }
});
