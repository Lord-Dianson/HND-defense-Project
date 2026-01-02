
import { showToast } from './toast.js';
import { getStudentInfo } from './utils.js';

let currentBookingId = null;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchHistory();
    setupReceiptModal();
    setupMobileMenu();
});

async function fetchHistory() {
    const tableBody = document.querySelector('tbody');
    if (!tableBody) return;

    try {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-brand-gold"></i></td></tr>';

        const userInfo = await getStudentInfo();
        if (!userInfo || !userInfo.id) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-red-400">Please log in to view history.</td></tr>';
            return;
        }

        // Get Token
        let token = null;
        try {
            const tokenRes = await axios.post('http://localhost:3000/api/auth/get-token', {
                user_id: userInfo.id
            });
            if (tokenRes.data.success) {
                token = tokenRes.data.token;
            }
        } catch (e) {
            console.error("Token fetch error", e);
        }

        const response = await axios.get('http://localhost:3000/api/bookings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data.success) {
            renderHistory(response.data.bookings, tableBody);
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-gray-400">No booking history found.</td></tr>';
        }

    } catch (error) {
        console.error('Error fetching history:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-red-400">Error loading history.</td></tr>';
    }
}

function renderHistory(bookings, container) {
    if (bookings.length === 0) {
        container.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-gray-400">No bookings found.</td></tr>';
        return;
    }

    container.innerHTML = bookings.map(booking => {
        const hostel = booking.hostel || {};
        const payment = booking.payment || {};
        const date = new Date(payment.paidAt || booking.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const amount = payment.amount ? parseInt(payment.amount).toLocaleString() + ' FCFA' : '0 FCFA';
        const isPaid = payment.status === 'completed';

        return `
         <tr class="hover:bg-white/5 transition-colors group">
            <td class="p-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-brand-blue/20 flex items-center justify-center text-brand-blue group-hover:scale-110 transition-transform duration-300">
                        <i class="fas fa-home"></i>
                    </div>
                    <div>
                        <p class="font-bold text-white group-hover:text-brand-blue transition-colors text-lg">${hostel.name || 'Unknown Hostel'}</p>
                        <p class="text-xs text-brand-cyan uppercase tracking-wider font-bold">${hostel.location || 'Unknown Location'}</p>
                    </div>
                </div>
            </td>
            <td class="p-6 text-gray-300 font-mono text-sm">${date}</td>
            <td class="p-6 font-bold text-white text-lg">${amount}</td>
            <td class="p-6">
                <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isPaid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'} text-xs font-bold border">
                    <span class="w-1.5 h-1.5 rounded-full ${isPaid ? 'bg-green-400' : 'bg-red-400'} animate-pulse"></span>
                    ${payment.status || 'Pending'}
                </span>
            </td>
            <td class="p-6 text-right">
                <button onclick="window.openReceiptModal('${booking.bookingID}')"
                    class="text-xs font-bold uppercase tracking-wider text-brand-blue hover:text-white px-5 py-2.5 rounded-xl border border-brand-blue/30 hover:bg-brand-blue transition-all">
                    <i class="fas fa-download mr-1"></i> Receipt (500 FCFA)
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function setupReceiptModal() {
    // Add modal HTML to body if not present (or assume it's there)
    // We will assume it's in the HTML or inject it. 
    // Ideally it should be in HTML, but I can inject it here to be safe if I don't want to edit HTML too much.
    // But I strictly need to update HTML anyway. I'll focus on Logic here.

    // Attach to window for onclick access
    window.openReceiptModal = (id) => {
        currentBookingId = id;
        const modal = document.getElementById('receipt-modal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            console.error('Receipt modal not found');
        }
    };

    const closeBtn = document.getElementById('close-receipt-modal');
    const modal = document.getElementById('receipt-modal');
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.id === 'receipt-backdrop') {
                modal.classList.add('hidden');
            }
        });
    }

    const form = document.getElementById('receipt-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            try {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                btn.disabled = true;

                const phone = document.getElementById('receipt-phone').value;
                const user = await getStudentInfo();

                // Fetch Token
                let token = null;
                const tokenRes = await axios.post('http://localhost:3000/api/auth/get-token', { user_id: user.id });
                if (tokenRes.data.success) token = tokenRes.data.token;

                // Simulate Payment or Verify Info
                // Here we just call the endpoint to get the URL.
                // In a real scenario, we would trigger a payment request first.

                const response = await axios.post('http://localhost:3000/api/bookings/receipt', {
                    bookingID: currentBookingId,
                    phone: phone
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.data.success && response.data.receiptUrl) {
                    showToast('Receipt Retrieved Successfully', 'success');
                    modal.classList.add('hidden');

                    // Trigger Download
                    const link = document.createElement('a');
                    link.href = response.data.receiptUrl;
                    link.download = `Receipt-${currentBookingId}.pdf`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                } else {
                    showToast(response.data.message || 'Failed to retrieve receipt', 'error');
                }

            } catch (error) {
                console.error('Receipt Error:', error);
                showToast(error.response?.data?.message || 'Error occurred', 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}

function setupMobileMenu() {
    // Re-implement or rely on existing script? 
    // The HTML has a script tag for setup, but history.js might overwrite or conflict. 
    // History.html has inline script for menu. Ideally I should remove the inline script in HTML and put it here.
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');

    if (menuToggle && mobileMenu) {
        menuToggle.addEventListener('click', () => {
            mobileMenu.classList.toggle('translate-x-full');
            if (mobileMenu.classList.contains('translate-x-full')) {
                if (menuIcon) menuIcon.classList.remove('opacity-0', 'scale-0');
                if (closeIcon) closeIcon.classList.add('opacity-0', 'scale-0');
            } else {
                if (menuIcon) menuIcon.classList.add('opacity-0', 'scale-0');
                if (closeIcon) closeIcon.classList.remove('opacity-0', 'scale-0');
            }
        });
    }
}
