
/* Remember a Day — Settings */
(() => {
  "use strict";

  const KEY = "remember-a-day-settings";
  const THEME_KEY = "remember-a-day-theme";

  const defaults = {
    theme: "light",
    accent: "#7564d8",
    fontSize: "medium",
    compact: false,
    birthdayReminders: true,
    anniversaryReminders: true,
    customReminders: true,
    reminderDays: "1",
    dateFormat: "DD/MM/YYYY",
    weekStart: "sunday",
    timeFormat: "12",
    showYears: true,
    cardMood: "elegant",
    cardAnimations: true,
    language: "en",
    region: "en-IN"
  };

  const $ = id => document.getElementById(id);

  let prefs = readPrefs();

  function readPrefs() {
    try {
      return {
        ...defaults,
        ...JSON.parse(localStorage.getItem(KEY) || "{}")
      };
    } catch {
      return { ...defaults };
    }
  }

  function save(message = "Preferences saved on this device.") {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));

      if ($("settings-save-status")) {
        $("settings-save-status").textContent = message;
      }

      window.dispatchEvent(new CustomEvent("rad-settings-updated", {
        detail: { ...prefs }
      }));
    } catch (error) {
      console.error("Settings save failed:", error);
    }
  }

  function applyTheme() {
    const systemDark =
      window.matchMedia?.("(prefers-color-scheme: dark)").matches;

    const dark =
      prefs.theme === "dark" ||
      (prefs.theme === "system" && systemDark);

    document.body.classList.toggle("dark-mode", dark);

    localStorage.setItem(THEME_KEY, dark ? "dark" : "light");

    document.documentElement.style.colorScheme =
      dark ? "dark" : "light";
  }

