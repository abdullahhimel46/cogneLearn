/**
 * LocalAnalytics - privacy-first client-side analytics.
 *
 * Stores only:
 * - session metadata
 * - aggregated attention (avg/min/max + counts)
 * - daily rollups
 * - streak counters
 *
 * Never stores:
 * - webcam frames
 * - face landmarks
 * - biometric history
 */
(function () {
    const STORES = (window.LocalDB && LocalDB.STORES) || {};

    const THRESHOLDS = {
        LOW_FOCUS_AVG: 45,
        INACTIVITY_DAYS: 7
    };

    function isoDateOnly(value) {
        const d = value ? new Date(value) : new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    }

    function safeNumber(value, fallback) {
        const n = Number(value);
        return Number.isFinite(n) ? n : (fallback || 0);
    }

    async function recordAttentionSample(sessionId, score, ts) {
        if (!window.LocalDB || !sessionId) return;

        await LocalDB.add(STORES.ATTENTION_SAMPLES, {
            sessionId: String(sessionId),
            ts: ts || Date.now(),
            score: Math.max(0, Math.min(100, Math.round(safeNumber(score, 0))))
        });
    }

    async function computeAttentionSummary(sessionId) {
        if (!window.LocalDB || !sessionId) {
            return { avg: 0, min: 0, max: 0, count: 0, distractedCount: 0 };
        }

        const samples = await LocalDB.getAllFromIndex(STORES.ATTENTION_SAMPLES, "by_sessionId", String(sessionId));
        if (!samples || samples.length === 0) {
            return { avg: 0, min: 0, max: 0, count: 0, distractedCount: 0 };
        }

        let sum = 0;
        let min = 100;
        let max = 0;
        let distractedCount = 0;

        for (const item of samples) {
            const score = Math.max(0, Math.min(100, safeNumber(item.score, 0)));
            sum += score;
            min = Math.min(min, score);
            max = Math.max(max, score);
            if (score < 40) distractedCount += 1;
        }

        return {
            avg: Math.round(sum / samples.length),
            min,
            max,
            count: samples.length,
            distractedCount
        };
    }

    async function purgeAttentionSamples(sessionId) {
        if (!window.LocalDB || !sessionId) return;
        await LocalDB.deleteWhereIndexEquals(STORES.ATTENTION_SAMPLES, "by_sessionId", String(sessionId));
    }

    async function upsertSession(sessionRecord) {
        if (!window.LocalDB) return;
        await LocalDB.put(STORES.STUDY_SESSIONS, sessionRecord);
    }

    async function getAllSessions() {
        if (!window.LocalDB) return [];
        const sessions = await LocalDB.getAll(STORES.STUDY_SESSIONS);
        return Array.isArray(sessions) ? sessions : [];
    }

    function isCompletedSession(session) {
        if (!session) return false;
        if (session.completed === true) return true;
        const status = String(session.status || "").toLowerCase();
        return status === "completed";
    }

    async function recomputeDailyAnalyticsForDate(date) {
        if (!window.LocalDB) return;

        let daySessions;
        try {
            // Use index for better performance
            daySessions = await LocalDB.getAllFromIndex(STORES.STUDY_SESSIONS, "by_date", date);
        } catch (e) {
            // Fallback to manual filter if index fails
            const all = await getAllSessions();
            daySessions = all.filter(function (s) { return s && s.date === date; });
        }

        daySessions = (daySessions || []).filter(isCompletedSession);

        const totalFocusMinutes = daySessions.reduce(function (sum, s) { return sum + safeNumber(s.completedDuration, 0); }, 0);
        const sessionsCompleted = daySessions.length;
        const averageAttention = sessionsCompleted > 0
            ? Math.round(daySessions.reduce(function (sum, s) { return sum + safeNumber(s.avgAttention, 0); }, 0) / sessionsCompleted)
            : 0;

        await LocalDB.put(STORES.DAILY_ANALYTICS, {
            date,
            totalFocusMinutes,
            sessionsCompleted,
            averageAttention,
            updatedAt: new Date().toISOString()
        });
    }

    async function computeStreaks() {
        const sessions = (await getAllSessions()).filter(isCompletedSession);
        if (sessions.length === 0) {
            return { currentStreak: 0, bestStreak: 0 };
        }

        // Unique study dates
        const uniqueDates = Array.from(new Set(sessions.map(function (s) { return s.date; }).filter(Boolean)));
        uniqueDates.sort();

        // Best streak
        let best = 1;
        let run = 1;
        for (let i = 1; i < uniqueDates.length; i++) {
            const prev = new Date(uniqueDates[i - 1] + "T00:00:00");
            const curr = new Date(uniqueDates[i] + "T00:00:00");
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            if (diff === 1) {
                run += 1;
                best = Math.max(best, run);
            } else {
                run = 1;
            }
        }

        // Current streak (walk back from today)
        const today = isoDateOnly(new Date());
        const dateSet = new Set(uniqueDates);
        let current = 0;
        let cursor = new Date(today + "T00:00:00");
        while (dateSet.has(isoDateOnly(cursor))) {
            current += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return { currentStreak: current, bestStreak: best };
    }

    async function upsertAchievementCache(patch) {
        if (!window.LocalDB) return;

        const existing = await LocalDB.get(STORES.ACHIEVEMENT_CACHE, "default") || { id: "default" };
        const next = Object.assign({}, existing, patch || {}, { updatedAt: new Date().toISOString() });
        await LocalDB.put(STORES.ACHIEVEMENT_CACHE, next);
        return next;
    }

    async function getAchievementCache() {
        if (!window.LocalDB) return { currentStreak: 0, bestStreak: 0 };
        return await LocalDB.get(STORES.ACHIEVEMENT_CACHE, "default") || { id: "default", currentStreak: 0, bestStreak: 0 };
    }

    async function updateStreakEvents(streaks) {
        if (!window.EventOutbox) return;
        if (!streaks) return;

        if (streaks.currentStreak === 7) {
            await EventOutbox.enqueue("STREAK_7", { scope: isoDateOnly(new Date()) });
            if (window.NotificationManager) {
                NotificationManager.toast("🔥 7-day streak! Keep going.");
            }
        }
        if (streaks.currentStreak === 30) {
            await EventOutbox.enqueue("STREAK_30", { scope: isoDateOnly(new Date()) });
            if (window.NotificationManager) {
                NotificationManager.toast("🏆 30-day streak! Amazing consistency.");
            }
        }
    }

    async function detectInactivity() {
        const sessions = (await getAllSessions()).filter(isCompletedSession);
        if (sessions.length === 0) {
            return { inactiveDays: null, lastStudyDate: null };
        }

        sessions.sort(function (a, b) {
            return new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime();
        });

        const last = sessions[0];
        const lastDate = last && (last.endTime || last.startTime);
        if (!lastDate) {
            return { inactiveDays: null, lastStudyDate: null };
        }

        const diffDays = Math.floor((Date.now() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24));
        return { inactiveDays: diffDays, lastStudyDate: isoDateOnly(lastDate) };
    }

    async function maybeEmitInactivityEvent() {
        if (!window.EventOutbox) return;
        const inactivity = await detectInactivity();
        if (inactivity.inactiveDays == null) return;

        if (inactivity.inactiveDays >= THRESHOLDS.INACTIVITY_DAYS) {
            // scope is the last study date so we only send once per inactive period
            await EventOutbox.enqueue("INACTIVITY", { scope: inactivity.lastStudyDate || isoDateOnly(new Date()) });
            if (window.NotificationManager) {
                NotificationManager.toast("We miss you — time for a quick focus session?");
            }
        }
    }

    async function finalizeCompletedSession(serverSession) {
        if (!serverSession || !serverSession.sessionId) {
            return null;
        }

        const sessionId = String(serverSession.sessionId);
        const attention = await computeAttentionSummary(sessionId);
        const date = isoDateOnly(serverSession.endTime || serverSession.startTime || new Date());

        const scopedUserId = localStorage.getItem("cognelearn_scoped_user_id");

        const record = {
            sessionId,
            userId: scopedUserId || null,
            playlistId: serverSession.playlistId || null,
            videoId: serverSession.videoId || null,
            startTime: serverSession.startTime || null,
            endTime: serverSession.endTime || null,
            duration: safeNumber(serverSession.duration, 0),
            completedDuration: safeNumber(serverSession.completedDuration, safeNumber(serverSession.duration, 0)),
            status: serverSession.status || "completed",
            completed: true,
            date,
            avgAttention: attention.avg,
            attentionMin: attention.min,
            attentionMax: attention.max,
            attentionCount: attention.count,
            distractedCount: attention.distractedCount,
            updatedAt: new Date().toISOString(),
            source: "client"
        };

        await upsertSession(record);
        await purgeAttentionSamples(sessionId);
        await recomputeDailyAnalyticsForDate(date);

        const streaks = await computeStreaks();
        await upsertAchievementCache({
            currentStreak: streaks.currentStreak,
            bestStreak: streaks.bestStreak
        });

        await updateStreakEvents(streaks);

        // Low focus event: only send once per day if avg attention is low.
        if (attention.count > 0 && attention.avg > 0 && attention.avg < THRESHOLDS.LOW_FOCUS_AVG) {
            await EventOutbox.enqueue("LOW_FOCUS", { scope: date, meta: { avgAttention: attention.avg } });
            if (window.NotificationManager) {
                NotificationManager.toast("Focus dipped today — try a shorter session or reduce distractions.");
            }
        }

        // Best-effort inactivity evaluation after saving.
        await maybeEmitInactivityEvent();

        window.dispatchEvent(new CustomEvent("cognelearn:local-analytics-updated"));
        return record;
    }

    async function getDashboardStats() {
        const sessions = (await getAllSessions()).filter(isCompletedSession);

        const totalFocusMinutes = sessions.reduce(function (sum, s) { return sum + safeNumber(s.completedDuration, 0); }, 0);
        const totalSessions = sessions.length;

        const avgAttentionScore = totalSessions > 0
            ? Math.round(sessions.reduce(function (sum, s) { return sum + safeNumber(s.avgAttention, 0); }, 0) / totalSessions)
            : 0;

        const today = isoDateOnly(new Date());
        const todayFocusMinutes = sessions
            .filter(function (s) { return s.date === today; })
            .reduce(function (sum, s) { return sum + safeNumber(s.completedDuration, 0); }, 0);

        const completionRate = totalSessions > 0
            ? Math.round((sessions.filter(function (s) { return safeNumber(s.completedDuration, 0) >= safeNumber(s.duration, 0) * 0.8; }).length / totalSessions) * 100)
            : 0;

        const focusScore = totalSessions > 0
            ? Math.min(100, Math.round(
                sessions.reduce(function (sum, s) {
                    const duration = Math.max(1, safeNumber(s.duration, 0));
                    const completed = safeNumber(s.completedDuration, 0);
                    return sum + (completed / duration) * 100;
                }, 0) / totalSessions
            ))
            : 0;

        const streaks = await computeStreaks();

        const recommendations = [];
        if (focusScore < 50) recommendations.push("Try shorter study sessions to maintain focus.");
        if (totalSessions < 5) recommendations.push("Build consistency! Try to study at the same time each day.");
        if (completionRate < 70) recommendations.push("Work on completing more of your planned sessions.");
        if (avgAttentionScore < 60 && totalSessions > 0) recommendations.push("Your attention score is low. Try reducing distractions in your study environment.");
        if (recommendations.length === 0) recommendations.push("Great job! Keep up your excellent productivity habits!");

        // totalPlaylists is managed by dashboard.js after playlists load.
        return {
            totalFocusMinutes,
            totalSessions,
            avgAttentionScore,
            todayFocusMinutes,
            totalPlaylists: 0,
            focusScore,
            completionRate,
            maxStreak: streaks.bestStreak,
            recommendations
        };
    }

    async function getRecentSessions(limit) {
        const n = Math.max(1, Math.min(50, Number(limit) || 5));
        const sessions = (await getAllSessions()).filter(isCompletedSession);
        sessions.sort(function (a, b) {
            return new Date(b.endTime || b.startTime || 0).getTime() - new Date(a.endTime || a.startTime || 0).getTime();
        });
        return sessions.slice(0, n);
    }

    async function bootstrapFromServer() {
        // Optional bootstrap: if local DB is empty, copy minimal session metadata from server.
        // We DO NOT persist attentionScores coming from server.
        if (!window.Api || !window.StudySession || !window.LocalDB) return;

        const existing = await getAllSessions();
        if (existing.length > 0) return;

        try {
            const serverSessions = await StudySession.getAll();
            if (!Array.isArray(serverSessions)) return;

            for (const s of serverSessions) {
                if (!s || !s.sessionId) continue;
                const date = isoDateOnly(s.endTime || s.startTime || new Date());
                const scopedUserId = localStorage.getItem("cognelearn_scoped_user_id");
                await upsertSession({
                    sessionId: String(s.sessionId),
                    userId: scopedUserId || null,
                    playlistId: s.playlistId || null,
                    videoId: s.videoId || null,
                    startTime: s.startTime || null,
                    endTime: s.endTime || null,
                    duration: safeNumber(s.duration, 0),
                    completedDuration: safeNumber(s.completedDuration, 0),
                    status: s.status || "unknown",
                    completed: String(s.status || "").toLowerCase() === "completed",
                    date,
                    avgAttention: 0,
                    updatedAt: new Date().toISOString(),
                    source: "server-bootstrap"
                });
            }

            // Recompute daily rollups and streak cache.
            const dates = Array.from(new Set((await getAllSessions()).map(function (x) { return x.date; }).filter(Boolean)));
            for (const date of dates) {
                await recomputeDailyAnalyticsForDate(date);
            }
            const streaks = await computeStreaks();
            await upsertAchievementCache({ currentStreak: streaks.currentStreak, bestStreak: streaks.bestStreak });
        } catch (e) {
            // ignore bootstrap errors; dashboard can still use server analytics as fallback.
        }
    }

    async function getDailyAnalytics(limit) {
        if (!window.LocalDB) return [];
        const n = Math.max(1, Math.min(365, Number(limit) || 90));
        const all = await LocalDB.getAll(STORES.DAILY_ANALYTICS);
        all.sort(function (a, b) {
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        return all.slice(0, n);
    }

    window.LocalAnalytics = {
        THRESHOLDS,
        isoDateOnly,
        recordAttentionSample,
        computeAttentionSummary,
        finalizeCompletedSession,
        getAllSessions,
        getRecentSessions,
        getDailyAnalytics,
        getDashboardStats,
        getAchievementCache,
        maybeEmitInactivityEvent,
        bootstrapFromServer
    };
})();


