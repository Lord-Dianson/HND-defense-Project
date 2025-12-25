import { writePref } from '../utils/storage.js';

const segStudent = document.getElementById('segStudent');
        const segAgent = document.getElementById('segAgent');
        const accountNote = document.getElementById('accountNote');
        let accountType = 'student';

        function setActiveSegment(selectedBtn) {
            [segStudent, segAgent].forEach(btn => btn.classList.remove('active'));
            selectedBtn.classList.add('active');
            accountType = selectedBtn.dataset.value;
            accountNote.textContent = accountType === 'student' ? 'Signing up as a student' : 'Signing up as an agent';
        }

        segStudent.addEventListener('click', () => setActiveSegment(segStudent));
        segAgent.addEventListener('click', () => setActiveSegment(segAgent));

        // Password toggle
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('password');
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            togglePassword.innerHTML = type === 'password' ? '<i class="bi bi-eye"></i>' : '<i class="bi bi-eye-slash"></i>';
        });

        // Form validation + submit handler with OTP flow
        const form = document.getElementById('signupForm');

        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const credentials = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value.trim()
            };

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Sending OTP...';

            try {
                const response = await fetch('/HosteLink/backend/routes/authRoutes.php/send-otp', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        role: accountType,
                        credentials: credentials
                    })
                });

                const data = await response.json();

                if (data.success) {
                    // Buffer signup data using Capacitor Preferences
                    await writePref('signup_jti', data.jti);
                    await writePref('signup_credentials', credentials);
                    await writePref('signup_accountType', accountType);

                    // Redirect to OTP page
                    window.location.href = '/HosteLink/frontend/views/auth/otp.html';
                } else {
                    alert('Error: ' + (data.message || 'Failed to send OTP'));
                    btn.disabled = false;
                    btn.textContent = 'Create account';
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert('Error: ' + error.message);
                btn.disabled = false;
                btn.textContent = 'Create account';
            }
        });

        // Initialize default
        setActiveSegment(segStudent);