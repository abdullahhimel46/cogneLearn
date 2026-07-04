/**
 * EventOutbox - queues tiny event signals locally and flushes them to the backend.
 *
 * Backend receives only signals like: STREAK_7, STREAK_30, LOW_FOCUS, INACTIVITY.
 */
(function () {
    const OUTBOX_STORE = (window.LocalDB && LocalDB.STORES.EVENT_OUTBOX) || "event_outbox";
    const DEDUP_STORE = (window.LocalDB && LocalDB.STORES.EVENT_DEDUP) || "event_dedup";

    function todayKey() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function dedupKey(eventType, scope) {
        const s = scope || todayKey();
        return `${String(eventType || "").trim().toUpperCase()}:${s}`;
    }

    async function hasDedup(key) {
        if (!window.LocalDB) return false;
        const existing = await LocalDB.get(DEDUP_STORE, key);
        return !!existing;
    }

    async function markDedup(key) {
        if (!window.LocalDB) return;
        await LocalDB.put(DEDUP_STORE, { key, createdAt: new Date().toISOString() });
    }

    async function enqueue(eventType, options) {
        const type = String(eventType || "").trim().toUpperCase();
        if (!type) return;

        const scope = options && options.scope ? String(options.scope) : todayKey();
        const key = dedupKey(type, scope);

        // Deduplicate: only one event per (type, scope)
        if (await hasDedup(key)) {
            return;
        }

        const payload = {
            event: type,
            meta: (options && options.meta) ? options.meta : null
        };

        await LocalDB.add(OUTBOX_STORE, {
            createdAt: new Date().toISOString(),
            type,
            scope,
            key,
            payload
        });

        await markDedup(key);

        // Notify listeners (dashboard) that analytics/events changed.
        window.dispatchEvent(new CustomEvent("cognelearn:local-analytics-updated"));

        // Best-effort immediate flush.
        flush().catch(function () { });
    }

    async function flush(limit) {
        if (!window.LocalDB || !window.Api) return;
        if (navigator && navigator.onLine === false) return;

        const batchSize = Math.max(1, Math.min(25, Number(limit) || 10));
        const events = await LocalDB.getAll(OUTBOX_STORE);
        events.sort(function (a, b) {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });

        const slice = events.slice(0, batchSize);
        for (const item of slice) {
            try {
                // Backend expects { event: "STREAK_7" }
                await Api.post("/api/v1/events", Object.assign({ event: item.type }, item.payload && item.payload.meta ? { meta: item.payload.meta } : {}));
                await LocalDB.delete(OUTBOX_STORE, item.id);
            } catch (error) {
                // Stop on first failure to avoid hammering server.
                break;
            }
        }
    }

    window.addEventListener("online", function () {
        flush().catch(function () { });
    });

    window.EventOutbox = {
        enqueue,
        flush,
        dedupKey
    };
})();
