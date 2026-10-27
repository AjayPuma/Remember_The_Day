/* Remember a Day: personal occasion folders */
(function () {
  const params = new URLSearchParams(location.search);
  const folder = document.body.dataset.folder || "custom";
  const titleMap = {
    birthdays: { title: "🎂 Birthdays", label: "PEOPLE YOU CELEBRATE", desc: "Every birthday, remembered every year." },
    anniversaries: { title: "💍 Anniversaries", label: "LOVE & MILESTONES", desc: "Celebrate the dates that bring people together." },
    custom: { title: "✨ Custom Occasions", label: "YOUR IMPORTANT DATES", desc: "Every other occasion that matters to you." }
  };

  const typeOf = e => String(e.type || "").toLowerCase();
  const isBirthday = e => typeOf(e).includes("birthday") || String(e.category || "").toLowerCase() === "birthday";
  const isAnniversary = e => typeOf(e).includes("anniversary") || String(e.category || "").toLowerCase() === "anniversary";
  const matches = e => folder === "birthdays" ? isBirthday(e) :
    folder === "anniversaries" ? isAnniversary(e) : (!isBirthday(e) && !isAnniversary(e));

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }

  function render() {
    const meta = titleMap[folder] || titleMap.custom;
    document.title = `${meta.title.replace(/^[^ ]+ /, "")} | Remember a Day`;
    document.getElementById("folder-title").textContent = meta.title;
    document.getElementById("folder-label").textContent = meta.label;
    document.getElementById("folder-description").textContent = meta.desc;

    const list = document.getElementById("occasion-list");
    const search = document.getElementById("folder-search").value.trim().toLowerCase();
    let events = getEvents().filter(matches).filter(e =>
      String(e.name || "").toLowerCase().includes(search) ||
      String(e.notes || "").toLowerCase().includes(search)
    );
    events.sort((a, b) => getNextOccurrence(a) - getNextOccurrence(b));

    if (!events.length) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">${folder === "birthdays" ? "🎂" : folder === "anniversaries" ? "💍" : "✨"}</div><h3>Nothing here yet</h3><p>Add an occasion and it will appear in this folder with its next countdown.</p><a class="primary-button" href="add.html">＋ Add Occasion</a></div>`;
      return;
    }

    list.innerHTML = events.map(event => {
      const card = createEventCard(event);
      const date = getNextOccurrence(event);
      let extra = "";
      if (folder === "birthdays" && event.date) {
        const born = new Date(`${event.date}T00:00:00`);
        if (!Number.isNaN(born.getTime())) {
          let age = date.getFullYear() - born.getFullYear();
          if (date.getMonth() < born.getMonth() ||
              (date.getMonth() === born.getMonth() && date.getDate() < born.getDate())) age--;
          if (age >= 0) extra = `<p class="folder-extra">🎈 Turning ${age} on their next birthday</p>`;
        }
      }
      if (folder === "anniversaries" && event.date) {
        const started = new Date(`${event.date}T00:00:00`);
        if (!Number.isNaN(started.getTime()) && started.getFullYear() < date.getFullYear()) {
          extra = `<p class="folder-extra">💖 ${date.getFullYear() - started.getFullYear()} years together</p>`;
        }
      }
      return card.replace('<div class="event-info">', `<div class="event-info">${extra}`);
    }).join("");
  }

  document.getElementById("folder-search").addEventListener("input", render);
  window.addEventListener("storage", render);
  render();
})();
