(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const cfg = window.REMEMBER_SUPABASE || {};
  const configured = () => Boolean(cfg.url && cfg.anonKey);
  const VAULT_KEY = "remember_a_day_creations_v3";
  const SHARE_BASE_URL =
  "https://ajaypuma.github.io/Remember_The_Day/pages/surprise-studio.html";

  const headers = () => ({
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    "Content-Type": "application/json"
  });

  const templates = [
    ["Midnight Gold", "birthday", "#17213e", "#f7d88a", "#fff7df", "✦", "HAPPY BIRTHDAY"],
    ["Royal Anniversary", "anniversary", "#1b243b", "#e8c474", "#fff9eb", "🥂", "HAPPY ANNIVERSARY"],
    ["Velvet & Champagne", "anniversary", "#4a1525", "#f5d08a", "#fff6eb", "💍", "YEARS OF LOVE"],
    ["Forever & Always", "anniversary", "#e8e3ef", "#59436f", "#2d1f3d", "∞", "FOREVER & ALWAYS"],
    ["Golden Jubilee", "anniversary", "#f2e1bc", "#855a2b", "#452c12", "👑", "GOLDEN MEMORIES"],
    ["Blush Celebration", "birthday", "#ffe9e5", "#a83e68", "#571c34", "🎂", "HAPPY BIRTHDAY"],
    ["Lavender Bloom", "birthday", "#f1e9f4", "#755276", "#3b233c", "✿", "A BEAUTIFUL DAY"],
    ["Floral Garden", "birthday", "#e9e4d8", "#53664d", "#273323", "✿", "BLOOM & SHINE"],
    ["Confetti Pop", "birthday", "#fff0f1", "#c23e67", "#5c182f", "✦", "LET'S CELEBRATE"],
    ["Starlight Wish", "birthday", "#1c2946", "#d8b66e", "#fff8e8", "✦", "MAKE A WISH"],
    ["Love Letter", "love", "#f8e5e5", "#a93c55", "#541927", "♡", "WITH ALL MY LOVE"],
    ["Rose Romance", "love", "#efd7d9", "#7d3547", "#471a25", "🌹", "YOU ARE MY WORLD"],
    ["Sweetheart Note", "love", "#fce6e9", "#ad4b65", "#592030", "♥", "ONLY FOR YOU"],
    ["Moon & Stars", "love", "#162238", "#f3cf82", "#fff8e6", "☾", "LOVE YOU TO THE MOON"],
    ["Best Human Ever", "friendship", "#e5f0e8", "#3d6954", "#1d382b", "☀", "BEST FRIEND"],
    ["Little Joys", "friendship", "#f6edce", "#7a6332", "#423417", "☼", "GOOD TIMES"],
    ["Cheers to You", "friendship", "#e1edf4", "#365d78", "#1a3345", "✦", "CHEERS TO YOU"],
    ["Partner in Crime", "friendship", "#fdf0e1", "#b85d38", "#592814", "⚡", "ALWAYS GOT YOU"],
    ["You Did It", "celebration", "#e4eafa", "#3e5289", "#1d294a", "✦", "CONGRATULATIONS"],
    ["New Beginnings", "celebration", "#f7ead8", "#96663d", "#4a3019", "✧", "NEW CHAPTER"],
    ["A Little Sunshine", "celebration", "#f9edc9", "#8b6728", "#473310", "☀", "YOU DESERVE JOY"],
    ["Emerald Prestige", "celebration", "#163b30", "#e6c373", "#f7f3e8", "✦", "PROUD OF YOU"],
    ["Minimal Editorial", "birthday", "#f4f0e8", "#34485c", "#19365b", "·", "A SPECIAL WISH"],
    ["The Grand Gala", "anniversary", "#141d33", "#f5d384", "#fff9eb", "✦", "A DAY TO REMEMBER"],
    // --- 12 New Pleasant, Refined & Modern Cards (ids 24..35) ---
    ["Serene Morning", "birthday", "#f7f4ed", "#6b8299", "#243447", "☁", "WARM WISHES"],
    ["Champagne Silk", "anniversary", "#fbf6ee", "#b5895a", "#4a3520", "🥂", "TOGETHER STILL"],
    ["Velvet Twilight", "love", "#231d3d", "#e4b876", "#f8f4ff", "✦", "ALWAYS YOU"],
    ["Matcha & Linen", "friendship", "#eef2ea", "#5c7650", "#263620", "🌿", "PURE JOY"],
    ["Apricot Glow", "birthday", "#fff1e6", "#d47a54", "#5c2b18", "☀", "BRIGHT DAY AHEAD"],
    ["Silvered Mist", "celebration", "#eef2f6", "#5c6f82", "#1e2b38", "✧", "WELL DONE"],
    ["Rosewood Letter", "love", "#f6e7e9", "#9e4b5c", "#4d1d27", "✉", "A SOFT NOTE"],
    ["Warm Sand & Gold", "anniversary", "#f4ece1", "#a67c44", "#3d2c16", "✦", "YEARS OF GRACE"],
    ["Skyline Dusk", "celebration", "#222c4a", "#9fb4e8", "#f3f6ff", "☾", "NEW HORIZON"],
    ["Peony Pastel", "birthday", "#fdf0f4", "#c46b8a", "#592336", "❀", "SWEETEST DAY"],
    ["Cedar & Cream", "friendship", "#f6f1ea", "#8a684e", "#3b2a1e", "☕", "ALWAYS IN MY CORNER"],
    ["Aurora Pearl", "love", "#f3f0fc", "#7d63b5", "#2c2047", "✧", "MY FAVOURITE PLACE"]
  ].map((t, i) => ({
    id: i, name: t[0], category: t[1], bg: t[2], deco: t[3], ink: t[4], symbol: t[5], title: t[6]
  }));

  const wishPresets = {
    birthday: { heading: "Happy Birthday!", message: "Wishing you a day filled with love, laughter and unforgettable magic." },
    anniversary: { heading: "Happy Anniversary!", message: "Another year of laughter, late-night talks, and building favourite memories together." },
    midnight: { heading: "A Midnight Wish ✨", message: "Counting down every second just to celebrate you first. You deserve the world!" },
    forever: { heading: "Forever & Always", message: "Through every season and every chapter, I'm grateful to walk beside you." }
  };

  let selected = templates[0];
  let cardPhotos = [];
  let boxPhotos = [];
  let memoryPhotos = [];
  let cardStickers = [];
  let activeStickerIdx = -1;
  let isCardFlipped = false;
  let soundEnabled = true;
  let currentLayer = 1;
  let boxStep = 0;
  let flipIndex = 0;
  let flipTimer = null;
  let mediaRecorder = null;
  let recordedChunks = [];
  let recordedAudioData = "";
  let activeMusicBlobUrl = "";

  const escapeHTML = v => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);

  // ---------------- SOUND & FX ----------------

  function playMagicSound(type = "chime") {
    if (!soundEnabled) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const now = ctx.currentTime;
      const notes =
        type === "untie" ? [523.25, 659.25, 783.99] :
        type === "open" ? [523.25, 659.25, 783.99, 1046.5, 1318.5] :
        type === "melody" ? [523.25, 523.25, 587.33, 523.25, 698.46, 659.25, 523.25, 587.33, 783.99] :
        [659.25, 880];

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type === "melody" ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + i * (type === "melody" ? 0.3 : 0.08));
        gain.gain.setValueAtTime(0.001, now + i * (type === "melody" ? 0.3 : 0.08));
        gain.gain.exponentialRampToValueAtTime(0.13, now + i * (type === "melody" ? 0.3 : 0.08) + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * (type === "melody" ? 0.3 : 0.08) + 0.42);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * (type === "melody" ? 0.3 : 0.08));
        osc.stop(now + i * (type === "melody" ? 0.3 : 0.08) + 0.45);
      });
    } catch {}
  }

  function launchFX(mode = "fireworks") {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = $("fx-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = ["#ff7048", "#f7d88a", "#e95d7b", "#38bdf8", "#a78bfa", "#34d399"];
    const particles = [];

    if (mode === "fireworks") {
      [[0.3, 0.35], [0.7, 0.32], [0.5, 0.44]].forEach(([bx, by]) => {
        for (let i = 0; i < 42; i++) {
          const ang = (Math.PI * 2 * i) / 42;
          const spd = 2.5 + Math.random() * 7;
          particles.push({
            x: canvas.width * bx, y: canvas.height * by,
            vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
            size: 5, color: colors[i % colors.length], shape: "circle", life: 1
          });
        }
      });
    } else if (mode === "hearts") {
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: canvas.width * (0.2 + Math.random() * 0.6), y: canvas.height * 0.65,
          vx: (Math.random() - 0.5) * 6, vy: -4 - Math.random() * 6,
          size: 20, emoji: i % 3 === 0 ? "✨" : "💖", shape: "emoji", life: 1
        });
      }
    } else {
      for (let i = 0; i < 95; i++) {
        particles.push({
          x: canvas.width * (0.3 + Math.random() * 0.4), y: canvas.height * 0.45,
          vx: (Math.random() - 0.5) * 14, vy: -7 - Math.random() * 10,
          size: 8, color: colors[i % colors.length], rot: Math.random() * 6, shape: "rect", life: 1
        });
      }
    }

    let raf;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.shape !== "emoji") p.vy += 0.16;
        p.life -= 0.013;
        if (p.life > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.life);
          if (p.shape === "emoji") {
            ctx.font = `${p.size}px serif`;
            ctx.fillText(p.emoji, p.x, p.y);
          } else if (p.shape === "circle") {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot += 0.15);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          }
          ctx.restore();
        }
      }
      if (alive) raf = requestAnimationFrame(tick);
      else { ctx.clearRect(0, 0, canvas.width, canvas.height); cancelAnimationFrame(raf); }
    };
    tick();
  }

  // ---------------- VAULT + JSON + CLOUD SYNC ----------------

  function readVault() {
    try { return JSON.parse(localStorage.getItem(VAULT_KEY) || "[]"); }
    catch { return []; }
  }

  function writeVault(items) {
    try { localStorage.setItem(VAULT_KEY, JSON.stringify(items.slice(0, 40))); } catch {}
    updateVaultBadge();
  }

  function saveToVault(kind, title, link) {
    const items = readVault();
    items.unshift({ kind, title: title || "Surprise", link: link || "", date: new Date().toLocaleDateString() });
    writeVault(items);
  }

  function updateVaultBadge() {
    const el = $("creations-count");
    if (el) el.textContent = String(readVault().length);
  }

  function renderVaultModal() {
    const items = readVault();
    $("creations-list").innerHTML = items.length ? items.map((item, i) => `
      <div class="creation-item">
        <div>
          <small>${escapeHTML(item.kind)} · ${escapeHTML(item.date)}</small>
          <strong>${escapeHTML(item.title)}</strong>
        </div>
        <div class="creation-actions">
          ${item.link ? `<a class="creation-btn" href="${escapeHTML(item.link)}" target="_blank" rel="noopener">Open</a>` : ""}
          <button type="button" class="creation-btn del" data-del="${i}">✕</button>
        </div>
      </div>
    `).join("") : `<p class="field-hint">No saved creations yet.</p>`;

    $("creations-list").querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = readVault();
        next.splice(Number(btn.dataset.del), 1);
        writeVault(next);
        renderVaultModal();
      });
    });
  }

  $("export-vault-json").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(readVault(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "remember-a-day-creations.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  });

  $("import-vault-json").addEventListener("change", async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (Array.isArray(imported)) {
        writeVault([...imported, ...readVault()]);
        renderVaultModal();
      }
    } catch { alert("Invalid JSON file."); }
  });

  $("sync-vault-cloud").addEventListener("click", async () => {
    if (!configured()) { alert("Supabase is not configured yet."); return; }
    try {
      const res = await fetch(`${cfg.url}/rest/v1/surprises?select=id,kind,title,created_at&order=created_at.desc&limit=20`, { headers: headers() });
      if (!res.ok) throw new Error(await res.text());
      const rows = await res.json();
      const cloudItems = rows.map(r => ({
        kind: `cloud:${r.kind}`,
        title: r.title || "Cloud Surprise",
link: `${SHARE_BASE_URL}?surprise=${encodeURIComponent(r.id)}`,        date: new Date(r.created_at || Date.now()).toLocaleDateString()
      }));
      writeVault([...cloudItems, ...readVault()]);
      renderVaultModal();
      alert(`Synced ${cloudItems.length} creations from cloud.`);
    } catch (err) {
      alert("Cloud sync failed: " + err.message);
    }
  });

  // ---------------- TEMPLATES ----------------

  function renderTemplates() {
    const filter = document.querySelector(".filter-chip.active")?.dataset.filter || "all";
    const q = ($("template-search").value || "").toLowerCase().trim();

    $("template-grid").innerHTML = templates
      .filter(t => (filter === "all" || t.category === filter) && (t.name + " " + t.category + " " + t.title).toLowerCase().includes(q))
      .map(t => `
        <button type="button" class="template-card ${selected.id === t.id ? "selected" : ""}" data-id="${t.id}">
          <div class="template-art" style="--art-bg:${t.bg};--art-deco:${t.deco};--art-ink:${t.ink}">
            <span class="art-kicker">${escapeHTML(t.category)}</span>
            <span class="art-flower">${t.symbol}</span>
            <strong class="art-title">${escapeHTML(t.title)}</strong>
            <span class="art-to">TAP TO SELECT</span>
          </div>
          <span class="template-name">${escapeHTML(t.name)}</span>
        </button>
      `).join("");

    document.querySelectorAll(".template-card").forEach(btn => {
      btn.addEventListener("click", () => {
        selected = templates[Number(btn.dataset.id)];
        renderTemplates();
        renderCardPreview();
        playMagicSound("chime");
      });
    });
  }

  // ---------------- CARD BUILDER, SCRATCH & STICKERS ----------------

  function palette(t) {
    const val = $("card-palette").value;
    const map = {
      navy: ["#17213e", "#f7d88a", "#fff7e5"],
      rose: ["#f9dfe4", "#a83e62", "#591d32"],
      crimson: ["#4d1120", "#f5cf84", "#fff6eb"],
      emerald: ["#143b2f", "#e8c474", "#f8f4e8"],
      lavender: ["#ede2f5", "#724e80", "#382142"]
    };
    const base = val === "original" ? [t.bg, t.deco, t.ink] : map[val];
    if ($("use-custom-colors").checked) {
      return [base[0], $("card-custom-accent").value, $("card-custom-ink").value];
    }
    return base;
  }

  function computeDayCounter(dateStr) {
    if (!$("show-day-counter").checked || !dateStr) return "";
    const target = new Date(dateStr + "T00:00:00");
    if (Number.isNaN(target.getTime())) return "";
    const diffDays = Math.round((Date.now() - target.getTime()) / 86400000);
    const absDays = Math.abs(diffDays);
    const years = (absDays / 365.25).toFixed(1);
    return diffDays >= 0
      ? `${absDays.toLocaleString()} Days (${years} yrs)`
      : `${absDays.toLocaleString()} Days To Go`;
  }

  function cardData() {
    return {
      kind: "card",
      template: selected.id,
      title: $("card-heading").value || selected.title,
      to: $("to-name").value,
      from: $("from-name").value,
      message: $("card-message").value,
      backNote: $("card-back-note").value,
      scratchText: $("card-scratch-text").value,
      showCounter: $("show-day-counter").checked,
      date: $("card-date").value,
      palette: $("card-palette").value,
      customColors: $("use-custom-colors").checked,
      customInk: $("card-custom-ink").value,
      customAccent: $("card-custom-accent").value,
      font: $("card-font").value,
      effect: $("card-effect").value,
      stickers: cardStickers,
      photos: cardPhotos
    };
  }

  function buildCardHTML(d, interactive = true) {
    const tpl = templates[d.template] || selected;
    const [bg, accent, ink] = palette(tpl);
    const single = (d.photos || []).length === 1 ? "single" : "";
    const counterText = computeDayCounter(d.date);

    const stickersHtml = (d.stickers || []).map((s, idx) => `
      <span class="card-sticker-item"
        ${interactive ? `data-sidx="${idx}"` : ""}
        style="left:${s.x}%;top:${s.y}%;--rot:${s.rot || 0}deg;--sc:${s.scale || 1};font-size:${s.src ? "0px" : "28px"}">
        ${s.src ? `<img src="${s.src}" alt="Sticker">` : escapeHTML(s.emoji)}
      </span>
    `).join("");

    const scratchHtml = d.scratchText ? `
      <div class="scratch-box">
        <span>${escapeHTML(d.scratchText)}</span>
        <canvas class="scratch-canvas" width="290" height="58"></canvas>
      </div>
    ` : "";

    return `
      <div class="card-flip-wrapper ${isCardFlipped && interactive ? "flipped" : ""}">
        <div class="card-face effect-${escapeHTML(d.effect || "foil")}" style="background:${bg};color:${ink}">
          ${stickersHtml}
          <span class="card-symbols" style="color:${accent}">${escapeHTML(tpl.symbol)} ✦ ${escapeHTML(tpl.symbol)}</span>
          <small class="card-category" style="color:${accent}">${escapeHTML(tpl.category)}</small>
          <h2 class="card-title" style="color:${ink};font-family:${d.font}">${escapeHTML(d.title)}</h2>
          <p class="card-to">${d.to ? "For " + escapeHTML(d.to) : "For someone special"}</p>
          ${counterText ? `<span class="day-counter-badge">${escapeHTML(counterText)}</span>` : ""}
          <div class="card-render-photos ${single}">
            ${(d.photos || []).map(src => `<img src="${src}" alt="Card photo">`).join("")}
          </div>
          <p class="card-message">${escapeHTML(d.message)}</p>
          ${scratchHtml}
          <strong style="font-family:${d.font}">${d.from ? "With love, " + escapeHTML(d.from) : "With warm wishes"}</strong>
        </div>
        <div class="card-face back-face" style="background:${bg};color:${ink}">
          <small class="card-category" style="color:${accent}">INNER KEEPSAKE NOTE</small>
          <h3 style="font-family:${d.font};margin:0">${escapeHTML(d.title)}</h3>
          <p class="card-message">${escapeHTML(d.backNote || "Every moment shared with you is a memory worth keeping forever.")}</p>
          <small style="color:${accent}">${escapeHTML(d.date || "")}</small>
        </div>
      </div>
    `;
  }

  function initScratchCanvas(container) {
    const c = container.querySelector(".scratch-canvas");
    if (!c) return;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, c.width, c.height);
    grad.addColorStop(0, "#d9b66e");
    grad.addColorStop(0.5, "#fff2be");
    grad.addColorStop(1, "#c79b46");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#19365b";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("✦ RUB / SCRATCH TO REVEAL ✦", c.width / 2, c.height / 2 + 4);

    let rubbing = false;
    const scratchAt = ev => {
      if (!rubbing) return;
      ev.preventDefault();
      const pt = ev.touches ? ev.touches[0] : ev;
      const rect = c.getBoundingClientRect();
      const x = ((pt.clientX - rect.left) / rect.width) * c.width;
      const y = ((pt.clientY - rect.top) / rect.height) * c.height;
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(x, y, 16, 0, Math.PI * 2);
      ctx.fill();
    };

    c.addEventListener("mousedown", e => { rubbing = true; scratchAt(e); });
    c.addEventListener("mousemove", scratchAt);
    window.addEventListener("mouseup", () => { rubbing = false; });
    c.addEventListener("touchstart", e => { rubbing = true; scratchAt(e); }, { passive: false });
    c.addEventListener("touchmove", scratchAt, { passive: false });
    window.addEventListener("touchend", () => { rubbing = false; });
  }

  function bindStickers(container) {
    const face = container.querySelector(".card-face");
    if (!face) return;
    face.querySelectorAll(".card-sticker-item").forEach(el => {
      const idx = Number(el.dataset.sidx);
      const start = ev => {
        ev.preventDefault();
        ev.stopPropagation();
        activeStickerIdx = idx;
        const move = mEv => {
          const pt = mEv.touches ? mEv.touches[0] : mEv;
          const r = face.getBoundingClientRect();
          cardStickers[idx].x = Math.max(8, Math.min(92, Math.round(((pt.clientX - r.left) / r.width) * 100)));
          cardStickers[idx].y = Math.max(8, Math.min(92, Math.round(((pt.clientY - r.top) / r.height) * 100)));
          el.style.left = `${cardStickers[idx].x}%`;
          el.style.top = `${cardStickers[idx].y}%`;
        };
        const stop = () => {
          window.removeEventListener("mousemove", move);
          window.removeEventListener("mouseup", stop);
          window.removeEventListener("touchmove", move);
          window.removeEventListener("touchend", stop);
        };
        window.addEventListener("mousemove", move);
        window.addEventListener("mouseup", stop);
        window.addEventListener("touchmove", move, { passive: false });
        window.addEventListener("touchend", stop);
      };
      el.addEventListener("mousedown", start);
      el.addEventListener("touchstart", start, { passive: false });
    });
  }

  function renderCardPreview() {
    const wrap = $("card-live-preview");
    wrap.innerHTML = buildCardHTML(cardData(), true);
    bindStickers(wrap);
    initScratchCanvas(wrap);
    if ($("include-designed-card")?.checked) updateEmbeddedBoxCard();
  }

  // ---------------- GIFT BOX: NESTED, HOLD-TO-CHARGE, LOCK & CAKE ----------------

  function updateEmbeddedBoxCard() {
    const slot = $("embedded-card-slot");
    if (!slot) return;
    if ($("include-designed-card").checked) {
      slot.hidden = false;
      slot.innerHTML = buildCardHTML(cardData(), false);
    } else {
      slot.hidden = true;
      slot.innerHTML = "";
    }
  }

  function syncBoxLocksAndCake() {
    const totalLayers = Number($("box-layers").value || 1);
    $("box-layer-badge").textContent = `BOX ${currentLayer}/${totalLayers}`;
    $("birthday-cake-widget").hidden = !$("include-birthday-cake").checked;
    $("charge-meter-wrap").hidden = $("box-mechanic").value !== "hold";

    const lockEnabled = $("enable-box-lock").checked;
    const passcode = ($("box-lock-passcode").value || "").trim();
    if (lockEnabled && passcode && boxStep === 0) {
      $("box-lock-gate").hidden = false;
      $("box-lock-hint-display").textContent = $("box-lock-hint").value || "Enter secret answer to unlock";
    } else {
      $("box-lock-gate").hidden = true;
    }
  }

  function advanceGiftStep() {
    if (!$("box-lock-gate").hidden) return;
    const totalLayers = Number($("box-layers").value || 1);

    if (boxStep === 0) {
      boxStep = 1;
      $("giftbox-stage").dataset.step = "1";
      $("giftbox-hint").textContent = `Step 2: Tap to open Box ${currentLayer} of ${totalLayers} ✨`;
      playMagicSound("untie");
    } else if (boxStep === 1) {
      if (currentLayer < totalLayers) {
        currentLayer++;
        boxStep = 0;
        $("giftbox-stage").dataset.step = "0";
        $("box-layer-badge").textContent = `BOX ${currentLayer}/${totalLayers}`;
        $("giftbox-hint").textContent = `Smaller box inside! Untie Box ${currentLayer} of ${totalLayers} 🎀`;
        playMagicSound("untie");
        launchFX("confetti");
      } else {
        boxStep = 2;
        $("giftbox-stage").dataset.step = "2";
        $("giftbox-hint").hidden = true;
        $("giftbox-reveal").hidden = false;
        updateEmbeddedBoxCard();
        playMagicSound("open");
        launchFX($("box-fx-type").value);
        $("giftbox-audio-player").play?.().catch(() => {});
      }
    }
  }

  function resetGiftBox() {
    currentLayer = 1;
    boxStep = 0;
    $("charge-meter-fill").style.width = "0%";
    $("giftbox-stage").dataset.step = "0";
    $("giftbox-reveal").hidden = true;
    $("giftbox-hint").hidden = false;
    document.querySelectorAll(".candle").forEach(c => c.classList.remove("blown"));
    syncBoxLocksAndCake();
    $("giftbox-hint").textContent = $("box-to").value
      ? `Step 1: A surprise for ${$("box-to").value} — tap to untie 🎀`
      : "Step 1: Tap or hold the bow to begin 🎀";
  }

  // Hold-to-charge mechanic
  let chargeInterval = null;
  let chargePct = 0;

  function startCharge() {
    if ($("box-mechanic").value !== "hold" || !$("box-lock-gate").hidden) return;
    clearInterval(chargeInterval);
    chargePct = 0;
    chargeInterval = setInterval(() => {
      chargePct += 5;
      $("charge-meter-fill").style.width = `${Math.min(100, chargePct)}%`;
      if (chargePct >= 100) {
        clearInterval(chargeInterval);
        chargePct = 0;
        $("charge-meter-fill").style.width = "0%";
        advanceGiftStep();
      }
    }, 45);
  }

  function cancelCharge() {
    clearInterval(chargeInterval);
    if ($("box-mechanic").value === "hold" && chargePct < 100) {
      chargePct = 0;
      $("charge-meter-fill").style.width = "0%";
    }
  }

  // Cake candles & Mic blow
  function blowAllCandles() {
    document.querySelectorAll(".candle").forEach(c => c.classList.add("blown"));
    playMagicSound("open");
    launchFX("fireworks");
  }

  document.querySelectorAll(".candle").forEach(c => {
    c.addEventListener("click", () => {
      c.classList.add("blown");
      playMagicSound("chime");
    });
  });
  $("blow-candles-btn").addEventListener("click", blowAllCandles);

  $("mic-blow-btn").addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      $("mic-blow-btn").textContent = "🎤 Blow now...";

      const check = setInterval(() => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        if (avg > 55) {
          clearInterval(check);
          stream.getTracks().forEach(t => t.stop());
          ctx.close();
          blowAllCandles();
          $("mic-blow-btn").textContent = "🎤 Blow Into Mic";
        }
      }, 100);
      setTimeout(() => {
        clearInterval(check);
        stream.getTracks().forEach(t => t.stop());
        $("mic-blow-btn").textContent = "🎤 Blow Into Mic";
      }, 6000);
    } catch {
      blowAllCandles();
    }
  });

  // Voice Note Recorder
  $("record-voice-btn").addEventListener("click", async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onload = () => {
            recordedAudioData = reader.result;
            const player = $("giftbox-audio-player");
            player.src = recordedAudioData;
            player.hidden = false;
            $("voice-status").textContent = "Voice note recorded and ready!";
          };
          reader.readAsDataURL(blob);
          stream.getTracks().forEach(t => t.stop());
        };
        mediaRecorder.start();
        $("record-voice-btn").textContent = "⏹ Stop Recording";
        $("voice-status").textContent = "Recording voice note...";
      } catch {
        $("voice-status").textContent = "Microphone permission unavailable; upload an MP3 instead.";
      }
    } else {
      mediaRecorder.stop();
      $("record-voice-btn").textContent = "🎙️ Record Voice";
    }
  });

  // ---------------- IMAGE UPLOAD & PNG EXPORT ----------------

  function loadImages(input, max, callback, status) {
    const files = [...(input.files || [])].slice(0, max);
    Promise.all(files.map(file => new Promise(resolve => {
      if (!file.type.startsWith("image/")) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, 1400 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.84));
        };
        img.onerror = () => resolve(null);
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }))).then(list => {
      callback(list.filter(Boolean));
      if (status) status.textContent = `${list.filter(Boolean).length} photo(s) ready.`;
    });
  }

  function loadCanvasImg(src) {
    return new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = src;
    });
  }

  function roundedImg(ctx, img, x, y, w, h, r = 16) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.clip();
    const s = Math.max(w / img.width, h / img.height);
    ctx.drawImage(img, x + (w - img.width * s) / 2, y + (h - img.height * s) / 2, img.width * s, img.height * s);
    ctx.restore();
  }

  function wrapText(ctx, text, x, y, maxW, lh, maxLines = 5) {
    const words = String(text || "").split(/\s+/);
    let line = "", lines = 0;
    for (const w of words) {
      const test = line ? `${line} ${w}` : w;
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, y);
        y += lh; line = w; lines++;
        if (lines >= maxLines) return y;
      } else line = test;
    }
    if (line && lines < maxLines) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }

  async function renderCardCanvas() {
    const isStory = $("card-export-ratio").value === "story";
    const W = isStory ? 1080 : 1200;
    const H = isStory ? 1920 : 1200;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const d = cardData();
    const [bg, accent, ink] = palette(selected);

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.font = "64px Georgia";
    ctx.fillText(`${selected.symbol} ✦ ${selected.symbol}`, W / 2, isStory ? 220 : 145);

    ctx.font = "bold 22px Arial";
    ctx.fillText(selected.category.toUpperCase(), W / 2, isStory ? 290 : 210);

    ctx.fillStyle = ink;
    ctx.font = `bold 64px ${d.font}`;
    wrapText(ctx, d.title, W / 2, isStory ? 390 : 315, W - 180, 76, 2);

    ctx.font = "34px Arial";
    ctx.fillText(d.to ? `For ${d.to}` : "For someone special", W / 2, isStory ? 520 : 440);

    const imgs = await Promise.all(cardPhotos.map(loadCanvasImg));
    const photoTop = isStory ? 580 : 490;
    if (imgs.length === 1) {
      roundedImg(ctx, imgs[0], (W - 420) / 2, photoTop, 420, 260);
    } else if (imgs.length > 1) {
      const p = [[W / 2 - 330, photoTop], [W / 2 + 30, photoTop], [W / 2 - 330, photoTop + 200], [W / 2 + 30, photoTop + 200]];
      imgs.forEach((im, i) => roundedImg(ctx, im, p[i][0], p[i][1], 300, 175));
    }

    ctx.fillStyle = ink;
    ctx.font = "30px Arial";
    wrapText(ctx, d.message, W / 2, isStory ? 1120 : 840, W - 220, 44, 4);

    ctx.font = `bold 32px ${d.font}`;
    ctx.fillText(d.from ? `With love, ${d.from}` : "With warm wishes", W / 2, H - 110);

    for (const st of cardStickers) {
      const sx = (st.x / 100) * W;
      const sy = (st.y / 100) * H;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(((st.rot || 0) * Math.PI) / 180);
      const sc = st.scale || 1;
      if (st.src) {
        const sImg = await loadCanvasImg(st.src);
        ctx.drawImage(sImg, -48 * sc, -48 * sc, 96 * sc, 96 * sc);
      } else {
        ctx.font = `${Math.round(74 * sc)}px serif`;
        ctx.fillText(st.emoji, 0, 24 * sc);
      }
      ctx.restore();
    }

    return canvas;
  }

  async function downloadCanvas(canvas, name) {
    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  // ---------------- SUPABASE SHARE + QR CODE ----------------

  function renderQRBox(targetEl, link) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(link)}`;
    targetEl.hidden = false;
    targetEl.innerHTML = `
      <div><strong>Share Link Ready:</strong> <a href="${link}" target="_blank" rel="noopener">Open Surprise ↗</a></div>
      <button type="button" class="wish-chip" id="copy-link-btn">Copy Link</button>
      <img class="qr-img" src="${qrUrl}" alt="Scan QR code to open surprise">
      <small class="field-hint">Scan QR code on a gift or card</small>
    `;
    targetEl.querySelector("#copy-link-btn").addEventListener("click", async () => {
      await navigator.clipboard.writeText(link);
      targetEl.querySelector("#copy-link-btn").textContent = "Copied ✓";
    });
  }

  async function uploadBytes(bytes, mime, ext) {
    const path = `${crypto.randomUUID()}.${ext}`;
    const res = await fetch(`${cfg.url}/storage/v1/object/${cfg.bucket}/${path}`, {
      method: "POST",
      headers: { apikey: cfg.anonKey, Authorization: `Bearer ${cfg.anonKey}`, "Content-Type": mime, "x-upsert": "false" },
      body: bytes
    });
    if (!res.ok) throw new Error(await res.text());
    return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${path}`;
  }

  async function uploadDataUrl(dataUrl) {
    const parts = dataUrl.split(",");
    const mime = (parts[0].match(/data:(.*?);/) || [])[1] || "image/jpeg";
    const bytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
    return uploadBytes(bytes, mime, mime.split("/")[1].replace("jpeg", "jpg"));
  }

  function fileToDataUrl(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function createSurprise(kind, payload, statusEl, resultBox) {
    if (!configured()) {
      statusEl.textContent = "Supabase online sharing is not configured yet.";
      return;
    }
    statusEl.textContent = "Creating shareable link & QR code...";
    try {
      const photoUrls = [];
      for (const p of (payload.photos || [])) photoUrls.push(await uploadDataUrl(p));
      delete payload.photos;
      payload.photoUrls = photoUrls;

      if (payload.embeddedCard?.photos?.length) {
        const cUrls = [];
        for (const cp of payload.embeddedCard.photos) cUrls.push(await uploadDataUrl(cp));
        delete payload.embeddedCard.photos;
        payload.embeddedCard.photoUrls = cUrls;
      }

      if (payload.musicData) {
        const parts = payload.musicData.split(",");
        const mime = (parts[0].match(/data:(.*?);/) || [])[1] || "audio/mpeg";
        const bytes = Uint8Array.from(atob(parts[1]), c => c.charCodeAt(0));
        payload.musicUrl = await uploadBytes(bytes, mime, mime.includes("webm") ? "webm" : "mp3");
        delete payload.musicData;
      }

      const res = await fetch(`${cfg.url}/rest/v1/surprises`, {
        method: "POST",
        headers: { ...headers(), Prefer: "return=representation" },
        body: JSON.stringify({ kind, title: payload.title || "Surprise", payload, expires_at: null })
      });
      if (!res.ok) throw new Error(await res.text());
      const rows = await res.json();
      const id = rows[0]?.id;
const link = `${SHARE_BASE_URL}?surprise=${encodeURIComponent(id)}`;      saveToVault(kind, payload.title || "Surprise", link);
      renderQRBox(resultBox, link);
      statusEl.textContent = "Share link & QR generated!";
    } catch (e) {
      const hint = /failed to fetch/i.test(e.message)
        ? "Failed to fetch — verify REMEMBER_SUPABASE url/anonKey in js/supabase-config.js, network, and Supabase table/bucket rules."
        : e.message;
      statusEl.textContent = "Error: " + hint;
    }
  }

  // ---------------- FLIPBOOK & EVENT BINDINGS ----------------

  function renderMemory() {
    $("memory-preview-title").textContent = $("memory-title").value || "Our favourite moments";
    $("memory-preview-caption").textContent = $("memory-caption").value;
    $("memory-preview-date").textContent = $("memory-date").value;
    const layout = $("memory-layout").value;
    $("memory-preview").className = `memory-preview layout-${layout}`;

    $("memory-preview-photos").innerHTML = memoryPhotos.length
      ? memoryPhotos.map(src => `<img src="${src}" alt="Memory photo">`).join("")
      : '<div class="memory-placeholder">Your photos will appear here</div>';

    const isFlip = layout === "flipbook" && memoryPhotos.length > 0;
    $("flipbook-stage").hidden = !isFlip;
    if (isFlip) {
      flipIndex = Math.min(flipIndex, memoryPhotos.length - 1);
      $("flipbook-img").src = memoryPhotos[flipIndex];
      $("flip-counter").textContent = `${flipIndex + 1} / ${memoryPhotos.length}`;
    }
  }

  $("flip-prev").addEventListener("click", () => {
    if (!memoryPhotos.length) return;
    flipIndex = (flipIndex - 1 + memoryPhotos.length) % memoryPhotos.length;
    renderMemory();
  });
  $("flip-next").addEventListener("click", () => {
    if (!memoryPhotos.length) return;
    flipIndex = (flipIndex + 1) % memoryPhotos.length;
    renderMemory();
  });
  $("flip-autoplay").addEventListener("click", () => {
    if (flipTimer) {
      clearInterval(flipTimer); flipTimer = null;
      $("flip-autoplay").textContent = "▶ Auto";
    } else {
      $("flip-autoplay").textContent = "⏸ Stop";
      flipTimer = setInterval(() => {
        if (!memoryPhotos.length) return;
        flipIndex = (flipIndex + 1) % memoryPhotos.length;
        renderMemory();
      }, 1800);
    }
  });

  function switchTab(name) {
    document.querySelectorAll(".studio-tab").forEach(b => b.classList.toggle("active", b.dataset.panel === name));
    document.querySelectorAll(".studio-panel").forEach(p => p.classList.toggle("active", p.id === "panel-" + name));
  }
  document.querySelectorAll(".studio-tab").forEach(b => b.addEventListener("click", () => switchTab(b.dataset.panel)));

  document.querySelectorAll(".sec-jump-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sec-jump-btn").forEach(b => b.classList.toggle("active", b === btn));
      document.querySelectorAll(".editor-box.sec-block").forEach(sec => {
        sec.classList.toggle("active", sec.id === btn.dataset.sec);
      });
      const pane = $("card-controls-pane");
      if (pane && window.innerWidth > 900) {
        pane.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });

  $("sound-toggle").addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    $("sound-toggle").textContent = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
  });

  document.querySelectorAll(".wish-chip").forEach(ch => {
    ch.addEventListener("click", () => {
      const p = wishPresets[ch.dataset.wish];
      if (!p) return;
      $("card-heading").value = p.heading;
      $("card-message").value = p.message;
      renderCardPreview();
    });
  });

  $("template-search").addEventListener("input", renderTemplates);
  document.querySelectorAll(".filter-chip").forEach(b => b.addEventListener("click", () => {
    document.querySelectorAll(".filter-chip").forEach(x => x.classList.toggle("active", x === b));
    renderTemplates();
  }));

  ["to-name", "from-name", "card-heading", "card-message", "card-back-note", "card-scratch-text", "card-date", "show-day-counter", "card-palette", "use-custom-colors", "card-custom-ink", "card-custom-accent", "card-font", "card-effect"]
    .forEach(id => {
      $(id).addEventListener("input", renderCardPreview);
      $(id).addEventListener("change", renderCardPreview);
    });

  $("flip-card-btn").addEventListener("click", () => {
    isCardFlipped = !isCardFlipped;
    renderCardPreview();
  });
  $("reset-scratch-btn").addEventListener("click", renderCardPreview);
  $("trigger-card-magic").addEventListener("click", () => { playMagicSound("open"); launchFX("confetti"); });

  document.querySelectorAll(".sticker-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      cardStickers.push({ emoji: btn.dataset.sticker, x: 25 + Math.round(Math.random() * 50), y: 25 + Math.round(Math.random() * 50), scale: 1, rot: 0 });
      activeStickerIdx = cardStickers.length - 1;
      renderCardPreview();
    });
  });
  $("custom-sticker-file").addEventListener("change", async e => {
    const f = e.target.files?.[0];
    if (!f) return;
    const src = await fileToDataUrl(f);
    cardStickers.push({ src, x: 50, y: 50, scale: 1, rot: 0 });
    activeStickerIdx = cardStickers.length - 1;
    renderCardPreview();
  });
  $("sticker-grow").addEventListener("click", () => {
    if (cardStickers[activeStickerIdx]) { cardStickers[activeStickerIdx].scale = Math.min(2.2, (cardStickers[activeStickerIdx].scale || 1) + 0.2); renderCardPreview(); }
  });
  $("sticker-shrink").addEventListener("click", () => {
    if (cardStickers[activeStickerIdx]) { cardStickers[activeStickerIdx].scale = Math.max(0.5, (cardStickers[activeStickerIdx].scale || 1) - 0.2); renderCardPreview(); }
  });
  $("sticker-rotate").addEventListener("click", () => {
    if (cardStickers[activeStickerIdx]) { cardStickers[activeStickerIdx].rot = ((cardStickers[activeStickerIdx].rot || 0) + 20) % 360; renderCardPreview(); }
  });
  $("clear-stickers").addEventListener("click", () => { cardStickers = []; activeStickerIdx = -1; renderCardPreview(); });

  $("card-photos").addEventListener("change", () => loadImages($("card-photos"), 4, imgs => { cardPhotos = imgs; renderCardPreview(); }, $("card-photo-status")));

  $("pack-into-box").addEventListener("click", () => {
    $("include-designed-card").checked = true;
    if ($("to-name").value) $("box-to").value = $("to-name").value;
    if ($("from-name").value) $("box-from").value = $("from-name").value;
    updateEmbeddedBoxCard();
    resetGiftBox();
    switchTab("giftbox");
  });

  $("download-card").addEventListener("click", async () => {
    const canvas = await renderCardCanvas();
    await downloadCanvas(canvas, "remember-a-day-card.png");
    launchFX("confetti");
    saveToVault("Card PNG", $("card-heading").value || selected.title, "");
  });

  $("share-card").addEventListener("click", async () => {
    const canvas = await renderCardCanvas();
    const blob = await new Promise(r => canvas.toBlob(r, "image/png"));
    const file = new File([blob], "card.png", { type: "image/png" });
    if (navigator.share && navigator.canShare?.({ files: [file] })) await navigator.share({ files: [file], title: "Surprise Card" });
    else await downloadCanvas(canvas, "remember-a-day-card.png");
  });

  $("save-card-link").addEventListener("click", () => createSurprise("card", cardData(), $("studio-status"), $("share-result-box")));

  // Gift box events
  $("giftbox-interact").addEventListener("click", () => { if ($("box-mechanic").value === "tap") advanceGiftStep(); });
  $("giftbox-interact").addEventListener("mousedown", startCharge);
  $("giftbox-interact").addEventListener("touchstart", startCharge, { passive: true });
  window.addEventListener("mouseup", cancelCharge);
  window.addEventListener("touchend", cancelCharge);

  $("box-unlock-btn").addEventListener("click", () => {
    const expected = ($("box-lock-passcode").value || "").trim().toLowerCase();
    const given = ($("box-unlock-answer").value || "").trim().toLowerCase();
    if (given && given === expected) {
      $("box-lock-gate").hidden = true;
      $("box-lock-error").textContent = "";
      playMagicSound("untie");
      advanceGiftStep();
    } else {
      $("box-lock-error").textContent = "Not quite — try again!";
    }
  });

  $("enable-box-lock").addEventListener("change", () => {
    $("box-lock-fields").hidden = !$("enable-box-lock").checked;
    syncBoxLocksAndCake();
  });
  ["box-layers", "box-mechanic", "include-birthday-cake", "box-lock-hint", "box-lock-passcode"].forEach(id => {
    $(id).addEventListener("input", syncBoxLocksAndCake);
    $(id).addEventListener("change", syncBoxLocksAndCake);
  });

  ["box-theme", "box-style"].forEach(id => $(id).addEventListener("change", () => {
    $("giftbox-stage").className = `giftbox-stage theme-${$("box-theme").value} style-${$("box-style").value}`;
    $("giftbox-stage").dataset.step = String(boxStep);
  }));
  ["box-to", "box-title", "box-message", "box-from"].forEach(id => $(id).addEventListener("input", () => {
    $("giftbox-reveal-title").textContent = $("box-title").value || "A Magical Surprise For You";
    $("giftbox-reveal-message").textContent = $("box-message").value;
    $("giftbox-reveal-from").textContent = $("box-from").value ? "With love, " + $("box-from").value : "";
    $("giftbox-reveal-photos").innerHTML = boxPhotos.map(u => `<img src="${u}" alt="Photo">`).join("");
  }));

  $("box-photos").addEventListener("change", () => loadImages($("box-photos"), 4, imgs => {
    boxPhotos = imgs;
    $("giftbox-reveal-photos").innerHTML = boxPhotos.map(u => `<img src="${u}" alt="Photo">`).join("");
  }, $("box-status")));

  $("box-music").addEventListener("change", () => {
    if (activeMusicBlobUrl) URL.revokeObjectURL(activeMusicBlobUrl);
    const f = $("box-music").files?.[0];
    if (f) {
      activeMusicBlobUrl = URL.createObjectURL(f);
      $("giftbox-audio-player").src = activeMusicBlobUrl;
      $("giftbox-audio-player").hidden = false;
    }
  });

  $("toggle-synth-music").addEventListener("click", () => playMagicSound("melody"));
  $("burst-more-fx").addEventListener("click", () => { playMagicSound("open"); launchFX($("box-fx-type").value); });
  $("giftbox-replay").addEventListener("click", resetGiftBox);

  $("box-preview").addEventListener("click", () => {
    resetGiftBox();
    $("box-lock-gate").hidden = true;
    const total = Number($("box-layers").value || 1);
    let delay = 500;
    for (let l = 1; l <= total; l++) {
      setTimeout(() => advanceGiftStep(), delay);
      delay += 750;
      setTimeout(() => advanceGiftStep(), delay);
      delay += 850;
    }
  });

  $("box-share").addEventListener("click", async () => {
    let musicData = recordedAudioData || "";
    const file = $("box-music").files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) { $("box-status").textContent = "Audio must be under 8 MB."; return; }
      musicData = await fileToDataUrl(file);
    }
    createSurprise("giftbox", {
      title: $("box-title").value,
      to: $("box-to").value,
      message: $("box-message").value,
      from: $("box-from").value,
      theme: $("box-theme").value,
      style: $("box-style").value,
      layers: Number($("box-layers").value || 1),
      hasCake: $("include-birthday-cake").checked,
      lockEnabled: $("enable-box-lock").checked,
      lockHint: $("box-lock-hint").value,
      lockPasscode: $("box-lock-passcode").value,
      fxType: $("box-fx-type").value,
      embeddedCard: $("include-designed-card").checked ? cardData() : null,
      photos: boxPhotos,
      musicData
    }, $("box-status"), $("box-share-result"));
  });

  // Memory bindings
  $("memory-photos").addEventListener("change", () => loadImages($("memory-photos"), 8, imgs => {
    memoryPhotos = imgs; flipIndex = 0; renderMemory();
  }, $("memory-status")));
  ["memory-title", "memory-caption", "memory-date", "memory-layout"].forEach(id => {
    $(id).addEventListener("input", renderMemory);
    $(id).addEventListener("change", renderMemory);
  });
  $("download-memory").addEventListener("click", async () => {
    const c = document.createElement("canvas");
    c.width = 1200; c.height = 1200;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fffdf7"; ctx.fillRect(0, 0, 1200, 1200);
    ctx.fillStyle = "#19365b"; ctx.textAlign = "center"; ctx.font = "bold 52px Georgia";
    wrapText(ctx, $("memory-title").value, 600, 140, 1000, 64, 2);
    const imgs = await Promise.all(memoryPhotos.slice(0, 6).map(loadCanvasImg));
    const pos = [[150, 280], [630, 280], [150, 560], [630, 560], [150, 840], [630, 840]];
    imgs.forEach((im, i) => roundedImg(ctx, im, pos[i][0], pos[i][1], 420, 240));
    ctx.font = "28px Arial";
    wrapText(ctx, $("memory-caption").value, 600, 1135, 1000, 38, 2);
    await downloadCanvas(c, "remember-a-day-memory.png");
    launchFX("confetti");
  });
  $("share-memory").addEventListener("click", () => createSurprise("memory", {
    title: $("memory-title").value, caption: $("memory-caption").value, date: $("memory-date").value, layout: $("memory-layout").value, photos: memoryPhotos
  }, $("memory-status"), $("memory-share-result")));

  $("my-surprises").addEventListener("click", () => { renderVaultModal(); $("creations-modal").hidden = false; });
  $("close-creations").addEventListener("click", () => ($("creations-modal").hidden = true));
  $("creations-backdrop").addEventListener("click", () => ($("creations-modal").hidden = true));

  // Shared link recipient experience
  async function loadShared() {
    const id = new URLSearchParams(location.search).get("surprise");
    if (!id) return;
    $("studio-app").hidden = true;
    $("shared-view").hidden = false;
    if (!configured()) { $("shared-view").innerHTML = `<div class="shared-error">Online sharing not configured.</div>`; return; }

    try {
      const res = await fetch(`${cfg.url}/rest/v1/surprises?id=eq.${encodeURIComponent(id)}&select=*`, { headers: headers() });
      const rows = await res.json();
      const item = rows[0];
      if (!item) throw new Error("Surprise not found.");
      const d = item.payload || {};

      if (item.kind === "giftbox") {
        let s = 0, layer = 1;
        const total = Number(d.layers || 1);
        const photos = (d.photoUrls || []).map(u => `<img src="${escapeHTML(u)}" alt="Photo">`).join("");
        const cardHtml = d.embeddedCard ? buildCardHTML({ ...d.embeddedCard, photos: d.embeddedCard.photoUrls || [] }, false) : "";

        $("shared-view").innerHTML = `
          <div class="giftbox-preview-wrap">
            <div class="giftbox-stage theme-${escapeHTML(d.theme || "navy")} style-${escapeHTML(d.style || "luxury")}" id="s-stage" data-step="0">
              <div class="magic-rays"></div>
              <div class="balloon-cluster"><span>🎈</span><span>✨</span><span>🎈</span><span>💖</span><span>🎈</span></div>
              ${d.lockEnabled && d.lockPasscode ? `
                <div class="box-lock-gate" id="s-lock">
                  <p class="studio-eyebrow">SECRET LOCK</p>
                  <p>${escapeHTML(d.lockHint || "Enter secret answer")}</p>
                  <div class="lock-input-row">
                    <input type="text" id="s-ans" placeholder="Answer...">
                    <button type="button" class="studio-primary" id="s-unlock">Unlock</button>
                  </div>
                  <small class="lock-error" id="s-err"></small>
                </div>` : ""}
              <div class="giftbox-scene">
                <button type="button" class="giftbox-art" id="s-box-btn">
                  <span class="gift-glow"></span>
                  <span class="gift-lid"><span class="lid-trim"></span></span>
                  <span class="gift-body"><span class="box-emblem" id="s-badge">BOX 1/${total}</span></span>
                  <span class="gift-ribbon-v"></span>
                  <span class="gift-ribbon-h"></span>
                  <span class="gift-bow">🎀</span>
                </button>
              </div>
              <p id="s-hint" class="giftbox-hint-pill">Tap the bow to untie Box 1 of ${total} 🎀</p>
              <div class="giftbox-reveal" id="s-reveal" hidden>
                <div class="reveal-header-tag">✨ FOR ${escapeHTML(d.to || "YOU")} ✨</div>
                <h3>${escapeHTML(d.title || "A Magical Surprise")}</h3>
                <p>${escapeHTML(d.message || "")}</p>
                ${d.hasCake ? `<div class="cake-widget"><div class="cake-body">🎂 Birthday Cake Inside!</div><button type="button" class="mini-pill active" id="s-blow">💨 Blow Candles</button></div>` : ""}
                ${cardHtml ? `<div class="embedded-card-slot">${cardHtml}</div>` : ""}
                <div class="reveal-photo-strip">${photos}</div>
                ${d.musicUrl ? `<audio id="s-aud" controls src="${escapeHTML(d.musicUrl)}"></audio>` : ""}
                <small class="reveal-signature">${escapeHTML(d.from ? "With love, " + d.from : "")}</small>
              </div>
            </div>
          </div>
        `;

        $("s-unlock")?.addEventListener("click", () => {
          if (($("s-ans").value || "").trim().toLowerCase() === String(d.lockPasscode).trim().toLowerCase()) {
            $("s-lock").hidden = true;
            playMagicSound("untie");
          } else {
            $("s-err").textContent = "Wrong answer, try again!";
          }
        });

        $("s-blow")?.addEventListener("click", () => { playMagicSound("open"); launchFX("fireworks"); });

        $("s-box-btn").addEventListener("click", () => {
          if ($("s-lock") && !$("s-lock").hidden) return;
          if (s === 0) {
            s = 1;
            $("s-stage").dataset.step = "1";
            $("s-hint").textContent = `Tap to open Box ${layer} of ${total} ✨`;
            playMagicSound("untie");
          } else if (s === 1) {
            if (layer < total) {
              layer++; s = 0;
              $("s-stage").dataset.step = "0";
              $("s-badge").textContent = `BOX ${layer}/${total}`;
              $("s-hint").textContent = `Smaller box inside! Untie Box ${layer} of ${total} 🎀`;
              playMagicSound("untie");
            } else {
              s = 2;
              $("s-stage").dataset.step = "2";
              $("s-hint").hidden = true;
              $("s-reveal").hidden = false;
              playMagicSound("open");
              launchFX(d.fxType || "fireworks");
              $("s-aud")?.play().catch(() => {});
            }
          }
        });
      } else {
        const photos = (d.photoUrls || []).map(u => `<img src="${escapeHTML(u)}" alt="Photo">`).join("");
        $("shared-view").innerHTML = `
          <article class="shared-card">
            <span>✦ A SPECIAL WISH FOR YOU ✦</span>
            <h1>${escapeHTML(d.title || "Happy Celebration")}</h1>
            <p>${d.to ? "For " + escapeHTML(d.to) : ""}</p>
            <div class="shared-photos">${photos}</div>
            <p>${escapeHTML(d.message || d.caption || "")}</p>
            <strong>${escapeHTML(d.from ? "With love, " + d.from : "")}</strong>
          </article>
        `;
        launchFX("fireworks");
      }
    } catch (e) {
      $("shared-view").innerHTML = `<div class="shared-error">${escapeHTML(e.message)}</div>`;
    }
  }

  renderTemplates();
  renderCardPreview();
  renderMemory();
  syncBoxLocksAndCake();
  updateVaultBadge();
  loadShared();
})();