import { getCurrentAccount, isSessionValid, clearSession } from './utils.js';
import { showToast } from './toast.js';
// We assume axios is available globally via CDN in the HTML files

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 1. Check Authentication
        const user = await getCurrentAccount();
        // Token is in DB. Relies on user presence.

        if (!user) {
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
        if (user.role !== 'student') {
            showToast('Unauthorized access. Redirecting...', 'error');
            setTimeout(() => {
                if (user.role === 'agent') window.location.href = '../agent/profile.html';
                else window.location.href = '../index.html';
            }, 1500);
            return;
        }

        console.log('Student Dashboard Loaded for:', user.name);

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

        // 2. Populate Basic Info (Common Elements)
        // Sidebar/Header Profile Name
        const profileNameEls = document.querySelectorAll('.profile-name, #profile-name');
        profileNameEls.forEach(el => el.textContent = user.name);

        // Sidebar/Header Profile Image
        // If user.profile is a full URL (Cloudinary), use it. Else default.
        const profileImgEls = document.querySelectorAll('.profile-img, #profile-img, #sidebar-profile-img');
        const profileSrc = user.profile;

        profileImgEls.forEach(el => {
            el.src = profileSrc;
            // Handle error locally in case link breaks
            el.onerror = () => { el.src = '../../images/default_avatar.png'; };
        });

        // Email in profile page
        const emailEls = document.querySelectorAll('.profile-email, #email');
        emailEls.forEach(el => {
            if (el.tagName === 'INPUT') el.value = user.email;
            else el.textContent = user.email;
        });

        // Profile Page Specific Fields
        const fullNameEl = document.getElementById('full-name');
        if (fullNameEl) fullNameEl.value = user.name;

        const phoneEl = document.getElementById('phone');
        if (phoneEl && user.phone) phoneEl.value = user.phone;

        // 3. Logout Logic
        const logoutBtns = document.querySelectorAll('.logout-btn, #logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (confirm('Are you sure you want to logout?')) {
                    await clearSession();
                    window.location.href = '../auth/login.html';
                }
            });
        });

        // 4. Per-Page Logic
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'hostels.html') {
            // Logic for hostels (listing) is likely handled by specific inline scripts or main.js
            // But we can add specific user-based fetching here if needed.
            // For now, hostels might be public.
        } else if (currentPage === 'History.html') {
            fetchPaymentHistory(user.id, token);
        } else if (currentPage === 'profile.html') {
            // Profile fields already populated above where possible
        }

    } catch (err) {
        console.error('Dashboard Error:', err);
        // window.location.href = '../auth/login.html';
    }
});

// Fetch Payment History
async function fetchPaymentHistory(userId, token) {
    const container = document.getElementById('payment-history-container');
    if (!container) return; // Not on history page or element missing

    try {
        // Note: The user updated index.php to use /api/payments/history
        // The backend `getPaymentHistory` likely uses the token to identify the user, 
        // OR we pass the user ID. 
        // Let's assume the standard token-based auth first.

        const response = await axios.get(`http://localhost:3000/api/payments/history`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success && response.data.payments) {
            renderPaymentHistory(response.data.payments, container);
        } else {
            container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-400">No payment history found.</td></tr>';
        }

    } catch (error) {
        console.error('Error fetching payments:', error);
        container.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-400">Failed to load history.</td></tr>';
    }
}

function renderPaymentHistory(payments, container) {
    container.innerHTML = payments.map(payment => `
        <tr class="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td class="py-4 px-4 text-white">${payment.hostel_name || 'Hostel'}</td>
            <td class="py-4 px-4 text-gray-400">${payment.date}</td>
            <td class="py-4 px-4 text-brand-blue font-medium">${payment.amount} FCFA</td>
            <td class="py-4 px-4">
                <span class="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                    ${payment.status}
                </span>
            </td>
            <td class="py-4 px-4">
                <button onclick="downloadReceipt('${payment.id}')" class="text-gray-400 hover:text-white transition-colors">
                    <i class="fas fa-download"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Make globally available for onclick events (if needed)
window.downloadReceipt = (paymentId) => {
    showToast('Download receipt for: ' + paymentId, 'info');
    // Implement actual download logic calling backend
};
