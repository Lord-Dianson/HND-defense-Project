import { getCurrentAccount, saveAccount, isSessionValid, clearSession } from './utils.js';
import { showToast } from './toast.js';
// We assume axios is available globally via CDN in the HTML files

const accountBalance = document.querySelector('.account-balance');
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Check Authentication
        const user = await getCurrentAccount();
        // Token is in DB. Relies on user presence.

        if (!user) {
            console.warn('No user info found, redirecting to notAuthorized.');
            window.location.href = '../general/notAuthorized.html';
            return;
        }

        // Check if session is still valid (< 7 days)
        const valid = await isSessionValid();
        if (!valid) {
            await clearSession();
            window.location.href = '../auth/login.html';
            return;
        }



        // Verify correct role
        if (user.role !== 'agent') {
            showToast('Unauthorized access. Redirecting...', 'error');
            setTimeout(() => {
                if (user.role === 'student') window.location.href = '../student/profile.html';
                else window.location.href = '../index.html';
            }, 1500);
            return;
        }

        console.log('Agent Dashboard Loaded for:', user.name);

        // Fetch Token from Backend
        let token = null;
        try {
            const tokenRes = await axios.post('http://localhost:3000/api/auth/get-token', {
                user_id: user.id
            });
            if (tokenRes.data.success) {
                token = tokenRes.data.token;
            }
        } catch (err) {
            console.error('Failed to retrieve token:', err);
        }

        // Fetch Fresh User Info (Profile, etc.)
        if (token) {
            try {
                const userRes = await axios.post('http://localhost:3000/api/users/by-id', {}, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (userRes.data.success) {
                    // Update user object and storage
                    Object.assign(user, userRes.data.user);
                    await saveAccount(user);
                    console.log('User info updated from backend.');
                    accountBalance.textContent = user.accountBalance + " FCFA";
                }
            } catch (err) {
                console.error('Failed to update user info:', err);
            }
        }

        // 2. Populate Basic Info
        // Profile Name (used throughout pages)
        const profileNameEls = document.querySelectorAll('.profile-name, #profile-name');
        profileNameEls.forEach(el => el.textContent = user.name);

        // Profile Image
        // Profile Image
        const profileImgEls = document.querySelectorAll('.profile-img, #profile-img, #sidebar-profile-img');
        const profileSrc = user.profile;

        profileImgEls.forEach(el => {
            // Strictly target elements meant to be profile images
            el.src = profileSrc;
            el.onerror = function () {
                this.onerror = null;
                this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
            };
        });

        // Email
        const emailEls = document.querySelectorAll('.profile-email, #email');
        emailEls.forEach(el => {
            if (el.tagName === 'INPUT') el.value = user.email;
            else el.textContent = user.email;
        });

        // Profile Page Specific Fields
        const displayNameEl = document.getElementById('display-name');
        if (displayNameEl) displayNameEl.textContent = user.name;

        const inputNameEl = document.getElementById('input-name');
        if (inputNameEl) inputNameEl.value = user.name;

        const inputPhoneEl = document.getElementById('input-phone');
        if (inputPhoneEl && user.phone) inputPhoneEl.value = user.phone;

        // 3. Logout Logic
        const logoutLinks = document.querySelectorAll('a[href*="login.html"]'); // Target all logout links
        logoutLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                // If it's strictly a logout button
                if (link.textContent.includes('Logout') || link.querySelector('.fa-sign-out-alt')) {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        await clearSession();
                        window.location.href = '../auth/login.html';
                    }
                }
            });
        });

        // 4. Per-Page Logic
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'history.html') {
            fetchAgentListings(token);
        } else if (currentPage === 'uploads.html') {
            setupUploadForm(token);
        } else if (currentPage === 'profile.html' || currentPage === '') {
            fetchActiveListingsCount(token);
        }

    } catch (err) {
        console.error('Agent Dashboard Error:', err);
    }
});

// Fetch Active Listings Count for Profile
async function fetchActiveListingsCount(token) {
    const countEl = document.getElementById('active-listings-count');
    const progressEl = document.getElementById('active-listings-progress');
    if (!countEl) return;

    try {
        const response = await axios.get('http://localhost:3000/api/agent/list-hostels', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.data.success && response.data.hostels) {
            const allListings = response.data.hostels;
            const verifiedListings = allListings.filter(h => h.verified == 1);

            countEl.textContent = verifiedListings.length;

            // Update progress bar (verified / total)
            if (progressEl && allListings.length > 0) {
                const percentage = (verifiedListings.length / allListings.length) * 100;
                progressEl.style.width = percentage + '%';
            } else if (progressEl) {
                progressEl.style.width = '0%';
            }
        }
    } catch (error) {
        console.error('Error fetching active listings count:', error);
    }
}

