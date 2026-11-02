
/* ==========================================
   REMEMBER A DAY — MEMORY JOURNAL
   Keeps compatibility with older saved memories.
   ========================================== */

const MEMORY_KEY = "remember-a-day-memories";

let editingMemoryId = null;
let selectedNewPhotos = [];
let existingEditPhotos = [];
let previewObjectUrls = [];

function getMemories() {
    try {
        const data = localStorage.getItem(MEMORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Could not read memories:", error);
        return [];
    }
}

function saveMemories(memories) {
    try {
        localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
        return true;
    } catch (error) {
        console.error("Could not save memories:", error);
        setMemoryStatus(
            "Browser storage is full. Try fewer or smaller photos.",
            true
        );
        return false;
    }
}

function escapeMemoryHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function getMemoryPhotos(memory) {
    if (Array.isArray(memory.photos)) return memory.photos;
    if (Array.isArray(memory.imgs)) return memory.imgs;
    return memory.img ? [memory.img] : [];
}

function setMemoryStatus(message, isError = false) {
    const status = document.getElementById("memory-form-status");
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#b42318" : "";
}

function clearPreviewUrls() {
    previewObjectUrls.forEach(url => URL.revokeObjectURL(url));
    previewObjectUrls = [];
}

function compressMemoryPhoto(file) {
    return new Promise(resolve => {
        if (!file || !file.type.startsWith("image/")) {
            resolve(null);
            return;
        }

        const reader = new FileReader();

        reader.onerror = () => resolve(null);

        reader.onload = () => {
            const image = new Image();

            image.onerror = () => resolve(null);

            image.onload = () => {
                const maxSide = 1000;
                const scale = Math.min(
                    1,
                    maxSide / Math.max(image.width, image.height)
                );

                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));

                const context = canvas.getContext("2d");
                if (!context) {
                    resolve(null);
                    return;
                }

                context.drawImage(
                    image, 0, 0, canvas.width, canvas.height
                );

                try {
                    resolve(canvas.toDataURL("image/jpeg", 0.7));
                } catch (error) {
                    resolve(null);
                }
            };

            image.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

function resetMemoryForm() {
    editingMemoryId = null;
    selectedNewPhotos = [];
    existingEditPhotos = [];
    clearPreviewUrls();

    document.getElementById("memory-title").value = "";
    document.getElementById("memory-date").value = "";
    document.getElementById("memory-note").value = "";
    document.getElementById("memory-photos").value = "";

    document.getElementById("memory-form-heading").textContent =
        "Create a memory ✨";
    document.getElementById("save-memory").textContent = "❤️ Save Memory";
    document.getElementById("cancel-memory-edit").hidden = true;

    renderMemoryPhotoPreview();
    setMemoryStatus("");
}

function renderMemoryPhotoPreview() {
    const preview = document.getElementById("memory-photo-preview");
    if (!preview) return;

    clearPreviewUrls();

    const items = [
        ...existingEditPhotos.map((src, index) => ({
            src,
            existing: true,
            index
        })),
        ...selectedNewPhotos.map((file, index) => ({
            src: URL.createObjectURL(file),
            existing: false,
            index
        }))
    ];

    // Store only temporary object URLs for newly selected files.
    items.forEach(item => {
        if (!item.existing) previewObjectUrls.push(item.src);
    });

    preview.innerHTML = items.map((item, index) => `
        <div class="memory-preview-item">
            <img src="${item.src}" alt="Selected photo ${index + 1}">
            <button type="button" class="memory-preview-remove"
                data-remove-preview="${index}" aria-label="Remove photo">×</button>
        </div>
    `).join("");

    preview.querySelectorAll("[data-remove-preview]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.removePreview);

            if (index < existingEditPhotos.length) {
                existingEditPhotos.splice(index, 1);
            } else {
                selectedNewPhotos.splice(
                    index - existingEditPhotos.length, 1
                );
            }

            renderMemoryPhotoPreview();
        });
    });
}

async function addSelectedFiles(fileList) {
    const incoming = Array.from(fileList || []).filter(file =>
        file.type.startsWith("image/")
    );

    const available = 5 - existingEditPhotos.length - selectedNewPhotos.length;

    if (incoming.length > available) {
        setMemoryStatus("You can attach up to 5 photos per memory.", true);
    }

    selectedNewPhotos.push(...incoming.slice(0, Math.max(0, available)));
    renderMemoryPhotoPreview();
}

