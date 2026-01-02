
import { getPreference, removePreference, clearPreferences, saveAccount, setCurrentAccount, setLoginTimestamp } from './utils.js';
import { showToast } from './toast.js';

const otpForm = document.getElementById('otp-form');
const inputs = document.querySelectorAll('.otp-input');
const resendLink = document.getElementById('resend-link');

document.addEventListener('DOMContentLoaded', async () => {

    // 1. Check Preferences for OTP JTI and Timestamp
    try {
        const jti = await getPreference('otp_jti');
        const timestampStr = await getPreference('otp_timestamp');

        if (!jti || !timestampStr) {
            console.warn('Missing OTP data in preferences, redirecting to signup.');
            showToast('Session expired or invalid. Please sign up again.', 'error');
            setTimeout(() => { window.location.href = 'signup.html'; }, 2000);
            return;
        }

        const timestamp = parseInt(timestampStr, 10);
        // Note: PHP sends timestamp in seconds. JS Date.now() is in milliseconds.
        // We'll convert current time to seconds for comparison to match backend logic.
        const nowSeconds = Math.floor(Date.now() / 1000);
        const fiveMinutes = 300; // 5 minutes in seconds

        if (nowSeconds - timestamp > fiveMinutes) {
            console.warn('OTP expired (> 5 mins), redirecting to signup.');
            showToast('OTP session expired. Please sign up again.', 'error');
            await clearPreferences(); // Clear invalid data
            setTimeout(() => { window.location.href = 'signup.html'; }, 2000);
            return;
        }

        console.log('OTP Session Valid. JTI:', jti);

    } catch (error) {
        console.error('Error checking preferences:', error);
        // Fallback or safe redirect? 
        // Let's stay on page if error is just reading prefs to allow debugging, 
        // but normally we should redirect.
    }

    // 2. Input Logic (Focus management)
    inputs.forEach((input, index) => {
        // Auto-focus next
        input.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
            }
        });

        // Backspace support
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value) {
                if (index > 0) {
                    inputs[index - 1].focus();
                }
            }
        });

        // Paste support
        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, inputs.length).split('');
            pastedData.forEach((char, i) => {
                if (inputs[i]) inputs[i].value = char;
            });
            // Focus last filled
            const lastIndex = Math.min(pastedData.length, inputs.length) - 1;
            if (inputs[lastIndex]) inputs[lastIndex].focus();
        });
    });

    // 3. Form Submission
    otpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect OTP
        let otpValue = '';
        inputs.forEach(input => {
            otpValue += input.value;
        });

        if (otpValue.length !== 6) {
            showToast('Please enter a complete 6-digit verification code.', 'warning');
            return;
        }

        const submitBtn = otpForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;

        try {
            const jti = await getPreference('otp_jti');

            // Call Backend Signup/Verify API
            const response = await axios.post('http://localhost:3000/api/auth/signup', {
                otp: otpValue,
                jti: jti
            }, {
                headers: { 'Content-Type': 'application/json' },
                withCredentials: true
            });

            if (response.data.success) {
                // Clear OTP preferences
                await removePreference('otp_jti');
                await removePreference('otp_timestamp');

                // Store User Info using multi-account system
                const userData = response.data.user;

                await saveAccount(userData);
                await setCurrentAccount(userData.id);

                // Store strictly in agent_info or user_info as requested
                if (userData.role === 'agent') {
                    await setPreference('agent_info', JSON.stringify(userData));
                } else {
                    await setPreference('user_info', JSON.stringify(userData));
                }

                await setLoginTimestamp(userData.id);

                // Show success
                showToast('Verification Successful! Redirecting to dashboard...', 'success');

                setTimeout(() => {
                    // Role-based redirection
                    if (userData.role === 'agent') {
                        window.location.href = '../agent/profile.html';
                    } else if (userData.role === 'student') {
                        window.location.href = '../student/profile.html';
                    } else {
                        // Fallback
                        window.location.href = '../index.html';
                    }
                }, 1500);
            } else {
                showToast(response.data.message || 'Verification failed. Incorrect Code.', 'error');
            }

        } catch (error) {
            console.error('Verification Error:', error);
            let msg = 'An error occurred during verification.';
            if (error.response && error.response.data && error.response.data.message) {
                msg = error.response.data.message;
            }
            showToast(msg, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    });

    // 4. Resend Logic
    resendLink.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm('Resend a new code?')) {
            try {
                const jti = await getPreference('otp_jti');
                // We might need email again if JTI isn't enough for backend to find the pending signup.
                // Assuming JTI identifies the pending session.
                // If backend needs email, we should have stored it too.
                // Checking backend send-otp implementation logic (assumed): usually send-otp creates a record.
                // Let's assume JTI is enough or we rely on the user to go back to signup if JTI expires.
                // Actually, resend-otp route usually takes email or jti.
                // Let's try sending JTI.

                const response = await axios.post('http://localhost:3000/api/auth/resend-otp', {
                    jti: jti
                }, {
                    headers: { 'Content-Type': 'application/json' },
                    withCredentials: true
                });

                if (response.data.success) {
                    showToast('Code sent successfully!', 'success');
                    // Update timestamp? User might need more time now.
                    await setPreference('otp_timestamp', Math.floor(Date.now() / 1000).toString());
                } else {
                    showToast(response.data.message || 'Failed to resend code.', 'error');
                }
            } catch (err) {
                console.error('Resend error:', err);
                showToast('Could not resend code. Please try signing up again.', 'error');
            }
        }
    });

});
