/* ==========================================
   REMEMBER A DAY
   SERVICE WORKER
   ========================================== */

const CACHE_NAME = "remember-a-day-v5";


const FILES_TO_CACHE = [

    "./",

    "./index.html",

    "./settings.html",

    "./pages/add.html",
    "./pages/birthdays.html",
    "./pages/anniversaries.html",
    "./pages/custom-occasions.html",
    "./pages/holidays.html",

    "./pages/memories.html",

    "./pages/timeline.html",

    "./css/style.css",

    "./js/app.js",

    "./js/storage.js",

    "./js/events.js",
    "./js/categories.js",

    "./js/reminders.js",

    "./js/memories.js",

    "./js/timeline.js",

    "./manifest.json",

    "./data/festivals.json",
"./data/important-days.json",
"./data/public-holidays.json",
"./js/calendar-data.js",
"./pages/festivals.html",
"./pages/important-days.html",
"./pages/public-holidays.html"

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