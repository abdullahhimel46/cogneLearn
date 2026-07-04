/**
 * NotificationManager - lightweight toast + optional Web Notifications.
 */
(function () {
    function ensureContainer() {
        let node = document.getElementById("cognelearn-toast-root");
        if (node) return node;

        node = document.createElement("div");
        node.id = "cognelearn-toast-root";
        node.style.position = "fixed";
        node.style.right = "16px";
        node.style.bottom = "16px";
        node.style.zIndex = "9999";
        node.style.display = "flex";
        node.style.flexDirection = "column";
        node.style.gap = "10px";
        document.body.appendChild(node);
        return node;
    }

    function toast(message, options) {
        const text = String(message || "").trim();
        if (!text) return;

        const root = ensureContainer();
        const node = document.createElement("div");
        node.textContent = text;
        node.style.padding = "10px 12px";
        node.style.borderRadius = "12px";
        node.style.background = "rgba(17, 24, 39, 0.92)";
        node.style.color = "#fff";
        node.style.fontSize = "14px";
        node.style.boxShadow = "0 10px 30px rgba(0,0,0,0.25)";
        node.style.maxWidth = "320px";
        node.style.lineHeight = "1.35";

        root.appendChild(node);

        const ms = Math.max(1500, Math.min(8000, options && options.durationMs ? Number(options.durationMs) : 2600));
        window.setTimeout(function () {
            node.style.opacity = "0";
            node.style.transform = "translateY(8px)";
            node.style.transition = "all 220ms ease";
            window.setTimeout(function () {
                try { root.removeChild(node); } catch (e) { }
            }, 260);
        }, ms);
    }

    async function browserNotification(title, body) {
        if (typeof Notification === "undefined") return false;

        try {
            if (Notification.permission === "default") {
                await Notification.requestPermission();
            }
            if (Notification.permission !== "granted") {
                return false;
            }
            new Notification(String(title || "cogneLearn"), { body: String(body || "") });
            return true;
        } catch (e) {
            return false;
        }
    }

    window.NotificationManager = {
        toast,
        browserNotification
    };
})();
