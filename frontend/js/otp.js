/**
 * OTP Verification Flow
 * Handles 6-digit OTP input, verification, and account creation
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Get signup data from session buffer (Capacitor-like)
  const signupBuffer = window.hostelSession.getSignupBuffer();
  const jti = window.hostelSession.getOtpJti();
  const role = window.hostelSession.getSignupRole();

  if (!jti || !signupBuffer) {
    // Redirect to signup if data is missing
    alert('Session expired. Please sign up again.');
    window.location.href = '/HosteLink/frontend/views/auth/signup.html';
    return;
  }

  const credentials = signupBuffer.credentials;

  // Display email being verified
  document.getElementById('displayEmail').textContent = credentials.email;

  // Create 6 OTP input fields
  const otpInputsContainer = document.getElementById('otpInputs');
  const inputs = [];
  for (let i = 0; i < 6; i++) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'numeric';
    input.maxLength = '1';
    input.pattern = '[0-9]';
    input.className = 'otp-input';
    input.setAttribute('aria-label', `Digit ${i + 1}`);
    input.setAttribute('autocomplete', 'one-time-code');
    otpInputsContainer.appendChild(input);
    inputs.push(input);
  }

  // Elements
  const verifyBtn = document.getElementById('verifyBtn');
  const resendBtn = document.getElementById('resendBtn');
  const timerDisplay = document.getElementById('timerDisplay');
  const timerValue = document.getElementById('timerValue');
  const resendTimer = document.getElementById('resendTimer');
  const errorMessage = document.getElementById('errorMessage');
  const successMessage = document.getElementById('successMessage');

  let otpExpiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
  let resendCountdown = 0;
  let otpTimerId = null;
  let resendTimerId = null;

  /**
   * Start OTP expiry timer (5 minutes)
   */
  function startOTPTimer() {
    function updateOTPDisplay() {
      const now = Date.now();
      const remaining = Math.max(0, otpExpiryTime - now);
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;
      timerValue.textContent = timeStr;

      if (remaining <= 60000) {
        timerDisplay.classList.add('warning');
      }

      if (remaining <= 0) {
        clearInterval(otpTimerId);
        timerDisplay.innerHTML = 'Code expired';
        verifyBtn.disabled = true;
        resendBtn.disabled = false;
        clearInputs();
      }
    }

    updateOTPDisplay();
    otpTimerId = setInterval(updateOTPDisplay, 1000);
  }

  /**
   * Start resend button cooldown (60 seconds)
   */
  function startResendTimer() {
    resendCountdown = 60;
    resendBtn.disabled = true;
    
    function updateResendDisplay() {
      resendTimer.textContent = ` (${resendCountdown}s)`;
      resendCountdown--;

      if (resendCountdown < 0) {
        clearInterval(resendTimerId);
        resendBtn.disabled = false;
        resendTimer.textContent = '';
      }
    }

    updateResendDisplay();
    resendTimerId = setInterval(updateResendDisplay, 1000);
  }

  /**
   * Update UI when OTP input changes
   */
  function updateOTPInput(index) {
    const input = inputs[index];
    const value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
    input.value = value;

    if (value && index < inputs.length - 1) {
      inputs[index + 1].focus();
      input.classList.add('filled');
    } else if (!value) {
      input.classList.remove('filled');
    } else if (index === inputs.length - 1 && value) {
      input.classList.add('filled');
      verifyBtn.focus();
    }

    // Enable verify button if all 6 digits are filled
    const allFilled = inputs.every(inp => inp.value.length === 1);
    verifyBtn.disabled = !allFilled;
  }

  /**
   * Handle backspace navigation
   */
  inputs.forEach((input, idx) => {
    input.addEventListener('input', () => updateOTPInput(idx));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !input.value && idx > 0) {
        inputs[idx - 1].focus();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        inputs[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < inputs.length - 1) {
        inputs[idx + 1].focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (verifyBtn.disabled === false) {
          verifyBtn.click();
        }
      }
    });

    // Support paste of full code
    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').trim();
      const digits = paste.replace(/[^0-9]/g, '').slice(0, 6).split('');
      
      inputs.forEach((inp, i) => {
        inp.value = digits[i] || '';
        if (digits[i]) {
          inp.classList.add('filled');
        }
      });

      if (digits.length === 6) {
        verifyBtn.disabled = false;
        verifyBtn.focus();
      }
    });
  });

  /**
   * Clear all inputs
   */
  function clearInputs() {
    inputs.forEach(inp => {
      inp.value = '';
      inp.classList.remove('filled');
    });
    inputs[0].focus();
  }

  /**
   * Show error message
   */
  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
    clearInputs();
  }

  /**
   * Show success message
   */
  function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
  }

  /**
   * Handle OTP verification
   */
  verifyBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    const otp = inputs.map(inp => inp.value).join('');

    if (otp.length !== 6) {
      showError('Please enter all 6 digits');
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying...';

    try {
      const response = await fetch('/HosteLink/backend/routes/authRoutes.php/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jti: jti,
          otp: otp
        })
      });

      const data = await response.json();

      if (data.success) {
        showSuccess('Email verified! Logging you in...');

        // Get user info from buffered signup data
        const userInfo = {
          name: credentials.name,
          email: credentials.email,
          role: role,
          userId: data.user_id
        };

        // Set auth session using session manager (no localStorage)
        // Only sessionStorage is used for auto-login within this session
        window.hostelSession.setAuthSession(
          data.token || 'temp_' + Date.now(),
          data.user_id,
          userInfo
        );

        // Clear signup buffer from session
        window.hostelSession.clearSignupBuffer();

        // Redirect to dashboard after successful OTP verification
        setTimeout(() => {
          window.location.href = '/HosteLink/frontend/views/dashboard/profile.html';
        }, 1500);
      } else {
        showError(data.message || 'Invalid OTP. Please try again.');
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Code';
      }
    } catch (error) {
      console.error('Verification error:', error);
      showError('Error: ' + error.message);
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify Code';
    }
  });

  /**
   * Handle resend OTP
   */
  resendBtn.addEventListener('click', async (e) => {
    e.preventDefault();

    resendBtn.disabled = true;
    const originalText = resendBtn.textContent;
    resendBtn.textContent = 'Sending...';

    try {
      // Get current credentials from session manager buffer
      const signupBuffer = window.hostelSession.getSignupBuffer();
      if (!signupBuffer) {
        showError('Session expired. Please sign up again.');
        window.location.href = '/HosteLink/frontend/views/auth/signup.html';
        return;
      }

      const response = await fetch('/HosteLink/backend/routes/authRoutes.php/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: role,
          credentials: signupBuffer.credentials
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update buffer with new JTI if backend provided one
        if (data.jti) {
          window.hostelSession.setSignupBuffer(data.jti, signupBuffer.credentials, role);
        }

        // Reset timers and inputs
        otpExpiryTime = Date.now() + 5 * 60 * 1000;
        clearInterval(otpTimerId);
        clearInterval(resendTimerId);
        timerDisplay.classList.remove('warning');
        
        showSuccess('A new code has been sent to your email');
        clearInputs();
        
        startOTPTimer();
        startResendTimer();

        setTimeout(() => {
          successMessage.classList.remove('show');
        }, 4000);
      } else {
        showError(data.message || 'Failed to resend code');
        resendBtn.disabled = false;
        resendBtn.textContent = originalText;
      }
    } catch (error) {
      console.error('Resend error:', error);
      showError('Error: ' + error.message);
      resendBtn.disabled = false;
      resendBtn.textContent = originalText;
    }
  });

  // Initialize
  inputs[0].focus();
  startOTPTimer();
  startResendTimer();
});
