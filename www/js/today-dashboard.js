
/* ==========================================
   TODAY DASHBOARD
   ========================================== */

(() => {
    "use strict";

    const $ = id => document.getElementById(id);

    function dateParts(value) {
        const match = String(value || "").match(
            /^(\d{4})-(\d{1,2})-(\d{1,2})/
        );

        return match
            ? { year: +match[1], month: +match[2], day: +match[3] }
            : null;
    }

    function renderDate() {
        const today = new Date();

        $("today-weekday").textContent =
            today.toLocaleDateString("en-IN", { weekday: "long" });

        $("today-full-date").textContent =
            today.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }

    function renderPersonalEvents() {
        const target = $("today-personal-events");
        if (!target) return;

        let events = [];

        try {
            events = typeof getEvents === "function" ? getEvents() : [];
        } catch (error) {
            console.warn("Could not load personal events:", error);
        }

        const today = new Date();

        const matches = events.filter(event => {
            const date = dateParts(event.date);
            if (!date) return false;

            // Match birthdays and anniversaries every year.
           const type = String(event.type || "").toLowerCase();
const category = String(event.category || "").toLowerCase();

const recurring =
    /birthday|anniversary/.test(type) ||
    category === "birthday" ||
    category === "anniversary";

            return date.month === today.getMonth() + 1 &&
                date.day === today.getDate() &&
                (recurring || date.year === today.getFullYear());
        });

        target.replaceChildren();

        if (!matches.length) {
    target.replaceChildren();
    return;
}



matches.forEach(event => {
    const item = document.createElement("div");
    item.className = "today-event-item";

    const photos = Array.isArray(event.photos) ? event.photos : [];
    const photo = event.photo || photos[0] || "";

    if (photo) {
        const image = document.createElement("img");
        image.className = "today-event-photo";
        image.src = photo;
        image.alt = event.name || "Occasion photo";
        image.loading = "lazy";
        item.appendChild(image);
    }

    const details = document.createElement("div");
    details.className = "today-event-details";

    const eyebrow = document.createElement("span");
    eyebrow.className = "today-event-eyebrow";
    eyebrow.textContent = "TODAY'S MOMENT";

    const name = document.createElement("h3");
    name.textContent = event.name || "Special day";

    const type = document.createElement("span");
    type.className = "today-event-type";
    type.textContent = "🎂 " + (event.type || event.category || "SPECIAL OCCASION");

    const note = document.createElement("p");
    note.textContent = "A special day worth remembering.";

    details.append(eyebrow, name, type, note);
    item.appendChild(details);

    target.appendChild(item);
});


    }

    async function renderSpecialDays() {
        const target = $("today-special-days");
        if (!target) return;

        if (!window.CalendarData) {
            target.textContent = "No observance data available";
            return;
        }

        try {
            const data = await CalendarData.loadAll();
            const today = new Date();
            const year = today.getFullYear();
            const matches = [];

            ["festivals", "importantDays"].forEach(key => {
                (data[key] || []).forEach(item => {
                    const date = CalendarData.getDateForYear(item, year);

                    if (
                        date &&
                        date.getMonth() === today.getMonth() &&
                        date.getDate() === today.getDate()
                    ) {
                        matches.push(item.name || item.title || item.label);
                    }
                });
            });

            (data.publicHolidays || []).forEach(item => {
                const date = dateParts(item.date);

                if (
                    date &&
                    date.year === year &&
                    date.month === today.getMonth() + 1 &&
                    date.day === today.getDate()
                ) {
                    matches.push(item.name || item.title || item.label);
                }
            });

            target.replaceChildren();

            const unique = [...new Set(matches.filter(Boolean))];

           if (!unique.length) {
    target.textContent = "Today is yours. Make it a memory worth keeping. ✨";
    return;
}

            unique.forEach(name => {
                const item = document.createElement("div");
                item.className = "today-event-item";
                item.textContent = name;
                target.append(item);
            });

        } catch (error) {
            console.error("Could not load today's observances:", error);
            target.textContent = "Could not load observances";
        }
    }

    function init() {
        renderDate();
        renderPersonalEvents();
        renderSpecialDays();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    window.addEventListener("storage", event => {
        if (!event.key || event.key === "remember-a-day-events") {
            renderPersonalEvents();
        }
    });
})();
