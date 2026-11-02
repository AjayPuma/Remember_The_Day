(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const cfg = window.REMEMBER_SUPABASE || {};
  const configured = () => Boolean(cfg.url && cfg.anonKey);

  const headers = () => ({
    apikey: cfg.anonKey,
    Authorization: `Bearer ${cfg.anonKey}`,
    "Content-Type": "application/json"
  });

  const templates = [
    ["Midnight Gold","birthday","#17213e","#f7d88a","#fff7df","✦","HAPPY BIRTHDAY"],
    ["Lavender Bloom","birthday","#f1e9f4","#755276","#fff","✿","A BEAUTIFUL DAY"],
    ["Blush Celebration","birthday","#ffe9e5","#a83e68","#fff9f5","🎂","HAPPY BIRTHDAY"],
    ["Golden Memories","birthday","#f1dfb8","#75502e","#fff7e7","✧","MAKE A WISH"],
    ["Floral Garden","birthday","#e9e4d8","#53664d","#fffdf2","✿","BLOOM & SHINE"],
    ["Confetti Pop","birthday","#fff0f1","#c23e67","#fff","✦","LET'S CELEBRATE"],
    ["Love Letter","love","#f8e5e5","#a93c55","#fff8f3","♡","WITH ALL MY LOVE"],
    ["Rose Romance","love","#efd7d9","#7d3547","#fff8f1","🌹","YOU ARE SPECIAL"],
    ["Forever & Always","love","#e8e3ef","#59436f","#fff","∞","FOREVER & ALWAYS"],
    ["Sweetheart","love","#fce6e9","#ad4b65","#fffaf5","♥","A NOTE FOR YOU"],
    ["Best Human Ever","friendship","#e5f0e8","#3d6954","#fffdf4","☀","BEST FRIEND"],
    ["Little Joys","friendship","#f6edce","#7a6332","#fffdf3","☼","GOOD TIMES"],
    ["Cheers to You","friendship","#e1edf4","#365d78","#fff","✦","CHEERS TO YOU"],
    ["Thank You","thanks","#e9eee4","#52674b","#fffdf6","✿","THANK YOU"],
    ["Grateful Heart","thanks","#f2e7d9","#805b3d","#fffaf2","♡","SO GRATEFUL"],
    ["You Did It","celebration","#e4eafa","#3e5289","#fff","✦","CONGRATULATIONS"],
    ["New Beginnings","celebration","#f7ead8","#96663d","#fffaf2","✧","NEW BEGINNINGS"],
    ["A Little Sunshine","celebration","#f9edc9","#8b6728","#fffdf1","☀","YOU DESERVE JOY"],
    ["Minimal Moment","birthday","#f4f0e8","#34485c","#fff","·","A SPECIAL WISH"],
    ["The Grand Wish","birthday","#1c2946","#d8b66e","#fff8e8","✦","A DAY TO REMEMBER"]
  ].map((t,i) => ({
    id:i,
    name:t[0],
    category:t[1],
    bg:t[2],
    deco:t[3],
    ink:t[4],
    symbol:t[5],
    title:t[6]
  }));

  let selected = templates[0];
  let cardPhotos = [];
  let boxPhotos = [];
  let memoryPhotos = [];

  const escapeHTML = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;",
      "<":"&lt;",
      ">":"&gt;",
      '"':"&quot;",
      "'":"&#39;"
    })[c]);

  // ---------------- TEMPLATES ----------------

  function artMarkup(t) {
    return `
      <div class="template-art"
        style="--art-bg:${t.bg};--art-deco:${t.deco};--art-ink:${t.ink}">
        <span class="art-kicker">${escapeHTML(t.category)}</span>
        <span class="art-flower">${t.symbol}</span>
        <strong class="art-title">${escapeHTML(t.title)}</strong>
        <span class="art-to">A LITTLE JOY FOR YOU</span>
      </div>
      <span class="template-name">${escapeHTML(t.name)}</span>
    `;
  }

  function renderTemplates() {
    const filter =
      document.querySelector(".filter-chip.active")?.dataset.filter || "all";

    const q = ($("template-search").value || "").toLowerCase();

    $("template-grid").innerHTML = templates
      .filter(t =>
        (filter === "all" || t.category === filter) &&
        (t.name + " " + t.category).toLowerCase().includes(q)
      )
      .map(t => `
        <button class="template-card ${selected.id === t.id ? "selected" : ""}"
          data-id="${t.id}"
          aria-pressed="${selected.id === t.id}">
          ${artMarkup(t)}
        </button>
      `).join("");

    document.querySelectorAll(".template-card").forEach(button => {
      button.addEventListener("click", () => {
        selected = templates[Number(button.dataset.id)];
        renderTemplates();
        renderCardPreview();
      });
    });
  }

  // ---------------- CARD DATA ----------------

  function palette(t) {
    const value = $("card-palette").value;

    const map = {
      rose:["#f7dfe3","#a54862","#fff8f5"],
      navy:["#17213e","#d9b66e","#fff7e5"],
      sage:["#e4eadf","#50664f","#fffdf4"],
      lavender:["#eee4f3","#74547e","#fffaff"],
      sunset:["#f9e0d1","#ad634d","#fff8f2"]
    };

    return value === "original"
      ? [t.bg,t.deco,t.ink]
      : map[value];
  }

  function cardData() {
    return {
      kind:"card",
      template:selected.id,
      title:$("card-heading").value || selected.title,
      to:$("to-name").value,
      from:$("from-name").value,
      message:$("card-message").value,
      date:$("card-date").value,
      palette:$("card-palette").value,
      photos:cardPhotos
    };
  }

  function renderCardPreview() {
    const d = cardData();
    const [bg,accent,ink] = palette(selected);

    const html = `
      <div class="card-render"
        style="background:linear-gradient(145deg,${bg},${ink});
        color:${ink};padding:28px;text-align:center;
        min-height:350px;display:flex;flex-direction:column;
        justify-content:space-between;position:relative;
        overflow:hidden;border-radius:18px">

        <span style="font-size:30px;color:${accent}">
          ${selected.symbol} ✦ ${selected.symbol}
        </span>

        <small style="letter-spacing:3px;color:${accent}">
          ${escapeHTML(selected.category.toUpperCase())}
        </small>

        <h2 style="font:600 36px Georgia,serif;color:${ink};margin:14px 0">
          ${escapeHTML(d.title)}
        </h2>

        <p style="color:${ink};font-size:17px">
          ${d.to ? "For " + escapeHTML(d.to) : "For someone special"}
        </p>

        <div class="card-render-photos"
          style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap">
          ${cardPhotos.map(src => `
            <img src="${src}"
              style="width:${cardPhotos.length === 1 ? "150px" : "90px"};
              height:100px;object-fit:cover;border:5px solid white;
              border-radius:8px">
          `).join("")}
        </div>

        <p style="color:${ink};line-height:1.6;white-space:pre-wrap">
          ${escapeHTML(d.message)}
        </p>

        <small style="color:${accent}">
          ${escapeHTML(d.date)}
        </small>

        <strong style="color:${ink}">
          ${d.from ? "With love, " + escapeHTML(d.from) : "With warm wishes"}
        </strong>
      </div>
    `;

    let preview = $("card-live-preview");

    if (!preview) {
      preview = document.createElement("div");
      preview.id = "card-live-preview";
      preview.className = "live-card-preview";
      $("studio-status").before(preview);
    }

    preview.innerHTML = html;
  }

  // ---------------- IMAGE UPLOAD ----------------

  function loadImages(input,max,callback,status) {
    const files = [...(input.files || [])].slice(0,max);

    if ((input.files || []).length > max) {
      status.textContent = `Only the first ${max} photos will be used.`;
    }

    Promise.all(files.map(file => new Promise((resolve,reject) => {
      if (!file.type.startsWith("image/")) {
        resolve(null);
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const img = new Image();

        img.onload = () => {
          const scale = Math.min(
            1,
            1500 / Math.max(img.width,img.height)
          );

          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);

          canvas.getContext("2d").drawImage(
            img,0,0,canvas.width,canvas.height
          );

          resolve(canvas.toDataURL("image/jpeg",0.82));
        };

        img.onerror = () => resolve(null);
        img.src = reader.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    })))
    .then(items => callback(items.filter(Boolean)))
    .catch(() => {
      status.textContent = "Could not read one of those photos.";
    });
  }

  // ---------------- CANVAS HELPERS ----------------

  function loadCanvasImage(src) {
    return new Promise((resolve,reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Could not load an uploaded photo."));
      img.src = src;
    });
  }

  function roundedImage(ctx,img,x,y,w,h,radius=18) {
    ctx.save();

    ctx.beginPath();
    ctx.roundRect(x,y,w,h,radius);
    ctx.clip();

    const scale = Math.max(w/img.width,h/img.height);
    const sw = img.width * scale;
    const sh = img.height * scale;

    ctx.drawImage(
      img,
      x + (w-sw)/2,
      y + (h-sh)/2,
      sw,
      sh
    );

    ctx.restore();
  }

  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=5) {
    const words = String(text || "").split(/\s+/);
    let line = "";
    let lines = 0;

    for (const word of words) {
      const test = line ? line + " " + word : word;

      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line,x,y);
        y += lineHeight;
        line = word;
        lines++;

        if (lines >= maxLines) return y;
      } else {
        line = test;
      }
    }

    if (line && lines < maxLines) {
      ctx.fillText(line,x,y);
      y += lineHeight;
    }

    return y;
  }

  // ---------------- CARD PNG ----------------

  async function renderCardCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;

    const ctx = canvas.getContext("2d");
    const d = cardData();
    const [bg,accent,ink] = palette(selected);

    const gradient = ctx.createLinearGradient(0,0,1200,1200);
    gradient.addColorStop(0,bg);
    gradient.addColorStop(1,ink);

    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,1200,1200);

    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.strokeRect(35,35,1130,1130);

    ctx.textAlign = "center";
    ctx.fillStyle = accent;
    ctx.font = "70px Georgia";
    ctx.fillText(`${selected.symbol} ✦ ${selected.symbol}`,600,145);

    ctx.font = "bold 22px Arial";
    ctx.fillText(selected.category.toUpperCase(),600,215);

    ctx.fillStyle = ink;
    ctx.font = "bold 66px Georgia";

    wrapCanvasText(
      ctx,d.title || selected.title,600,315,1000,78,2
    );

    ctx.font = "34px Arial";
    ctx.fillText(
      d.to ? `For ${d.to}` : "For someone special",
      600,440
    );

    const images = await Promise.all(cardPhotos.map(loadCanvasImage));

    if (images.length === 1) {
      roundedImage(ctx,images[0],390,490,420,260);
    } else if (images.length > 1) {
      const positions = [
        [270,490],
        [630,490],
        [270,690],
        [630,690]
      ];

      images.forEach((img,i) => {
        roundedImage(
          ctx,img,
          positions[i][0],
          positions[i][1],
          300,175
        );
      });
    }

    ctx.fillStyle = ink;
    ctx.font = "30px Arial";

    const messageY =
      images.length > 1 ? 930 :
      images.length === 1 ? 830 : 590;

    wrapCanvasText(
      ctx,d.message,600,messageY,950,43,4
    );

    ctx.font = "24px Arial";
    ctx.fillStyle = accent;
    ctx.fillText(d.date || "",600,1080);

    ctx.fillStyle = ink;
    ctx.font = "bold 29px Georgia";

    ctx.fillText(
      d.from ? `With love, ${d.from}` : "With warm wishes",
      600,1130
    );

    return canvas;
  }

  // ---------------- MEMORY PNG ----------------

  async function renderMemoryCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#e9e1d4";
    ctx.fillRect(0,0,1200,1200);

    ctx.fillStyle = "#fffdf7";
    ctx.fillRect(55,55,1090,1090);

    ctx.textAlign = "center";
    ctx.fillStyle = "#ff7048";
    ctx.font = "bold 22px Arial";
    ctx.fillText("A MOMENT TO KEEP",600,145);

    ctx.fillStyle = "#19365b";
    ctx.font = "bold 55px Georgia";

    wrapCanvasText(
      ctx,$("memory-title").value,600,235,950,65,2
    );

    const images = await Promise.all(memoryPhotos.map(loadCanvasImage));
    const layout = $("memory-layout").value;

    if (layout === "film") {
      const gap = 20;
      const count = Math.min(images.length,5);
      const width = 190;
      const total = count * width + (count - 1) * gap;
      let x = (1200 - total) / 2;

      for (const img of images.slice(0,5)) {
        ctx.fillStyle = "#252525";
        ctx.fillRect(x-8,350,206,330);

        roundedImage(ctx,img,x,390,width,250,5);
        x += width + gap;
      }
    } else {
      const positions = [
        [150,340],
        [625,340],
        [150,610],
        [625,610],
        [150,880],
        [625,880],
        [150,880],
        [625,880]
      ];

      const count = Math.min(images.length,6);

      images.slice(0,count).forEach((img,i) => {
        const [x,y] = positions[i];

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x-10,y-10,440,230);

        roundedImage(ctx,img,x,y,420,190,5);
      });
    }

    ctx.fillStyle = "#526174";
    ctx.font = "27px Arial";

    wrapCanvasText(
      ctx,$("memory-caption").value,600,1080,950,38,2
    );

    ctx.font = "22px Arial";
    ctx.fillText($("memory-date").value || "",600,1140);

    return canvas;
  }

  // ---------------- DOWNLOAD ----------------

  async function downloadCanvas(canvas,filename) {
    const blob = await new Promise(resolve =>
      canvas.toBlob(resolve,"image/png")
    );

    if (!blob) {
      throw new Error("Could not create PNG image.");
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    a.remove();

    setTimeout(() => URL.revokeObjectURL(url),2000);
  }

  async function downloadCard() {
    try {
      $("studio-status").textContent = "Creating your card image...";

      const canvas = await renderCardCanvas();

      await downloadCanvas(
        canvas,
        "remember-a-day-greeting.png"
      );

      $("studio-status").textContent = "Your card is ready!";
    } catch (e) {
      console.error(e);
      $("studio-status").textContent = e.message;
    }
  }

  // ---------------- SHARE CARD ----------------

  async function shareCard() {
    try {
      const canvas = await renderCardCanvas();

      const blob = await new Promise(resolve =>
        canvas.toBlob(resolve,"image/png")
      );

      if (!blob) {
        throw new Error("Could not create image.");
      }

      const file = new File(
        [blob],
        "remember-a-day.png",
        {type:"image/png"}
      );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({files:[file]})
      ) {
        await navigator.share({
          files:[file],
          title:"A greeting from Remember a Day"
        });
      } else {
        await downloadCanvas(canvas,"remember-a-day.png");

        alert(
          "Image downloaded. You can attach it in WhatsApp or Instagram."
        );
      }
    } catch (e) {
      if (e.name !== "AbortError") {
        console.error(e);
        alert("Could not share the card. Please try downloading it.");
      }
    }
  }

  // ---------------- GIFT BOX ----------------

  function setGiftTheme() {
    $("giftbox-stage").className =
      "giftbox-stage theme-" + $("box-theme").value;
  }

  function updateBoxText() {
    $("giftbox-reveal-title").textContent =
      $("box-title").value || "A little surprise";

    $("giftbox-reveal-message").textContent =
      $("box-message").value;

    $("giftbox-reveal-from").textContent =
      $("box-from").value
        ? "With love, " + $("box-from").value
        : "";

    $("giftbox-hint").textContent =
      $("box-to").value
        ? "A surprise for " + $("box-to").value + " — tap to open"
        : "Tap the gift to preview the surprise";
  }

  function previewGift() {
    $("giftbox-stage").classList.remove("opened");
    $("giftbox-reveal").hidden = true;

    setTimeout(() => {
      $("giftbox-open").click();
    },100);
  }

  // ---------------- MEMORY PREVIEW ----------------

  function renderMemory() {
    $("memory-preview-title").textContent =
      $("memory-title").value || "A moment to keep";

    $("memory-preview-caption").textContent =
      $("memory-caption").value;

    $("memory-preview-date").textContent =
      $("memory-date").value;

    $("memory-preview").className =
      "memory-preview layout-" + $("memory-layout").value;

    $("memory-preview-photos").innerHTML =
      memoryPhotos.length
        ? memoryPhotos.map(src =>
            `<img src="${src}" alt="Memory photo">`
          ).join("")
        : '<div class="memory-placeholder">Your photos will appear here</div>';
  }

  // ---------------- SUPABASE SHARING ----------------

  async function uploadBytes(bytes,mime,ext) {
    const path = `${crypto.randomUUID()}.${ext}`;

    const res = await fetch(
      `${cfg.url}/storage/v1/object/${cfg.bucket}/${path}`,
      {
        method:"POST",
        headers:{
          apikey:cfg.anonKey,
          Authorization:`Bearer ${cfg.anonKey}`,
          "Content-Type":mime,
          "x-upsert":"false"
        },
        body:bytes
      }
    );

    if (!res.ok) {
      throw new Error("Media upload failed: " + await res.text());
    }

    return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${path}`;
  }

  async function uploadDataImage(dataUrl) {
    const parts = dataUrl.split(",");

    const mime =
      (parts[0].match(/data:(.*?);/) || [])[1] || "image/jpeg";

    const bytes = Uint8Array.from(
      atob(parts[1]),
      c => c.charCodeAt(0)
    );

    const ext = mime.split("/")[1].replace("jpeg","jpg");

    return uploadBytes(bytes,mime,ext);
  }

  function fileAsDataURL(file) {
    return new Promise((resolve,reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;

      reader.readAsDataURL(file);
    });
  }

  async function createSurprise(kind,payload,statusEl) {
    if (!configured()) {
      statusEl.textContent = "Online sharing is not configured yet.";
      return;
    }

    statusEl.textContent = "Preparing your surprise...";

    try {
      const rawPhotos = payload.photos || [];
      const urls = [];

      for (const photo of rawPhotos) {
        urls.push(await uploadDataImage(photo));
      }

      delete payload.photos;
      payload.photoUrls = urls;

      if (payload.musicData) {
        const parts = payload.musicData.split(",");

        const mime =
          (parts[0].match(/data:(.*?);/) || [])[1] || "audio/mpeg";

        const bytes = Uint8Array.from(
          atob(parts[1]),
          c => c.charCodeAt(0)
        );

        payload.musicUrl = await uploadBytes(
          bytes,
          mime,
          mime.includes("mp4") ? "m4a" : "mp3"
        );

        delete payload.musicData;
      }

      const res = await fetch(
        `${cfg.url}/rest/v1/surprises`,
        {
          method:"POST",
          headers:{
            ...headers(),
            Prefer:"return=representation"
          },
          body:JSON.stringify({
            kind,
            title:payload.title || "A little surprise",
            payload,
            expires_at:null
          })
        }
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const rows = await res.json();
      const id = rows[0]?.id;

      if (!id) {
        throw new Error("No share ID returned.");
      }

      const link =
        `${location.origin}${location.pathname}?surprise=${encodeURIComponent(id)}`;

      statusEl.innerHTML = `
        Surprise created!
        <a href="${link}" target="_blank" rel="noopener">Open preview</a>
        ·
        <button type="button" id="copy-surprise-link">Copy link</button>
      `;

      $("copy-surprise-link").addEventListener("click",async () => {
        try {
          await navigator.clipboard.writeText(link);
          statusEl.textContent = "Link copied! Send it to your friend.";
        } catch {
          statusEl.textContent = link;
        }
      });

      if (navigator.share) {
        const share = confirm("Your surprise link is ready. Share it now?");

        if (share) {
          await navigator.share({
            title:"A surprise for you",
            text:"Someone made a surprise for you!",
            url:link
          });
        }
      }

    } catch (e) {
      console.error(e);
      statusEl.textContent = "Could not create link: " + e.message;
    }
  }

  // ---------------- EVENT LISTENERS ----------------

  document.querySelectorAll(".studio-tab").forEach(button => {
    button.addEventListener("click",() => {
      const name = button.dataset.panel;

      document.querySelectorAll(".studio-tab").forEach(b =>
        b.classList.toggle("active",b === button)
      );

      document.querySelectorAll(".studio-panel").forEach(panel =>
        panel.classList.toggle("active",panel.id === "panel-" + name)
      );
    });
  });

  $("template-search").addEventListener("input",renderTemplates);

  document.querySelectorAll(".filter-chip").forEach(button => {
    button.addEventListener("click",() => {
      document.querySelectorAll(".filter-chip").forEach(b =>
        b.classList.toggle("active",b === button)
      );

      renderTemplates();
    });
  });

  [
    "to-name",
    "from-name",
    "card-heading",
    "card-message",
    "card-date",
    "card-palette",
    "card-motion"
  ].forEach(id => {
    $(id).addEventListener("input",renderCardPreview);
    $(id).addEventListener("change",renderCardPreview);
  });

  $("card-photos").addEventListener("change",() => {
    loadImages(
      $("card-photos"),
      4,
      imgs => {
        cardPhotos = imgs;
        $("card-photo-status").textContent =
          `${imgs.length} photo(s) ready.`;
        renderCardPreview();
      },
      $("card-photo-status")
    );
  });

  $("download-card").addEventListener("click",downloadCard);
  $("share-card").addEventListener("click",shareCard);

  $("box-theme").addEventListener("change",setGiftTheme);

  ["box-to","box-title","box-message","box-from"].forEach(id => {
    $(id).addEventListener("input",updateBoxText);
  });

  $("giftbox-open").addEventListener("click",() => {
    $("giftbox-stage").classList.add("opened");
    $("giftbox-reveal").hidden = false;
    $("giftbox-hint").textContent = "Your surprise is open ✨";
  });

  $("box-preview").addEventListener("click",previewGift);

  $("box-photos").addEventListener("change",() => {
    loadImages(
      $("box-photos"),
      4,
      imgs => {
        boxPhotos = imgs;
        $("box-status").textContent =
          `${imgs.length} photo(s) ready for the surprise.`;
      },
      $("box-status")
    );
  });

  $("box-share").addEventListener("click",async () => {
    try {
      const music = $("box-music").files[0];
      let musicData = "";

      if (music) {
        if (music.size > 8 * 1024 * 1024) {
          $("box-status").textContent =
            "Please choose an audio file smaller than 8 MB.";
          return;
        }

        musicData = await fileAsDataURL(music);
      }

      createSurprise(
        "giftbox",
        {
          title:$("box-title").value,
          to:$("box-to").value,
          message:$("box-message").value,
          from:$("box-from").value,
          theme:$("box-theme").value,
          photos:boxPhotos,
          musicData
        },
        $("box-status")
      );

    } catch (e) {
      console.error(e);
      $("box-status").textContent = e.message;
    }
  });

  $("memory-photos").addEventListener("change",() => {
    loadImages(
      $("memory-photos"),
      8,
      imgs => {
        memoryPhotos = imgs;
        renderMemory();

        $("memory-status").textContent =
          `${imgs.length} photo(s) added.`;
      },
      $("memory-status")
    );
  });

  ["memory-title","memory-caption","memory-date","memory-layout"].forEach(id => {
    $(id).addEventListener("input",renderMemory);
    $(id).addEventListener("change",renderMemory);
  });

  $("download-memory").addEventListener("click",async () => {
    try {
      $("memory-status").textContent = "Creating your memory image...";

      const canvas = await renderMemoryCanvas();

      await downloadCanvas(
        canvas,
        "remember-a-day-memory.png"
      );

      $("memory-status").textContent = "Your memory image is ready!";

    } catch (e) {
      console.error(e);
      $("memory-status").textContent = e.message;
    }
  });

  $("save-card-link").addEventListener("click",() => {
    createSurprise("card",cardData(),$("studio-status"));
  });

  $("share-memory").addEventListener("click",() => {
    createSurprise(
      "memory",
      {
        title:$("memory-title").value,
        caption:$("memory-caption").value,
        date:$("memory-date").value,
        layout:$("memory-layout").value,
        photos:memoryPhotos
      },
      $("memory-status")
    );
  });

  $("my-surprises").addEventListener("click",() => {
    alert(
      "Your creations are saved on this device only when downloaded. Shareable-link history will be added with account-based saving in a later update."
    );
  });

  // ---------------- INITIALISE ----------------

  renderTemplates();
  renderCardPreview();
  renderMemory();
  updateBoxText();
  setGiftTheme();

  // Remove old technical setup text from initial display.
  $("box-status").textContent = "Your gift box is ready to preview!";

  // ---------------- LOAD SHARED SURPRISE ----------------

  async function loadShared() {
    const id = new URLSearchParams(location.search).get("surprise");

    if (!id) return;

    $("studio-app").hidden = true;
    $("shared-view").hidden = false;

    if (!configured()) {
      $("shared-view").innerHTML = `
        <div class="shared-error">
          Online sharing is not configured.
        </div>
      `;
      return;
    }

    try {
      const res = await fetch(
        `${cfg.url}/rest/v1/surprises?id=eq.${encodeURIComponent(id)}&select=*`,
        {headers:headers()}
      );

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const rows = await res.json();
      const item = rows[0];

      if (!item) {
        throw new Error("This surprise was not found or has expired.");
      }

      const d = item.payload || {};

      const photos = (d.photoUrls || []).map(url => `
        <img src="${escapeHTML(url)}" alt="Shared memory">
      `).join("");

      if (item.kind === "giftbox") {
        $("shared-view").innerHTML = `
          <div class="giftbox-preview-wrap">
            <div class="giftbox-stage theme-${escapeHTML(d.theme || "rose")}">

              <div class="giftbox-art" style="font-size:100px">🎁</div>

              <button class="studio-primary" id="open-shared-gift">
                Open your surprise
              </button>

              <div class="shared-box" id="shared-gift-content" hidden>
                <p class="studio-eyebrow">
                  A LITTLE SURPRISE FOR ${escapeHTML(d.to || "YOU")}
                </p>

                <h2>${escapeHTML(d.title || "A little something")}</h2>

                <p>${escapeHTML(d.message || "")}</p>

                ${photos}

                ${d.musicUrl
                  ? `<audio controls preload="none" src="${escapeHTML(d.musicUrl)}"></audio>`
                  : ""}

                <p>${escapeHTML(d.from || "With love")}</p>
              </div>
            </div>
          </div>
        `;

        $("open-shared-gift").addEventListener("click",() => {
          $("shared-gift-content").hidden = false;
          $("open-shared-gift").hidden = true;
        });

      } else {
        $("shared-view").innerHTML = `
          <article class="shared-card">
            <span>✦ A LITTLE SOMETHING FOR YOU ✦</span>

            <h1>${escapeHTML(d.title || "A special wish")}</h1>

            <p>${d.to ? "For " + escapeHTML(d.to) : ""}</p>

            <div class="shared-photos">${photos}</div>

            <p>${escapeHTML(d.message || d.caption || "")}</p>

            <small>${escapeHTML(d.date || "")}</small>

            <strong>
              ${d.from
                ? "With love, " + escapeHTML(d.from)
                : "Made with Remember a Day"}
            </strong>
          </article>
        `;
      }

    } catch (e) {
      $("shared-view").innerHTML = `
        <div class="shared-error">
          ${escapeHTML(e.message)}
        </div>
      `;
    }
  }

  loadShared();

})();