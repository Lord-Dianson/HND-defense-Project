// Water Effect (Ripple) Logic moved to ripple.js


// Password Toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('password-eye');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

import { getCurrentAccount, saveAccount, setCurrentAccount, isSessionValid, setLoginTimestamp } from './utils.js';
import { showToast } from './toast.js';
// axios is loaded globally via CDN

// Check if user is already logged in with valid session
(async function checkExistingSession() {
    const user = await getCurrentAccount();
    if (user && await isSessionValid()) {
        // Redirect to appropriate dashboard
        let dashboardUrl = '../index.html';
        if (user.role === 'admin' || user.role === 'super_admin') {
            dashboardUrl = '../superAdmin/mainDashboard.html';
        } else if (user.role === 'agent') {
            dashboardUrl = '../agent/profile.html';
        } else if (user.role === 'student') {
            dashboardUrl = '../student/profile.html';
        }
        window.location.href = dashboardUrl;
    }
})();

// Form Submission
const loginForm = document.getElementById('login-form');
loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const emailOrPhone = document.getElementById('emailOrPhone').value;
    const password = document.getElementById('password').value;
    const submitBtn = loginForm.querySelector('button[type="submit"]');

    const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Login';
    if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        submitBtn.disabled = true;
    }

    try {
        const body = {
            email: emailOrPhone,
            password: password
        };

        const response = await axios.post('http://localhost:3000/api/auth/login', body, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data.success) {
            const { user } = response.data;

            // Save account to multi-account storage
            await saveAccount(user);
            await setCurrentAccount(user.id);

            // Set login timestamp for session management
            await setLoginTimestamp(user.id);

            // Redirect based on role
            let dashboardUrl = '../index.html'; // Default
            if (user.role === 'admin' || user.role === 'super_admin') {
                dashboardUrl = '../superAdmin/mainDashboard.html';
            } else if (user.role === 'agent') {
                dashboardUrl = '../agent/profile.html';
            } else if (user.role === 'student') {
                dashboardUrl = '../student/profile.html';
            }

            window.location.href = dashboardUrl;
        } else {
            showToast(response.data.message || 'Login failed.', 'error');
        }
    } catch (error) {
        console.error('Login Error:', error);
        let msg = 'An error occurred during login.';
        if (error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        }
        showToast(msg, 'error');
    } finally {
        if (submitBtn) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
        }
    }
});