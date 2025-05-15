// js/profile.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const profileWrapper = document.getElementById('profile-wrapper');
    if (!profileWrapper && loadingIndicator) { // If profile wrapper missing, maybe show error early
        loadingIndicator.innerHTML = '<p class="error-message">Error: Profile container not found.</p>';
        return;
    }

    // Header Elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    // Profile Header Elements
    const userCoverPhoto = document.getElementById('user-cover-photo');
    const userProfilePic = document.getElementById('user-profile-pic');
    const userDisplayName = document.getElementById('user-display-name');
    const userRoleBadge = document.getElementById('user-role-badge');
    const userBio = document.getElementById('user-bio');
    const contentCountEl = document.getElementById('content-count');
    const followerCountEl = document.getElementById('follower-count');
    const followingCountEl = document.getElementById('following-count');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const followUnfollowBtn = document.getElementById('follow-unfollow-btn');
    const messageUserBtn = document.getElementById('message-user-btn');
    const editCoverBtn = document.getElementById('edit-cover-btn');
    const editProfilePicBtn = document.getElementById('edit-profile-pic-btn');

    // Tabs & Panes
    const tabLinks = document.querySelectorAll('.tabs-nav .tab-link');
    const tabPanes = document.querySelectorAll('.tab-content-area .tab-pane');
    const profileContentGrid = document.getElementById('profile-content-grid');
    const profileFollowersGrid = document.getElementById('profile-followers-grid');
    const profileFollowingGrid = document.getElementById('profile-following-grid');
    const profileEventsGrid = document.getElementById('profile-events-grid');
    // About Tab Details
    const aboutEmail = document.getElementById('about-email');
    const aboutPhone = document.getElementById('about-phone');
    const aboutDob = document.getElementById('about-dob');
    const aboutGender = document.getElementById('about-gender');
    const aboutNationality = document.getElementById('about-nationality');
    const aboutLocation = document.getElementById('about-location');
    const aboutJoined = document.getElementById('about-joined');


    // Edit Modal Elements
    const editProfileModal = document.getElementById('edit-profile-modal');
    const editProfileForm = document.getElementById('edit-profile-form');
    const closeEditModalBtn = editProfileModal?.querySelector('.close-modal-btn');
    const cancelEditBtn = editProfileModal?.querySelector('.cancel-edit-btn');
    const editProfileMessage = document.getElementById('edit-profile-message');
    // Edit form fields
    const editCoverPicInput = document.getElementById('edit-cover-pic-input');
    const editCoverPicPreview = document.getElementById('edit-cover-pic-img-preview');
    const editProfilePicInput = document.getElementById('edit-profile-pic-input');
    const editProfilePicPreview = document.getElementById('edit-profile-pic-img-preview');
    const editFirstNameInput = document.getElementById('edit-first-name');
    const editLastNameInput = document.getElementById('edit-last-name');
    const editMiddleNameInput = document.getElementById('edit-middle-name');
    const editBioInput = document.getElementById('edit-bio');
    const editCityInput = document.getElementById('edit-city');
    const editCountryInput = document.getElementById('edit-country');
    // Add other editable fields selectors here...

    // --- State Variables ---
    let currentViewer = null; // Logged-in user object
    let currentProfileData = null; // Data of the profile being viewed
    let profileUserId = null; // ID of the profile being viewed
    let isOwnProfile = false;

    // --- Initialization ---
    async function initializeProfilePage() {
        // 1. Determine Profile ID (from URL or logged-in user)
        const urlParams = new URLSearchParams(window.location.search);
        profileUserId = urlParams.get('id');

        // 2. Check Authentication
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (session) {
            currentViewer = session.user;
            updateHeaderForLoggedInUser(); // Update header profile pic/email
            if (!profileUserId) {
                profileUserId = currentViewer.id; // No ID in URL, load logged-in user's profile
            }
        } else if (!profileUserId) {
            // Not logged in AND no profile ID specified - redirect to login
            console.log("Not logged in and no profile ID specified. Redirecting...");
            window.location.replace('signup.html');
            return;
        }

        // If we have a profileUserId (either from URL or logged-in user)
        if (profileUserId) {
            isOwnProfile = currentViewer?.id === profileUserId;
            await loadProfileData(profileUserId);
        } else {
            showLoadingError("Could not determine which profile to load.");
        }

        // 3. Setup Event Listeners (moved here to ensure elements exist)
        setupEventListeners();

    }

    function showLoadingError(message) {
        if(loadingIndicator) {
            loadingIndicator.innerHTML = `<p class="error-message">${message}</p>`;
            loadingIndicator.style.display = 'flex'; // Ensure it's visible
        }
         if(profileWrapper) profileWrapper.style.display = 'none'; // Hide main content
    }

    // --- Data Fetching ---
    async function loadProfileData(userId) {
        console.log(`Loading profile for user ID: ${userId}`);
        try {
            // Fetch profile details
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*') // Select all columns for now
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            if (!profile) throw new Error("Profile not found.");

            currentProfileData = profile;

            // Fetch related data (stats, initial content tab) in parallel
            await Promise.all([
                fetchProfileStats(userId),
                loadTabData('content', userId) // Load content for the default tab
            ]);

            // Display data and hide loader
            displayProfileData(currentProfileData);
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (profileWrapper) profileWrapper.style.display = 'block';

        } catch (error) {
            console.error('Error loading profile data:', error.message);
            showLoadingError(`Could not load profile: ${error.message}`);
        }
    }

    async function fetchProfileStats(userId) {
        // Placeholder: Replace with actual queries or Supabase function calls
        // Example: Fetch follower count (requires a 'followers' table)
        // const { count: followers, error: followerError } = await supabase
        //     .from('followers')
        //     .select('*', { count: 'exact', head: true })
        //     .eq('following_id', userId);
        const followers = Math.floor(Math.random() * 1000); // Placeholder

        // Example: Fetch following count
        // const { count: following, error: followingError } = await supabase
        //     .from('followers')
        //     .select('*', { count: 'exact', head: true })
        //     .eq('follower_id', userId);
         const following = Math.floor(Math.random() * 200); // Placeholder

        // Example: Fetch content count
        const { count: contentCount, error: contentError } = await supabase
            .from('content') // Assuming a 'content' table
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        // Update UI
        if (followerCountEl) followerCountEl.textContent = followers ?? '--';
        if (followingCountEl) followingCountEl.textContent = following ?? '--';
        if (contentCountEl) contentCountEl.textContent = contentCount ?? '--';
    }

    // Function to load data for a specific tab
    async function loadTabData(tabName, userId) {
        console.log(`Loading data for tab: ${tabName}`);
        const targetPane = document.getElementById(`tab-${tabName}`);
        if (!targetPane) return;

        const contentArea = targetPane.querySelector('.content-grid, .user-grid, .about-details-section'); // Find the container
        if (!contentArea) return;

        const loadingEl = contentArea.querySelector('.loading-state');
        const emptyEl = contentArea.querySelector('.empty-state');
        if (loadingEl) loadingEl.style.display = 'block';
        if (emptyEl) emptyEl.style.display = 'none';
        // Clear previous content (except loading/empty states)
        contentArea.querySelectorAll(':not(.loading-state):not(.empty-state)').forEach(el => el.remove());


        try {
            let data = [];
            let error = null;

            switch (tabName) {
                case 'content':
                    ({ data, error } = await supabase
                        .from('content') // Your content table
                        .select('id, title, thumbnail_url, type')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(20)); // Add limit/pagination
                    renderContentGrid(contentArea, data, emptyEl);
                    break;
                case 'followers':
                    // Requires 'followers' table (follower_id, following_id)
                    // Fetch profiles of users where following_id = userId
                    // Example structure - NEEDS A JOIN OR FUNCTION
                    // ({ data, error } = await supabase.rpc('get_followers', { profile_id: userId }));
                    renderUserGrid(contentArea, [], emptyEl); // Placeholder - no data yet
                    console.warn("Follower fetching not fully implemented.");
                    break;
                case 'following':
                    // Requires 'followers' table
                    // Fetch profiles of users where follower_id = userId
                     // Example structure - NEEDS A JOIN OR FUNCTION
                    // ({ data, error } = await supabase.rpc('get_following', { profile_id: userId }));
                    renderUserGrid(contentArea, [], emptyEl); // Placeholder - no data yet
                    console.warn("Following fetching not fully implemented.");
                    break;
                 case 'events':
                     // Requires 'events' table linked to user
                    ({ data, error } = await supabase
                        .from('events') // Your events table
                        .select('id, name, event_date, cover_image_url') // Select necessary fields
                        .eq('organizer_id', userId) // Assuming 'organizer_id' links to profiles.id
                        .order('event_date', { ascending: true })
                        .limit(20));
                    renderEventGrid(contentArea, data, emptyEl);
                    break;
                 case 'about':
                     renderAboutDetails(contentArea); // Uses existing currentProfileData
                     break;
                // Add cases for other tabs (Ratings, etc.)
                default:
                    console.warn(`No data loading implemented for tab: ${tabName}`);
                     if (emptyEl) emptyEl.textContent = "Content not available.";
                     if (emptyEl) emptyEl.style.display = 'block';
            }

            if (error) throw error;

        } catch (err) {
            console.error(`Error loading data for ${tabName}:`, err.message);
            if (contentArea) contentArea.innerHTML = `<p class="error-message">Could not load ${tabName}.</p>`;
        } finally {
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    // --- Rendering Functions ---
    function displayProfileData(profile) {
        // Update Header
        if (userCoverPhoto && profile.cover_pic_url) userCoverPhoto.src = profile.cover_pic_url;
        else if (userCoverPhoto) userCoverPhoto.src = 'cover-photo.png'; // Fallback

        if (userProfilePic && profile.profile_pic_url) userProfilePic.src = profile.profile_pic_url;
        else if (userProfilePic) userProfilePic.src = 'profile-picture.png'; // Fallback

        if (userDisplayName) userDisplayName.textContent = `${profile.first_name} ${profile.last_name}`;
        document.title = `${profile.first_name} ${profile.last_name} - SympleTunes Studio`; // Update page title

        if (userRoleBadge) userRoleBadge.textContent = profile.primary_role || 'Member'; // Assuming primary_role column exists

        if (userBio) userBio.textContent = profile.bio || 'No bio provided.';

        // Update About Tab Details
        renderAboutDetails(document.getElementById('tab-about')?.querySelector('.about-details-section'));


        // Show/Hide Edit vs Follow Buttons
        if (isOwnProfile) {
            if (editProfileBtn) editProfileBtn.style.display = 'inline-flex';
            if (editCoverBtn) editCoverBtn.style.display = 'inline-flex';
            if (editProfilePicBtn) editProfilePicBtn.style.display = 'inline-flex';
            if (followUnfollowBtn) followUnfollowBtn.style.display = 'none';
            if (messageUserBtn) messageUserBtn.style.display = 'none'; // Can't message self
        } else {
            if (editProfileBtn) editProfileBtn.style.display = 'none';
             if (editCoverBtn) editCoverBtn.style.display = 'none';
            if (editProfilePicBtn) editProfilePicBtn.style.display = 'none';
            if (followUnfollowBtn) followUnfollowBtn.style.display = 'inline-flex';
            if (messageUserBtn) messageUserBtn.style.display = 'inline-flex';
             // Check initial follow status (requires fetching this data)
             // setFollowButtonState(initialFollowStatus);
        }
        // Show role-specific tabs/elements based on profile.primary_role
        updateRoleSpecificUI(profile.primary_role);
    }

    function renderContentGrid(container, items, emptyEl) {
        container.querySelectorAll('.content-card').forEach(el => el.remove()); // Clear existing cards
        if (!items || items.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
        if (emptyEl) emptyEl.style.display = 'none';

        items.forEach(item => {
            const card = document.createElement('article');
            card.className = 'content-card glass-card'; // Use glass-card styling
             card.innerHTML = `
                <a href="/content/${item.id}"> <!-- Adjust link -->
                    <div class="card-thumbnail">
                        <img src="${item.thumbnail_url || 'assets/images/content-placeholder1.jpg'}" alt="${item.title || 'Content'} Thumbnail">
                        <div class="card-play-icon"><i class="fas fa-play"></i></div>
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${item.title || 'Untitled'}</h3>
                        <!-- Optionally show type -->
                        <span class="card-type-badge">${item.type || 'Unknown'}</span>
                    </div>
                </a>
            `;
            container.appendChild(card);
        });
    }

     function renderUserGrid(container, items, emptyEl) {
         container.querySelectorAll('.user-card').forEach(el => el.remove()); // Clear existing cards
        if (!items || items.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
         if (emptyEl) emptyEl.style.display = 'none';

        items.forEach(user => {
            const card = document.createElement('div');
            card.className = 'user-card glass-card'; // Reuse glass-card
            card.innerHTML = `
                <a href="profile.html?id=${user.id}">
                    <img src="${user.profile_pic_url || 'profile-picture.png'}" alt="${user.first_name}'s Profile Picture">
                    <h4>${user.first_name} ${user.last_name}</h4>
                </a>
                <p>${user.primary_role || 'Member'}</p>
                <!-- Add follow/unfollow button if needed within the card -->
            `;
            container.appendChild(card);
        });
     }

      function renderEventGrid(container, items, emptyEl) {
          container.querySelectorAll('.event-card').forEach(el => el.remove()); // Clear existing cards
        if (!items || items.length === 0) {
            if (emptyEl) emptyEl.style.display = 'block';
            return;
        }
         if (emptyEl) emptyEl.style.display = 'none';

         // Create event card structure similar to content card or unique
         items.forEach(event => {
             const card = document.createElement('article');
             card.className = 'content-card event-card glass-card'; // Reuse or create specific class
             card.innerHTML = `
                 <a href="/event/${event.id}"> <!-- Adjust link -->
                     <div class="card-thumbnail">
                         <img src="${event.cover_image_url || 'assets/images/event-placeholder.jpg'}" alt="${event.name} Event Image">
                     </div>
                     <div class="card-info">
                         <h3 class="card-title">${event.name}</h3>
                         <p class="card-creator"><i class="fas fa-calendar-alt"></i> ${new Date(event.event_date).toLocaleDateString()}</p>
                         <span class="card-type-badge">Event</span>
                     </div>
                 </a>
             `;
             container.appendChild(card);
         });
      }

      function renderAboutDetails(container) {
          if (!container || !currentProfileData) return;

          const profile = currentProfileData;
          const formatDisplay = (value) => value || '<span class="not-provided">Not provided</span>'; // Helper for optional fields
          const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString() : formatDisplay(null);

          if(aboutEmail) aboutEmail.innerHTML = formatDisplay(profile.email);
          if(aboutPhone) aboutPhone.innerHTML = formatDisplay(profile.phone_number);
          if(aboutDob) aboutDob.innerHTML = formatDate(profile.dob);
          if(aboutGender) aboutGender.innerHTML = formatDisplay(profile.gender);
          if(aboutNationality) aboutNationality.innerHTML = formatDisplay(profile.nationality);
          if(aboutLocation) aboutLocation.innerHTML = formatDisplay(`${profile.city ? profile.city + ', ' : ''}${profile.country || ''}`);
          if(aboutJoined) aboutJoined.innerHTML = formatDate(profile.created_at); // Ensure created_at is selected
      }


    function updateHeaderForLoggedInUser() {
        if (!currentViewer) return;
        // Fetch minimal profile data for header if not already loaded
        supabase.from('profiles')
            .select('first_name, profile_pic_url')
            .eq('id', currentViewer.id)
            .single()
            .then(({ data, error }) => {
                if (data) {
                    if (headerProfilePic && data.profile_pic_url) headerProfilePic.src = data.profile_pic_url;
                    if (headerUsername) headerUsername.textContent = data.first_name || currentViewer.email.split('@')[0];
                    if (headerUserEmail) headerUserEmail.textContent = currentViewer.email;
                } else {
                    // Fallbacks if profile data fetch fails for header
                    if (headerUsername) headerUsername.textContent = currentViewer.email.split('@')[0];
                     if (headerUserEmail) headerUserEmail.textContent = currentViewer.email;
                }
            });
    }

    function updateRoleSpecificUI(profileRole) {
         if (!profileRole) return;
         const userRoleClass = profileRole.toLowerCase().replace(/\s+/g, '_');
         document.querySelectorAll('.role-specific').forEach(el => {
             el.style.display = el.classList.contains(userRoleClass) ? (el.tagName === 'LI' || el.tagName === 'BUTTON' || el.tagName === 'A' ? 'flex' : 'block') : 'none';
         });
     }

     function setFollowButtonState(isFollowing) {
         if (!followUnfollowBtn) return;
         followUnfollowBtn.dataset.following = isFollowing;
         if (isFollowing) {
             followUnfollowBtn.innerHTML = '<i class="fas fa-user-check"></i> Following';
             followUnfollowBtn.classList.add('following'); // Add class for specific CSS
         } else {
             followUnfollowBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
             followUnfollowBtn.classList.remove('following');
         }
     }

    // --- Event Handlers ---
    function setupEventListeners() {
        // Tab Switching
        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabName = link.dataset.tab;
                if (!tabName) return;

                // Update active link
                tabLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');

                // Hide all panes, show target pane
                tabPanes.forEach(pane => {
                    pane.classList.remove('active');
                    if (pane.id === `tab-${tabName}`) {
                        pane.classList.add('active');
                        // Load data for the tab if it hasn't been loaded
                        // Add a check, e.g., if (!pane.dataset.loaded) { loadTabData(tabName, profileUserId); pane.dataset.loaded = true; }
                        // For simplicity now, we might reload or load on first click
                        if(tabName !== 'about') { // About tab uses already loaded data
                             loadTabData(tabName, profileUserId);
                        } else {
                            renderAboutDetails(document.getElementById('tab-about')?.querySelector('.about-details-section'));
                        }
                    }
                });
            });
        });

        // Logout
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);

        // Edit Profile Button Click (Open Modal)
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', () => {
                if (!editProfileModal || !currentProfileData) return;
                // Populate modal form with current data
                editFirstNameInput.value = currentProfileData.first_name || '';
                editLastNameInput.value = currentProfileData.last_name || '';
                editMiddleNameInput.value = currentProfileData.middle_name || '';
                editBioInput.value = currentProfileData.bio || '';
                editCityInput.value = currentProfileData.city || '';
                editCountryInput.value = currentProfileData.country || '';
                // Populate other fields...
                editProfilePicPreview.src = currentProfileData.profile_pic_url || 'profile-picture.png';
                editCoverPicPreview.src = currentProfileData.cover_pic_url || 'cover-photo.png';
                if(editProfileMessage) editProfileMessage.style.display = 'none'; // Hide old messages
                // Use modal functions from main.js if available, or basic display toggle
                editProfileModal.style.display = 'flex';
            });
        }

        // Close/Cancel Edit Modal
        if(closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
        }
         if(cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => editProfileModal.style.display = 'none');
        }
         // Optional: Close modal if clicking outside
         if(editProfileModal) {
             editProfileModal.addEventListener('click', (e) => {
                 if (e.target === editProfileModal) {
                     editProfileModal.style.display = 'none';
                 }
             });
         }


        // Edit Profile Form Submission
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', handleProfileUpdate);
        }

        // Edit Form Image Previews
        if (editProfilePicInput && editProfilePicPreview) {
            editProfilePicInput.addEventListener('change', () => previewFile(editProfilePicInput, editProfilePicPreview));
        }
        if (editCoverPicInput && editCoverPicPreview) {
            editCoverPicInput.addEventListener('change', () => previewFile(editCoverPicInput, editCoverPicPreview));
        }

        // Follow/Unfollow Button Click
        if (followUnfollowBtn) {
            followUnfollowBtn.addEventListener('click', handleFollowToggle);
        }

         // Edit Cover/Profile Pic Buttons on Header
        if (editCoverBtn) {
             editCoverBtn.addEventListener('click', () => {
                 // Option 1: Open the modal directly
                 if (editProfileModal) openModalAndFocus(editProfileModal, 'edit-cover-pic-input');
                 // Option 2: Trigger the file input click (less user friendly)
                 // if (editCoverPicInput) editCoverPicInput.click();
             });
        }
         if (editProfilePicBtn) {
              editProfilePicBtn.addEventListener('click', () => {
                  if (editProfileModal) openModalAndFocus(editProfileModal, 'edit-profile-pic-input');
              });
        }
    }

    function openModalAndFocus(modalElement, inputId) {
         if (!modalElement) return;
         modalElement.style.display = 'flex'; // Or use modal open function from main.js
         const inputElement = document.getElementById(inputId);
         if(inputElement) {
             // Slight delay might be needed for modal transition
             setTimeout(() => inputElement.click(), 100); // Trigger file selection
         }
    }


    function handleLogout() {
        setLoadingState(logoutButton || mobileLogoutButton, true);
        supabase.auth.signOut()
            .then(() => { window.location.replace('signup.html'); })
            .catch((error) => {
                console.error('Sign out error:', error);
                setLoadingState(logoutButton || mobileLogoutButton, false);
                alert("Sign out failed: " + error.message); // Simple alert
            });
    }

     async function handleProfileUpdate(event) {
         event.preventDefault();
         if (!currentViewer || !isOwnProfile || !editProfileForm) return;

         const saveButton = document.getElementById('save-profile-changes-btn');
         if (!saveButton.dataset.originalText) saveButton.dataset.originalText = saveButton.textContent;
         setLoadingState(saveButton, true);
         displayMessage(editProfileForm, '', 'info'); // Clear previous messages

         let profilePicUrl = currentProfileData.profile_pic_url; // Keep old URL by default
         let coverPicUrl = currentProfileData.cover_pic_url;

         try {
            // 1. Upload new images if selected
            if (editProfilePicInput.files[0]) {
                const file = editProfilePicInput.files[0];
                const fileName = `${currentViewer.id}/profile-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
                const { error } = await supabase.storage.from('profile-pics').upload(fileName, file, { upsert: true }); // Use upsert
                if (error) throw new Error(`Profile pic upload failed: ${error.message}`);
                profilePicUrl = supabase.storage.from('profile-pics').getPublicUrl(fileName).data.publicUrl;
            }
            if (editCoverPicInput.files[0]) {
                const file = editCoverPicInput.files[0];
                const fileName = `${currentViewer.id}/cover-${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
                 const { error } = await supabase.storage.from('cover-pics').upload(fileName, file, { upsert: true });
                if (error) throw new Error(`Cover pic upload failed: ${error.message}`);
                coverPicUrl = supabase.storage.from('cover-pics').getPublicUrl(fileName).data.publicUrl;
            }

            // 2. Prepare data to update
            const updateData = {
                first_name: editFirstNameInput.value.trim(),
                last_name: editLastNameInput.value.trim(),
                middle_name: editMiddleNameInput.value.trim() || null,
                bio: editBioInput.value.trim() || null,
                city: editCityInput.value.trim() || null,
                country: editCountryInput.value || null,
                // Add other editable fields...
                profile_pic_url: profilePicUrl,
                cover_pic_url: coverPicUrl
            };

             // Remove null fields only if necessary, Supabase handles null updates
             // Object.keys(updateData).forEach(key => updateData[key] == null && delete updateData[key]);

             // 3. Update profile in database
             const { error: updateError } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', currentViewer.id);

             if (updateError) throw updateError;

             // 4. Success: Update UI and close modal
             displayMessage(editProfileForm, 'Profile updated successfully!', 'success');
             // Update local data and refresh UI parts
             currentProfileData = { ...currentProfileData, ...updateData };
             displayProfileData(currentProfileData); // Refresh main profile view
             updateHeaderForLoggedInUser(); // Refresh header pic/name if changed

             setTimeout(() => {
                 if(editProfileModal) editProfileModal.style.display = 'none';
             }, 1500); // Close modal after success message

         } catch (error) {
             console.error("Profile Update Error:", error);
             displayMessage(editProfileForm, `Update failed: ${error.message}`, 'error');
         } finally {
            setLoadingState(saveButton, false);
         }
     }

    async function handleFollowToggle() {
        if (!currentViewer || isOwnProfile || !profileUserId) return; // Can't follow self or if not logged in

        const isCurrentlyFollowing = followUnfollowBtn.dataset.following === 'true';
        setLoadingState(followUnfollowBtn, true); // Show loading on follow button

        try {
            // PLACEHOLDER: This requires a backend function or direct table manipulation
            // if RLS allows. Direct manipulation is less secure for social graphs.
            // Assumes a 'followers' table { follower_id (fk profiles.id), following_id (fk profiles.id), created_at }
            if (isCurrentlyFollowing) {
                // --- Call Supabase function or DB to UNFOLLOW ---
                 console.log(`TODO: Unfollow user ${profileUserId}`);
                 // Example direct delete (NEEDS RLS allowing delete where follower_id = auth.uid())
                // const { error } = await supabase.from('followers')
                //  .delete()
                //  .match({ follower_id: currentViewer.id, following_id: profileUserId });
                // if (error) throw error;
                 setFollowButtonState(false);
                 // Decrement follower count locally (or refetch)
            } else {
                // --- Call Supabase function or DB to FOLLOW ---
                console.log(`TODO: Follow user ${profileUserId}`);
                 // Example direct insert (NEEDS RLS allowing insert where follower_id = auth.uid())
                // const { error } = await supabase.from('followers')
                //  .insert({ follower_id: currentViewer.id, following_id: profileUserId });
                // if (error) throw error;
                 setFollowButtonState(true);
                 // Increment follower count locally (or refetch)
            }
            // Ideally, refetch stats after follow/unfollow
            fetchProfileStats(profileUserId);

        } catch(error) {
             console.error("Follow/Unfollow Error:", error);
             alert(`Action failed: ${error.message}`); // Simple alert
             // Revert button state if action failed
             setFollowButtonState(isCurrentlyFollowing);
        } finally {
            setLoadingState(followUnfollowBtn, false);
        }
    }


    // Helper: Preview image file
    function previewFile(fileInput, imgPreviewElement) { /* ... same as before ... */
         const file = fileInput.files[0];
        if (file && imgPreviewElement) {
            const reader = new FileReader();
            reader.onload = function(e) {
                imgPreviewElement.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    }

    // --- Utility Functions (Loading State, Messages - Reuse from auth.js or main.js) ---
    function setLoadingState(button, isLoading) { /* ... same ... */
        if(!button) return;
        if (isLoading) {
            button.disabled = true;
            // Store original text if not already stored
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }
            button.innerHTML = '<span class="spinner"></span> Working...'; // Or just spinner
        } else {
            button.disabled = false;
            // Restore original text
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
            // Clean up just in case
            // delete button.dataset.originalText;
        }
    }
     function displayMessage(parentElement, message, type = 'error') { /* Basic version */
         // Remove existing message first
        const existingMsg = parentElement.querySelector('.form-message');
        if (existingMsg) existingMsg.remove();
        if (!message) return; // Don't display empty messages

        const messageEl = document.createElement('p');
        messageEl.className = `form-message ${type}`;
        messageEl.textContent = message;
        parentElement.prepend(messageEl);
    }


    // --- Start the process ---
    initializeProfilePage();

}); // End DOMContentLoaded