function applyAppearance() {
    applyTheme();

    document.documentElement.style.setProperty("--sp-accent", prefs.accent);
    document.body.style.setProperty("--sp-accent", prefs.accent);

    const sizes = {
      small: "13px",
      medium: "15px",
      large: "18px"
    };
    const chosenSize = sizes[prefs.fontSize] || sizes.medium;
    document.documentElement.style.setProperty("--settings-font-size", chosenSize);
    document.body.style.fontSize = chosenSize;

    document.body.classList.toggle("compact", Boolean(prefs.compact));

    document.querySelectorAll(".swatches button").forEach(button => {
      const selected = button.dataset.accent === prefs.accent;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  
  function bind(id, key, kind = "value") {
    const element = $(id);
    if (!element) return;

    if (kind === "checked") {
      element.checked = Boolean(prefs[key]);
    } else {
      element.value = prefs[key];
    }

    element.addEventListener("change", () => {
      prefs[key] =
        kind === "checked" ? element.checked : element.value;

      if (["theme", "accent", "fontSize", "compact"].includes(key)) {
        applyAppearance();
      }

      save();
    });
  }

  function initAccordions() {
    document.querySelectorAll(".settings-trigger").forEach(button => {
      button.addEventListener("click", () => {
        const open =
          button.getAttribute("aria-expanded") !== "true";

        button.setAttribute("aria-expanded", String(open));

        const panel = button.nextElementSibling;

        if (panel) panel.hidden = !open;
      });
    });
  }

  function initControls() {
    [
      ["setting-theme", "theme"],
      ["setting-font-size", "fontSize"],
      ["setting-compact", "compact", "checked"],
      ["setting-birthday-reminders", "birthdayReminders", "checked"],
      ["setting-anniversary-reminders", "anniversaryReminders", "checked"],
      ["setting-custom-reminders", "customReminders", "checked"],
      ["setting-reminder-days", "reminderDays"],
      ["setting-date-format", "dateFormat"],
      ["setting-week-start", "weekStart"],
      ["setting-time-format", "timeFormat"],
      ["setting-show-years", "showYears", "checked"],
      ["setting-card-mood", "cardMood"],
      ["setting-card-animations", "cardAnimations", "checked"],
      ["setting-language", "language"],
      ["setting-region", "region"]
    ].forEach(args => bind(...args));

    document.querySelectorAll(".swatches button").forEach(button => {
      button.addEventListener("click", () => {
        prefs.accent = button.dataset.accent;
        applyAppearance();
        save("Accent colour saved.");
      });
    });

    applyAppearance();
  }

  function arrayAt(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  // Memories & Storage — kept as it was.
  function updateStats() {
    const occasions = arrayAt("remember-a-day-events");
    const memories = arrayAt("remember-a-day-memories");

    let bytes = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key) || "";
      bytes += (key.length + value.length) * 2;
    }

    const size = bytes < 1024
      ? `${bytes} B`
      : bytes < 1048576
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1048576).toFixed(2)} MB`;

    if ($("occasion-count")) {
      $("occasion-count").textContent = occasions.length;
    }

    if ($("memory-count")) {
      $("memory-count").textContent = memories.length;
    }

    if ($("storage-size")) {
      $("storage-size").textContent = size;
    }
  }

  function initBackup() {
    $("export-backup")?.addEventListener("click", () => {
      if (typeof window.exportBackup === "function") {
        window.exportBackup();
      } else {
        alert("Backup function is missing. Check js/storage.js.");
      }
    });

    $("choose-backup")?.addEventListener("click", () => {
      $("backup-file")?.click();
    });

    $("backup-file")?.addEventListener("change", event => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!confirm("Restoring replaces your current occasions and memories. Continue?")) {
        event.target.value = "";
        return;
      }

      if (typeof window.importBackup === "function") {
        window.importBackup(file);
      } else {
        alert("Restore function is missing. Check js/storage.js.");
      }
    });
  }

  function initNotifications() {
    const status = $("notification-status");
    const button = $("request-notifications");

    if (!status || !button) return;

    function update() {
      if (!("Notification" in window)) {
        status.textContent = "This browser does not support notifications.";
        button.disabled = true;
        return;
      }

      const permission = Notification.permission;

      status.textContent =
        permission === "granted"
          ? "Browser notifications are allowed."
          : permission === "denied"
            ? "Notifications are blocked in browser settings."
            : "Notifications are not enabled yet.";

      button.textContent =
        permission === "granted" ? "Enabled" : "Enable";

      button.disabled = permission !== "default";
    }

    button.addEventListener("click", async () => {
      try {
        await Notification.requestPermission();
        update();
      } catch (error) {
        console.error(error);
      }
    });

    update();
  }

  function resetPrefs() {
    if (!confirm(
      "Reset settings to defaults? Your occasions and memories will stay safe."
    )) return;

    localStorage.removeItem(KEY);
    localStorage.removeItem(THEME_KEY);

    prefs = { ...defaults };

    save("Settings reset. Your occasions and memories are safe.");
    location.reload();
  }

function initAbout() {
    const aboutCard = document.querySelector(".about-card");

    if (aboutCard) {
      aboutCard.innerHTML = `
        <span>♥</span>
        <b>Remember-a-Day</b>
        <strong>Cherish every moment &amp; milestone · Every date has a story.</strong>
        <small class="about-lead">
          Remember-a-Day is your personal space for life's people, celebrations, and meaningful moments—designed to keep every birthday, anniversary, milestone, and memory close without clutter or accounts.
        </small>
        <div class="about-grid">
          <div class="about-item">
            <b>📅 Smart Occasion &amp; Countdown Tracker</b>
            <small>Save Birthdays, Anniversaries, Trips, Holidays, Milestones, and Special Occasions with automatic yearly rollovers, live day countdowns, search, category filters, and reminder preferences.</small>
          </div>
          <div class="about-item">
            <b>🗓️ Interactive Calendar &amp; Daily Glance</b>
            <small>See Today's Moment and Special Today observances at a glance, browse upcoming events, and tap highlighted calendar dates to open keepsake day cards.</small>
          </div>
          <div class="about-item">
            <b>🪔 Festivals, Important Days &amp; Holidays</b>
            <small>Explore built-in directories of Indian festivals, national &amp; international observances, and state-wise public holidays alongside your personal dates.</small>
          </div>
          <div class="about-item">
            <b>♡ Memories, On This Day &amp; Timeline</b>
            <small>Write personal notes, attach photos, revisit memories from previous years on <em>On This Day</em>, and scroll chronologically through your story on the <em>Memory Timeline</em>.</small>
          </div>
          <div class="about-item">
            <b>🎁 Surprise Studio</b>
            <small>Turn any birthday, anniversary, festival, or special milestone into a personalised greeting card or interactive gift box in seconds.</small>
          </div>
          <div class="about-item">
            <b>🔒 Private, Local-First &amp; Customisable</b>
            <small>All your occasions, memories, and photos stay right on your device with JSON backup export and restore, light/dark themes, accent colours, text sizes, and compact layout options.</small>
          </div>
        </div>
        <div class="about-creator">
          <div class="about-creator-badge">✦</div>
          <div class="about-creator-text">
            <span>Designed &amp; Built by</span>
            <b>Patchava Uma Mahesh Ajay</b>
            <small>Crafted with care so every date and memory stays close.</small>
          </div>
        </div>
      `;
    }

    const feedbackButton = $("copy-feedback");
    if (feedbackButton) {
      const row = feedbackButton.closest(".settings-row");
      if (row) row.remove();
    }

    const versionRow = document.querySelector(".about-card")
      ?.parentElement?.querySelectorAll(".settings-row");

    if (versionRow) {
      versionRow.forEach(row => {
        if (row.textContent.toLowerCase().includes("version")) {
          const value = row.querySelector(".readonly");
          if (value) value.textContent = "Test 2";
        }
      });
    }

    $("settings-timezone") &&
      ($("settings-timezone").textContent =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "Browser default");
  }

  function initOther() {
    $("reload-app")?.addEventListener("click", () => location.reload());

    $("reset-preferences")?.addEventListener("click", resetPrefs);
    $("reset-all-settings")?.addEventListener("click", resetPrefs);
  }

  document.addEventListener("DOMContentLoaded", () => {
    initAccordions();
    initControls();
    initBackup();
    initNotifications();
    initAbout();
    initOther();
    updateStats();

    if (prefs.theme === "system" && window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)")
        .addEventListener?.("change", applyTheme);
    }
  });
})();
