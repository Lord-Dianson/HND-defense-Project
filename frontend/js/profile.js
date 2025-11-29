 // Utility to read from localStorage with fallback
    function readProfile() {
      return {
        name: localStorage.getItem('signup_name') || localStorage.getItem('profile_name') || 'Aku',
        email: localStorage.getItem('signup_email') || localStorage.getItem('profile_email') || 'you@example.com',
        phone: localStorage.getItem('signup_phone') || localStorage.getItem('profile_phone') || '+2376XXXXXXX',
        accountType: localStorage.getItem('signup_accountType') || localStorage.getItem('profile_accountType') || 'student',
        about: localStorage.getItem('profile_about') || 'Hostel manager and superhost.',
        avatarData: localStorage.getItem('profile_avatar') || '' // base64 data URL
      };
    }

    // Render profile into DOM
    function renderProfile() {
      const data = readProfile();
      document.getElementById('profileName').textContent = data.name;
      document.getElementById('profileEmail').textContent = data.email;
      document.getElementById('profilePhone').textContent = data.phone;
      document.getElementById('profileAccountType').textContent = capitalize(data.accountType);
      document.getElementById('displayName').textContent = data.name;
      document.getElementById('displayAccountType').textContent = capitalize(data.accountType);
      document.getElementById('profileAbout').textContent = data.about;

      // Avatar handling
      const avatarImg = document.getElementById('avatarImg');
      const avatarInitials = document.getElementById('avatarInitials');
      const avatarWrap = document.getElementById('avatarWrap');

      if (data.avatarData) {
        avatarImg.src = data.avatarData;
        avatarImg.style.display = 'block';
        avatarInitials.style.display = 'none';
      } else {
        avatarImg.style.display = 'none';
        // initials from name
        const initials = getInitials(data.name);
        avatarInitials.textContent = initials;
        avatarInitials.style.display = 'block';
      }
    }

    function capitalize(s) {
      if (!s) return s;
      return s.charAt(0).toUpperCase() + s.slice(1);
    }

    function getInitials(name) {
      if (!name) return 'U';
      const parts = name.trim().split(/\s+/);
      if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
      return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
    }

    // Avatar upload preview and save
    const avatarInput = document.getElementById('avatarInput');
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(ev) {
        const dataUrl = ev.target.result;
        // preview
        const avatarImg = document.getElementById('avatarImg');
        const avatarInitials = document.getElementById('avatarInitials');
        avatarImg.src = dataUrl;
        avatarImg.style.display = 'block';
        avatarInitials.style.display = 'none';
        // persist
        localStorage.setItem('profile_avatar', dataUrl);
      };
      reader.readAsDataURL(file);
    });

    // Remove avatar
    document.getElementById('removeAvatar').addEventListener('click', () => {
      localStorage.removeItem('profile_avatar');
      renderProfile();
    });

    // Edit profile modal wiring
    const editModalEl = document.getElementById('editModal');
    const editModal = new bootstrap.Modal(editModalEl, { backdrop: 'static' });

    document.getElementById('editProfile').addEventListener('click', () => {
      const data = readProfile();
      document.getElementById('editName').value = data.name;
      document.getElementById('editEmail').value = data.email;
      document.getElementById('editPhone').value = data.phone;
      document.getElementById('editAccountType').value = data.accountType;
      document.getElementById('editAbout').value = data.about;
      editModal.show();
    });

    document.getElementById('editForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('editName').value.trim();
      const email = document.getElementById('editEmail').value.trim();
      const phone = document.getElementById('editPhone').value.trim();
      const accountType = document.getElementById('editAccountType').value;
      const about = document.getElementById('editAbout').value.trim();

      // Save to localStorage (also mirror to signup keys if you want)
      localStorage.setItem('profile_name', name);
      localStorage.setItem('profile_email', email);
      localStorage.setItem('profile_phone', phone);
      localStorage.setItem('profile_accountType', accountType);
      localStorage.setItem('profile_about', about);

      // Optionally keep signup keys in sync
      // localStorage.setItem('signup_name', name);
      // localStorage.setItem('signup_email', email);
      // localStorage.setItem('signup_phone', phone);
      // localStorage.setItem('signup_accountType', accountType);

      renderProfile();
      editModal.hide();
    });

    // Sidebar nav behavior for in-page Profile only
    function initProfileNav(root = document) {
      const profileNavs = Array.from(root.querySelectorAll('.nav-item[data-target="profile"]'));
      profileNavs.forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          // remove active from all nav items
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          // set active on both copies
          document.querySelectorAll('.nav-item[data-target="profile"]').forEach(n => n.classList.add('active'));

          // show profile pane (already visible on this page)
          const offcanvasEl = document.getElementById('mobileMenu');
          const bsOff = bootstrap.Offcanvas.getInstance(offcanvasEl);
          if (bsOff) bsOff.hide();
        });

        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            item.click();
          }
        });
      });
    }
    initProfileNav(document);

    // Logout handlers
    document.getElementById('logoutDesktop').addEventListener('click', () => {
      if (confirm('Log out now?')) {
        // clear session-like keys (example)
        // localStorage.clear(); // optional
        window.location.href = '/login.html';
      }
    });
    document.getElementById('logoutMobile').addEventListener('click', () => {
      if (confirm('Log out now?')) {
        window.location.href = '/login.html';
      }
    });

    // Mobile offcanvas nav should close when clicking links that navigate away
    document.querySelectorAll('.offcanvas .nav-item[href]').forEach(a => {
      a.addEventListener('click', () => {
        const offcanvasEl = document.getElementById('mobileMenu');
        const bsOff = bootstrap.Offcanvas.getInstance(offcanvasEl);
        if (bsOff) bsOff.hide();
      });
    });

    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
      renderProfile();
    });
