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


/* ==========================================
   EXPORT BACKUP
   ========================================== */

function exportBackup() {

    const backup = {

        occasions: getEvents(),

        memories:
            JSON.parse(
                localStorage.getItem(
                    "remember-a-day-memories"
                )
            ) || [],

        createdAt:
            new Date().toISOString()

    };


    const data =
        JSON.stringify(
            backup,
            null,
            2
        );


    const blob =
        new Blob(
            [data],
            {
                type: "application/json"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        `remember-a-day-backup-${new Date()
            .toISOString()
            .slice(0, 10)}.json`;


    link.click();


    URL.revokeObjectURL(url);

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