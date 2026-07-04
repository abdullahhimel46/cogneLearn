/**
 * LocalDB - tiny IndexedDB wrapper (no external deps).
 *
 * Privacy-first design:
 * - Stores only summarized metrics and session metadata.
 * - Never stores webcam frames, face landmarks, or biometric history.
 */
(function () {
    const DB_VERSION = 2; // Incremented to ensure indices are created
    let scopedUserId = null;
    let dbPromise = null;

    function dbName() {
        return scopedUserId ? ("cognelearn_local_" + scopedUserId) : "cognelearn_local";
    }

    function setUserScope(userId) {
        const next = userId ? String(userId) : null;
        if (scopedUserId === next) {
            return;
        }
        scopedUserId = next;
        dbPromise = null;
    }

    const STORES = {
        STUDY_SESSIONS: "study_sessions",          // key: sessionId
        DAILY_ANALYTICS: "daily_analytics",        // key: date (YYYY-MM-DD)
        ACHIEVEMENT_CACHE: "achievement_cache",    // key: id ("default")
        ATTENTION_SAMPLES: "attention_samples",    // key: autoIncrement id
        EVENT_OUTBOX: "event_outbox",              // key: autoIncrement id
        EVENT_DEDUP: "event_dedup"                 // key: key (string)
    };

    function open() {
        if (dbPromise) {
            return dbPromise;
        }

        dbPromise = new Promise(function (resolve, reject) {
            const request = indexedDB.open(dbName(), DB_VERSION);

            request.onupgradeneeded = function (event) {
                const db = request.result;
                const transaction = request.transaction;

                if (!db.objectStoreNames.contains(STORES.STUDY_SESSIONS)) {
                    const store = db.createObjectStore(STORES.STUDY_SESSIONS, { keyPath: "sessionId" });
                    store.createIndex("by_endTime", "endTime");
                    store.createIndex("by_startTime", "startTime");
                    store.createIndex("by_date", "date");
                } else {
                    // Ensure new indices exist if store already exists
                    const store = transaction.objectStore(STORES.STUDY_SESSIONS);
                    if (!store.indexNames.contains("by_date")) {
                        store.createIndex("by_date", "date");
                    }
                }

                if (!db.objectStoreNames.contains(STORES.DAILY_ANALYTICS)) {
                    db.createObjectStore(STORES.DAILY_ANALYTICS, { keyPath: "date" });
                }

                if (!db.objectStoreNames.contains(STORES.ACHIEVEMENT_CACHE)) {
                    db.createObjectStore(STORES.ACHIEVEMENT_CACHE, { keyPath: "id" });
                }

                if (!db.objectStoreNames.contains(STORES.ATTENTION_SAMPLES)) {
                    const store = db.createObjectStore(STORES.ATTENTION_SAMPLES, { keyPath: "id", autoIncrement: true });
                    store.createIndex("by_sessionId", "sessionId");
                    store.createIndex("by_sessionId_ts", ["sessionId", "ts"]);
                }

                if (!db.objectStoreNames.contains(STORES.EVENT_OUTBOX)) {
                    const store = db.createObjectStore(STORES.EVENT_OUTBOX, { keyPath: "id", autoIncrement: true });
                    store.createIndex("by_createdAt", "createdAt");
                }

                if (!db.objectStoreNames.contains(STORES.EVENT_DEDUP)) {
                    db.createObjectStore(STORES.EVENT_DEDUP, { keyPath: "key" });
                }
            };

            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error || new Error("IndexedDB open failed")); };
        });

        return dbPromise;
    }

    function tx(db, storeName, mode) {
        return db.transaction(storeName, mode).objectStore(storeName);
    }

    function requestToPromise(request) {
        return new Promise(function (resolve, reject) {
            request.onsuccess = function () { resolve(request.result); };
            request.onerror = function () { reject(request.error); };
        });
    }

    async function get(storeName, key) {
        const db = await open();
        return requestToPromise(tx(db, storeName, "readonly").get(key));
    }

    async function put(storeName, value) {
        const db = await open();
        return requestToPromise(tx(db, storeName, "readwrite").put(value));
    }

    async function add(storeName, value) {
        const db = await open();
        return requestToPromise(tx(db, storeName, "readwrite").add(value));
    }

    async function del(storeName, key) {
        const db = await open();
        return requestToPromise(tx(db, storeName, "readwrite").delete(key));
    }

    async function getAll(storeName) {
        const db = await open();
        return requestToPromise(tx(db, storeName, "readonly").getAll());
    }

    async function getAllFromIndex(storeName, indexName, query) {
        const db = await open();
        const store = tx(db, storeName, "readonly");
        const index = store.index(indexName);
        return requestToPromise(index.getAll(query));
    }

    async function deleteWhereIndexEquals(storeName, indexName, value) {
        const db = await open();
        const transaction = db.transaction(storeName, "readwrite");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);

        return new Promise(function (resolve, reject) {
            const request = index.openCursor(IDBKeyRange.only(value));
            request.onerror = function () { reject(request.error); };
            request.onsuccess = function () {
                const cursor = request.result;
                if (!cursor) {
                    resolve();
                    return;
                }
                cursor.delete();
                cursor.continue();
            };
        });
    }

    window.LocalDB = {
        STORES,
        setUserScope,
        dbName,
        open,
        get,
        put,
        add,
        delete: del,
        getAll,
        getAllFromIndex,
        deleteWhereIndexEquals
    };
})();
