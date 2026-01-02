
import { showToast } from './toast.js';
import { getStudentInfo, setPreference } from './utils.js';

// Global state for filtering and booking
let allHostels = [];
let displayedHostels = [];
let selectedAmenities = [];
const HOSTELS_PER_PAGE = 9;
let currentPage = 1;
let bookingState = { hostel: null, years: 1 };

document.addEventListener('DOMContentLoaded', async () => {
    await fetchHostels();
    setupFilters();
    setupAmenitiesAccordion();
    setupLoadMore();
    setupSidebar();
    setupMobileMenu();
});

async function fetchHostels() {
    const grid = document.getElementById('hostel-grid');
    if (!grid) return;

    try {
        grid.innerHTML = '<div class="col-span-full text-center py-20"><i class="fas fa-spinner fa-spin text-3xl text-brand-gold"></i></div>';

        const response = await fetch('http://localhost:3000/api/hostels');
        const data = await response.json();

        if (data.success) {
            allHostels = data.hostels.filter(h => h.verified == 1);
            displayedHostels = [...allHostels];
            currentPage = 1;
            renderHostelsPaginated();
            updateLoadMoreButton();
        } else {
            grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-400">Failed to load hostels.</div>';
            showToast('Failed to load hostels.', 'error');
        }

    } catch (error) {
        console.error('Error fetching hostels:', error);
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-red-400">Error loading data.</div>';
        showToast('Error connecting to server.', 'error');
    }
}

function renderHostelsPaginated() {
    const grid = document.getElementById('hostel-grid');
    if (!grid) return;

    const startIndex = 0;
    const endIndex = currentPage * HOSTELS_PER_PAGE;
    const hostelsToShow = displayedHostels.slice(startIndex, endIndex);

    if (hostelsToShow.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">No hostels found matching your criteria.</div>';
        return;
    }

    grid.innerHTML = hostelsToShow.map(hostel => createHostelCard(hostel)).join('');

    const countInfo = document.getElementById('hostel-count');
    if (countInfo) {
        countInfo.textContent = `Showing ${hostelsToShow.length} of ${displayedHostels.length} hostels`;
    }
}

function updateLoadMoreButton() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    const loadMoreContainer = document.getElementById('load-more-container');

    if (!loadMoreBtn) return;

    const totalShown = currentPage * HOSTELS_PER_PAGE;
    const remaining = displayedHostels.length - totalShown;

    if (remaining <= 0) {
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
    } else {
        if (loadMoreContainer) loadMoreContainer.classList.remove('hidden');
        loadMoreBtn.innerHTML = `<span>Load More (${remaining} remaining)</span> <i class="fas fa-arrow-down ml-2 group-hover:translate-y-1 transition-transform"></i>`;
    }
}

function setupLoadMore() {
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!loadMoreBtn) return;

    loadMoreBtn.addEventListener('click', () => {
        loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        loadMoreBtn.disabled = true;

        setTimeout(() => {
            currentPage++;
            renderHostelsPaginated();
            updateLoadMoreButton();
            loadMoreBtn.disabled = false;
        }, 300);
    });
}

