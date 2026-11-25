/* ==========================================
   APPLY SAVED THEME
   ========================================== */

(function applySavedTheme() {
    const savedTheme = localStorage.getItem("remember-a-day-theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
    }
})();

/* ==========================================
   CALENDAR STATE
   ========================================== */

let calendarDate = new Date();


let calendarReferenceEvents = [];

async function loadCalendarReferenceEvents() {
    if (!window.CalendarData) return;

    try {
        const items = await CalendarData.getUpcoming(3650);

        calendarReferenceEvents = items.map(item => {
            const sectionLabels = {
                festival: "Festival",
                "important-day": "Important Day",
                "public-holiday": "Public Holiday"
            };

            return {
                name: item.name || item.title || item.label || "Special Day",
                date: item.date,
                type: sectionLabels[item.section] || "Special Day",
                section: item.section
            };
        }).filter(item => parseLocalDate(item.date));

        renderCalendar();

    } catch (error) {
        console.error("Could not load calendar reference events:", error);
    }
}


/* ==========================================
   INITIALIZE APPLICATION
   ========================================== */

document.addEventListener("DOMContentLoaded", async () => {
    showToday();
    showUpcomingEvents();
    showReminders();

    if (typeof initializeReminderNotifications === "function") {
        initializeReminderNotifications();
    }

    renderCalendar();
    updateOccasionCategoryCounts();

    // Load festivals, important days and public holidays.
    await loadCalendarReferenceEvents();
});

/* ==========================================
   SHOW TODAY'S DATE
   ========================================== */


function showToday() {
    const todayElement = document.getElementById("today-date");

    if (!todayElement) return;

    const today = new Date();

    let settings = {};

    try {
        settings = JSON.parse(
            localStorage.getItem("remember-a-day-settings") || "{}"
        );
    } catch (error) {
        console.error("Could not read calendar settings:", error);
    }

    const format = settings.dateFormat || "DD/MM/YYYY";

    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();

    let formattedDate;

    switch (format) {
        case "MM/DD/YYYY":
            formattedDate = `${month}/${day}/${year}`;
            break;

        case "YYYY-MM-DD":
            formattedDate = `${year}-${month}-${day}`;
            break;

        default:
            formattedDate = `${day}/${month}/${year}`;
    }

    todayElement.textContent = formattedDate;
}


/* ==========================================
   SHOW UPCOMING EVENTS
   ========================================== */


