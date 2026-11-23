
/* REMEMBER A DAY — ON THIS DAY */

(() => {
    "use strict";

    const container = document.getElementById("time-capsule-list");
    const section = document.getElementById("time-capsule-section");

    if (!container) return;

    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch {
            return [];
        }
    }

    function getPhotos(memory) {
        const photos = Array.isArray(memory.photos)
            ? memory.photos
            : Array.isArray(memory.imgs)
                ? memory.imgs
                : memory.img ? [memory.img] : [];

        return photos.filter(photo =>
            typeof photo === "string" && photo.trim()
        );
    }

    function getAllMemories() {
        const memories = [];

        readStorage("remember-a-day-memories").forEach(memory => {
            memories.push({
                title: memory.title || "A special memory",
                date: memory.date || "",
                note: memory.note || memory.text || "",
                photos: getPhotos(memory)
            });
        });

        readStorage("remember-a-day-events").forEach(event => {
            (Array.isArray(event.mem) ? event.mem : []).forEach(memory => {
                memories.push({
                    title: event.name || "Occasion memory",
                    date: memory.date || event.date || "",
                    note: memory.text || memory.note || "",
                    photos: getPhotos(memory)
                });
            });
        });

        return memories;
    }

    function createMemoryCard(memory) {
        const card = document.createElement("a");
        card.className = "capsule-memory";
        card.href = "pages/memories.html";

        // Photo gallery
        const gallery = document.createElement("div");
        gallery.className = "capsule-memory-gallery";

        memory.photos.forEach((src, index) => {
            const img = document.createElement("img");
            img.src = src;
            img.alt = `${memory.title} photo ${index + 1}`;
            img.loading = "lazy";
            gallery.appendChild(img);
        });

        // Fill unused space when there is only one photo
        if (memory.photos.length === 1) {
            const extra = document.createElement("div");
            extra.className = "capsule-memory-extra";
            extra.innerHTML = "♡";
            gallery.appendChild(extra);
        }

        if (!memory.photos.length) {
            gallery.classList.add("no-photo");
            gallery.textContent = "❤️";
        }

        // Memory details
        const details = document.createElement("div");
        details.className = "capsule-memory-details";

        const date = document.createElement("small");
        const savedDate = new Date(memory.date + "T00:00:00");

        date.textContent = savedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        const title = document.createElement("strong");
        title.textContent = memory.title;

        const note = document.createElement("p");
        note.textContent = memory.note || "A beautiful moment worth remembering.";

        const count = document.createElement("span");
        count.className = "capsule-photo-count";
        count.textContent = `${memory.photos.length} ${memory.photos.length === 1 ? "photo" : "photos"}`;

        details.append(date, title, note, count);
        card.append(gallery, details);

        return card;
    }

    function render() {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const year = today.getFullYear();

        const matching = getAllMemories()
            .filter(memory => {
                const match = String(memory.date).match(
                    /^(\d{4})-(\d{1,2})-(\d{1,2})$/
                );

                return match &&
                    Number(match[2]) === month &&
                    Number(match[3]) === day &&
                    Number(match[1]) < year;
            })
            .sort((a, b) => b.date.localeCompare(a.date));

        container.replaceChildren();

        if (!matching.length) {
            if (section) section.hidden = true;
            return;
        }

        if (section) section.hidden = false;

        matching.forEach(memory => {
            container.appendChild(createMemoryCard(memory));
        });
    }

    render();

    window.addEventListener("storage", event => {
        if (
            !event.key ||
            event.key === "remember-a-day-memories" ||
            event.key === "remember-a-day-events"
        ) {
            render();
        }
    });
})();
