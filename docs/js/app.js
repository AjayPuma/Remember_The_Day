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

/* ==========================================
   INITIALIZE APPLICATION
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {
    showToday();
    showUpcomingEvents();
    showReminders();

    if (typeof initializeReminderNotifications === "function") {
        initializeReminderNotifications();
    }

    renderCalendar();
    updateOccasionCategoryCounts();
});

/* ==========================================
   SHOW TODAY'S DATE
   ========================================== */

function showToday() {
    const todayElement = document.getElementById("today-date");
    if (!todayElement) return;

    const today = new Date();

    todayElement.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

/* ==========================================
   SHOW UPCOMING EVENTS
   ========================================== */

function showUpcomingEvents(searchText = "", filterType = "all") {
    const container = document.getElementById("upcoming-events");
    if (!container) return;

    let events = getEvents();

    if (searchText.trim() !== "") {
        const search = searchText.toLowerCase().trim();

        events = events.filter(event =>
            String(event.name || "").toLowerCase().includes(search) ||
            String(event.type || "").toLowerCase().includes(search)
        );
    }

    if (filterType !== "all") {
        events = events.filter(event => event.type === filterType);
    }

    if (events.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📅</div>
                <h3>No occasions found</h3>
                <p>Try another search or filter.</p>
            </div>
        `;
        return;
    }

    events.sort((a, b) => getNextOccurrence(a) - getNextOccurrence(b));

    container.innerHTML = events
        .slice(0, 20)
        .map(createEventCard)
        .join("");
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

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    calendarMonth.textContent = calendarDate.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric"
    });

    const events = getEvents();
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

        const dayEvents = events.filter(event => {
            const eventDate = parseLocalDate(event.date);

            return eventDate &&
                eventDate.getMonth() === month &&
                eventDate.getDate() === day;
        });

        const eventClass = dayEvents.length > 0 ? "has-event" : "";

        calendarHTML += `
            <div
                class="calendar-day ${eventClass} ${isToday ? "today" : ""}"
                data-date="${dateString}"
                ${dayEvents.length > 0 ? 'role="button" tabindex="0" aria-label="' +
                    day + " " + calendarDate.toLocaleDateString("en-IN", { month: "long" }) +
                    ', occasions: ' + dayEvents.length + '"' : ""}
            >
                <span class="day-number">${day}</span>
                ${dayEvents.length > 0 ? `<span class="event-dot"></span>` : ""}
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

    const events = getEvents();

    const selectedEvents = events.filter(event => {
        const eventDate = parseLocalDate(event.date);

        return eventDate &&
            eventDate.getMonth() === selectedDate.getMonth() &&
            eventDate.getDate() === selectedDate.getDate();
    });

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
                            <article class="occasion-modal-item">
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