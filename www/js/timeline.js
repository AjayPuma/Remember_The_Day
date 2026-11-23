
/* ==========================================
   REMEMBER A DAY — MEMORY TIMELINE
   Supports standalone and occasion memories.
   Does not modify saved memory data.
   ========================================== */

(() => {
    "use strict";

    const timeline = document.getElementById("timeline-list");
    const search = document.getElementById("timeline-search");
    const sort = document.getElementById("timeline-sort");
    const yearFilter = document.getElementById("timeline-year");
    const categoryFilter = document.getElementById("timeline-category");
    const count = document.getElementById("timeline-count");
    const clearButton = document.getElementById("timeline-clear");


// ==========================================
// TEMPORARY TEST DATA — DELETE AFTER TESTING
// ==========================================

const TIMELINE_TEST_MODE = false;

const TEST_MEMORIES = [

{
    id: "test-001",
    title: "A Beautiful Birthday",
    date: "2026-11-12",
    note: "Celebrated my birthday with friends. Lots of laughter, cake and unforgettable moments!",
    category: "Celebration",
    source: "Test memory",
    photos: [
        "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700",
        "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=700",
        "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=700"
    ]
},

    {
        id: "test-002",
        title: "College Friends Reunion",
        date: "2026-08-15",
        note: "Met my old college friends after a long time. It felt like we were back in our first year.",
        category: "Friends",
        source: "Test memory",
        photos: []
    },
    {
        id: "test-003",
        title: "Family Trip",
        date: "2026-06-20",
        note: "A wonderful family trip filled with beautiful places, delicious food and happy memories.",
        category: "Travel",
        source: "Test memory",
        photos: []
    },
    {
        id: "test-004",
        title: "First Day at Work",
        date: "2026-03-02",
        note: "A new beginning! Excited, nervous and ready to learn something new every day.",
        category: "Achievement",
        source: "Test memory",
        photos: []
    },
    {
        id: "test-005",
        title: "New Year Celebration",
        date: "2026-01-01",
        note: "Welcomed the new year with family, happiness and lots of hopes.",
        category: "Celebration",
        source: "Test memory",
        photos: []
    },
    {
        id: "test-006",
        title: "A Special Friendship",
        date: "2025-12-10",
        note: "Some people make ordinary days extraordinary. Grateful for this friendship.",
        category: "Friends",
        source: "Test memory",
        photos: []
    },
    {
        id: "test-007",
        title: "My First Big Achievement",
        date: "2025-07-18",
        note: "Worked hard for this moment. Finally achieved something I had been dreaming about!",
        category: "Achievement",
        source: "Test memory",
        photos: []
    },
    {
        id: "test-008",
        title: "A Peaceful Evening",
        date: "2025-02-14",
        note: "A simple evening, beautiful weather and a peaceful mind. Sometimes little things matter most.",
        category: "Personal",
        source: "Test memory",
        photos: []
    }
];


    if (!timeline || !search || !sort) return;

    // Safely read memories from localStorage
    function readStorage(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.warn(`Could not read ${key}:`, error);
            return [];
        }
    }

    // Support all existing photo formats
    function getPhotos(item) {
        const photos = Array.isArray(item.photos)
            ? item.photos
            : Array.isArray(item.imgs)
                ? item.imgs
                : item.img
                    ? [item.img]
                    : [];

        return photos.filter(photo =>
            typeof photo === "string" && photo.trim()
        );
    }

    // Parse dates without timezone shifting
    function parseDate(value) {
        if (!value) return null;

        const match = String(value).match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})/
        );

        if (!match) return null;

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        const date = new Date(year, month - 1, day);

        if (
            date.getFullYear() !== year ||
            date.getMonth() !== month - 1 ||
            date.getDate() !== day
        ) {
            return null;
        }

        date.setHours(0, 0, 0, 0);
        return date;
    }

    function formatDate(value) {
        const date = parseDate(value);

        if (!date) return "Date not set";

        return new Intl.DateTimeFormat("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    // Collect standalone memories and older occasion memories
    function getAllMemories() {
    const result = TIMELINE_TEST_MODE
        ? TEST_MEMORIES.map(memory => ({ ...memory }))
        : [];

        const standalone = readStorage(
            "remember-a-day-memories"
        );

        const occasions = readStorage(
            "remember-a-day-events"
        );

        // Standalone memories
        standalone.forEach((memory, index) => {
            result.push({
                id: `saved-${memory.id ?? index}`,
                title: memory.title || "A special memory",
                date: memory.date || "",
                note: memory.note || memory.text || "",
                photos: getPhotos(memory),
                category: "Saved memory",
                source: "Personal memory"
            });
        });

        // Memories attached to occasions
        occasions.forEach((event, eventIndex) => {
            const occasionMemories = Array.isArray(event.mem)
                ? event.mem
                : [];

            occasionMemories.forEach((memory, index) => {
                result.push({
                    id: `occasion-${event.id ?? eventIndex}-${memory.id ?? memory.date ?? index}`,
                    title: event.name || "Occasion memory",
                    date: memory.date || event.date || "",
                    note: memory.text || memory.note || "",
                    photos: getPhotos(memory),
                    category:
                        event.type ||
                        event.category ||
                        "Occasion",
                    source: "Occasion memory"
                });
            });
        });

        return result;
    }

    function addOption(select, value, label) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        select.append(option);
    }

    // Automatically populate year and category filters
    function populateFilters(memories) {
        if (yearFilter) {
            const previous = yearFilter.value;

            yearFilter.replaceChildren();
            addOption(yearFilter, "all", "All years");

            const years = [
                ...new Set(
                    memories
                        .map(memory => {
                            const date = parseDate(memory.date);
                            return date
                                ? String(date.getFullYear())
                                : null;
                        })
                        .filter(Boolean)
                )
            ].sort((a, b) => Number(b) - Number(a));

            years.forEach(year => {
                addOption(yearFilter, year, year);
            });

            yearFilter.value = years.includes(previous)
                ? previous
                : "all";
        }

        if (categoryFilter) {
            const previous = categoryFilter.value;

            categoryFilter.replaceChildren();
            addOption(
                categoryFilter,
                "all",
                "All categories"
            );

            const categories = [
                ...new Set(
                    memories
                        .map(memory => memory.category)
                        .filter(Boolean)
                )
            ].sort((a, b) => a.localeCompare(b));

            categories.forEach(category => {
                addOption(categoryFilter, category, category);
            });

            categoryFilter.value = categories.includes(previous)
                ? previous
                : "all";
        }
    }

    // Create a clickable photo

// Open a complete memory details popup
function openMemoryDetails(memory) {
    let overlay = document.getElementById("memory-detail-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "memory-detail-overlay";
        overlay.className = "memory-detail-overlay";

        document.body.append(overlay);
    }

    overlay.replaceChildren();

    const modal = document.createElement("section");
    modal.className = "memory-detail-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Memory details");

    const close = document.createElement("button");
    close.type = "button";
    close.className = "memory-detail-close";
    close.textContent = "×";
    close.setAttribute("aria-label", "Close memory");

    const header = document.createElement("div");
    header.className = "memory-detail-header";

    const date = document.createElement("span");
    date.className = "timeline-date";
    date.textContent = formatDate(memory.date);

    const category = document.createElement("span");
    category.className = "timeline-category";
    category.textContent = memory.category;

    header.append(date, category);

    const title = document.createElement("h2");
    title.className = "memory-detail-title";
    title.textContent = memory.title;

    const note = document.createElement("p");
    note.className = "memory-detail-note";
    note.textContent = memory.note || "A moment worth remembering.";

    const source = document.createElement("p");
    source.className = "memory-detail-source";
    source.textContent = memory.source;

    const galleryHeading = document.createElement("h3");
    galleryHeading.className = "memory-detail-gallery-heading";
    galleryHeading.textContent = `Photos (${memory.photos.length})`;

    const gallery = document.createElement("div");
    gallery.className = "memory-detail-gallery";

    memory.photos.forEach((photo, index) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "memory-detail-photo";

        const image = document.createElement("img");
        image.src = photo;
        image.alt = `${memory.title} photo ${index + 1}`;
        image.loading = "lazy";

        button.append(image);
        button.addEventListener("click", () => {
            openLightbox(photo, image.alt);
        });

        gallery.append(button);
    });

    if (!memory.photos.length) {
        galleryHeading.textContent = "No photos saved";
    }

    modal.append(
        close,
        header,
        title,
        note,
        source,
        galleryHeading,
        gallery
    );

    overlay.append(modal);
    overlay.hidden = false;
    document.body.classList.add("memory-modal-open");

    close.addEventListener("click", closeMemoryDetails);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeMemoryDetails();
        }
    }, { once: true });

    close.focus();
}

