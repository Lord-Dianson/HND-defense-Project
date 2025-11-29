  // Segmented toggle logic
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

        // Simple client-side validation and submit handler
        const form = document.getElementById('signupForm');

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                const firstInvalid = form.querySelector(':invalid');
                if (firstInvalid) firstInvalid.focus();
                return;
            }

            const payload = {
                name: document.getElementById('name').value.trim(),
                email: document.getElementById('email').value.trim(),
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value.trim(),
                accountType: accountType
            };

            console.log('Signup payload', payload);

            const btn = form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Creating...';

            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = 'Create account';
                form.reset();
                form.classList.remove('was-validated');
                setActiveSegment(segStudent);
                alert('Account created successfully for ' + payload.email);
            }, 900);
        });

        // Initialize default
        setActiveSegment(segStudent);