function createHostelCard(hostel) {
    const facilities = hostel.facilities ? hostel.facilities.split(',') : [];
    const facilityIcons = getFacilityIcons();

    const tagsHtml = facilities.slice(0, 4).map(fac => {
        const icon = facilityIcons[fac.trim()] || 'fa-check';
        return `<span class="px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300 flex items-center gap-1 border border-white/5"><i class="fas ${icon} text-brand-blue text-xs"></i> ${fac.trim()}</span>`;
    }).join('');

    const priceDisplay = hostel.price >= 1000 ? (hostel.price / 1000) + 'k' : hostel.price;

    return `
    <div class="hostel-card glass-card rounded-2xl overflow-hidden group cursor-pointer relative h-full flex flex-col border border-white/5 hover:-translate-y-1 hover:shadow-2xl transition-all duration-500" onclick="viewHostelDetails('${hostel.hostelID}')">
             <div class="relative h-40 overflow-hidden">
                <img src="${hostel.image || 'https://via.placeholder.com/400x300?text=No+Image'}"
                    class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    alt="${hostel.name}">
                <div class="absolute inset-0 bg-gradient-to-t from-dark-card via-transparent to-transparent"></div>
                ${hostel.price > 400000 ? '<div class="absolute top-3 right-3 bg-brand-gold/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-dark-main text-xs font-bold uppercase tracking-wider shadow-lg">Premium</div>' : ''}
                ${(hostel.roomsLeft !== undefined && hostel.roomsLeft !== null) ? (() => {
            let colorClass = 'bg-brand-blue/90';
            let icon = 'fa-check-circle';
            if (hostel.roomsLeft === 0) {
                colorClass = 'bg-gray-500/90'; // Grey/Red for 0
                icon = 'fa-ban';
            } else if (hostel.roomsLeft < 5) {
                colorClass = 'bg-red-500/90'; // Urgent
                icon = 'fa-fire';
            } else if (hostel.roomsLeft < 10) {
                colorClass = 'bg-orange-500/90'; // Warning
                icon = 'fa-clock';
            }
            return `<div class="absolute top-3 left-3 ${colorClass} backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-bold uppercase tracking-wider shadow-lg flex items-center gap-1"><i class="fas ${icon}"></i> ${hostel.roomsLeft} Rooms Left</div>`;
        })() : ''}
                
                <div class="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                        <h3 class="text-lg font-bold mb-0.5 text-white group-hover:text-brand-blue transition-colors truncate w-48">${hostel.name}</h3>
                        <p class="text-gray-200 text-xs flex items-center gap-1.5 font-medium location-text">
                            <i class="fas fa-map-marker-alt text-brand-blue text-xs"></i> <span>${hostel.location}</span>
                        </p>
                        ${hostel.roomType ? `<p class="text-brand-gold text-[10px] font-bold uppercase tracking-wider mt-1"><i class="fas fa-door-open mr-1"></i>${hostel.roomType}</p>` : ''}
                    </div>
                </div>
            </div>
            
            <div class="p-4 flex-1 flex flex-col pt-2 bg-white/[0.02]">
                <div class="flex justify-between items-center mb-4 pt-1 border-b border-white/5 pb-3">
                    <div class="text-2xl font-bold text-brand-blue">${priceDisplay} <span class="text-xs text-gray-400 font-normal align-middle">/ Year</span></div>
                    <div class="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                         <i class="fas fa-user-group text-brand-blue text-xs"></i>
                         <span class="text-xs text-gray-300 font-medium">${hostel.capacity > 0 ? hostel.capacity : 'N/A'} people/room</span>
                    </div>
                </div>

                <div class="flex flex-wrap gap-1.5 mb-4">
                    ${tagsHtml}
                </div>

                <div class="mt-auto">
                    <button class="w-full bg-white/5 hover:bg-brand-blue border border-white/10 hover:border-brand-blue text-white font-semibold py-2.5 px-4 rounded-xl transition-all text-sm group-hover:shadow-lg group-hover:shadow-blue-500/20">
                        View Details
                    </button>
                </div>
            </div>
        </div >
    `;
}

function setupFilters() {
    const searchInput = document.getElementById('search-input');
    const priceRange = document.getElementById('price-range');
    const priceVal = document.getElementById('price-val');
    const clearBtn = document.getElementById('clear-filters-btn');

    function applyFilters() {
        let filtered = allHostels;

        if (searchInput && searchInput.value) {
            const term = searchInput.value.toLowerCase();
            filtered = filtered.filter(h =>
                h.location.toLowerCase().includes(term) ||
                h.name.toLowerCase().includes(term)
            );
        }

        if (priceRange) {
            const max = parseInt(priceRange.value);
            filtered = filtered.filter(h => h.price <= max);
        }

        if (selectedAmenities.length > 0) {
            filtered = filtered.filter(h => {
                if (!h.facilities) return false;
                const hostelFacilities = h.facilities.toLowerCase();
                return selectedAmenities.every(amenity =>
                    hostelFacilities.includes(amenity.toLowerCase())
                );
            });
        }

        displayedHostels = filtered;
        currentPage = 1;
        renderHostelsPaginated();
        updateLoadMoreButton();
    }

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (priceRange) {
        priceRange.addEventListener('input', (e) => {
            const value = parseInt(e.target.value);
            if (priceVal) priceVal.textContent = value.toLocaleString();
            applyFilters();
        });
    }

    document.querySelectorAll('.amenity-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const amenity = btn.dataset.amenity;
            btn.classList.toggle('active');
            if (selectedAmenities.includes(amenity)) {
                selectedAmenities = selectedAmenities.filter(a => a !== amenity);
            } else {
                selectedAmenities.push(amenity);
            }
            updateAmenityCount();
            applyFilters();
        });
    });

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            if (priceRange) {
                priceRange.value = priceRange.max;
                if (priceVal) priceVal.textContent = parseInt(priceRange.max).toLocaleString();
            }
            selectedAmenities = [];
            document.querySelectorAll('.amenity-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-brand-blue/30', 'border-brand-blue', 'text-brand-blue');
            });
            updateAmenityCount();

            displayedHostels = [...allHostels];
            currentPage = 1;
            renderHostelsPaginated();
            updateLoadMoreButton();
            showToast('All filters cleared', 'info');
        });
    }
}

