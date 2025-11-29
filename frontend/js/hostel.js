/***** Sample data (replace with real data) *****/
    const hostelsData = [
      { id: 'h1', title: 'Sunrise Hostel', location: 'Buea', price: 5000, priceLabel: '₦ 5,000 / night', roomsLeft: 3, desc: 'Cozy rooms near the university with free Wi-Fi and breakfast.', images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h2', title: 'Campus Lodge', location: 'Buea', price: 4200, priceLabel: '₦ 4,200 / night', roomsLeft: 5, desc: 'Affordable rooms with secure parking and 24/7 support.', images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h3', title: 'Riverside Rooms', location: 'Limbe', price: 6500, priceLabel: '₦ 6,500 / night', roomsLeft: 2, desc: 'Sea views, modern amenities, and friendly staff.', images: ['https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h4', title: 'Green Garden', location: 'Buea', price: 3800, priceLabel: '₦ 3,800 / night', roomsLeft: 6, desc: 'Quiet garden setting with shared kitchen and lounge.', images: ['https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h5', title: 'City Central', location: 'Douala', price: 7200, priceLabel: '₦ 7,200 / night', roomsLeft: 1, desc: 'Central location, great for business travelers.', images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h6', title: 'Seaside Stay', location: 'Limbe', price: 6100, priceLabel: '₦ 6,100 / night', roomsLeft: 4, desc: 'Short walk to the beach and local markets.', images: ['https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h7', title: 'Hilltop Hostel', location: 'Buea', price: 4500, priceLabel: '₦ 4,500 / night', roomsLeft: 7, desc: 'Great views and friendly staff.', images: ['https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop'] },
      { id: 'h8', title: 'Budget Inn', location: 'Buea', price: 3200, priceLabel: '₦ 3,200 / night', roomsLeft: 10, desc: 'Simple, clean rooms for budget travelers.', images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=1400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1505691723518-36a0f1b6b1f6?q=80&w=1400&auto=format&fit=crop'] }
    ];

    /***** State and rendering *****/
    const hostelGrid = document.getElementById('hostelGrid');
    const visibleCountEl = document.getElementById('visibleCount');
    const totalCountEl = document.getElementById('totalCount');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreBottom = document.getElementById('loadMoreBottom');

    let allHostels = hostelsData.slice(); // working copy
    let filteredHostels = allHostels.slice();
    let perPage = 6; // show 6 initially
    let currentCount = 0;

    totalCountEl.textContent = allHostels.length;

    function renderHostels(reset = false) {
      if (reset) {
        hostelGrid.innerHTML = '';
        currentCount = 0;
      }
      const toShow = filteredHostels.slice(currentCount, currentCount + perPage);
      toShow.forEach(h => hostelGrid.appendChild(createCard(h)));
      currentCount += toShow.length;
      visibleCountEl.textContent = Math.min(currentCount, filteredHostels.length);
      totalCountEl.textContent = filteredHostels.length;

      // hide load more if all shown
      const hide = currentCount >= filteredHostels.length;
      loadMoreBtn.style.display = hide ? 'none' : '';
      loadMoreBottom.style.display = hide ? 'none' : '';
    }

    // Create a compact card element
    function createCard(h) {
      const card = document.createElement('article');
      card.className = 'hostel-card';

      const carouselId = `carousel-${h.id}`;

      // carousel
      const carousel = document.createElement('div');
      carousel.className = 'carousel slide';
      carousel.id = carouselId;
      carousel.setAttribute('data-bs-ride', 'carousel');

      // indicators (dots)
      const indicators = document.createElement('div');
      indicators.className = 'carousel-indicators';
      h.images.forEach((img, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-bs-target', `#${carouselId}`);
        btn.setAttribute('data-bs-slide-to', String(idx));
        if (idx === 0) btn.className = 'active';
        btn.setAttribute('aria-label', `Slide ${idx + 1}`);
        indicators.appendChild(btn);
      });

      // inner
      const inner = document.createElement('div');
      inner.className = 'carousel-inner';
      h.images.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
        const wrap = document.createElement('div');
        wrap.className = 'img-wrap';
        const image = document.createElement('img');
        image.src = img;
        image.alt = `${h.title} image ${idx + 1}`;
        wrap.appendChild(image);
        item.appendChild(wrap);
        inner.appendChild(item);
      });

      // controls (arrows)
      const prev = document.createElement('button');
      prev.className = 'carousel-control-prev';
      prev.type = 'button';
      prev.setAttribute('data-bs-target', `#${carouselId}`);
      prev.setAttribute('data-bs-slide', 'prev');
      prev.innerHTML = `<span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span>`;

      const next = document.createElement('button');
      next.className = 'carousel-control-next';
      next.type = 'button';
      next.setAttribute('data-bs-target', `#${carouselId}`);
      next.setAttribute('data-bs-slide', 'next');
      next.innerHTML = `<span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span>`;

      carousel.appendChild(indicators);
      carousel.appendChild(inner);
      carousel.appendChild(prev);
      carousel.appendChild(next);

      // body
      const body = document.createElement('div');
      body.className = 'card-body';

      const title = document.createElement('div');
      title.className = 'hostel-title';
      title.textContent = h.title;

      const meta = document.createElement('div');
      meta.className = 'hostel-meta';
      meta.innerHTML = `<div><i class="bi bi-geo-alt-fill"></i> <span style="margin-left:.4rem">${h.location}</span></div>
                        <div class="hostel-price">${h.priceLabel}</div>`;

      const rooms = document.createElement('div');
      rooms.className = 'muted';
      rooms.innerHTML = `<span class="badge-rooms">${h.roomsLeft} rooms left</span>`;

      const footer = document.createElement('div');
      footer.className = 'hostel-footer';

      const leftGroup = document.createElement('div');
      leftGroup.style.display = 'flex';
      leftGroup.style.gap = '.5rem';
      leftGroup.style.alignItems = 'center';

      const viewBtn = document.createElement('button');
      viewBtn.className = 'btn-view';
      viewBtn.textContent = 'View properties';
      viewBtn.setAttribute('data-hostel-id', h.id);
      viewBtn.addEventListener('click', onViewProperties);

      const bookBtn = document.createElement('button');
      bookBtn.className = 'btn-book';
      bookBtn.textContent = 'Book hostel';
      bookBtn.addEventListener('click', () => {
        alert(`Booking flow for ${h.title} (${h.priceLabel})`);
      });

      leftGroup.appendChild(viewBtn);
      leftGroup.appendChild(bookBtn);

      footer.appendChild(leftGroup);
      footer.appendChild(rooms);

      body.appendChild(title);
      body.appendChild(meta);
      body.appendChild(footer);

      card.appendChild(carousel);
      card.appendChild(body);

      return card;
    }

    /***** Filtering, sorting, load more *****/
    function applyFiltersAndSort() {
      const q = searchInput.value.trim().toLowerCase();
      const sort = sortSelect.value;

      filteredHostels = allHostels.filter(h => {
        if (!q) return true;
        return h.location.toLowerCase().includes(q);
      });

      if (sort === 'price_high') {
        filteredHostels.sort((a, b) => b.price - a.price);
      } else if (sort === 'price_low') {
        filteredHostels.sort((a, b) => a.price - b.price);
      }

      // reset and render first page
      renderHostels(true);
    }

    // wire controls
    searchInput.addEventListener('input', () => {
      applyFiltersAndSort();
    });
    sortSelect.addEventListener('change', () => {
      applyFiltersAndSort();
    });

    loadMoreBtn.addEventListener('click', () => {
      renderHostels(false);
    });
    loadMoreBottom.addEventListener('click', () => {
      renderHostels(false);
      // scroll to newly loaded content
      setTimeout(() => {
        const lastCard = hostelGrid.lastElementChild;
        if (lastCard) lastCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 120);
    });

    // initial render
    document.addEventListener('DOMContentLoaded', () => {
      allHostels = hostelsData.slice(); // could be fetched from API
      filteredHostels = allHostels.slice();
      renderHostels(true);
    });

    /***** Modal handling (improved clarity) *****/
    const hostelModalEl = document.getElementById('hostelModal');
    const hostelModal = new bootstrap.Modal(hostelModalEl);

    function onViewProperties(e) {
      const id = e.currentTarget.dataset.hostelId;
      const h = allHostels.find(x => x.id === id);
      if (!h) return;

      // populate modal text
      document.getElementById('modalHostelTitle').textContent = h.title;
      document.getElementById('modalHostelLocation').textContent = h.location;
      document.getElementById('modalHostelPrice').textContent = h.priceLabel;
      document.getElementById('modalHostelRooms').textContent = `${h.roomsLeft}`;
      document.getElementById('modalHostelDesc').textContent = h.desc;

      // build modal carousel
      const container = document.getElementById('modalCarouselContainer');
      container.innerHTML = ''; // clear previous

      const modalCarouselId = `modalCarousel-${h.id}`;
      const carousel = document.createElement('div');
      carousel.id = modalCarouselId;
      carousel.className = 'carousel slide';
      carousel.setAttribute('data-bs-ride', 'carousel');

      // indicators
      const indicators = document.createElement('div');
      indicators.className = 'carousel-indicators';
      h.images.forEach((img, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('data-bs-target', `#${modalCarouselId}`);
        btn.setAttribute('data-bs-slide-to', String(idx));
        if (idx === 0) btn.className = 'active';
        btn.setAttribute('aria-label', `Slide ${idx + 1}`);
        indicators.appendChild(btn);
      });

      // inner
      const inner = document.createElement('div');
      inner.className = 'carousel-inner';
      h.images.forEach((img, idx) => {
        const item = document.createElement('div');
        item.className = 'carousel-item' + (idx === 0 ? ' active' : '');
        const image = document.createElement('img');
        image.src = img;
        image.alt = `${h.title} image ${idx + 1}`;
        item.appendChild(image);
        inner.appendChild(item);
      });

      // controls
      const prev = document.createElement('button');
      prev.className = 'carousel-control-prev';
      prev.type = 'button';
      prev.setAttribute('data-bs-target', `#${modalCarouselId}`);
      prev.setAttribute('data-bs-slide', 'prev');
      prev.innerHTML = `<span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span>`;

      const next = document.createElement('button');
      next.className = 'carousel-control-next';
      next.type = 'button';
      next.setAttribute('data-bs-target', `#${modalCarouselId}`);
      next.setAttribute('data-bs-slide', 'next');
      next.innerHTML = `<span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span>`;

      carousel.appendChild(indicators);
      carousel.appendChild(inner);
      carousel.appendChild(prev);
      carousel.appendChild(next);

      container.appendChild(carousel);

      // wire booking inside modal
      const modalBookBtn = document.getElementById('modalBookBtn');
      modalBookBtn.onclick = () => {
        alert(`Booking flow for ${h.title} (${h.priceLabel})`);
      };

      // show modal
      hostelModal.show();

      // ensure carousel starts at first slide
      setTimeout(() => {
        const bsCarousel = bootstrap.Carousel.getOrCreateInstance(document.getElementById(modalCarouselId));
        bsCarousel.to(0);
      }, 80);
    }

    // Accessibility: close modal on Escape handled by Bootstrap automatically
 