
import { setPreference, getPreference, isSessionValid } from './utils.js';
import { showToast } from './toast.js';

// axios is loaded globally via CDN

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
window.togglePassword = togglePassword;


const signupForm = document.getElementById('signup-form');
const photoUpload = document.getElementById('photo-upload');
const photoPreview = document.getElementById('photo-preview');

// Photo Upload Preview
// Photo Upload Preview
photoUpload.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            // Create an image element
            const img = document.createElement('img');
            img.src = e.target.result;
            img.className = 'w-full h-full object-cover';

            // Clear existing content and append the image
            photoPreview.innerHTML = '';
            photoPreview.appendChild(img);
        }
        reader.readAsDataURL(file);
    }
});


signupForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = signupForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    submitBtn.disabled = true;

    try {
        let profileUrl = '';

        // 1. Upload Photo to Cloudinary (if exists)
        if (photoUpload.files[0]) {
            const formData = new FormData();
            formData.append('file', photoUpload.files[0]);
            formData.append('upload_preset', 'lloorrdd'); // Replace with your upload preset
            formData.append('cloud_name', 'dmtgl1spo'); // Replace with your cloud name
            formData.append('folder', 'hosteLink Images'); // Target specific folder

            const cloudinaryRes = await axios.post(
                'https://api.cloudinary.com/v1_1/dmtgl1spo/image/upload', // Replace with your cloud name
                formData
            );
            profileUrl = cloudinaryRes.data.secure_url;
        }

        // 2. Prepare Data for Backend
        const body = {
            name: document.getElementById('fullname').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            phone: document.getElementById('phone').value,
            role: document.querySelector('input[name="userType"]:checked').value,
            profile: profileUrl
        };

        // 3. Send to Backend
        // Assuming the backend is served from /HosteLink/backend/public
        // Adjust the URL if your setup differs (e.g., localhost:3000)
        const response = await axios.post('http://localhost:3000/api/auth/send-otp', body, {
            headers: {
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        if (response.data.success) {
            // 4. Store otp_jti and timestamp in Capacitor Preferences
            const jti = response.data.jti;
            const timestamp = response.data.timestamp;
            await setPreference('otp_jti', jti);
            await setPreference('otp_timestamp', timestamp.toString());

            // Redirect to OTP page
            window.location.href = 'otp.html';
        } else {
            showToast(response.data.message || 'Signup failed. Please try again.', 'error');
        }

    } catch (error) {
        console.error('Signup Error:', error);
        let msg = 'An error occurred during signup.';

        if (error.code === 'ERR_NETWORK' || !window.navigator.onLine) {
            msg = 'Network connection failed. Please check your internet connection and try again.';
        } else if (error.response && error.response.data && error.response.data.message) {
            msg = error.response.data.message;
        }

        showToast(msg, 'error');
    } finally {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
    }
});