function updateAmenityCount() {
    const countEl = document.getElementById('amenity-count');
    if (countEl) countEl.textContent = selectedAmenities.length > 0 ? `${selectedAmenities.length} selected` : '0 selected';
}

function setupAmenitiesAccordion() {
    const toggle = document.getElementById('amenities-toggle');
    const panel = document.getElementById('amenities-panel');
    const arrow = document.getElementById('amenities-arrow');
    const showMoreBtn = document.getElementById('show-more-amenities');
    const moreAmenities = document.getElementById('more-amenities');

    if (toggle && panel) {
        toggle.addEventListener('click', () => {
            panel.classList.toggle('hidden');
            if (arrow) arrow.classList.toggle('rotate-180');
        });
    }

    if (showMoreBtn && moreAmenities) {
        showMoreBtn.addEventListener('click', () => {
            moreAmenities.classList.toggle('hidden');
            if (moreAmenities.classList.contains('hidden')) {
                showMoreBtn.innerHTML = '<i class="fas fa-plus-circle"></i> Show more amenities';
            } else {
                showMoreBtn.innerHTML = '<i class="fas fa-minus-circle"></i> Show fewer';
            }
        });
    }
}

// ------ SIDEBAR & BOOKING LOGIC ------

function setupSidebar() {
    const overlay = document.getElementById('booking-overlay');
    const closeBtn = document.getElementById('close-sidebar');
    const checkoutBtn = document.getElementById('checkout-btn');
    const decreaseBtn = document.getElementById('decrease-year');
    const increaseBtn = document.getElementById('increase-year');

    const closeSidebar = () => {
        const sidebar = document.getElementById('booking-sidebar');
        if (sidebar && overlay) {
            sidebar.classList.add('translate-x-full');
            overlay.classList.add('opacity-0');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 300);
            document.body.style.overflow = '';
        }
    };

    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay) overlay.addEventListener('click', closeSidebar);

    if (decreaseBtn) {
        decreaseBtn.addEventListener('click', () => {
            if (bookingState.years > 1) {
                bookingState.years--;
                updatePrice();
            }
        });
    }

    if (increaseBtn) {
        increaseBtn.addEventListener('click', () => {
            if (bookingState.years < 5) {
                bookingState.years++;
                updatePrice();
            }
        });
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
}

window.viewHostelDetails = (id) => {
    const hostel = allHostels.find(h => h.hostelID === id);
    if (!hostel) {
        showToast('Hostel details not found.', 'error');
        return;
    }
    openSidebar(hostel);
};

function openSidebar(hostel) {
    bookingState.hostel = hostel;
    bookingState.years = 1;

    document.body.style.overflow = 'hidden';

    const imgEl = document.getElementById('sidebar-image');
    if (imgEl) imgEl.src = hostel.image || 'https://via.placeholder.com/400x300?text=Hostel';

    setText('sidebar-name', hostel.name);
    setText('sidebar-location', hostel.location);

    const roomTypeEl = document.getElementById('sidebar-room-type');
    if (roomTypeEl) roomTypeEl.textContent = hostel.roomType || 'Standard Room';

    setText('sidebar-description', hostel.description || 'Welcome to ' + hostel.name + '.');

    const statusEl = document.getElementById('sidebar-status');
    if (statusEl) {
        if (hostel.status === 'full') {
            statusEl.textContent = 'Full';
            statusEl.className = 'px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-400 border border-red-500/20 mb-2 inline-block';
        } else {
            statusEl.textContent = 'Available';
            statusEl.className = 'px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-green-500/20 text-green-400 border border-green-500/20 mb-2 inline-block';
        }
    }

    const facContainer = document.getElementById('sidebar-facilities');
    if (facContainer) {
        const facilities = hostel.facilities ? hostel.facilities.split(',') : [];
        const icons = getFacilityIcons();
        facContainer.innerHTML = facilities.map(fac => {
            const icon = icons[fac.trim()] || 'fa-check';
            // Compact pills for no-scroll sidebar
            return `<span class="px-2 py-1 rounded-md bg-white/10 backdrop-blur-md border border-white/10 text-[10px] uppercase font-bold tracking-wider text-gray-200 flex items-center gap-1.5 shadow-sm"><i class="fas ${icon} text-brand-gold text-[10px]"></i> ${fac.trim()}</span>`;
        }).join('');
    }

    updatePrice();

    const sidebar = document.getElementById('booking-sidebar');
    const overlay = document.getElementById('booking-overlay');
    if (sidebar && overlay) {
        overlay.classList.remove('hidden');
        void overlay.offsetWidth;
        overlay.classList.remove('opacity-0');
        sidebar.classList.remove('translate-x-full');
    }
}

