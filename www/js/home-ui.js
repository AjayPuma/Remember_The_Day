/* Home dashboard interactions. Keeps the existing event/calendar engines intact. */
const MAX_HOME_COMING_UP = 4;

document.addEventListener("DOMContentLoaded", () => {
  const timeline = document.getElementById("timeline-view");
  const calendar = document.getElementById("calendar-view");
  const viewButtons = [...document.querySelectorAll("[data-view]")];
  const setView = (view) => {
    const showCalendar = view === "calendar";
    if (timeline) timeline.hidden = showCalendar;
    if (calendar) calendar.hidden = !showCalendar;
    viewButtons.forEach(button => {
      const active = button.dataset.view === view;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };
  viewButtons.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));

  const themeButton = document.getElementById("theme-toggle");
  const syncThemeButton = () => {
    if (!themeButton) return;
    const dark = document.body.classList.contains("dark-mode");
    themeButton.textContent = dark ? "☀" : "☾";
    themeButton.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  syncThemeButton();
  if (themeButton) {
    themeButton.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("remember-a-day-theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
      syncThemeButton();
    });
  }

  const filterSelect = document.getElementById("filter-events");
  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      const value = button.dataset.filter;
      if (filterSelect) filterSelect.value = value === "all" ? "all" : value;
      document.querySelectorAll("[data-filter]").forEach(item => item.classList.toggle("active", item === button));
      if (typeof showUpcomingEvents === "function") {
        const searchInput = document.getElementById("search-events");
        showUpcomingEvents(searchInput ? searchInput.value : "", filterSelect ? filterSelect.value : "all");
      }
      updateEventCount();
      arrangeUpcomingCards();
    });
  });

  const searchInput = document.getElementById("search-events");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      updateEventCount();
      arrangeUpcomingCards();
    });
  }
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      updateEventCount();
      arrangeUpcomingCards();
    });
  }

  function updateEventCount() {
    const all = typeof getEvents === "function" ? getEvents() : [];
    const query = (document.getElementById("search-events")?.value || "").trim().toLowerCase();
    const type = filterSelect?.value || "all";
    const isFiltering = Boolean(query) || type !== "all";

    const visible = all.filter(event => {
      const matchesText = !query || `${event.name || ""} ${event.type || ""} ${event.date || ""}`.toLowerCase().includes(query);
      const matchesType = type === "all" || String(event.type || "").toLowerCase() === type.toLowerCase();
      return matchesText && matchesType;
    });

    const shownCount = isFiltering ? visible.length : Math.min(visible.length, MAX_HOME_COMING_UP);
    const label = document.getElementById("event-count-label");
    if (label) {
      label.textContent = isFiltering
        ? `Showing ${shownCount} ${shownCount === 1 ? "event" : "events"}`
        : `Showing ${shownCount} of ${visible.length} ${visible.length === 1 ? "event" : "events"}`;
    }
  }
  updateEventCount();

  const todayButton = document.getElementById("today-calendar");
  if (todayButton) {
    todayButton.addEventListener("click", () => {
      if (typeof calendarDate !== "undefined" && typeof renderCalendar === "function") {
        calendarDate = new Date();
        renderCalendar();
      }
    });
  }

  renderTimeCapsule();
  arrangeUpcomingCards();
  enhanceFestivalCards();
  enhanceHeroMagic();
  enhanceEventModalMagic(); // <-- add this line right here
});