function showUpcomingEvents(searchText = "", filterType = "all") {
    const container = document.getElementById("upcoming-events");
    if (!container) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let events = getEvents();

    // Search
    if (searchText.trim() !== "") {
        const search = searchText.toLowerCase().trim();

        events = events.filter(event =>
            String(event.name || "").toLowerCase().includes(search) ||
            String(event.type || "").toLowerCase().includes(search)
        );
    }

    // Category filter
    if (filterType !== "all") {
        events = events.filter(event =>
            String(event.type || "").toLowerCase() === filterType.toLowerCase()
        );
    }

    if (!events.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No occasions found</h3>
                <p>Try another search or filter.</p>
            </div>
        `;

        updateEventCount(0);
        return;
    }

    // Sort by next occurrence
    events.sort((a, b) =>
        getNextOccurrence(a) - getNextOccurrence(b)
    );

    const todaysEvents = [];
    const upcomingEvents = [];

    events.forEach(event => {
        const nextDate = getNextOccurrence(event);
        const date = new Date(nextDate);
        date.setHours(0, 0, 0, 0);

        if (date.getTime() === today.getTime()) {
            todaysEvents.push(event);
        } else {
            upcomingEvents.push(event);
        }
    });

    const renderGroup = (title, items, icon) => {
        if (!items.length) return "";



return `
    <section class="event-group ${
        title === "Happening Today"
            ? "today-event-group"
            : "coming-up-event-group"
    }">
        <div class="event-group-heading">
            <span>${icon}</span>
            <h2>${title}</h2>
            <small>${items.length}</small>
        </div>

        <div class="event-group-grid">
            ${items.map(createEventCard).join("")}
        </div>
    </section>
`;


    };

    container.innerHTML =
        // renderGroup("Happening Today", todaysEvents, "🎉") +
        renderGroup("Coming Up", upcomingEvents.slice(0, 20), "🗓️");

    updateEventCount(events.length);
}

function updateEventCount(count) {
    const label = document.getElementById("event-count-label");

    if (label) {
        label.textContent =
            `${count} ${count === 1 ? "occasion" : "occasions"} saved`;
    }
}


/* ==========================================
   SHOW UPCOMING REMINDERS
   ========================================== */

function showReminders() {
    const container = document.getElementById("reminders-container");
    if (!container) return;

    const reminders = typeof getUpcomingReminders === "function"
        ? getUpcomingReminders()
        : [];

    let notificationControl = "";

    if (typeof Notification !== "undefined") {
        if (Notification.permission === "default") {
            notificationControl = `
                <div class="reminder-permission">
                    <p>Want a browser notification on the reminder date?</p>
                    <button
                        type="button"
                        id="enable-reminder-notifications"
                        class="secondary-button"
                    >
                        Enable Notifications
                    </button>
                </div>`;
        } else if (Notification.permission === "denied") {
            notificationControl = `
                <p class="reminder-note">
                    Browser notifications are blocked. You can still view reminders here.
                </p>`;
        } else {
            notificationControl = `
                <p class="reminder-note">
                    Browser notifications are enabled while this app is open.
                </p>`;
        }
    } else {
        notificationControl = `
            <p class="reminder-note">
                Browser notifications are not supported in this browser.
                Your reminders are still listed here.
            </p>`;
    }

    if (reminders.length === 0) {
        container.innerHTML = `
            ${notificationControl}
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3>No upcoming reminders</h3>
                <p>
                    Add an occasion and choose how many days before it
                    you want to be reminded.
                </p>
            </div>`;
    } else {
        const cards = reminders.slice(0, 5).map(item => {
            const event = item.event;
            const reminderDate = item.reminderDate;

            return `
                <article class="reminder-card">
                    <div class="reminder-icon">🔔</div>
                    <div class="reminder-info">
                        <h3>${escapeHTML(event.name || "Untitled occasion")}</h3>
                        <p>${escapeHTML(event.type || "Occasion")}</p>
                        <small>
                            Reminder: ${reminderDate.toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "long",
                                year: "numeric"
                            })}
                        </small>
                    </div>
                </article>`;
        }).join("");

        container.innerHTML = `${notificationControl}${cards}`;
    }

    const enableButton = document.getElementById(
        "enable-reminder-notifications"
    );

    if (enableButton) {
        enableButton.addEventListener("click", async () => {
            try {
                const permission = await Notification.requestPermission();

                showReminders();

                if (
                    permission === "granted" &&
                    typeof checkAndSendDueReminders === "function"
                ) {
                    checkAndSendDueReminders();
                }
            } catch (error) {
                console.error("Could not enable notifications:", error);
                alert(
                    "Notifications couldn't be enabled in this browser. " +
                    "Your in-app reminders will still work."
                );
            }
        }, { once: true });
    }
}

/* ==========================================
   SAFE HTML TEXT
   ========================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

/* ==========================================
   SEARCH EVENTS
   ========================================== */

const searchInput = document.getElementById("search-events");

if (searchInput) {
    searchInput.addEventListener("input", function () {
        const filterSelect = document.getElementById("filter-events");
        const filter = filterSelect ? filterSelect.value : "all";

        showUpcomingEvents(this.value, filter);
    });
}

/* ==========================================
   FILTER EVENTS
   ========================================== */

const filterSelect = document.getElementById("filter-events");

if (filterSelect) {
    filterSelect.addEventListener("change", function () {
        const searchElement = document.getElementById("search-events");
        const search = searchElement ? searchElement.value : "";

        showUpcomingEvents(search, this.value);
    });
}

/* ==========================================
   CALENDAR MODAL STYLES
   Injected here to avoid requiring CSS edits.
   ========================================== */

(function addCalendarModalStyles() {
    if (document.getElementById("calendar-modal-styles")) return;

    const style = document.createElement("style");
    style.id = "calendar-modal-styles";

    style.textContent = `
        .occasion-modal-overlay {
            position: fixed;
            inset: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(10, 22, 38, 0.64);
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.22s ease, visibility 0.22s ease;
        }

        .occasion-modal-overlay.is-visible {
            opacity: 1;
            visibility: visible;
        }

        .occasion-modal {
            position: relative;
            width: 100%;
            max-width: 440px;
            max-height: min(80vh, 680px);
            overflow-y: auto;
            background: #F5F0E6;
            color: #19365B;
            border-radius: 24px;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
            padding: 28px;
            transform: translateY(14px) scale(0.98);
            transition: transform 0.22s ease;
        }

        .occasion-modal-overlay.is-visible .occasion-modal {
            transform: translateY(0) scale(1);
        }

        .occasion-modal-header {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            margin-bottom: 22px;
            padding-right: 32px;
        }

        .occasion-modal-icon {
            flex: 0 0 52px;
            width: 52px;
            height: 52px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 17px;
            background: rgba(255, 112, 72, 0.14);
            font-size: 27px;
        }

        .occasion-modal-heading {
            flex: 1;
            min-width: 0;
        }

        .occasion-modal-eyebrow {
            margin: 0 0 5px;
            color: #C45131;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 1.8px;
            text-transform: uppercase;
        }

        .occasion-modal-title {
            margin: 0;
            color: #19365B;
            font-size: 23px;
            line-height: 1.25;
            overflow-wrap: anywhere;
        }

        .occasion-modal-date {
            margin: 7px 0 0;
            color: #657187;
            font-size: 14px;
            line-height: 1.5;
        }

        .occasion-modal-close {
            position: absolute;
            top: 18px;
            right: 18px;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 0;
            border-radius: 50%;
            background: rgba(25, 54, 91, 0.08);
            color: #19365B;
            font-size: 25px;
            line-height: 1;
            cursor: pointer;
            transition: background 0.18s ease, transform 0.18s ease;
        }

        .occasion-modal-close:hover {
            background: rgba(255, 112, 72, 0.2);
            transform: rotate(90deg);
        }

        .occasion-modal-list {
            display: grid;
            gap: 11px;
        }

        .occasion-modal-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 15px;
            border: 1px solid rgba(25, 54, 91, 0.09);
                        border-radius: 16px;
            background: #FFFFFF;
        }

        .occasion-modal-item-icon {
            flex: 0 0 38px;
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px;
            background: #FFF0E9;
            font-size: 20px;
        }

        .occasion-modal-item-content {
            flex: 1;
            min-width: 0;
            padding-top: 2px;
        }

        .occasion-modal-item-name {
            margin: 0;
            color: #19365B;
            font-size: 15px;
            font-weight: 750;
            line-height: 1.4;
            overflow-wrap: anywhere;
        }

        .occasion-modal-item-type {
            margin: 4px 0 0;
            color: #7A8493;
            font-size: 12px;
            line-height: 1.4;
        }

        .occasion-modal-footer {
            display: flex;
            justify-content: flex-end;
            margin-top: 22px;
        }

        .occasion-modal-done {
            min-width: 104px;
            padding: 11px 22px;
            border: 0;
            border-radius: 12px;
            background: #19365B;
            color: #FFFFFF;
            font: inherit;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition: background 0.18s ease, transform 0.18s ease;
        }

        .occasion-modal-done:hover {
            background: #274B76;
            transform: translateY(-1px);
        }

        body.occasion-modal-open {
            overflow: hidden;
        }

        body.dark-mode .occasion-modal {
            background: #172638;
            color: #F5F0E6;
        }

        body.dark-mode .occasion-modal-title,
        body.dark-mode .occasion-modal-item-name {
            color: #F5F0E6;
        }

        body.dark-mode .occasion-modal-date,
        body.dark-mode .occasion-modal-item-type {
            color: #C1CAD6;
        }

        body.dark-mode .occasion-modal-item {
            background: #22364C;
            border-color: rgba(255, 255, 255, 0.1);
        }

        body.dark-mode .occasion-modal-close {
            color: #F5F0E6;
            background: rgba(255, 255, 255, 0.1);
        }

        @media (max-width: 480px) {
            .occasion-modal {
                padding: 23px 19px;
                border-radius: 21px;
            }

            .occasion-modal-title {
                font-size: 20px;
            }

            .occasion-modal-header {
                gap: 11px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .occasion-modal-overlay,
            .occasion-modal,
            .occasion-modal-close,
            .occasion-modal-done {
                transition: none;
            }
        }
    `;

    document.head.appendChild(style);
})();

/* ==========================================
   CALENDAR
   ========================================== */


function renderCalendar() {
    const calendarMonth = document.getElementById("calendar-month");
    const calendarDays = document.getElementById("calendar-days");

    if (!calendarMonth || !calendarDays) return;

    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

const settings = JSON.parse(
    localStorage.getItem("remember-a-day-settings") || "{}"
);

const weekStart = settings.weekStart === "monday" ? 1 : 0;

const firstDay =
    (new Date(year, month, 1).getDay() - weekStart + 7) % 7;    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarMonth.textContent = calendarDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    const personalEvents = getEvents();
    let calendarHTML = "";

    for (let i = 0; i < firstDay; i++) {
        calendarHTML += `<div class="calendar-day empty"></div>`;
    }

    const today = new Date();

    for (let day = 1; day <= daysInMonth; day++) {

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();

        // User's saved birthdays and occasions
        const personalDayEvents = personalEvents.filter(event => {
            const eventDate = parseLocalDate(event.date);

            return eventDate &&
                eventDate.getMonth() === month &&
                eventDate.getDate() === day;
        });

        // Festivals, important days and public holidays
        const referenceDayEvents = calendarReferenceEvents.filter(event => {
            const eventDate = parseLocalDate(event.date);

            return eventDate &&
                eventDate.getFullYear() === year &&
                eventDate.getMonth() === month &&
                eventDate.getDate() === day;
        });

        const hasEvents =
            personalDayEvents.length > 0 ||
            referenceDayEvents.length > 0;

        const eventClass = hasEvents ? "has-event" : "";

        const indicators = `
            <span class="calendar-indicators">
                ${personalDayEvents.length > 0
                    ? `<span class="event-dot personal" title="Your occasions"></span>`
                    : ""}
                ${referenceDayEvents.length > 0
                    ? `<span class="event-dot reference" title="Festival or important day"></span>`
                    : ""}
            </span>
        `;

        const totalEvents =
            personalDayEvents.length + referenceDayEvents.length;

        calendarHTML += `
            <div
                class="calendar-day ${eventClass} ${isToday ? "today" : ""}"
                data-date="${dateString}"
                ${hasEvents
                    ? `role="button" tabindex="0"
                       aria-label="${day} ${calendarDate.toLocaleDateString("en-IN", { month: "long" })}, ${totalEvents} occasions"`
                    : ""}
            >
                <span class="day-number">${day}</span>
                ${hasEvents ? indicators : ""}
            </div>
        `;
    }

    calendarDays.innerHTML = calendarHTML;

    calendarDays.querySelectorAll(".calendar-day.has-event").forEach(dayElement => {

        const openSelectedDate = () => {
            showCalendarEvents(dayElement.dataset.date);
        };

        dayElement.addEventListener("click", openSelectedDate);

        dayElement.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openSelectedDate();
            }
        });
    });
}


/* ==========================================
   DATE PARSING
   Avoid timezone date shifts for YYYY-MM-DD.
   ========================================== */

function parseLocalDate(dateValue) {
    if (!dateValue) return null;

    if (dateValue instanceof Date) {
        return Number.isNaN(dateValue.getTime())
            ? null
            : new Date(
                dateValue.getFullYear(),
                dateValue.getMonth(),
                dateValue.getDate()
            );
    }

    const value = String(dateValue);
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (match) {
        return new Date(
            Number(match[1]),
            Number(match[2]) - 1,
            Number(match[3])
        );
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) return null;

    return new Date(
        parsed.getFullYear(),
        parsed.getMonth(),
        parsed.getDate()
    );
}

/* ==========================================
   PREVIOUS MONTH
   ========================================== */

const previousMonth = document.getElementById("previous-month");

if (previousMonth) {
    previousMonth.addEventListener("click", () => {
        calendarDate.setDate(1);
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
    });
}

/* ==========================================
   NEXT MONTH
   ========================================== */

const nextMonth = document.getElementById("next-month");

if (nextMonth) {
    nextMonth.addEventListener("click", () => {
        calendarDate.setDate(1);
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
    });
}

/* ==========================================
   SHOW EVENTS FOR SELECTED DATE
   BEAUTIFUL CENTERED MODAL
   ========================================== */

function showCalendarEvents(dateString) {
    const selectedDate = parseLocalDate(dateString);
    if (!selectedDate) return;


const personalEvents = getEvents();

const selectedPersonalEvents = personalEvents.filter(event => {
    const eventDate = parseLocalDate(event.date);

    return eventDate &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate();
});

const selectedReferenceEvents = calendarReferenceEvents.filter(event => {
    const eventDate = parseLocalDate(event.date);

    return eventDate &&
        eventDate.getFullYear() === selectedDate.getFullYear() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getDate() === selectedDate.getDate();
});

const selectedEvents = [
    ...selectedPersonalEvents.map(event => ({
        ...event,
        _calendarSource: "personal"
    })),

    ...selectedReferenceEvents.map(event => ({
        ...event,
        _calendarSource: "reference"
    }))
];


    // Remove any previous calendar modal before opening a new one.
    closeCalendarEventsModal();

    const formattedDate = selectedDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

    const overlay = document.createElement("div");
    overlay.className = "occasion-modal-overlay";
    overlay.id = "occasion-modal-overlay";

    overlay.innerHTML = `
        <section
            class="occasion-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="occasion-modal-title"
        >
            <button
                type="button"
                class="occasion-modal-close"
                aria-label="Close occasions"
                title="Close"
            >&times;</button>

            <header class="occasion-modal-header">
                <div class="occasion-modal-icon" aria-hidden="true">🗓️</div>
                <div class="occasion-modal-heading">
                    <p class="occasion-modal-eyebrow">Remember a Day</p>
                    <h2 class="occasion-modal-title" id="occasion-modal-title">
                        ${selectedEvents.length === 1 ? "A special occasion" : "Special occasions"}
                    </h2>
                    <p class="occasion-modal-date">${escapeHTML(formattedDate)}</p>
                </div>
            </header>

            <div class="occasion-modal-list">
                ${
                    selectedEvents.length > 0
                        ? selectedEvents.map(event => `
                            <article class="occasion-modal-item ${event._calendarSource}">
                                <div class="occasion-modal-item-icon" aria-hidden="true">
                                    ${getOccasionIcon(event)}
                                </div>
                                <div class="occasion-modal-item-content">
                                    <h3 class="occasion-modal-item-name">
                                        ${escapeHTML(event.name || "Untitled occasion")}
                                    </h3>
                                    <p class="occasion-modal-item-type">
                                        ${escapeHTML(event.type || event.category || "Occasion")}
                                    </p>
                                </div>
                            </article>
                        `).join("")
                        : `
                            <article class="occasion-modal-item">
                                <div class="occasion-modal-item-icon" aria-hidden="true">🌿</div>
                                <div class="occasion-modal-item-content">
                                    <h3 class="occasion-modal-item-name">No occasions saved</h3>
                                    <p class="occasion-modal-item-type">
                                        There are no occasions for this date.
                                    </p>
                                </div>
                            </article>
                        `
                }
            </div>

            <footer class="occasion-modal-footer">
                <button type="button" class="occasion-modal-done">Close</button>
            </footer>
        </section>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("occasion-modal-open");

    const closeButton = overlay.querySelector(".occasion-modal-close");
    const doneButton = overlay.querySelector(".occasion-modal-done");
        const modal = overlay.querySelector(".occasion-modal");

    closeButton.addEventListener("click", closeCalendarEventsModal);
    doneButton.addEventListener("click", closeCalendarEventsModal);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeCalendarEventsModal();
        }
    });

    // Escape closes the modal; Tab remains inside the modal while open.
    overlay._escapeHandler = event => {
        if (event.key === "Escape") {
            closeCalendarEventsModal();
            return;
        }

        if (event.key === "Tab") {
            const focusable = modal.querySelectorAll(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (!focusable.length) return;

            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        }
    };

    document.addEventListener("keydown", overlay._escapeHandler);

    requestAnimationFrame(() => {
        overlay.classList.add("is-visible");
        closeButton.focus();
    });
}