function updatePrice() {
    const { hostel, years } = bookingState;
    if (!hostel) return;

    const basePrice = parseInt(hostel.price) || 0;
    const rentTotal = basePrice * years;
    const bookingFee = 2000;
    const grandTotal = rentTotal + bookingFee;

    setText('duration-display', years);

    const durationLabel = document.getElementById('duration-label');
    if (durationLabel) {
        durationLabel.textContent = `${years} Academic Year${years > 1 ? 's' : ''} `;
    }

    setText('rent-calc', years > 1 ? `${years} yrs` : '1 yr');
    setText('rent-total', rentTotal.toLocaleString() + ' FCFA');
    setText('grand-total', grandTotal.toLocaleString() + ' FCFA');

    const decreaseBtn = document.getElementById('decrease-year');
    if (decreaseBtn) {
        decreaseBtn.disabled = years <= 1;
        decreaseBtn.style.opacity = years <= 1 ? '0.5' : '1';
    }
}

async function handleCheckout() {
    if (!bookingState.hostel) return;

    // Close Sidebar first
    const sidebar = document.getElementById('booking-sidebar');
    const overlay = document.getElementById('booking-overlay');
    if (sidebar && overlay) {
        sidebar.classList.add('translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => {
            overlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    // Open Modal with a slight delay to allow sidebar to start closing
    setTimeout(() => {
        const modal = document.getElementById('checkout-modal');
        if (modal) {
            modal.classList.remove('hidden');
            document.getElementById('modal-total-amount').textContent = calculateTotal().grandTotal.toLocaleString() + ' FCFA';
        } else {
            console.error('Checkout modal not found');
        }
    }, 300);
}

function calculateTotal() {
    const basePrice = parseInt(bookingState.hostel.price) || 0;
    const totalRent = basePrice * bookingState.years;
    return {
        basePrice,
        totalRent,
        grandTotal: totalRent + 2000
    };
}

function setupCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const closeBtn = document.getElementById('close-modal');
    const form = document.getElementById('checkout-form');

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
    }

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            try {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                btn.disabled = true;

                const phone = document.getElementById('momo-number').value;
                const { basePrice, totalRent, grandTotal } = calculateTotal();

                let userInfo = {};
                let token = null;
                try {
                    const user = await getStudentInfo();
                    if (user) userInfo = user;
                    
                    // Fetch fresh token for this request
                    const tokenRes = await axios.post('http://localhost:3000/api/auth/get-token', {
                        user_id: userInfo.id
                    });
                    if (tokenRes.data.success) {
                        token = tokenRes.data.token;
                    }
                } catch (e) { 
                    console.error('Error fetching user info or token:', e);
                }

                // STEP 1: GENERATE RECEIPT PDF
                showToast('Generating Receipt...', 'info');
                const receiptData = {
                    payer_name: userInfo.name || "Guest Student",
                    hostel_name: bookingState.hostel.name,
                    booking_period: bookingState.years,
                    rent_amount: grandTotal // Total amount paid
                };

                const pdfResponse = await axios.post('http://localhost:3000/api/receipts/generate', receiptData, {
                    headers: { 'Authorization': `Bearer ${token || ''}` },
                    responseType: 'blob'
                });

                const pdfBlob = new Blob([pdfResponse.data], { type: 'application/pdf' });

                // STEP 2: UPLOAD TO CLOUDINARY
                showToast('Securing Transaction...', 'info');
                const formData = new FormData();
                formData.append('file', pdfBlob, `Receipt-${Date.now()}.pdf`);
                formData.append('upload_preset', 'lloorrdd');
                formData.append('cloud_name', 'dmtgl1spo');
                formData.append('folder', 'hosteLink Receipts');

                const cloudinaryRes = await axios.post(
                    'https://api.cloudinary.com/v1_1/dmtgl1spo/auto/upload', // auto for pdfs usually, or raw/image
                    formData
                );
                const receiptUrl = cloudinaryRes.data.secure_url;

                // STEP 3: BOOK HOSTEL (Payment then Booking)
                showToast('Finalizing Booking...', 'info');
                const bookingPayload = {
                    hostelID: bookingState.hostel.hostelID,
                    studentID: userInfo.id,
                    amount: grandTotal,
                    phone: phone,
                    receipt: receiptUrl,
                    checkOut: new Date(new Date().setFullYear(new Date().getFullYear() + bookingState.years)).toISOString().split('T')[0]
                };
                console.log('Booking payload:', bookingPayload);
                console.log('Token:', token);
                
                const bookingResponse = await axios.post('http://localhost:3000/api/hostels/book', bookingPayload, {
                    headers: { 'Authorization': `Bearer ${token || ''}` }
                });


                if (bookingResponse.data.success) {
                    // Save for Receipt Page View (optional but good for UX)
                    const bookingData = {
                        hostelId: bookingState.hostel.hostelID,
                        hostelName: bookingState.hostel.name,
                        image: bookingState.hostel.image,
                        location: bookingState.hostel.location,
                        payerName: userInfo.name || "Guest Student",
                        duration: bookingState.years,
                        pricePerYear: basePrice,
                        rentTotal: totalRent,
                        bookingFee: 2000,
                        totalPrice: grandTotal,
                        date: new Date().toISOString(),
                        phone: phone,
                        bookingID: bookingResponse.data.bookingID,
                        paymentID: bookingResponse.data.paymentID,
                        receiptUrl: receiptUrl
                    };

                    await setPreference('current_booking', JSON.stringify(bookingData));
                    showToast('Payment Successful! Receipt Saved.', 'success');

                    // Redirect to profile page based on user role after a delay
                    setTimeout(() => {
                        const userRole = userInfo.role || 'student';
                        let profileUrl = '../dashboard/profile.html'; // default for student
                        
                        if (userRole === 'agent') {
                            profileUrl = '../agent/dashboard.html';
                        } else if (userRole === 'admin' || userRole === 'super_admin') {
                            profileUrl = '../admin/dashboard.html';
                        }
                        
                        window.location.href = profileUrl;
                    }, 2000);
                } else {
                    showToast(bookingResponse.data.message || 'Payment failed', 'error');
                }

            } catch (error) {
                console.error('Checkout Error:', error);
                const msg = error.response?.data?.message || 'Transaction failed. Please try again.';
                showToast(msg, 'error');
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
}

// Call setup on init
document.addEventListener('DOMContentLoaded', setupCheckoutModal);

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function getFacilityIcons() {
    return {
        'Free Wi-Fi': 'fa-wifi', 'WiFi': 'fa-wifi', 'Water': 'fa-faucet',
        'Security': 'fa-shield-halved', 'Power': 'fa-bolt', 'AC': 'fa-snowflake',
        'Fan': 'fa-fan', 'Parking': 'fa-parking', 'TV': 'fa-tv',
        'Kitchen': 'fa-utensils', 'Mosquito Net': 'fa-bed', 'Shared Bathrooms': 'fa-restroom',
        'Lounge': 'fa-couch', 'TV Room': 'fa-tv', 'Daily Cleaning': 'fa-broom',
        'First Aid Kit': 'fa-kit-medical', 'Shared Kitchen': 'fa-utensils',
        'Private Room': 'fa-door-closed', 'Dormitory': 'fa-users', 'Work Desk': 'fa-laptop',
        'Secure Entry': 'fa-lock', 'Electric Fence': 'fa-bolt', 'Clean Linen': 'fa-bed',
        'Social Events': 'fa-calendar-check', 'Laundry': 'fa-tshirt', 'Terrace': 'fa-sun',
        'Garden': 'fa-leaf', 'Hot Water': 'fa-fire', 'Kitchenette': 'fa-sink',
        'Private Bathroom': 'fa-bath', 'Studio': 'fa-house', 'Chapel': 'fa-church',
        'Coffee Machine': 'fa-mug-hot', 'Bar': 'fa-glass-martini-alt', 'Music': 'fa-music'
    };
}

function setupMobileMenu() {
    const menuBtn = document.getElementById('menu-toggle');
    const menuIcon = document.getElementById('menu-icon');
    const closeIcon = document.getElementById('close-icon');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        const isClosed = mobileMenu.classList.toggle('translate-x-full');
        if (!isClosed) {
            if (menuIcon) menuIcon.classList.add('opacity-0', 'scale-0');
            if (closeIcon) closeIcon.classList.remove('opacity-0', 'scale-0');
        } else {
            if (menuIcon) menuIcon.classList.remove('opacity-0', 'scale-0');
            if (closeIcon) closeIcon.classList.add('opacity-0', 'scale-0');
        }
    });

    const mobileLinks = document.querySelectorAll('.mobile-link');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('translate-x-full');
            if (menuIcon) menuIcon.classList.remove('opacity-0', 'scale-0');
            if (closeIcon) closeIcon.classList.add('opacity-0', 'scale-0');
        });
    });
}
