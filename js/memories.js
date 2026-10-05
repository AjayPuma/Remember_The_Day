/* ==========================================
   MEMORY MANAGEMENT
   ========================================== */

const MEMORY_KEY = "remember-a-day-memories";


/* ==========================================
   GET MEMORIES
   ========================================== */

function getMemories() {

    const data = localStorage.getItem(
        MEMORY_KEY
    );

    return data ? JSON.parse(data) : [];
}


/* ==========================================
   SAVE MEMORIES
   ========================================== */

function saveMemories(memories) {

    localStorage.setItem(
        MEMORY_KEY,
        JSON.stringify(memories)
    );

}


/* ==========================================
   DISPLAY MEMORIES
   ========================================== */

function displayMemories() {

    const container =
        document.getElementById("memory-list");

    if (!container) {
        return;
    }

    const memories = getMemories();

    if (memories.length === 0) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ❤️
                </div>

                <h3>No memories yet</h3>

                <p>
                    Save your first special memory above.
                </p>

            </div>
        `;

        return;
    }

    container.innerHTML = memories
        .reverse()
        .map(memory => `

            <article class="memory-card">

                <span class="event-type">
                    ${memory.date}
                </span>

                <h3>
                    ${memory.title}
                </h3>

                <p>
                    ${memory.note}
                </p>

            </article>

        `)
        .join("");
}


/* ==========================================
   SAVE NEW MEMORY
   ========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        displayMemories();

        const saveButton =
            document.getElementById("save-memory");

        if (!saveButton) {
            return;
        }

        saveButton.addEventListener(
            "click",
            () => {

                const title =
                    document.getElementById(
                        "memory-title"
                    ).value.trim();

                const date =
                    document.getElementById(
                        "memory-date"
                    ).value;

                const note =
                    document.getElementById(
                        "memory-note"
                    ).value.trim();


                if (!title || !date || !note) {

                    alert(
                        "Please fill all memory fields."
                    );

                    return;
                }


                const memories = getMemories();

                memories.push({

                    id: Date.now(),

                    title: title,

                    date: date,

                    note: note

                });


                saveMemories(memories);

                alert(
                    "Memory saved ❤️"
                );


                document.getElementById(
                    "memory-title"
                ).value = "";

                document.getElementById(
                    "memory-date"
                ).value = "";

                document.getElementById(
                    "memory-note"
                ).value = "";


                displayMemories();

            }
        );

    }
);