/* ==========================================
   OCCASION ICON
   ========================================== */

function getOccasionIcon(event) {
    const type = String(event.type || event.category || "").toLowerCase();

    if (type.includes("birthday")) return "🎂";
    if (type.includes("anniversary")) return "💝";
    if (type.includes("holiday")) return "🏖️";
    if (type.includes("festival")) return "🪔";
    if (type.includes("meeting")) return "📌";

    return "🎉";
}

/* ==========================================
   CLOSE CALENDAR MODAL
   ========================================== */

function closeCalendarEventsModal() {
    const overlay = document.getElementById("occasion-modal-overlay");
    if (!overlay) return;

    if (overlay._escapeHandler) {
        document.removeEventListener("keydown", overlay._escapeHandler);
    }

    overlay.classList.remove("is-visible");
    document.body.classList.remove("occasion-modal-open");

    // Remove after the fade-out animation.
    setTimeout(() => {
        if (overlay.parentNode) {
            overlay.remove();
        }
    }, 230);
}

/* ==========================================
   BACKUP & RESTORE CONTROLS
   ========================================== */

/* EXPORT */

const exportButton = document.getElementById("export-data");

if (exportButton) {
    exportButton.addEventListener("click", () => {
        exportBackup();
    });
}

/* IMPORT */

