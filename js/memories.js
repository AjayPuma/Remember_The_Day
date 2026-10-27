/* ==========================================
   MEMORY MANAGEMENT
   Supports multiple photos and older memories.
   ========================================== */

const MEMORY_KEY = "remember-a-day-memories";

function getMemories() {
    try {
        const data = localStorage.getItem(MEMORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Could not read memories", error);
        return [];
    }
}

function saveMemories(memories) {
    try {
        localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
        return true;
    } catch (error) {
        alert("Browser storage is full. Try using fewer or smaller photos.");
        return false;
    }
}

function escapeMemoryHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;",
        '"': "&quot;", "'": "&#39;"
    }[char]));
}

function getMemoryPhotos(memory) {
    if (Array.isArray(memory.photos)) return memory.photos;
    if (Array.isArray(memory.imgs)) return memory.imgs;
    return memory.img ? [memory.img] : [];
}

function displayMemories() {
    const container = document.getElementById("memory-list");
    if (!container) return;

    const memories = [...getMemories()].sort((a, b) =>
        String(b.date || "").localeCompare(String(a.date || ""))
    );

    if (!memories.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❤️</div>
                <h3>No memories yet</h3>
                <p>Save your first special memory above.</p>
            </div>`;
        return;
    }

    container.innerHTML = memories.map(memory => {
        const photos = getMemoryPhotos(memory).map((photo, index) => `
            <img class="memory-photo" src="${photo}"
                 alt="Memory photo ${index + 1}" loading="lazy">
        `).join("");

        return `
            <article class="memory-card">
                <span class="event-type">${escapeMemoryHTML(memory.date)}</span>
                <h3>${escapeMemoryHTML(memory.title)}</h3>
                <p>${escapeMemoryHTML(memory.note).replace(/\n/g, "<br>")}</p>
                ${photos ? `<div class="memory-photo-grid">${photos}</div>` : ""}
                <button type="button" class="secondary-button"
                    data-delete-memory="${escapeMemoryHTML(memory.id)}">
                    Delete memory
                </button>
            </article>`;
    }).join("");

    container.querySelectorAll("[data-delete-memory]").forEach(button => {
        button.addEventListener("click", () => {
            if (!confirm("Delete this memory?")) return;
            const id = button.dataset.deleteMemory;
            saveMemories(getMemories().filter(memory => String(memory.id) !== String(id)));
            displayMemories();
        });
    });
}

function compressMemoryPhoto(file) {
    return new Promise(resolve => {
        if (!file || !file.type.startsWith("image/")) return resolve(null);

        const reader = new FileReader();
        reader.onerror = () => resolve(null);
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => resolve(null);
            image.onload = () => {
                const maxSide = 1000;
                const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(image.width * scale));
                canvas.height = Math.max(1, Math.round(image.height * scale));
                canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/jpeg", 0.72));
            };
            image.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

document.addEventListener("DOMContentLoaded", () => {
    displayMemories();

    const saveButton = document.getElementById("save-memory");
    if (!saveButton) return;

    saveButton.addEventListener("click", async () => {
        const title = document.getElementById("memory-title").value.trim();
        const date = document.getElementById("memory-date").value;
        const note = document.getElementById("memory-note").value.trim();
        const photoInput = document.getElementById("memory-photos");

        if (!title || !date || !note) {
            alert("Please fill in the title, date, and memory.");
            return;
        }

        const files = Array.from(photoInput?.files || []).slice(0, 5);
        const photos = [];

        for (const file of files) {
            const photo = await compressMemoryPhoto(file);
            if (photo) photos.push(photo);
        }

        const memories = getMemories();
        memories.push({
            id: String(Date.now()) + Math.random().toString(16).slice(2),
            title,
            date,
            note,
            photos
        });

        if (!saveMemories(memories)) return;

        document.getElementById("memory-title").value = "";
        document.getElementById("memory-date").value = "";
        document.getElementById("memory-note").value = "";
        if (photoInput) photoInput.value = "";

        alert("Memory saved ❤️");
        displayMemories();
    });
});
