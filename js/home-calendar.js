document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("upcoming-festivals");
  if (!container || !window.CalendarData) return;

  try {
    const events = await CalendarData.getUpcoming(365);
    const festivals = events
      .filter(event => event.section === "festival")
      .slice(0, 3);

    if (!festivals.length) {
      container.innerHTML = "<p>No upcoming festivals found.</p>";
      return;
    }

    container.replaceChildren();

    festivals.forEach(event => {
      const card = document.createElement("article");
      card.className = "event-card";

      const name = document.createElement("h3");
      name.textContent = `${event.emoji || "🎉"} ${event.name}`;

      const date = document.createElement("p");
      date.textContent = event.date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      const countdown = document.createElement("p");
      countdown.className = "event-countdown";
      countdown.textContent = event.daysUntil === 0
        ? "Today!"
        : `In ${event.daysUntil} days`;

      card.append(name, date, countdown);
      container.appendChild(card);
    });
  } catch (error) {
    console.error("Festival loading failed:", error);
    container.textContent = "Festivals could not be loaded.";
  }
});