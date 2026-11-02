/* ==========================================
   REMEMBER A DAY
   STORAGE MANAGEMENT
   ========================================== */

const STORAGE_KEY = "remember-a-day-events";


/* ==========================================
   GET ALL EVENTS
   ========================================== */

function getEvents() {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
        return [];
    }

    return JSON.parse(data);
}


/* ==========================================
   SAVE ALL EVENTS
   ========================================== */

function saveEvents(events) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}


/* ==========================================
   ADD EVENT
   ========================================== */

function addEvent(event) {
    const events = getEvents();

    event.id = Date.now();

    events.push(event);

    saveEvents(events);
}


/* ==========================================
   DELETE EVENT
   ========================================== */

function deleteEvent(id) {
    const events = getEvents();

    const updatedEvents = events.filter(event => event.id !== id);

    saveEvents(updatedEvents);
}

/* ==========================================
   BACKUP & RESTORE
   ========================================== */



function exportBackup() {
    try {
        const memoriesData = localStorage.getItem("remember-a-day-memories");

        const backup = {
            occasions: getEvents(),
            memories: memoriesData ? JSON.parse(memoriesData) : [],
            createdAt: new Date().toISOString()
        };

        const blob = new Blob(
            [JSON.stringify(backup, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `remember-a-day-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        // Allow the browser time to start the download.
        setTimeout(() => URL.revokeObjectURL(url), 1000);

    } catch (error) {
        console.error("Backup export failed:", error);
        alert("Could not export backup. Please check the browser console.");
    }
}



/* ==========================================
   IMPORT BACKUP
   ========================================== */

function importBackup(file) {

    const reader =
        new FileReader();


    reader.onload = function () {

        try {

            const backup =
                JSON.parse(
                    reader.result
                );


            /* ==============================
               VALIDATE BACKUP
               ============================== */

            if (
                !backup.occasions ||
                !Array.isArray(
                    backup.occasions
                )
            ) {

                throw new Error(
                    "Invalid backup file"
                );

            }


            /* ==============================
               SAVE OCCASIONS
               ============================== */

            saveEvents(
                backup.occasions
            );


            /* ==============================
               SAVE MEMORIES
               ============================== */

            if (
                backup.memories &&
                Array.isArray(
                    backup.memories
                )
            ) {

                localStorage.setItem(

                    "remember-a-day-memories",

                    JSON.stringify(
                        backup.memories
                    )

                );

            }


            alert(
                "Backup restored successfully! 🎉"
            );


            location.reload();


        } catch (error) {

            alert(
                "This backup file is not valid."
            );

            console.error(error);

        }

    };


    reader.readAsText(file);

}