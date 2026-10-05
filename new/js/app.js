/* ==========================================
   APPLY SAVED THEME
   ========================================== */

(function applySavedTheme() {

    const savedTheme =
        localStorage.getItem(
            "remember-a-day-theme"
        );

    if (savedTheme === "dark") {

        document.body.classList.add(
            "dark-mode"
        );

    }

})();

/* ==========================================
   CALENDAR STATE
   ========================================== */

let calendarDate = new Date();


/* ==========================================
   REMEMBER A DAY
   MAIN APPLICATION
   ========================================== */


/* ==========================================
   INITIALIZE APPLICATION
   ========================================== */

document.addEventListener("DOMContentLoaded", () => {

    showToday();

showUpcomingEvents();

showReminders();

renderCalendar();

});


/* ==========================================
   SHOW TODAY'S DATE
   ========================================== */

function showToday() {

    const todayElement = document.getElementById("today-date");

    if (!todayElement) {
        return;
    }

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

function showUpcomingEvents(
    searchText = "",
    filterType = "all"
) {

    const container =
        document.getElementById(
            "upcoming-events"
        );

    if (!container) {
        return;
    }


    let events = getEvents();


    /* ======================================
       SEARCH
       ====================================== */

    if (searchText.trim() !== "") {

        const search =
            searchText
                .toLowerCase()
                .trim();

        events = events.filter(event =>

            event.name
                .toLowerCase()
                .includes(search)

            ||

            event.type
                .toLowerCase()
                .includes(search)

        );

    }


    /* ======================================
       FILTER
       ====================================== */

    if (filterType !== "all") {

        events = events.filter(
            event =>
                event.type === filterType
        );

    }


    /* ======================================
       EMPTY RESULT
       ====================================== */

    if (events.length === 0) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    📅
                </div>

                <h3>
                    No occasions found
                </h3>

                <p>
                    Try another search or filter.
                </p>

            </div>

        `;

        return;
    }


    /* ======================================
       SORT EVENTS
       ====================================== */

    events.sort((a, b) => {

        return (
            getNextOccurrence(a) -
            getNextOccurrence(b)
        );

    });


    /* ======================================
       DISPLAY EVENTS
       ====================================== */

    container.innerHTML = events
        .slice(0, 20)
        .map(createEventCard)
        .join("");

}

/* ==========================================
   SHOW UPCOMING REMINDERS
   ========================================== */

function showReminders() {

    const container =
        document.getElementById(
            "reminders-container"
        );

    if (!container) {
        return;
    }


    const reminders =
        getUpcomingReminders();


    if (reminders.length === 0) {

        return;

    }


    container.innerHTML =
        reminders
            .slice(0, 5)
            .map(item => {

                const event =
                    item.event;

                const reminderDate =
                    item.reminderDate;


                return `

                    <article class="reminder-card">

                        <div class="reminder-icon">
                            🔔
                        </div>

                        <div class="reminder-info">

                            <h3>
                                ${event.name}
                            </h3>

                            <p>
                                ${event.type}
                            </p>

                            <small>
                                Reminder:
                                ${reminderDate.toLocaleDateString(
                                    "en-IN",
                                    {
                                        day: "numeric",
                                        month: "long"
                                    }
                                )}
                            </small>

                        </div>

                    </article>

                `;

            })
            .join("");

}

/* ==========================================
   SEARCH EVENTS
   ========================================== */

const searchInput =
    document.getElementById(
        "search-events"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const filter =
                document.getElementById(
                    "filter-events"
                ).value;

            showUpcomingEvents(
                this.value,
                filter
            );

        }
    );

}


/* ==========================================
   FILTER EVENTS
   ========================================== */

const filterSelect =
    document.getElementById(
        "filter-events"
    );


if (filterSelect) {

    filterSelect.addEventListener(
        "change",
        function () {

            const search =
                document.getElementById(
                    "search-events"
                ).value;

            showUpcomingEvents(
                search,
                this.value
            );

        }
    );

}

/* ==========================================
   CALENDAR
   ========================================== */

function renderCalendar() {

    const calendarMonth =
        document.getElementById("calendar-month");

    const calendarDays =
        document.getElementById("calendar-days");

    if (!calendarMonth || !calendarDays) {
        return;
    }


    /* ======================================
       CURRENT MONTH INFORMATION
       ====================================== */

    const year =
        calendarDate.getFullYear();

    const month =
        calendarDate.getMonth();


    const firstDay =
        new Date(year, month, 1).getDay();

    const daysInMonth =
        new Date(year, month + 1, 0).getDate();


    /* ======================================
       MONTH TITLE
       ====================================== */

    calendarMonth.textContent =
        calendarDate.toLocaleDateString(
            "en-IN",
            {
                month: "long",
                year: "numeric"
            }
        );


    /* ======================================
       GET EVENTS
       ====================================== */

    const events = getEvents();


    /* ======================================
       CREATE CALENDAR DAYS
       ====================================== */

    let calendarHTML = "";


    /* Empty spaces before first day */

    for (let i = 0; i < firstDay; i++) {

        calendarHTML += `
            <div class="calendar-day empty"></div>
        `;

    }


    /* Actual days */

    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const dateString =
            `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;


        /* ==================================
           CHECK TODAY
           ================================== */

        const today = new Date();

        const isToday =
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear();


        /* ==================================
           CHECK EVENTS
           ================================== */

        const dayEvents =
            events.filter(event => {

                const eventDate =
                    new Date(event.date);

                return (
                    eventDate.getMonth() === month &&
                    eventDate.getDate() === day
                );

            });


        let eventClass = "";

        if (dayEvents.length > 0) {
            eventClass = "has-event";
        }


        calendarHTML += `

            <div
                class="calendar-day ${eventClass} ${isToday ? "today" : ""}"
                data-date="${dateString}"
            >

                <span class="day-number">
                    ${day}
                </span>

                ${
                    dayEvents.length > 0
                    ? `<span class="event-dot"></span>`
                    : ""
                }

            </div>

        `;

    }


    calendarDays.innerHTML =
        calendarHTML;


    /* ======================================
       ADD CLICK EVENTS
       ====================================== */

    document
        .querySelectorAll(".calendar-day.has-event")
        .forEach(day => {

            day.addEventListener(
                "click",
                () => {

                    const selectedDate =
                        day.dataset.date;

                    showCalendarEvents(
                        selectedDate
                    );

                }
            );

        });

}

