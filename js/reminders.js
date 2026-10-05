/* ==========================================
   REMEMBER A DAY
   REMINDER MANAGEMENT
   ========================================== */


/* ==========================================
   GET REMINDER DATE
   ========================================== */

function getReminderDate(event) {

    if (!event.reminder || event.reminder === "none") {
        return null;
    }

    const eventDate = getNextOccurrence(event);

    const reminderDays = Number(event.reminder);

    const reminderDate = new Date(eventDate);

    reminderDate.setDate(
        reminderDate.getDate() - reminderDays
    );

    return reminderDate;
}


/* ==========================================
   GET REMINDER MESSAGE
   ========================================== */

function getReminderMessage(event) {

    const reminderDate = getReminderDate(event);

    if (!reminderDate) {
        return null;
    }

    const today = new Date();

    today.setHours(0, 0, 0, 0);
    reminderDate.setHours(0, 0, 0, 0);

    const difference =
        Math.ceil(
            (reminderDate - today) /
            (1000 * 60 * 60 * 24)
        );


    if (difference < 0) {
        return null;
    }


    if (difference === 0) {
        return `Reminder: ${event.name} is coming up!`;
    }


    if (difference === 1) {
        return `Reminder for tomorrow: ${event.name}`;
    }


    return `Reminder in ${difference} days: ${event.name}`;
}


/* ==========================================
   GET UPCOMING REMINDERS
   ========================================== */

function getUpcomingReminders() {

    const events = getEvents();

    return events
        .map(event => {

            const reminderDate =
                getReminderDate(event);

            if (!reminderDate) {
                return null;
            }

            return {
                event: event,
                reminderDate: reminderDate
            };

        })
        .filter(item => item !== null)

        .filter(item => {

            const today = new Date();

            today.setHours(0, 0, 0, 0);

            return item.reminderDate >= today;

        })

        .sort((a, b) => {

            return (
                a.reminderDate -
                b.reminderDate
            );

        });

}