function closeMemoryDetails() {
    const overlay = document.getElementById("memory-detail-overlay");

    if (overlay) {
        overlay.hidden = true;
    }

    document.body.classList.remove("memory-modal-open");
}

// Full-size photo viewer inside the memory popup
function openLightbox(src, alt) {
    let overlay = document.getElementById("timeline-lightbox");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "timeline-lightbox";
        overlay.className = "timeline-lightbox";

        const closeButton = document.createElement("button");
        closeButton.type = "button";
        closeButton.className = "timeline-lightbox-close";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Close image");

        const image = document.createElement("img");
        image.className = "timeline-lightbox-image";

        overlay.append(closeButton, image);
        document.body.append(overlay);

        overlay.addEventListener("click", event => {
            if (
                event.target === overlay ||
                event.target.closest(".timeline-lightbox-close")
            ) {
                overlay.hidden = true;
            }
        });
    }

    const image = overlay.querySelector("img");
    image.src = src;
    image.alt = alt;
    overlay.hidden = false;
}


    // Main rendering function
    function render() {
        const all = getAllMemories();

        populateFilters(all);

        const query = search.value.trim().toLowerCase();

        const selectedYear = yearFilter?.value || "all";
        const selectedCategory =
            categoryFilter?.value || "all";

        const direction =
            sort.value === "oldest" ? 1 : -1;

        const filtered = all
            .filter(memory => {
                const searchable = `
                    ${memory.title}
                    ${memory.note}
                    ${memory.category}
                    ${memory.source}
                `.toLowerCase();

                const date = parseDate(memory.date);

                if (
                    query &&
                    !searchable.includes(query)
                ) {
                    return false;
                }

                if (
                    selectedYear !== "all" &&
                    (
                        !date ||
                        String(date.getFullYear()) !== selectedYear
                    )
                ) {
                    return false;
                }

                if (
                    selectedCategory !== "all" &&
                    memory.category !== selectedCategory
                ) {
                    return false;
                }

                return true;
            })
            .sort((a, b) => {
                const dateA = parseDate(a.date)?.getTime()
                    ?? (direction === -1 ? -Infinity : Infinity);

                const dateB = parseDate(b.date)?.getTime()
                    ?? (direction === -1 ? -Infinity : Infinity);

                return direction * (dateA - dateB);
            });

        if (count) {
            count.textContent =
                `Showing ${filtered.length} of ${all.length} ` +
                `${all.length === 1 ? "memory" : "memories"}`;
        }

        timeline.replaceChildren();

        // Empty state
        if (!filtered.length) {
            const empty = document.createElement("div");
            empty.className = "timeline-empty";

            const icon = document.createElement("div");
            icon.className = "timeline-empty-icon";
            icon.textContent = "♡";

            const heading = document.createElement("h3");
            heading.textContent = all.length
                ? "No matching memories"
                : "Your story starts here";

            const message = document.createElement("p");
            message.textContent = all.length
                ? "Try another search or change your filters."
                : "Save a memory from the Memories page and it will appear here.";

            empty.append(icon, heading, message);
            timeline.append(empty);

            return;
        }

        // Group memories by month and year
        const groups = new Map();

        filtered.forEach(memory => {
            const date = parseDate(memory.date);

            const key = date
                ? `${date.getFullYear()}-${String(
                    date.getMonth() + 1
                ).padStart(2, "0")}`
                : "undated";

            if (!groups.has(key)) {
                groups.set(key, []);
            }

            groups.get(key).push(memory);
        });

        groups.forEach((items, key) => {
            const group = document.createElement("section");
            group.className = "timeline-month-group";

            const heading = document.createElement("h2");
            heading.className = "timeline-month-heading";

            if (key === "undated") {
                heading.textContent = "Date not set";
            } else {
                const [year, month] = key.split("-").map(Number);

                heading.textContent =
                    new Intl.DateTimeFormat("en-IN", {
                        month: "long",
                        year: "numeric"
                    }).format(
                        new Date(year, month - 1, 1)
                    );
            }

            group.append(heading);

            const list = document.createElement("div");
            list.className = "timeline-month-items";


items.forEach(memory => {
    const card = document.createElement("article");
    card.className = "timeline-card";

    const marker = document.createElement("span");
    marker.className = "timeline-marker";
    marker.setAttribute("aria-hidden", "true");

    const content = document.createElement("div");
    content.className = "timeline-card-content";

    // Left side: memory information
    const details = document.createElement("div");
    details.className = "timeline-card-details";

    const meta = document.createElement("div");
    meta.className = "timeline-card-meta";

    const date = document.createElement("time");
    date.className = "timeline-date";
    date.textContent = formatDate(memory.date);

    if (memory.date) date.dateTime = memory.date;

    const category = document.createElement("span");
    category.className = "timeline-category";
    category.textContent = memory.category;

    meta.append(date, category);

    const title = document.createElement("h3");
    title.className = "timeline-card-title";
    title.textContent = memory.title;

    const note = document.createElement("p");
    note.className = "timeline-card-note";
    note.textContent = memory.note || "A moment worth remembering.";

    const source = document.createElement("p");
    source.className = "timeline-source";
    source.textContent = memory.source;

    const viewHint = document.createElement("span");
    viewHint.className = "timeline-view-hint";
    viewHint.textContent = "View memory →";

    details.append(meta, title, note, source, viewHint);

    // Right side: fixed 2 × 2 photo collage
    const gallery = document.createElement("div");
    gallery.className = "timeline-photos";

    if (memory.photos.length) {
        memory.photos.slice(0, 4).forEach((photo, index) => {
            const tile = document.createElement("div");
            tile.className = "timeline-photo-button";

            const image = document.createElement("img");
            image.src = photo;
            image.alt = `${memory.title} photo ${index + 1}`;
            image.loading = "lazy";

            tile.append(image);

            // Show remaining photo count on fourth tile
            if (index === 3 && memory.photos.length > 4) {
                const more = document.createElement("span");
                more.className = "timeline-photo-more";
                more.textContent = `+${memory.photos.length - 4}`;
                tile.append(more);
            }

            gallery.append(tile);
        });
    } else {
        const placeholder = document.createElement("div");
        placeholder.className = "timeline-no-photo";
        placeholder.innerHTML = "<span>♡</span><small>Memory saved</small>";
        gallery.append(placeholder);
    }

    content.append(details, gallery);
    card.append(marker, content);

    // Open details when the card is clicked
    content.setAttribute("role", "button");
    content.setAttribute("tabindex", "0");
    content.setAttribute("aria-label", `Open memory: ${memory.title}`);

    content.addEventListener("click", () => {
        openMemoryDetails(memory);
    });

    content.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMemoryDetails(memory);
        }
    });

    list.append(card);
});
            group.append(list);
            timeline.append(group);
        });

      }


    // Events
    search.addEventListener("input", render);
    sort.addEventListener("change", render);

    yearFilter?.addEventListener("change", render);
    categoryFilter?.addEventListener("change", render);

    clearButton?.addEventListener("click", () => {
        search.value = "";
        sort.value = "newest";

        if (yearFilter) yearFilter.value = "all";
        if (categoryFilter) categoryFilter.value = "all";

        render();
    });

    // Refresh if another browser tab changes memories
    window.addEventListener("storage", event => {
        if (
            !event.key ||
            [
                "remember-a-day-memories",
                "remember-a-day-events"
            ].includes(event.key)
        ) {
            render();
        }
    });

    // Close photo viewer with Escape
    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            const overlay = document.getElementById(
                "timeline-lightbox"
            );

            if (overlay) overlay.hidden = true;
        }
    });

    render();
})();