// Fetch Agent Listings (History)
async function fetchAgentListings(token) {
    const listContainer = document.querySelector('.space-y-3'); // Container for list items
    if (!listContainer) return;

    try {
        // Clear placeholder items if we are fetching real data (or keep them as skeleton if desired, but better to clear)
        // For now, let's append or replace. The user said "usage of info only, rest from db". 
        // We really should clear the hardcoded items first.

        const response = await axios.get('http://localhost:3000/api/agent/list-hostels', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success && response.data.hostels && response.data.hostels.length > 0) {
            listContainer.innerHTML = ''; // Clear hardcoded
            renderHostels(response.data.hostels, listContainer);
        } else {
            // If empty, maybe show empty state
            // listContainer.innerHTML = '<p class="text-center text-gray-500 py-10">No listings found.</p>';
        }
    } catch (error) {
        console.error('Error fetching listings:', error);
    }
}

function renderHostels(hostels, container) {
    container.innerHTML = hostels.map(hostel => `
        <div class="history-item group p-3 rounded-xl mb-3">
            <img src="${hostel.mainImage || 'https://via.placeholder.com/200'}"
                class="w-16 h-16 rounded-lg object-cover mr-4 border border-white/10 group-hover:scale-105 transition-transform">
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                    <h3 class="text-base font-bold text-white truncate">${hostel.name}</h3>
                    <span class="status-badge status-${hostel.status.toLowerCase()} text-[10px] px-2 py-0.5">${hostel.status}</span>
                </div>
                <p class="text-gray-400 text-xs mb-1"><i class="fas fa-map-marker-alt text-brand-gold mr-1"></i>
                    ${hostel.location}</p>
                <div class="flex items-center gap-3 text-[10px] text-gray-500">
                    <span><i class="fas fa-eye mr-1"></i> ${hostel.views || 0} Views</span>
                    <span><i class="fas fa-calendar mr-1"></i> ${new Date(hostel.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="flex flex-col gap-1.5 ml-3">
                <button class="text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-dark-main p-1.5 rounded-md transition-colors text-xs"><i class="fas fa-pen"></i></button>
            </div>
        </div>
    `).join('');
}

// Setup Upload Form
function setupUploadForm(token) {
    const form = document.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Use FormData for file uploads if needed, or JSON if just text. 
        // For now, let's gather basic inputs.
        // NOTE: Real implementation needs handling of file uploads/cloudinary etc. 
        // Assuming simple JSON for the moment based on previous interactions, or we stub it.

        const btn = form.querySelector('button[type="submit"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
        btn.disabled = true;

        try {
            // Gather data (simplified)
            // Implementation details "instructed later", this is just the detailed setup phase.
            showToast('Submission logic to be implemented with Cloudinary integration.', 'info');

        } catch (error) {
            console.error(error);
            showToast('Error submitting listing.', 'error');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });
}

// Use window scope for HTML onclick handlers
const saveCancelBtns = document.getElementById('save-cancel-btns');
const editBtn = document.getElementById('edit-btn');
const inputs = document.querySelectorAll('.editable-input');

window.enableEdit = function () {
    if (editBtn) editBtn.classList.add('hidden');
    if (saveCancelBtns) saveCancelBtns.classList.remove('hidden');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
        input.classList.add('editing');
    });
};

window.cancelEdit = function () {
    if (editBtn) editBtn.classList.remove('hidden');
    if (saveCancelBtns) saveCancelBtns.classList.add('hidden');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
        input.classList.remove('editing');
    });
};

window.saveProfile = async function () {
    const saveBtn = saveCancelBtns ? saveCancelBtns.querySelector('button:last-child') : null;
    if (!saveBtn) return;

    const originalText = saveBtn.innerText;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    saveBtn.disabled = true;

    try {
        // Get user info from storage
        const user = await getCurrentAccount();
        if (!user) {
            alert('Session expired. Please login again.');
            window.location.href = '../auth/login.html';
            return;
        }

        // Gather updated data
        const nameInput = document.getElementById('input-name');
        const phoneInput = document.getElementById('input-phone');

        const updatedData = {
            name: nameInput ? nameInput.value : user.name,
            phone: phoneInput ? phoneInput.value : user.phone,
        };

        // Call backend update endpoint
        const response = await axios.put(`http://localhost:3000/api/admin/users/${user.id}`, updatedData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            // Update storage with new data
            const updatedUser = { ...user, ...updatedData };
            await saveAccount(updatedUser);

            // Update display name
            const newName = updatedData.name;
            if (newName) {
                const displayName = document.getElementById('display-name');
                if (displayName) displayName.innerText = newName;
                // Update nav name if exists
                const navNs = document.querySelectorAll('.profile-name, #profile-name');
                navNs.forEach(el => el.textContent = newName);
            }

            // Show success message
            showToast('Profile updated successfully!', 'success');
        } else {
            showToast('Failed to update profile: ' + (response.data.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showToast('An error occurred while updating profile.', 'error');
    } finally {
        if (editBtn) editBtn.classList.remove('hidden');
        if (saveCancelBtns) saveCancelBtns.classList.add('hidden');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;

        inputs.forEach(input => {
            input.setAttribute('readonly', true);
            input.classList.remove('editing');
        });
    }
};