/* ==========================================
   PREVIOUS MONTH
   ========================================== */

const previousMonth =
    document.getElementById(
        "previous-month"
    );

if (previousMonth) {

    previousMonth.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() - 1
            );

            renderCalendar();

        }
    );

}


/* ==========================================
   NEXT MONTH
   ========================================== */

const nextMonth =
    document.getElementById(
        "next-month"
    );

if (nextMonth) {

    nextMonth.addEventListener(
        "click",
        () => {

            calendarDate.setMonth(
                calendarDate.getMonth() + 1
            );

            renderCalendar();

        }
    );

}

/* ==========================================
   SHOW EVENTS FOR SELECTED DATE
   ========================================== */

function showCalendarEvents(dateString) {

    const events = getEvents();

    const selectedEvents =
        events.filter(event => {

            const eventDate =
                new Date(event.date);

            const selectedDate =
                new Date(dateString);

            return (
                eventDate.getMonth() ===
                    selectedDate.getMonth()

                &&

                eventDate.getDate() ===
                    selectedDate.getDate()
            );

        });


    if (selectedEvents.length === 0) {
        return;
    }


    const names =
        selectedEvents
            .map(event => `• ${event.name}`)
            .join("\n");


    alert(
        `Occasions on this date:\n\n${names}`
    );

}

/* ==========================================
   BACKUP & RESTORE CONTROLS
   ========================================== */


/* ==========================================
   EXPORT
   ========================================== */

const exportButton =
    document.getElementById(
        "export-data"
    );


if (exportButton) {

    exportButton.addEventListener(
        "click",
        () => {

            exportBackup();

        }
    );

}


/* ==========================================
   IMPORT
   ========================================== */

const importInput =
    document.getElementById(
        "import-data"
    );


if (importInput) {

    importInput.addEventListener(
        "change",
        function () {

            const file =
                this.files[0];


            if (!file) {
                return;
            }


            const confirmed =
                confirm(
                    "Importing a backup will replace your current data. Continue?"
                );


            if (!confirmed) {

                this.value = "";

                return;

            }


            importBackup(file);

        }
    );

}

/* ==========================================
   SERVICE WORKER
   ========================================== */

if ("serviceWorker" in navigator) {

    window.addEventListener(
        "load",
        () => {

            navigator.serviceWorker
                .register("./sw.js")
                .then(() => {

                    console.log(
                        "Service Worker registered successfully."
                    );

                })
                .catch(error => {

                    console.error(
                        "Service Worker registration failed:",
                        error
                    );

                });

        }
    );

}