const importInput = document.getElementById("import-data");

if (importInput) {
    importInput.addEventListener("change", function () {
        const file = this.files[0];

        if (!file) return;

        const confirmed = confirm(
            "Importing a backup will replace your current data. Continue?"
        );

        if (!confirmed) {
            this.value = "";
            return;
        }

        importBackup(file);
    });
}

/* ==========================================
   HOME CATEGORY COUNTS
   ========================================== */

function updateOccasionCategoryCounts() {
    const events = getEvents();

    const isBirthday = event =>
        String(event.type || "").toLowerCase().includes("birthday") ||
        String(event.category || "").toLowerCase() === "birthday";

    const isAnniversary = event =>
        String(event.type || "").toLowerCase().includes("anniversary") ||
        String(event.category || "").toLowerCase() === "anniversary";

    const birthdayCount = document.getElementById("birthday-count");
    const anniversaryCount = document.getElementById("anniversary-count");
    const customCount = document.getElementById("custom-count");

    if (birthdayCount) {
        birthdayCount.textContent =
            `${events.filter(isBirthday).length} saved`;
    }

    if (anniversaryCount) {
        anniversaryCount.textContent =
            `${events.filter(isAnniversary).length} saved`;
    }

    if (customCount) {
        customCount.textContent =
            `${events.filter(event => !isBirthday(event) && !isAnniversary(event)).length} saved`;
    }
}


