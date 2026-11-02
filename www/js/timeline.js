/* Memory timeline: reads both the standalone memories list and any
   older memories attached to occasions. It does not modify saved data. */
(() => {
  const timeline = document.getElementById("timeline-list");
  const search = document.getElementById("timeline-search");
  const sort = document.getElementById("timeline-sort");
  if (!timeline || !search || !sort) return;

  const safeRead = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
      return value;
    } catch {
      return fallback;
    }
  };

  function allMemories() {
    const standalone = safeRead("remember-a-day-memories", []);
    const occasions = safeRead("remember-a-day-events", []);
    const out = [];

    if (Array.isArray(standalone)) {
      standalone.forEach(m => out.push({
        id: `saved-${m.id}`,
        title: m.title || "Memory",
        date: m.date || "",
        note: m.note || m.text || "",
        photos: Array.isArray(m.photos) ? m.photos :
          Array.isArray(m.imgs) ? m.imgs : (m.img ? [m.img] : []),
        source: "Saved memory"
      }));
    }

    if (Array.isArray(occasions)) {
      occasions.forEach(event => {
        (Array.isArray(event.mem) ? event.mem : []).forEach(m => out.push({
          id: `occasion-${event.id}-${m.id || m.date}`,
          title: event.name || "Occasion memory",
          date: m.date || "",
          note: m.text || m.note || "",
          photos: Array.isArray(m.imgs) ? m.imgs :
            Array.isArray(m.photos) ? m.photos : (m.img ? [m.img] : []),
          source: "Occasion"
        }));
      });
    }
    return out;
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    const direction = sort.value === "newest" ? -1 : 1;
    const memories = allMemories()
      .filter(m => `${m.title} ${m.note} ${m.source}`.toLowerCase().includes(query))
      .sort((a, b) => direction * String(a.date).localeCompare(String(b.date)));

    timeline.replaceChildren();

    if (!memories.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "No memories found yet. Save one from the Memories page.";
      timeline.append(empty);
      return;
    }

    memories.forEach(memory => {
      const card = document.createElement("article");
      card.className = "timeline-card";

      const date = document.createElement("div");
      date.className = "timeline-date";
      date.textContent = memory.date || "Date not set";

      const title = document.createElement("h3");
      title.textContent = memory.title;

      const source = document.createElement("small");
      source.textContent = memory.source;

      const note = document.createElement("p");
      note.textContent = memory.note;

      const photos = document.createElement("div");
      photos.className = "timeline-photos";
      memory.photos.forEach((src, index) => {
        if (typeof src !== "string" || !src) return;
        const img = document.createElement("img");
        img.src = src;
        img.alt = `Photo ${index + 1} for ${memory.title}`;
        img.loading = "lazy";
        photos.append(img);
      });

      card.append(date, title, source, note, photos);
      timeline.append(card);
    });
  }

  search.addEventListener("input", render);
  sort.addEventListener("change", render);
  window.addEventListener("storage", render);
  render();
})();
