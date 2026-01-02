
import { showToast } from './toast.js';
import { getCurrentAccount } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('hostel-image');
    const previewContainer = document.getElementById('preview-container');
    const imagePreview = document.getElementById('image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const removeBtn = document.getElementById('remove-image');
    const form = document.getElementById('upload-form');

    // File Input Change Handler (Preview)
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    uploadPlaceholder.classList.add('hidden');
                    previewContainer.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Remove Image Handler
    if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering click on parent
            fileInput.value = '';
            imagePreview.src = '';
            previewContainer.classList.add('hidden');
            uploadPlaceholder.classList.remove('hidden');
        });
    }

    // Form Submission Handler
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnHtml = submitBtn.innerHTML;

            // Validate Amenities
            const selectedAmenities = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value)
                .join(',');

            if (!fileInput.files[0]) {
                showToast('Please upload a hostel image', 'error');
                return;
            }

            try {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
                submitBtn.disabled = true;

                // 1. Upload Image to Cloudinary
                const formData = new FormData();
                formData.append('file', fileInput.files[0]);
                formData.append('upload_preset', 'lloorrdd');
                formData.append('cloud_name', 'dmtgl1spo');
                formData.append('folder', 'hosteLink Images');

                const cloudinaryRes = await axios.post(
                    'https://api.cloudinary.com/v1_1/dmtgl1spo/image/upload',
                    formData
                );
                const imageUrl = cloudinaryRes.data.secure_url;

                // 2. Prepare Data for Backend
                const hostelData = {
                    name: document.getElementById('hostel-name').value,
                    location: document.getElementById('hostel-location').value,
                    price: document.getElementById('hostel-price').value,
                    roomType: document.getElementById('room-type').value,
                    landlordPhone: document.getElementById('owner-phone').value,
                    description: document.getElementById('hostel-desc').value,
                    facilities: selectedAmenities,
                    capacity: 10, // Default or add input if needed
                    roomsLeft: 10,
                    image: imageUrl
                };

                // Get Token from Backend
                const user = await getCurrentAccount();
                if (!user || !user.id) {
                    showToast('No user session found. Please login again.', 'error');
                    return;
                }

                const tokenRes = await axios.post('http://localhost:3000/api/auth/get-token', {
                    user_id: user.id
                });

                if (!tokenRes.data.success || !tokenRes.data.token) {
                    showToast('Failed to get authorization token. Please login again.', 'error');
                    return;
                }
                const token = tokenRes.data.token;

                // 3. Send to Backend
                const response = await axios.post('http://localhost:3000/api/add-hostels', hostelData, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.data.success) {
                    showToast('Hostel published successfully!', 'success');

                    // Reset Form
                    form.reset();
                    fileInput.value = '';
                    imagePreview.src = '';
                    previewContainer.classList.add('hidden');
                    uploadPlaceholder.classList.remove('hidden');

                    // Uncheck amenities visual state if using custom checkboxes
                    // (Assuming simple checkbox logic or reload)
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                } else {
                    showToast(response.data.message || 'Failed to publish hostel', 'error');
                }

            } catch (error) {
                console.error('Upload Error:', error);
                let msg = 'Failed to publish hostel';
                if (error.response && error.response.data && error.response.data.message) {
                    msg = error.response.data.message;
                }
                showToast(msg, 'error');
            } finally {
                submitBtn.innerHTML = originalBtnHtml;
                submitBtn.disabled = false;
            }
        });
    }
});