/* =====================================
   EVENT CARD CLICK - OPEN DETAILS
   ===================================== */

document.addEventListener("click", function (e) {
    const card = e.target.closest(
        "#upcoming-events .event-card[data-event-id]"
    );

    if (!card) return;

    // Don't open details when editing or deleting
    if (e.target.closest(".card-buttons, button, a")) return;

    openEventDetails(card.dataset.eventId);
});


function openEventDetails(id) {

    const event = getEvents().find(
        item => String(item.id) === String(id)
    );

    if (!event) {
        console.error("Event not found:", id);
        return;
    }

    document.getElementById("event-details-overlay")?.remove();

    const nextDate = getNextOccurrence(event);
    const days = getDaysUntil(event.date, event);

    const safe = value => String(value || "").replace(
        /[&<>"']/g,
        char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );

    const overlay = document.createElement("div");
    overlay.id = "event-details-overlay";
    overlay.className = "event-details-overlay";

    overlay.innerHTML = `
        <section class="event-details-modal">

            <header class="event-details-header">
                <button class="event-details-close" type="button">×</button>

                <span class="event-details-category">
                    ${safe(event.type)}
                </span>

                <h2>${safe(event.name)}</h2>

                <p>▣ ${formatDate(nextDate)}</p>
            </header>

            <div class="event-details-content">

                <section class="event-countdown">
                    <div>
                        <span>STATUS & COUNTDOWN</span>
                        <strong>
                            ${days === 0 ? "Today 🎉" :
                              days === 1 ? "Tomorrow" :
                              `In ${days} Days`}
                        </strong>
                    </div>

                    <span class="event-reminder-pill">
                        🔔 ${event.reminder && event.reminder !== "none"
                            ? safe(event.reminder) + " days before"
                            : "Reminder"}
                    </span>
                </section>

                <section class="event-description">
                    <h3>DESCRIPTION & NOTES</h3>
                    <p>${safe(event.notes || "No description added yet.")}</p>
                </section>


${(() => {
    const photos = Array.isArray(event.photos) && event.photos.length
        ? event.photos
        : event.photo ? [event.photo] : [];

    return photos.length ? `
        <section class="event-attached-photos">
            <h3>ATTACHED PHOTO MEMORIES</h3>

            <div class="event-photo-gallery">
                ${photos.map((photo, index) => `
                    <img
                        src="${safe(photo)}"
                        alt="${safe(event.name)} memory ${index + 1}"
                        class="event-gallery-image"
                    >
                `).join("")}
            </div>
        </section>
    ` : "";
})()}

${event.voiceNote?.data ? `
    <section class="event-voice-note">
        <h3>🎙️ ATTACHED VOICE NOTE</h3>

        <div class="event-voice-player">
            <span class="event-voice-icon">🎤</span>

            <div class="event-voice-info">
                <strong>Personal Voice Memory</strong>
                <audio controls preload="metadata">
                    <source
                        src="${safe(event.voiceNote.data)}"
                        type="${safe(event.voiceNote.mimeType || "audio/webm")}"
                    >
                </audio>
            </div>
        </div>
    </section>
` : ""}


                ${event.gift?.idea ? `
                    <section class="event-gift-details">
                        <h3>GIFT DETAILS</h3>
                        <p>🎁 ${safe(event.gift.idea)}</p>
                    </section>
                ` : ""}

            </div>

            <footer class="event-details-footer">
                <button class="event-delete-button" type="button">
                    🗑 Delete
                </button>

                <div>
                    <button class="event-share-button" type="button">
                        ↗ Share
                    </button>

                    <button class="event-edit-button" type="button">
                        Edit Occasion
                    </button>
                </div>
            </footer>

        </section>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add("event-details-open");

    overlay.querySelector(".event-details-close")
        .addEventListener("click", closeEventDetails);

    overlay.addEventListener("click", e => {
        if (e.target === overlay) closeEventDetails();
    });

    overlay.querySelector(".event-edit-button")
        .addEventListener("click", () => editEvent(event.id));

    overlay.querySelector(".event-delete-button")
        .addEventListener("click", () => {
            closeEventDetails();
            removeEvent(event.id);
        });

    overlay.querySelector(".event-share-button")
        .addEventListener("click", async () => {
            const text = `${event.name}\n${formatDate(nextDate)}\n${event.notes || ""}`;

            if (navigator.share) {
                try {
                    await navigator.share({
                        title: event.name,
                        text
                    });
                } catch (error) {
                    if (error.name !== "AbortError") console.error(error);
                }
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                alert("Event details copied!");
            }
        });

    document.addEventListener("keydown", eventModalEscape);
}


function closeEventDetails() {
    document.getElementById("event-details-overlay")?.remove();
    document.body.classList.remove("event-details-open");
    document.removeEventListener("keydown", eventModalEscape);
}


function eventModalEscape(e) {
    if (e.key === "Escape") closeEventDetails();
}



/* ==========================================
   REMEMBER A DAY — CALENDAR POPUP REDESIGN
   ========================================== */

(function calendarPopupRedesign() {
    if (document.getElementById("calendar-popup-redesign")) return;

    const style = document.createElement("style");
    style.id = "calendar-popup-redesign";

    style.textContent = `
        /* Backdrop */
        .occasion-modal-overlay {
            background: rgba(24, 22, 43, 0.58) !important;
            backdrop-filter: blur(10px) !important;
            -webkit-backdrop-filter: blur(10px) !important;
            padding: 18px !important;
        }

        /* Main card */
        .occasion-modal-overlay .occasion-modal {
            width: min(100%, 470px) !important;
            max-height: min(78vh, 620px) !important;
            overflow-y: auto !important;
            padding: 28px !important;
            border: 1px solid #e8e2fa !important;
            border-radius: 26px !important;
            background: #ffffff !important;
            color: #25213c !important;
            box-shadow: 0 28px 80px rgba(31, 25, 65, 0.24) !important;
            animation: calendarCardEnter .28s ease-out both;
        }

        @keyframes calendarCardEnter {
            from {
                opacity: 0;
                transform: translateY(14px) scale(.97);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* Header */
        .occasion-modal-header {
            align-items: center !important;
            gap: 15px !important;
            margin-bottom: 25px !important;
            padding-right: 32px !important;
        }

        .occasion-modal-icon {
            flex: 0 0 54px !important;
            width: 54px !important;
            height: 54px !important;
            border-radius: 18px !important;
            background: #f0ebff !important;
            font-size: 25px !important;
        }

        .occasion-modal-eyebrow {
            color: #8062d9 !important;
            font-size: 10px !important;
            letter-spacing: 2px !important;
            margin-bottom: 7px !important;
        }

        .occasion-modal-title {
            color: #292443 !important;
            font-size: clamp(20px, 4vw, 25px) !important;
            font-weight: 750 !important;
            letter-spacing: -.5px !important;
        }

        .occasion-modal-date {
            margin-top: 6px !important;
            color: #85829a !important;
            font-size: 13px !important;
        }

        /* Close icon */
        .occasion-modal-close {
            top: 17px !important;
            right: 17px !important;
            width: 35px !important;
            height: 35px !important;
            background: #f2f1f7 !important;
            color: #5c5675 !important;
            font-size: 22px !important;
        }

        .occasion-modal-close:hover {
            background: #ebe5ff !important;
            color: #7252d2 !important;
        }

        /* Occasion list */
        .occasion-modal-list {
            display: grid !important;
            gap: 12px !important;
        }

        .occasion-modal-item {
            align-items: center !important;
            gap: 13px !important;
            padding: 15px !important;
            border: 1px solid #eeebf5 !important;
            border-radius: 17px !important;
            background: #fbfaff !important;
            transition: transform .2s ease, border-color .2s ease !important;
        }

        .occasion-modal-item:hover {
            transform: translateY(-2px);
            border-color: #d9cdf9 !important;
        }

        .occasion-modal-item-icon {
            flex: 0 0 43px !important;
            width: 43px !important;
            height: 43px !important;
            border-radius: 14px !important;
            background: #f0ebff !important;
            font-size: 21px !important;
        }

        .occasion-modal-item-name {
            color: #302b49 !important;
            font-size: 15px !important;
            font-weight: 750 !important;
        }

        .occasion-modal-item-type {
            display: inline-flex !important;
            width: fit-content !important;
            margin-top: 6px !important;
            padding: 4px 9px !important;
            border-radius: 30px !important;
            background: #f0ebff !important;
            color: #7655c9 !important;
            font-size: 10px !important;
            font-weight: 700 !important;
        }

        /* Personal occasions */
        .occasion-modal-item.personal {
            border-left: 3px solid #8561e8 !important;
        }

        .occasion-modal-item.personal .occasion-modal-item-icon {
            background: #f0ebff !important;
        }

        .occasion-modal-item.personal .occasion-modal-item-type {
            background: #f0ebff !important;
            color: #7655c9 !important;
        }

        /* Public events and festivals */
        .occasion-modal-item.reference {
            border-left: 3px solid #20a69c !important;
        }

        .occasion-modal-item.reference .occasion-modal-item-icon {
            background: #e5f8f5 !important;
        }

        .occasion-modal-item.reference .occasion-modal-item-type {
            background: #e5f8f5 !important;
            color: #16877f !important;
        }

        /* Footer */
        .occasion-modal-footer {
            margin-top: 23px !important;
        }

        .occasion-modal-done {
            min-width: 105px !important;
            padding: 12px 24px !important;
            border-radius: 13px !important;
            background: #7656dc !important;
            color: #fff !important;
            font-size: 13px !important;
            font-weight: 750 !important;
            box-shadow: 0 5px 14px rgba(118, 86, 220, .2);
        }

        .occasion-modal-done:hover {
            background: #6443c9 !important;
        }

        /* Empty state */
        .occasion-modal-item:has(.occasion-modal-item-name:first-child) {
            min-width: 0;
        }

        /* Dark mode */
        body.dark-mode .occasion-modal-overlay .occasion-modal {
            background: #211e32 !important;
            border-color: #39334f !important;
            color: #f4f0ff !important;
        }

        body.dark-mode .occasion-modal-title,
        body.dark-mode .occasion-modal-item-name {
            color: #f4f0ff !important;
        }

        body.dark-mode .occasion-modal-date,
        body.dark-mode .occasion-modal-item-type {
            color: #bcb5d2 !important;
        }

        body.dark-mode .occasion-modal-item {
            background: #2a2540 !important;
            border-color: #403957 !important;
        }

        body.dark-mode .occasion-modal-item.personal .occasion-modal-item-type {
            background: #40325f !important;
            color: #d2bdff !important;
        }

        body.dark-mode .occasion-modal-item.reference .occasion-modal-item-type {
            background: #203f40 !important;
            color: #9ce8dc !important;
        }

        body.dark-mode .occasion-modal-close {
            background: #38334b !important;
            color: #eee8ff !important;
        }

        @media (max-width: 480px) {
            .occasion-modal-overlay .occasion-modal {
                padding: 22px 17px !important;
                border-radius: 21px !important;
            }

            .occasion-modal-header {
                gap: 11px !important;
            }

            .occasion-modal-item {
                padding: 12px !important;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .occasion-modal-overlay .occasion-modal {
                animation: none !important;
            }
        }
    `;

    document.head.appendChild(style);
})();