function renderTimeCapsule() {
  const container = document.getElementById("time-capsule-list");
  const section = document.getElementById("time-capsule-section");
  if (!container) return;

  let memories = [];

  try {
    const parsed = JSON.parse(localStorage.getItem("remember-a-day-memories") || "[]");
    memories = Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    memories = [];
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  const samePastDay = item => {
    if (!item || typeof item !== "object") return false;
    const rawDate = item.date || item.memoryDate || item.createdAt || "";
    const match = String(rawDate).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    return year < currentYear && month === currentMonth && day === currentDay;
  };

  const entries = memories
    .filter(samePastDay)
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .map(item => ({
      title: item.title || item.name || "A beautiful memory",
      year: String(item.date).slice(0, 4),
      photos: Array.isArray(item.photos) ? item.photos :
              Array.isArray(item.imgs) ? item.imgs :
              item.img ? [item.img] :
              item.photo ? [item.photo] : [],
      note: item.note || item.description || "",
      href: "pages/memories.html"
    }))
    .slice(0, 7);

  if (!entries.length) {
    container.innerHTML = "";
    if (section) section.hidden = true;
    return;
  }

  if (section) section.hidden = false;

  const escapeAttr = value =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const safeEscapeHTML = typeof escapeHTML === "function" ? escapeHTML : escapeAttr;

  container.innerHTML = entries.map(item => {
    const photos = item.photos.filter(photo => typeof photo === "string" && photo.trim());

    const gallery = photos.length
      ? `<div class="capsule-memory-gallery" data-count="${photos.length}">
          ${photos.map(photo =>
            `<img src="${escapeAttr(photo)}" alt="${escapeAttr(item.title)}" loading="lazy">`
          ).join("")}
          ${photos.length === 1
            ? `<div class="capsule-photo-note">
                <span>♡</span>
                <strong>A moment worth keeping</strong>
                <small>${safeEscapeHTML(item.year)}</small>
              </div>`
            : ""}
        </div>`
      : `<div class="capsule-memory-gallery no-photo">♡</div>`;

    return `
      <a class="capsule-memory" href="${item.href}">
        ${gallery}
        <div class="capsule-memory-details">
          <small>FROM ${safeEscapeHTML(item.year)}</small>
          <strong>${safeEscapeHTML(item.title)}</strong>
          ${item.note ? `<p>${safeEscapeHTML(item.note)}</p>` : ""}
          <span class="capsule-memory-link">View memory →</span>
        </div>
      </a>
    `;
  }).join("");
}


function enhanceFestivalCards() {
  const wrap = document.getElementById("upcoming-festivals");
  if (!wrap) return;

  const applyCtas = () => {
    wrap.querySelectorAll(".event-card").forEach(card => {
      if (card.querySelector(".festival-card-cta")) return;
      const title = card.querySelector("h3")?.textContent?.trim() || "Celebration";
      const link = document.createElement("a");
      link.className = "festival-card-cta";
      link.href = `pages/surprise-studio.html?occasion=${encodeURIComponent(title)}`;
      link.textContent = "✨ Make Card →";
      card.appendChild(link);
    });
  };

  applyCtas();
  new MutationObserver(applyCtas).observe(wrap, { childList: true, subtree: true });
}


function arrangeUpcomingCards() {
  const containers = [
    document.getElementById("upcoming-events"),
    document.getElementById("happening-today")
  ].filter(Boolean);

  if (!containers.length) return;

  const syncCards = () => {
    containers.forEach(container => {
      const isUpcoming = container.id === "upcoming-events";

      // Only select Coming Up cards for the 3-card limit.
      const cards = isUpcoming
        ? [...container.querySelectorAll(
            ".coming-up-event-group .event-card"
          )]
        : [...container.querySelectorAll(".event-card")];

      cards.forEach((card, idx) => {

        // Always show a maximum of 3 Coming Up cards.
        if (isUpcoming) {
          if (idx < MAX_HOME_COMING_UP) {
            card.style.removeProperty("display");
          } else {
            card.style.setProperty("display", "none", "important");
          }
        }

        // Add Send Card action.
        const actions = card.querySelector(".event-actions");

        if (!actions || actions.querySelector(".home-card-celebrate-actions")) {
          return;
        }

        const title =
          card.querySelector("h3, h2")?.textContent?.trim() || "Celebration";

        const existingBtns = actions.querySelector(".card-buttons");

        const wrap = document.createElement("div");
        wrap.className = "home-card-celebrate-actions";

        const wishLink = document.createElement("a");
        wishLink.className = "home-card-wish-link";
        wishLink.href =
          `pages/surprise-studio.html?occasion=${encodeURIComponent(title)}`;
        wishLink.textContent = "✨ Send Card";

        wrap.appendChild(wishLink);

        if (existingBtns) {
          wrap.appendChild(existingBtns);
        }

        actions.appendChild(wrap);
      });

      // Update Coming Up count badge.
      if (isUpcoming) {
        const visibleUpcoming = cards.filter(
          card => card.style.display !== "none"
        ).length;

        const comingUpHeading = [
          ...document.querySelectorAll("h1, h2, h3, h4, .section-title")
        ].find(el => /coming\s*up/i.test(el.textContent || ""));

        const comingUpBadge =
          comingUpHeading?.parentElement?.querySelector(
            ".count-badge, .section-count, span:not(:first-child)"
          ) || comingUpHeading?.querySelector("span");

        if (comingUpBadge) {
          comingUpBadge.textContent = String(visibleUpcoming);
        }
      }
    });
  };

  syncCards();

  containers.forEach(container => {
    new MutationObserver(syncCards).observe(container, {
      childList: true,
      subtree: true
    });
  });
}


function enhanceHeroMagic() {
  const specialContainer = document.getElementById("today-special-days");
  const momentContainer = document.getElementById("today-personal-events");
  if (!specialContainer && !momentContainer) return;

  function spawnSparkles(targetEl) {
    const rect = targetEl.getBoundingClientRect();
    const glyphs = ["✦", "✧", "✨", "💛", "💜"];
    for (let i = 0; i < 9; i++) {
      const s = document.createElement("span");
      s.className = "magic-sparkle";
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (20 + Math.random() * Math.max(40, rect.width - 40)) + "px";
      s.style.top = (10 + Math.random() * Math.max(20, rect.height - 20)) + "px";
      s.style.setProperty("--dx", ((Math.random() - 0.5) * 70).toFixed(0) + "px");
      s.style.setProperty("--dy", (-28 - Math.random() * 42).toFixed(0) + "px");
      targetEl.appendChild(s);
      setTimeout(() => s.remove(), 820);
    }
  }

  function resolveObservanceTargetPage(pill, labelText) {
    const rawMeta = (
      pill.dataset.section ||
      pill.dataset.source ||
      pill.dataset.type ||
      pill.getAttribute("data-section") ||
      pill.getAttribute("data-source") ||
      ""
    ).toLowerCase();

    if (rawMeta.includes("festival")) return "pages/festival.html";
    if (rawMeta.includes("holiday")) return "pages/holiday.html";
    if (rawMeta.includes("important")) return "pages/important-days.html";

    const lower = labelText.toLowerCase();
    const festivalKeywords = [
      "lohri", "sankranti", "pongal", "vasant panchami", "shivaratri",
      "eid", "holi", "good friday", "easter", "ugadi", "gudi padwa",
      "baisakhi", "vishu", "rama navami", "mahavir jayanti",
      "buddha purnima", "muharram", "rath yatra", "guru purnima",
      "raksha bandhan", "milad", "janmashtami", "ganesh chaturthi",
      "vinayaka chavithi", "samvatsari", "onam", "navaratri",
      "durga puja", "dussehra", "karwa chauth", "dhanteras",
      "diwali", "deepavali", "bhai dooj", "chhath", "guru nanak jayanti",
      "christmas"
    ];
    if (festivalKeywords.some(k => lower.includes(k))) return "pages/festival.html";

    const holidayKeywords = [
      "republic day", "independence day", "gandhi jayanti", "bhogi",
      "kanuma", "telangana formation day", "bonalu", "boxing day"
    ];
    if (holidayKeywords.some(k => lower.includes(k))) return "pages/holiday.html";

    return "pages/important-days.html";
  }

  function decorateSpecialDays() {
    if (!specialContainer) return;
    const strip = specialContainer.closest(".today-special-strip");
    const items = [...specialContainer.children];

    items.forEach((pill) => {
      if (pill.dataset.magicReady) return;
      pill.dataset.magicReady = "1";

      const clone = pill.cloneNode(true);
      clone.querySelectorAll("button").forEach(b => b.remove());
      const labelText = (clone.textContent || "").trim();
      const isBirthday = /birthday/i.test(labelText);
      const targetPage = resolveObservanceTargetPage(pill, labelText);

      pill.classList.add("magic-observance-link");
      pill.setAttribute("role", "link");
      pill.setAttribute("tabindex", "0");
      pill.title = `Open ${labelText}`;

      const goToSourcePage = () => {
        window.location.href = `${targetPage}?highlight=${encodeURIComponent(labelText)}`;
      };

      pill.addEventListener("click", goToSourcePage);
      pill.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToSourcePage();
        }
      });

      if (isBirthday && strip) {
        strip.classList.add("is-birthday-mode");
      }

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "magic-wish-btn";
      btn.title = isBirthday ? "Celebrate & send a birthday card" : "Send a sparkle for today";
      btn.textContent = isBirthday ? "🎂 Wish" : "✦ Sparkle";

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const host = strip || specialContainer;
        spawnSparkles(host);

        if (isBirthday) {
          window.location.href = `pages/surprise-studio.html?occasion=${encodeURIComponent(labelText)}`;
          return;
        }

        btn.textContent = "✨ Lit!";
        setTimeout(() => {
          btn.textContent = "✦ Sparkle";
        }, 1200);
      });

      pill.appendChild(btn);
    });
  }

  function decorateMomentCard() {
    if (!momentContainer) return;
    const card = momentContainer.querySelector(".event-card") || momentContainer.firstElementChild;
    if (!card || card.dataset.magicMomentReady) return;
    card.dataset.magicMomentReady = "1";

    const heading = card.querySelector("h3");
    const title = heading ? heading.textContent.trim() : "Today's Moment";
    const isBirthday = /birthday/i.test(card.textContent || "");
    if (isBirthday) {
      momentContainer.closest(".today-personal-highlight")?.classList.add("is-birthday-mode");
    }

    const actions = document.createElement("div");
    actions.className = "magic-moment-actions";
    actions.innerHTML = `
      <a href="pages/surprise-studio.html?occasion=${encodeURIComponent(title)}" class="magic-mini-cta">
        ${isBirthday ? "🎂 Send Birthday Card →" : "✨ Craft Card →"}
      </a>
      <a href="pages/memories.html" class="magic-mini-ghost">♡ Memories</a>
    `;
    card.appendChild(actions);
  }

  decorateSpecialDays();
  decorateMomentCard();

  const observer = new MutationObserver(() => {
    decorateSpecialDays();
    decorateMomentCard();
  });

  if (specialContainer) observer.observe(specialContainer, { childList: true, subtree: true });
  if (momentContainer) observer.observe(momentContainer, { childList: true, subtree: true });
}


