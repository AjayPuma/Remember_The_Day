/* ==========================================
   EVENT MANAGEMENT
   ========================================== */


/* ==========================================
   FORMAT DATE
   ========================================== */

function formatDate(dateString) {
    const date = dateString instanceof Date ? dateString : new Date(`${dateString}T00:00:00`);

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

/* ==========================================
   GET DAYS UNTIL EVENT
   ========================================== */

function getDaysUntil(dateString, event = null) {

    const today = new Date();

    let eventDate = new Date(dateString);

    if (event) {
        eventDate = getNextOccurrence(event);
    }

    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);

    const difference = eventDate - today;

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );
}

/* ==========================================
   SORT EVENTS
   ========================================== */

function sortEvents(events) {

    return events.sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
}


/* ==========================================
   CREATE EVENT CARD
   ========================================== */

function createEventCard(event) {

    const days = getDaysUntil(event.date, event);

    let timingText;

    if (days === 0) {

        timingText = "Today 🎉";

    } else if (days === 1) {

        timingText = "Tomorrow";

    } else {

        timingText = `In ${days} days`;

    }

    let giftHTML = "";

if (event.gift && event.gift.idea) {

    giftHTML = `
        <div class="event-gift">

            🎁 ${event.gift.idea}

            ${
                event.gift.budget
                ? ` · ₹${event.gift.budget}`
                : ""
            }

        </div>
    `;

}

let photoHTML = "";

if (event.photo) {

    photoHTML = `

        <img
            class="event-photo"
            src="${event.photo}"
            alt="${event.name}"
        >

    `;

}



    return `
        <article class="event-card">

        ${photoHTML}

            <div class="event-info">

                <span class="event-type">
                    ${event.type}
                </span>

                <h3>${event.name}</h3>

                <p>
                    ${formatDate(
                        getNextOccurrence(event)
                    )}
                </p>
                ${giftHTML}

            </div>

            <div class="event-actions">

                <strong>
                    ${timingText}
                </strong>

                <div class="card-buttons">

                    <button
                        onclick="editEvent(${event.id})"
                        title="Edit"
                    >
                        ✏️
                    </button>

                    <button
                        onclick="removeEvent(${event.id})"
                        title="Delete"
                    >
                        🗑️
                    </button>

                </div>

            </div>

        </article>
    `;
}

/* ==========================================
   GET NEXT OCCURRENCE
   ========================================== */

function getNextOccurrence(event) {
    const originalDate = new Date(`${event.date}T00:00:00`);
    if (Number.isNaN(originalDate.getTime())) return new Date();

    const type = String(event.type || "").toLowerCase();
    const category = String(event.category || "").toLowerCase();
    const repeatsYearly = type.includes("birthday") ||
        type.includes("anniversary") ||
        category === "birthday" || category === "anniversary";

    if (!repeatsYearly) return originalDate;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const month = originalDate.getMonth();
    const day = originalDate.getDate();

    function occurrence(year) {
        const date = new Date(year, month, day);
        // February 29 becomes February 28 in non-leap years.
        return date.getMonth() === month ? date : new Date(year, month + 1, 0);
    }

    let nextDate = occurrence(today.getFullYear());
    if (nextDate < today) nextDate = occurrence(today.getFullYear() + 1);
    return nextDate;
}

function removeEvent(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this occasion?"
    );

    if (!confirmed) {
        return;
    }

    deleteEvent(id);

    location.reload();
}


/* ==========================================
   EDIT EVENT
   ========================================== */

function editEvent(id) {

    /*
     * Pass the event ID through the URL.
     * This keeps Add mode and Edit mode separate.
     */

    const isInsidePages = window.location.pathname.includes("/pages/");
    window.location.href = isInsidePages
        ? `add.html?edit=${id}`
        : `pages/add.html?edit=${id}`;

}