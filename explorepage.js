document.addEventListener('DOMContentLoaded', async () => {
  // --- Supabase client assumed initialized globally as `supabase` ---

  const userActionsContainer = document.querySelector('.user-actions');
  const notificationsBtn = document.querySelector('.notifications-btn');
  const notificationCountSpan = document.querySelector('.notification-count');
  const profileDropdownTrigger = document.querySelector('.profile-trigger');
  const profileDropdownMenu = document.querySelector('.profile-dropdown .dropdown-menu');
  const headerProfilePic = document.getElementById('header-profile-pic');
  const headerUsername = document.getElementById('header-username');
  const headerUserEmail = document.getElementById('header-user-email');
  const authActions = document.getElementById('header-auth-actions');
  const mobileLogoutBtn = document.getElementById('mobile-logout-button');

  // --- Profile dropdown toggle ---
  if (profileDropdownTrigger && profileDropdownMenu) {
    profileDropdownTrigger.addEventListener('click', e => {
      e.stopPropagation();
      profileDropdownMenu.classList.toggle('active');
    });
    document.addEventListener('click', () => {
      profileDropdownMenu.classList.remove('active');
    });
  }

  // --- Fetch Profile Info ---
  async function fetchProfile(user) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('first_name, profile_pic_url')
      .eq('id', user.id)
      .single();
    if (error) return console.error('Profile fetch error', error);
    headerProfilePic.src = profile.profile_pic_url || 'default-avatar.png';
    headerUsername.textContent = profile.first_name || user.email.split('@')[0];
    headerUserEmail.textContent = user.email;
  }

  async function fetchNotifications(user) {
    const { data, error } = await supabase
      .from('notifications')
      .select('is_read')
      .eq('user_id', user.id);
    if (error) return console.error('Notifications fetch error', error);
    const unread = data.filter(n => !n.is_read).length;
    if (unread > 0) {
      notificationCountSpan.textContent = unread;
      notificationCountSpan.style.display = 'inline-block';
    } else {
      notificationCountSpan.style.display = 'none';
    }
  }

  // --- Update header for auth state ---
  async function showLoggedInUI(user) {
    notificationsBtn.style.display = 'inline-block';
    profileDropdownTrigger.style.display = 'inline-block';
    authActions.style.display = 'none';
    document.querySelector('.profile-dropdown').style.display = 'block';

    // Add dashboard button if not present
    if (!userActionsContainer.querySelector('.dashboard-link')) {
      const dash = document.createElement('a');
      dash.href = 'dashboard.html';
      dash.className = 'btn btn-secondary btn-small dashboard-link';
      dash.textContent = 'Dashboard';
      userActionsContainer.insertBefore(dash, notificationsBtn);
    }

    await fetchProfile(user);
    await fetchNotifications(user);

    // Show mobile links
    document.getElementById('mobile-logout-button')?.parentElement?.style.setProperty('display', 'list-item');
    document.querySelector('a[href="profile.html"]')?.parentElement?.style.setProperty('display', 'list-item');
    document.querySelector('a[href="#"]')?.parentElement?.style.setProperty('display', 'list-item');
    document.querySelector('a[href="signup.html"]')?.parentElement?.style.setProperty('display', 'none');
  }

  async function showLoggedOutUI() {
    notificationsBtn.style.display = 'none';
    profileDropdownTrigger.style.display = 'none';
    authActions.style.display = 'block';
    document.querySelector('.profile-dropdown').style.display = 'none';
    document.getElementById('header-dashboard-button-container')?.querySelector('.dashboard-link')?.remove();

    // Mobile cleanup
    document.getElementById('mobile-logout-button')?.parentElement?.style.setProperty('display', 'none');
    document.querySelector('a[href="profile.html"]')?.parentElement?.style.setProperty('display', 'none');
    document.querySelector('a[href="#"]')?.parentElement?.style.setProperty('display', 'none');
    document.querySelector('a[href="signup.html"]')?.parentElement?.style.setProperty('display', 'list-item');
  }

  // --- Check login status on load ---
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await showLoggedInUI(user);
    } else {
      showLoggedOutUI();
    }
  } else {
    showLoggedOutUI();
  }

  // --- React to auth state changes (login/logout) ---
  supabase.auth.onAuthStateChange(async (_, newSession) => {
    if (newSession) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await showLoggedInUI(user);
    } else {
      showLoggedOutUI();
    }
  });

  // --- Logout Button Handler ---
  document.getElementById('logout-button')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoggedOutUI();
  });

  document.getElementById('mobile-logout-button')?.addEventListener('click', async () => {
    await supabase.auth.signOut();
    showLoggedOutUI();
  });
});

    // --- Fullscreen Image Viewer Logic ---
    const imageViewerModal  = document.getElementById('image-viewer-modal');
    const fullscreenImage   = document.getElementById('fullscreen-image');
    const imageViewerCaption = document.getElementById('image-viewer-caption');
    const closeImageViewerBtn = document.querySelector('.close-image-viewer');
    const prevImageBtn       = document.querySelector('.prev-image-btn');
    const nextImageBtn       = document.querySelector('.next-image-btn');
    const galleryImages      = document.querySelectorAll('.gallery-image');
    let currentImageIndex = 0;
    let imagesArray = [];

    if (imageViewerModal && fullscreenImage && galleryImages.length) {
        galleryImages.forEach((img, idx) => {
            imagesArray.push({ src: img.src, caption: img.alt || '' });
            img.dataset.galleryIndex = idx;
            img.addEventListener('click', () => openImageViewer(idx));
        });
        function openImageViewer(idx) {
            currentImageIndex = idx;
            fullscreenImage.src = imagesArray[idx].src;
            imageViewerCaption && (imageViewerCaption.textContent = imagesArray[idx].caption);
            imageViewerModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeImageViewer() {
            imageViewerModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
        function showPrevImage() { openImageViewer((currentImageIndex - 1 + imagesArray.length) % imagesArray.length); }
        function showNextImage() { openImageViewer((currentImageIndex + 1) % imagesArray.length); }

        closeImageViewerBtn && closeImageViewerBtn.addEventListener('click', closeImageViewer);
        prevImageBtn && prevImageBtn.addEventListener('click', showPrevImage);
        nextImageBtn && nextImageBtn.addEventListener('click', showNextImage);
        document.addEventListener('keydown', e => {
            if (!imageViewerModal.classList.contains('active')) return;
            if (e.key === 'Escape') closeImageViewer();
            if (e.key === 'ArrowLeft') showPrevImage();
            if (e.key === 'ArrowRight') showNextImage();
        });
        imageViewerModal.addEventListener('click', e => { if (e.target === imageViewerModal) closeImageViewer(); });
    }

    // --- Smooth Scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

