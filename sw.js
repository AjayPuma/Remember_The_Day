/* ==========================================
   REMEMBER A DAY
   SERVICE WORKER
   ========================================== */

const CACHE_NAME = "remember-a-day-v1";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./settings.html",

    "./pages/add.html",

    "./pages/memories.html",

    "./css/style.css",

    "./js/app.js",

    "./js/storage.js",

    "./js/events.js",

    "./js/reminders.js",

    "./js/memories.js",

    "./manifest.json"

];


/* ==========================================
   INSTALL
   ========================================== */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches.open(CACHE_NAME)
                .then(cache => {

                    return cache.addAll(
                        FILES_TO_CACHE
                    );

                })

        );

    }
);


/* ==========================================
   FETCH
   ========================================== */

self.addEventListener(
    "fetch",
    event => {

        event.respondWith(

            caches.match(
                event.request
            )
            .then(cachedResponse => {

                return (
                    cachedResponse ||
                    fetch(event.request)
                );

            })

        );

    }
);


/* ==========================================
   ACTIVATE
   ========================================== */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches.keys()
                .then(cacheNames => {

                    return Promise.all(

                        cacheNames
                            .filter(
                                name =>
                                    name !== CACHE_NAME
                            )
                            .map(
                                name =>
                                    caches.delete(name)
                            )

                    );

                })

        );

    }
);