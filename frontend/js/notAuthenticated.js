document.addEventListener('DOMContentLoaded', () => {
    const countdownEl = document.getElementById('countdown');
    let timeLeft = 5;

    // Optional: Check if we want to confirm they really aren't authenticated before redirecting
    // But usually this page is shown BECAUSE they aren't, so we just force the redirect.

    const timer = setInterval(() => {
        timeLeft--;
        if (countdownEl) {
            countdownEl.textContent = timeLeft;
        }

        if (timeLeft <= 0) {
            clearInterval(timer);
            window.location.href = '../auth/signup.html';
        }
    }, 1000);
});