/* ==========================================
   REMEMBER A DAY - MAGIC EVENT POPUP
   Optimized version
   ========================================== */

function enhanceEventModalMagic() {

  // Prevent duplicate initialization
  if (window.radMagicInitialized) return;
  window.radMagicInitialized = true;

  const glyphs = ["✦", "✧", "✨", "💛", "💜"];

  let scanTimer = null;

  /* ==========================================
     SPARKLE EFFECT
     ========================================== */

  function burstSparkles(container) {

    if (!container) return;

    const rect = container.getBoundingClientRect();

    for (let i = 0; i < 14; i++) {

      const sparkle = document.createElement("span");

      sparkle.className = "magic-sparkle";
      sparkle.textContent = glyphs[i % glyphs.length];

      sparkle.style.left =
        (24 + Math.random() * Math.max(40, rect.width - 48)) + "px";

      sparkle.style.top =
        (24 + Math.random() * Math.max(40, rect.height - 48)) + "px";

      sparkle.style.setProperty(
        "--dx",
        ((Math.random() - 0.5) * 95) + "px"
      );

      sparkle.style.setProperty(
        "--dy",
        (-35 - Math.random() * 55) + "px"
      );

      container.appendChild(sparkle);

      sparkle.addEventListener("animationend", () => {
        sparkle.remove();
      }, { once: true });

    }
  }


  /* ==========================================
     PHOTO LIGHTBOX
     ========================================== */

  function openPhotoLightbox(src, alt) {

    document.querySelectorAll(".modal-photo-lightbox")
      .forEach(el => el.remove());

    const overlay = document.createElement("div");

    overlay.className = "modal-photo-lightbox";

    const image = document.createElement("img");

    image.src = src;
    image.alt = alt || "Memory photo";

    overlay.appendChild(image);

    overlay.addEventListener("click", () => {
      overlay.remove();
    });

    document.body.appendChild(overlay);
  }


  /* ==========================================
     FIND ACTIVE POPUP
     ========================================== */

  function findActivePopupCard() {

    const candidates = document.querySelectorAll(
      "dialog[open], [role='dialog'], [class*='modal'], [class*='popup'], [class*='overlay']"
    );

    for (const el of candidates) {

      if (el.classList.contains("modal-photo-lightbox")) {
        continue;
      }

      const rect = el.getBoundingClientRect();

      if (
        rect.width < 260 ||
        rect.height < 220 ||
        getComputedStyle(el).display === "none" ||
        getComputedStyle(el).visibility === "hidden"
      ) {
        continue;
      }

      const text = el.textContent || "";

      if (
        !/edit occasion/i.test(text) &&
        !/status\s*&\s*countdown/i.test(text) &&
        !/attached photo memories/i.test(text)
      ) {
        continue;
      }

      // Avoid decorating the full-screen backdrop.
      const innerCards = el.querySelectorAll(
        "div, section, article"
      );

      let bestCard = el;
      let smallestArea = Infinity;

      for (const child of innerCards) {

        const childRect = child.getBoundingClientRect();

        if (
          childRect.width < 300 ||
          childRect.width >= window.innerWidth * 0.98 ||
          childRect.height < 220 ||
          childRect.height >= rect.height * 0.98
        ) {
          continue;
        }

        if (!/edit occasion/i.test(child.textContent || "")) {
          continue;
        }

        const area = childRect.width * childRect.height;

        if (area < smallestArea) {
          smallestArea = area;
          bestCard = child;
        }
      }

      return bestCard;
    }

    return null;
  }


  /* ==========================================
     DECORATE POPUP
     ========================================== */

  function decorateActivePopup() {

    const modal = findActivePopupCard();

    if (!modal) return;

    modal.classList.add("rad-magic-modal-card");

    // Attach lightbox only once to each image.
    modal.querySelectorAll("img").forEach(img => {

      if (img.dataset.lightboxBound === "1") return;

      img.dataset.lightboxBound = "1";

      img.addEventListener("click", (e) => {

        e.stopPropagation();

        openPhotoLightbox(img.currentSrc || img.src, img.alt);

      });

    });


    // Prevent duplicate action buttons.
    if (modal.querySelector(".modal-magic-actions")) return;

    const editBtn = [...modal.querySelectorAll("button, a")]
      .find(btn =>
        /edit occasion/i.test(btn.textContent || "")
      );

    if (!editBtn || !editBtn.parentElement) return;

    const actionBar = editBtn.parentElement;

    const titleText =
      modal.querySelector("h1, h2, h3")
        ?.textContent?.trim() || "Celebration";

    const wrap = document.createElement("div");

    wrap.className = "modal-magic-actions";


    // Sparkle button
    const sparkleBtn = document.createElement("button");

    sparkleBtn.type = "button";
    sparkleBtn.className = "modal-sparkle-btn";
    sparkleBtn.textContent = "✦ Sparkle";

    sparkleBtn.addEventListener("click", (e) => {

      e.preventDefault();
      e.stopPropagation();

      burstSparkles(modal);

    });


    // Craft Card link
    const craftLink = document.createElement("a");

    craftLink.className = "modal-craft-link";

    const isInsidePages =
      window.location.pathname.includes("/pages/");

    craftLink.href = isInsidePages
      ? `surprise-studio.html?occasion=${encodeURIComponent(titleText)}`
      : `pages/surprise-studio.html?occasion=${encodeURIComponent(titleText)}`;

    craftLink.textContent = "✨ Craft Card";


    wrap.appendChild(sparkleBtn);
    wrap.appendChild(craftLink);

    actionBar.insertBefore(wrap, editBtn);
  }


  /* ==========================================
     DEBOUNCED POPUP SCAN
     ========================================== */

  function schedulePopupScan() {

    if (scanTimer) {
      clearTimeout(scanTimer);
    }

    scanTimer = setTimeout(() => {

      scanTimer = null;

      decorateActivePopup();

    }, 100);
  }


  /* ==========================================
     CLICK DETECTION
     ========================================== */

  document.addEventListener("click", (event) => {

    if (
      event.target.closest(".modal-photo-lightbox") ||
      event.target.closest(".modal-magic-actions")
    ) {
      return;
    }

    schedulePopupScan();

  }, true);


  /* ==========================================
     LIGHTWEIGHT DOM OBSERVER
     ========================================== */

  const observer = new MutationObserver((mutations) => {

    // Only react to newly added DOM elements.
    const hasNewElements = mutations.some(mutation =>
      [...mutation.addedNodes].some(node =>
        node.nodeType === Node.ELEMENT_NODE
      )
    );

    if (hasNewElements) {
      schedulePopupScan();
    }

  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

}


// Initialize once the page is ready.
if (document.readyState === "loading") {

  document.addEventListener(
    "DOMContentLoaded",
    enhanceEventModalMagic,
    { once: true }
  );

} else {

  enhanceEventModalMagic();

}


function enhanceInteractiveCalendar() {
  const calendarDays = document.getElementById("calendar-days");
  const calendarHeader = document.querySelector(".calendar-title-group");
  if (!calendarDays) return;

  const glyphs = ["✦", "✧", "✨", "💛", "💜"];

  function burstCalSparkles(target) {
    if (!target) return;
    const rect = target.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.className = "magic-sparkle";
      s.textContent = glyphs[i % glyphs.length];
      s.style.left = (20 + Math.random() * Math.max(40, rect.width - 40)) + "px";
      s.style.top = (16 + Math.random() * Math.max(20, rect.height - 32)) + "px";
      s.style.setProperty("--dx", ((Math.random() - 0.5) * 85).toFixed(0) + "px");
      s.style.setProperty("--dy", (-30 - Math.random() * 50).toFixed(0) + "px");
      target.appendChild(s);
      setTimeout(() => s.remove(), 820);
    }
  }

  function syncCalendarBadgesAndSummary() {
    const markedDays = calendarDays.querySelectorAll(".calendar-day.has-event").length;
    if (calendarHeader) {
      let badge = calendarHeader.querySelector(".cal-month-summary-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "cal-month-summary-badge";
        calendarHeader.appendChild(badge);
      }
      badge.textContent = markedDays
        ? `✦ ${markedDays} special ${markedDays === 1 ? "day" : "days"}`
        : "✦ Quiet month";
    }
  }

function upgradePressedDaySheet() {
    document.getElementById("rad-custom-day-card")?.remove();
    document.querySelector(".rad-day-backdrop")?.remove();

    const closeBtn = [...document.querySelectorAll("button")].find(btn => {
      if (btn.closest("#rad-custom-day-card")) return false;
      const t = (btn.textContent || "").trim();
      const r = btn.getBoundingClientRect();
      return /^close$/i.test(t) && r.width > 0 && r.height > 0;
    });

    if (!closeBtn) return;

    let rawPopup = closeBtn.parentElement;
    for (let i = 0; i < 4 && rawPopup; i++) {
      const r = rawPopup.getBoundingClientRect();
      if (r.width >= 260 && r.width < window.innerWidth * 0.96 && r.height >= 170) {
        break;
      }
      rawPopup = rawPopup.parentElement;
    }

    if (!rawPopup || rawPopup.id === "calendar-view") return;

    // Extract date subtitle & occasion rows from the generated popup
    const rawLines = (rawPopup.innerText || "")
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);

    const dateLine =
      rawLines.find(line =>
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/i.test(line)
      ) || "Special Day";

    const filteredLines = rawLines.filter(line =>
      !/^remember\s*a\s*day$/i.test(line) &&
      !/^a\s*special\s*occasion$/i.test(line) &&
      !/^close$/i.test(line) &&
      line !== dateLine
    );

    const occasions = [];
    for (let i = 0; i < filteredLines.length; i += 2) {
      const title = filteredLines[i];
      const meta = filteredLines[i + 1] || "Occasion";
      if (title) occasions.push({ title, meta });
    }
    if (!occasions.length) {
      occasions.push({ title: "Special Moment", meta: "Celebration" });
    }

    // Hide the plain legacy box so only our new keepsake card is shown
    rawPopup.dataset.radHiddenPopup = "1";
    rawPopup.style.opacity = "0";
    rawPopup.style.pointerEvents = "none";

    const backdrop = document.createElement("div");
    backdrop.className = "rad-day-backdrop";

    const card = document.createElement("aside");
    card.id = "rad-custom-day-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");

    const firstTitle = occasions[0].title;
    const isBirthday = /birthday/i.test(occasions[0].meta) || /birthday/i.test(firstTitle);

    const itemsHtml = occasions
      .map(occ => {
        const icon = /birthday/i.test(occ.meta)
          ? "🎂"
          : /anniversary/i.test(occ.meta)
            ? "💍"
            : "✦";
        return `
          <div class="rad-kcard-item">
            <div class="rad-kcard-icon">${icon}</div>
            <div class="rad-kcard-info">
              <strong>${occ.title}</strong>
              <span>${occ.meta}</span>
            </div>
          </div>
        `;
      })
      .join("");

    card.innerHTML = `
      <div class="rad-kcard-banner">
        <div class="rad-kcard-top">
          <span class="rad-kcard-tag">✦ ROYAL DAY KEEPSAKE</span>
          <button type="button" class="rad-kcard-close" aria-label="Close popup">×</button>
        </div>
        <h3 class="rad-kcard-heading">${isBirthday ? "Birthday Spotlight" : "Special Day"}</h3>
        <p class="rad-kcard-date">${dateLine}</p>
      </div>
      <div class="rad-kcard-body">
        ${itemsHtml}
      </div>
      <div class="rad-kcard-footer">
        <div class="rad-kcard-actions">
          <button type="button" class="rad-kcard-sparkle">✦ Sparkle</button>
          <a href="pages/surprise-studio.html?occasion=${encodeURIComponent(firstTitle)}" class="rad-kcard-craft">✨ Craft Card</a>
        </div>
        <button type="button" class="rad-kcard-done">Close</button>
      </div>
    `;

    const dismissAll = () => {
      card.remove();
      backdrop.remove();
      if (closeBtn && document.body.contains(closeBtn)) {
        closeBtn.click();
      }
      document.querySelectorAll("[data-rad-hidden-popup='1']").forEach(el => {
        el.style.opacity = "";
        el.style.pointerEvents = "";
        delete el.dataset.radHiddenPopup;
      });
    };

    backdrop.addEventListener("click", dismissAll);
    card.querySelector(".rad-kcard-close")?.addEventListener("click", dismissAll);
    card.querySelector(".rad-kcard-done")?.addEventListener("click", dismissAll);
    card.querySelector(".rad-kcard-sparkle")?.addEventListener("click", (e) => {
      e.stopPropagation();
      burstCalSparkles(card);
    });

    document.body.appendChild(backdrop);
    document.body.appendChild(card);
  }

  syncCalendarBadgesAndSummary();
  new MutationObserver(syncCalendarBadgesAndSummary).observe(calendarDays, {
    childList: true,
    subtree: true
  });

  calendarDays.addEventListener("click", () => {
    setTimeout(upgradePressedDaySheet, 40);
    setTimeout(upgradePressedDaySheet, 140);
  });
}