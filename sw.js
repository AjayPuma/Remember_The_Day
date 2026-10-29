
/* ==========================================
   REMEMBER A DAY
   SERVICE WORKER — V6
   Safer updates + offline fallback
   ========================================== */

const CACHE_NAME = "remember-a-day-v6";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./settings.html",
    "./manifest.json",

    "./pages/add.html",
    "./pages/birthdays.html",
    "./pages/anniversaries.html",
    "./pages/custom-occasions.html",
    "./pages/holidays.html",
    "./pages/memories.html",
    "./pages/timeline.html",
    "./pages/festivals.html",
    "./pages/important-days.html",
    "./pages/public-holidays.html",

    "./css/style.css",

    "./js/app.js",
    "./js/storage.js",
    "./js/events.js",
    "./js/categories.js",
    "./js/reminders.js",
    "./js/memories.js",
    "./js/timeline.js",
    "./js/calendar-data.js",
    "./js/home-calendar.js",

    "./data/festivals.json",
    "./data/important-days.json",
    "./data/public-holidays.json",

    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png"
];

/* INSTALL: cache available files without letting
   one missing optional file block installation. */
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(async cache => {
                await Promise.all(
                    FILES_TO_CACHE.map(async file => {
                        try {
                            await cache.add(file);
                        } catch (error) {
                            console.warn(
                                "Could not cache:",
                                file,
                                error
                            );
                        }
                    })
                );
            })
            .then(() => self.skipWaiting())
    );
});

/* FETCH: use fresh network responses for page
   navigation, with cached pages as offline fallback.
   Other same-origin GET requests use cache first. */
self.addEventListener("fetch", event => {
    const request = event.request;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then(response => {
                    if (response.ok) {
                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, copy))
                            .catch(error => console.warn(
                                "Page cache update failed:", error
                            ));
                    }

                    return response;
                })
                .catch(async () => {
                    const cached = await caches.match(request);

                    if (cached) return cached;

                    const home = await caches.match("./index.html");

                    if (home) return home;

                    return new Response(
                        "You are offline. Please reconnect and try again.",
                        {
                            status: 503,
                            headers: {
                                "Content-Type": "text/plain; charset=utf-8"
                            }
                        }
                    );
                })
        );

        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) return cached;

                return fetch(request).then(response => {
                    if (response.ok) {
                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, copy))
                            .catch(error => console.warn(
                                "Asset cache update failed:", error
                            ));
                    }

                    return response;
                });
            })
    );
});

/* ACTIVATE: remove old Remember a Day caches only. */
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys()
            .then(names => Promise.all(
                names
                    .filter(name =>
                        name.startsWith("remember-a-day-") &&
                        name !== CACHE_NAME
                    )
                    .map(name => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});