function populateMemoryYears() {
    const select = document.getElementById("memory-year-filter");
    if (!select) return;

    const previous = select.value;
    const years = [...new Set(
        getMemories()
            .map(memory => String(memory.date || "").slice(0, 4))
            .filter(year => /^\d{4}$/.test(year))
    )].sort((a, b) => Number(b) - Number(a));

    select.innerHTML = '<option value="all">All years</option>' +
        years.map(year =>
            `<option value="${escapeMemoryHTML(year)}">${escapeMemoryHTML(year)}</option>`
        ).join("");

    if ([...select.options].some(option => option.value === previous)) {
        select.value = previous;
    }
}

function displayMemories() {
    const container = document.getElementById("memory-list");
    if (!container) return;

    const search = document.getElementById("memory-search")?.value
        .trim().toLowerCase() || "";
    const month = document.getElementById("memory-month-filter")?.value || "all";
    const year = document.getElementById("memory-year-filter")?.value || "all";

    const allMemories = getMemories().sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
    );

    const memories = allMemories.filter(memory => {
        const date = String(memory.date || "");
        const searchable = `${memory.title || ""} ${memory.note || ""}`.toLowerCase();

        if (search && !searchable.includes(search)) return false;
        if (month !== "all" && Number(date.slice(5, 7)) - 1 !== Number(month)) return false;
        if (year !== "all" && date.slice(0, 4) !== year) return false;

        return true;
    });

    const count = document.getElementById("memory-count");
    if (count) {
        count.textContent = `Showing ${memories.length} of ${allMemories.length} memories`;
    }

    if (!memories.length) {
        const hasFilters = search || month !== "all" || year !== "all";

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❤️</div>
                <h3>${hasFilters ? "No matching memories" : "No memories yet"}</h3>
                <p>${hasFilters
                    ? "Try changing your search or filters."
                    : "Save your first special memory above."
                }</p>
                ${hasFilters
                    ? '<button type="button" id="clear-memory-filters" class="secondary-button">Clear filters</button>'
                    : ""
                }
            </div>`;

        document.getElementById("clear-memory-filters")?.addEventListener(
            "click", resetMemoryFilters
        );
        return;
    }

    container.innerHTML = memories.map(memory => {
        const photos = getMemoryPhotos(memory).map((photo, index) => `
            <img class="memory-photo"
                src="${escapeMemoryHTML(photo)}"
                alt="Memory photo ${index + 1}"
                loading="lazy"
                data-memory-photo="${escapeMemoryHTML(photo)}">
        `).join("");

        return `
            <article class="memory-card">
                <span class="event-type">${escapeMemoryHTML(memory.date)}</span>
                <h3>${escapeMemoryHTML(memory.title)}</h3>
                <p class="memory-card-note">${escapeMemoryHTML(memory.note).replace(/\n/g, "<br>")}</p>
                ${photos ? `<div class="memory-photo-grid">${photos}</div>` : ""}
                <div class="memory-card-actions">
                    <button type="button" class="secondary-button"
                        data-edit-memory="${escapeMemoryHTML(memory.id)}">
                        ✏️ Edit
                    </button>
                    <button type="button" class="secondary-button"
                        data-delete-memory="${escapeMemoryHTML(memory.id)}">
                        🗑️ Delete
                    </button>
                </div>
            </article>`;
    }).join("");

    container.querySelectorAll("[data-edit-memory]").forEach(button => {
        button.addEventListener("click", () => {
            const memory = getMemories().find(item =>
                String(item.id) === button.dataset.editMemory
            );
            if (memory) startMemoryEdit(memory);
        });
    });

    container.querySelectorAll("[data-delete-memory]").forEach(button => {
        button.addEventListener("click", () => {
            if (!confirm("Delete this memory permanently?")) return;

            const id = button.dataset.deleteMemory;
            const updated = getMemories().filter(memory =>
                String(memory.id) !== String(id)
            );

            if (saveMemories(updated)) {
                populateMemoryYears();
                displayMemories();
            }
        });
    });

    container.querySelectorAll("[data-memory-photo]").forEach(photo => {
        photo.addEventListener("click", () => openMemoryLightbox(photo.dataset.memoryPhoto));
    });
}

function startMemoryEdit(memory) {
    editingMemoryId = memory.id;
    selectedNewPhotos = [];
    existingEditPhotos = [...getMemoryPhotos(memory)];
    clearPreviewUrls();

    document.getElementById("memory-title").value = memory.title || "";
    document.getElementById("memory-date").value = memory.date || "";
    document.getElementById("memory-note").value = memory.note || "";
    document.getElementById("memory-photos").value = "";

    document.getElementById("memory-form-heading").textContent = "Edit your memory ✏️";
    document.getElementById("save-memory").textContent = "Save Changes";
    document.getElementById("cancel-memory-edit").hidden = false;

    renderMemoryPhotoPreview();
    document.getElementById("memory-form").scrollIntoView({
        behavior: "smooth", block: "start"
    });
}

function resetMemoryFilters() {
    document.getElementById("memory-search").value = "";
    document.getElementById("memory-month-filter").value = "all";
    document.getElementById("memory-year-filter").value = "all";
    displayMemories();
}

function openMemoryLightbox(src) {
    const lightbox = document.getElementById("memory-lightbox");
    const image = document.getElementById("memory-lightbox-image");
    if (!lightbox || !image) return;

    image.src = src;
    lightbox.hidden = false;
}

function closeMemoryLightbox() {
    const lightbox = document.getElementById("memory-lightbox");
    const image = document.getElementById("memory-lightbox-image");

    if (lightbox) lightbox.hidden = true;
    if (image) image.src = "";
}

document.addEventListener("DOMContentLoaded", () => {
    const saveButton = document.getElementById("save-memory");
    const photoInput = document.getElementById("memory-photos");

    displayMemories();
    populateMemoryYears();

    document.getElementById("toggle-memory-filters")?.addEventListener("click", () => {
        const panel = document.getElementById("memory-filter-panel");
        const button = document.getElementById("toggle-memory-filters");

        panel.hidden = !panel.hidden;
        button.setAttribute("aria-expanded", String(!panel.hidden));

        if (!panel.hidden) {
            document.getElementById("memory-search").focus();
        }
    });

    document.getElementById("reset-memory-filters")?.addEventListener(
        "click", resetMemoryFilters
    );

    document.getElementById("memory-search")?.addEventListener("input", displayMemories);
    document.getElementById("memory-month-filter")?.addEventListener("change", displayMemories);
    document.getElementById("memory-year-filter")?.addEventListener("change", displayMemories);

    photoInput?.addEventListener("change", () => addSelectedFiles(photoInput.files));

    document.getElementById("new-memory-button")?.addEventListener("click", () => {
        resetMemoryForm();
        document.getElementById("memory-form").scrollIntoView({
            behavior: "smooth", block: "start"
        });
    });

    document.getElementById("cancel-memory-edit")?.addEventListener(
        "click", resetMemoryForm
    );

    saveButton?.addEventListener("click", async () => {
        const title = document.getElementById("memory-title").value.trim();
        const date = document.getElementById("memory-date").value;
        const note = document.getElementById("memory-note").value.trim();

        if (!title || !date || !note) {
            setMemoryStatus("Please fill in the title, date, and memory.", true);
            return;
        }

        saveButton.disabled = true;
        setMemoryStatus("Preparing your memory...");

        try {
            const newPhotos = [];

            for (const file of selectedNewPhotos) {
                const photo = await compressMemoryPhoto(file);
                if (photo) newPhotos.push(photo);
            }

            const photos = [...existingEditPhotos, ...newPhotos].slice(0, 5);
            const memories = getMemories();

            if (editingMemoryId !== null) {
                const index = memories.findIndex(memory =>
                    String(memory.id) === String(editingMemoryId)
                );

                if (index === -1) {
                    setMemoryStatus("This memory could not be found. Refresh and try again.", true);
                    return;
                }

                memories[index] = {
                    ...memories[index],
                    title,
                    date,
                    note,
                    photos
                };
            } else {
                memories.push({
                    id: String(Date.now()) + Math.random().toString(16).slice(2),
                    title,
                    date,
                    note,
                    photos
                });
            }

            if (saveMemories(memories)) {
                resetMemoryForm();
                populateMemoryYears();
                displayMemories();
                setMemoryStatus("Memory saved successfully ❤️");
            }
        } finally {
            saveButton.disabled = false;
        }
    });

    document.getElementById("memory-lightbox-close")?.addEventListener(
        "click", closeMemoryLightbox
    );

    document.getElementById("memory-lightbox")?.addEventListener("click", event => {
        if (event.target.id === "memory-lightbox") closeMemoryLightbox();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMemoryLightbox();
    });

    window.addEventListener("storage", () => {
        populateMemoryYears();
        displayMemories();
    });
});
