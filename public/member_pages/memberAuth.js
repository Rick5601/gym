// memberAuth.js
(() => {
    // --- Token Check ---
    const token = localStorage.getItem("memberToken") || sessionStorage.getItem("memberToken");
    if (!token) {
        window.location.replace("/member_login.html");
        return;
    }

    // Expose a function globally to get the token
    window.getMemberToken = () => token;

    // --- Logout Handler ---
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("memberToken");
            sessionStorage.removeItem("memberToken");
            window.location.replace("/member_login.html");
        });
    }
})();
