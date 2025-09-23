// adminAuth.js
(() => {
    // --- Token Check ---
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
        window.location.replace("/admin_login.html");
        return;
    }

    // Expose a function globally to get the token
    window.getAdminToken = () => token;

    // --- Logout Handler ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("token");
            sessionStorage.removeItem("token");
            window.location.replace("/admin_login.html");
        });
    }
})();
