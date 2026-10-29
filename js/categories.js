
/* ==========================================
   REMEMBER A DAY
   PERSONAL OCCASION FOLDERS
   Search icon + search, category and month filters
   ========================================== */

(function () {
  const folder = document.body.dataset.folder || "custom";

  const titleMap = {
    birthdays: {
      title: "🎂 Birthdays",
      label: "PEOPLE YOU CELEBRATE",
      desc: "Every birthday, remembered every year."
    },
    anniversaries: {
      title: "💍 Anniversaries",
      label: "LOVE & MILESTONES",
      desc: "Celebrate the dates that bring people together."
    },
    custom: {
      title: "✨ Custom Occasions",
      label: "YOUR IMPORTANT DATES",
      desc: "Every other occasion that matters to you."
    }
  };

  const typeOf = event =>
    String(event.type || "").toLowerCase();

  const categoryOf = event =>
    String(event.category || "").toLowerCase();

  const isBirthday = event =>
    typeOf(event).includes("birthday") ||
    categoryOf(event) === "birthday";

  const isAnniversary = event =>
    typeOf(event).includes("anniversary") ||
    categoryOf(event) === "anniversary";

  const belongsToFolder = event =>
    folder === "birthdays"
      ? isBirthday(event)
      : folder === "anniversaries"
        ? isAnniversary(event)
        : !isBirthday(event) && !isAnniversary(event);

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);
  }

  const searchInput = document.getElementById("folder-search");
  const categorySelect = document.getElementById("folder-category");
  const monthSelect = document.getElementById("folder-month");
  const filterPanel = document.getElementById("folder-filter-panel");
  const toggleButton = document.getElementById("toggle-folder-filters");
  const closeButton = document.getElementById("close-folder-filters");
  const resetButton = document.getElementById("reset-folder-filters");
  const list = document.getElementById("occasion-list");

  function openFilters() {
    if (!filterPanel || !toggleButton) return;

    filterPanel.hidden = false;
    toggleButton.setAttribute("aria-expanded", "true");

    if (searchInput) searchInput.focus();
  }

  function closeFilters() {
    if (!filterPanel || !toggleButton) return;

    filterPanel.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.focus();
  }

  if (toggleButton) {
    toggleButton.addEventListener("click", () => {
      if (filterPanel.hidden) {
        openFilters();
      } else {
        closeFilters();
      }
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeFilters);
  }

  // Build category options from the occasions in this folder.
  function populateCategories() {
    if (!categorySelect || typeof getEvents !== "function") return;

    const previousValue = categorySelect.value;
    const events = getEvents().filter(belongsToFolder);
    const categories = new Map();

    events.forEach(event => {
      const value = String(event.category || event.type || "custom")
        .trim()
        .toLowerCase();

      const label = String(event.type || event.category || "Other")
        .trim();

      if (value) categories.set(value, label);
    });

    categorySelect.innerHTML =
      '<option value="all">All categories</option>' +
      Array.from(categories.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) =>
          `<option value="${escapeHTML(value)}">${escapeHTML(label)}</option>`
        )
        .join("");

    if ([...categorySelect.options].some(option => option.value === previousValue)) {
      categorySelect.value = previousValue;
    }
  }

  function render() {
    if (!list || typeof getEvents !== "function") return;

    const meta = titleMap[folder] || titleMap.custom;

    document.title =
      `${meta.title.replace(/^[^ ]+ /, "")} | Remember a Day`;

    document.getElementById("folder-title").textContent = meta.title;
    document.getElementById("folder-label").textContent = meta.label;
    document.getElementById("folder-description").textContent = meta.desc;

    const search = searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

    const selectedCategory = categorySelect
      ? categorySelect.value
      : "all";

    const selectedMonth = monthSelect
      ? monthSelect.value
      : "all";

    let events = getEvents().filter(belongsToFolder);

    // Search occasion name and notes.
    if (search) {
      events = events.filter(event =>
        String(event.name || "").toLowerCase().includes(search) ||
        String(event.notes || "").toLowerCase().includes(search)
      );
    }

    // Category filter.
    if (selectedCategory !== "all") {
      events = events.filter(event => {
        const category = String(
          event.category || event.type || "custom"
        ).trim().toLowerCase();

        return category === selectedCategory;
      });
    }

    // Month filter uses the next occurrence, including recurring dates.
    if (selectedMonth !== "all") {
      events = events.filter(event => {
        const nextDate = getNextOccurrence(event);
        return nextDate.getMonth() === Number(selectedMonth);
      });
    }

    events.sort((a, b) =>
      getNextOccurrence(a) - getNextOccurrence(b)
    );

    if (!events.length) {
      const hasFilters =
        search || selectedCategory !== "all" || selectedMonth !== "all";

      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${folder === "birthdays" ? "🎂" : folder === "anniversaries" ? "💍" : "✨"}</div>
          <h3>${hasFilters ? "No matching occasions" : "Nothing here yet"}</h3>
          <p>${hasFilters
            ? "Try changing your search or filters."
            : "Add an occasion and it will appear in this folder with its next countdown."
          }</p>
          ${hasFilters
            ? '<button type="button" class="secondary-button" id="empty-reset-filters">Clear filters</button>'
            : '<a class="primary-button" href="add.html">＋ Add Occasion</a>'
          }
        </div>`;

      const emptyReset = document.getElementById("empty-reset-filters");
      if (emptyReset) emptyReset.addEventListener("click", resetFilters);
      return;
    }

    list.innerHTML = events.map(event => {
      const card = createEventCard(event);
      const nextDate = getNextOccurrence(event);
      let extra = "";

      if (folder === "birthdays" && event.date) {
        const born = new Date(`${event.date}T00:00:00`);

        if (!Number.isNaN(born.getTime())) {
          const age = nextDate.getFullYear() - born.getFullYear();

          if (age >= 0) {
            extra = `<p class="folder-extra">🎈 Turning ${age} on their next birthday</p>`;
          }
        }
      }

      if (folder === "anniversaries" && event.date) {
        const started = new Date(`${event.date}T00:00:00`);

        if (
          !Number.isNaN(started.getTime()) &&
          started.getFullYear() < nextDate.getFullYear()
        ) {
          extra = `<p class="folder-extra">💖 ${nextDate.getFullYear() - started.getFullYear()} years together</p>`;
        }
      }

      return card.replace(
        '<div class="event-info">',
        `<div class="event-info">${extra}`
      );
    }).join("");
  }

  function resetFilters() {
    if (searchInput) searchInput.value = "";
    if (categorySelect) categorySelect.value = "all";
    if (monthSelect) monthSelect.value = "all";
    render();
  }

  if (resetButton) {
    resetButton.addEventListener("click", resetFilters);
  }

  if (searchInput) searchInput.addEventListener("input", render);
  if (categorySelect) categorySelect.addEventListener("change", render);
  if (monthSelect) monthSelect.addEventListener("change", render);

  window.addEventListener("storage", () => {
    populateCategories();
    render();
  });

  populateCategories();
  render();
})();
