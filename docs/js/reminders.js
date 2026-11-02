/* ==========================================
   REMEMBER A DAY — REMINDER MANAGEMENT
   In-app reminders + browser notifications
   ========================================== */

function getReminderDate(event) {
    if (!event.reminder || event.reminder === "none") return null;
    if (typeof getNextOccurrence !== "function") return null;
    const eventDate = getNextOccurrence(event);
    const reminderDays = Number(event.reminder);
    if (!Number.isFinite(reminderDays) || reminderDays < 0) return null;
    const reminderDate = new Date(eventDate);
    reminderDate.setHours(0, 0, 0, 0);
    reminderDate.setDate(reminderDate.getDate() - reminderDays);
    return reminderDate;
}

function getReminderMessage(event) {
    const reminderDate = getReminderDate(event);
    if (!reminderDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const difference = Math.round((reminderDate - today) / 86400000);
    if (difference < 0) return null;
    if (difference === 0) return `Reminder: ${event.name} is coming up!`;
    if (difference === 1) return `Reminder for tomorrow: ${event.name}`;
    return `Reminder in ${difference} days: ${event.name}`;
}

function getUpcomingReminders() {
    if (typeof getEvents !== "function") return [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return getEvents().map(event => {
        const reminderDate = getReminderDate(event);
        return reminderDate ? { event, reminderDate } : null;
    }).filter(Boolean).filter(item => item.reminderDate >= today)
      .sort((a, b) => a.reminderDate - b.reminderDate);
}

// Browser notifications are checked on page load, when the tab becomes visible,
// and periodically while the page remains open. They cannot reliably run after
// the browser is fully closed without additional platform support.
const REMINDER_SENT_KEY = "remember-a-day-notifications-sent";

function getSentReminderIds() {
    try {
        const value = JSON.parse(localStorage.getItem(REMINDER_SENT_KEY) || "[]");
        return Array.isArray(value) ? value : [];
    } catch (_) { return []; }
}

function checkAndSendDueReminders() {
    if (typeof Notification === "undefined" || Notification.permission !== "granted" || typeof getEvents !== "function") return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
    const sent = getSentReminderIds();
    let changed = false;

    getEvents().forEach(event => {
        const reminderDate = getReminderDate(event);
        if (!reminderDate) return;
        reminderDate.setHours(0, 0, 0, 0);
        if (reminderDate.getTime() !== today.getTime()) return;
        const key = `${event.id ?? event.name}|${todayKey}|${event.reminder}`;
        if (sent.includes(key)) return;
        try {
            new Notification("Remember a Day", {
                body: `${event.name} (${event.type || "Occasion"}) is coming up!`,
                icon: "assets/icon-192.png",
                tag: key
            });
            sent.push(key);
            changed = true;
        } catch (error) {
            console.error("Reminder notification failed:", error);
        }
    });
    if (changed) localStorage.setItem(REMINDER_SENT_KEY, JSON.stringify(sent.slice(-500)));
}

function initializeReminderNotifications() {
    checkAndSendDueReminders();
    if (window.__rememberDayReminderInterval) clearInterval(window.__rememberDayReminderInterval);
    window.__rememberDayReminderInterval = setInterval(checkAndSendDueReminders, 60 * 1000);
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) checkAndSendDueReminders();
    });
    window.addEventListener("focus", checkAndSendDueReminders);
}
