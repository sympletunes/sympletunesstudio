// js/upload-router.js
document.addEventListener('DOMContentLoaded', () => {
    const loadingIndicator = document.getElementById('loading-indicator');
    const uploadRouterWrapper = document.getElementById('upload-router-wrapper');
    const roleSelectionPrompt = document.getElementById('role-selection-prompt');
    const roleCards = document.querySelectorAll('.upload-role-grid .role-action-card');
    const roleNote = document.getElementById('role-note');
    const detectedRoleEl = document.getElementById('detected-role');

    // --- Header Elements ---
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    const notificationCountBadges = document.querySelectorAll('.notification-count'); // For header

    let currentUser = null;
    let userProfile = null;
    let userPrimaryRole = null;

    // --- Function to fetch user data and determine action ---
    async function initializeUploadPage() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            console.error("No active session. Redirecting to sign in.");
            window.location.replace('signup.html');
            return;
        }

        currentUser = session.user;
        console.log("User authenticated for upload:", currentUser.email);

        // Fetch user profile to get the role
        try {
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('first_name, profile_pic_url, role') // Ensure 'primary_role' column exists and is selected
                .eq('id', currentUser.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') { // Ignore 'PGRST116' (0 rows) for now
                throw profileError;
            }

            userProfile = profile;
            userPrimaryRole = userProfile?.role; // e.g., "Artist", "Advertiser"

             // Update header UI (copied from dashboard.js or make it a shared function)
            updateHeaderUI();


            // --- Logic based on Role ---
            if (userPrimaryRole) {
                 userPrimaryRole = userPrimaryRole.toLowerCase().replace(/\s+/g, '_'); // Normalize role name
                console.log("Detected primary role:", userPrimaryRole);

                // Option 1: Automatically redirect based on primary role
                // redirectToRolePage(userPrimaryRole);
                // return; // Stop further execution if redirecting

                // Option 2: Show the selection, highlighting the primary role
                displayRoleSelection(userPrimaryRole);

            } else {
                // Role not found in profile, show all options for selection
                 console.warn("Primary role not found in profile. Displaying all options.");
                 displayRoleSelection(null); // Show all applicable cards
            }

            // Hide loading, show content
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            if (uploadRouterWrapper) uploadRouterWrapper.style.display = 'block';

        } catch (error) {
            console.error("Error fetching user profile or role:", error.message);
            if (loadingIndicator) loadingIndicator.innerHTML = `<p class="error-message">Error loading user data: ${error.message}</p>`;
            // Maybe show a generic error message or redirect to dashboard/login
        }
        setupEventListeners(); // Setup listeners after initial load attempt
    }

     function updateHeaderUI() {
         if (!currentUser) return;
         // Update header profile pic
         if (headerProfilePic && userProfile?.profile_pic_url) {
            headerProfilePic.src = userProfile.profile_pic_url;
        } else if (headerProfilePic) {
            headerProfilePic.src = 'assets/images/profile-placeholder.png'; // Fallback
        }
        // Update header username/email
        if (headerUsername) headerUsername.textContent = userProfile?.first_name || currentUser.email.split('@')[0];
        if (headerUserEmail) headerUserEmail.textContent = currentUser.email;

        // Placeholder: Fetch and update notification count
        // fetchNotificationCount();
    }

     function handleLogout() {
        // setLoadingState(logoutButton || mobileLogoutButton, true); // Add loading state if needed
        supabase.auth.signOut()
            .then(() => { window.location.replace('signup.html'); })
            .catch((error) => {
                console.error('Sign out error:', error);
                 alert("Sign out failed: " + error.message);
                 // setLoadingState(logoutButton || mobileLogoutButton, false);
            });
    }

     function setupEventListeners() {
         // Logout Buttons
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);

        // Add listeners for mobile menu, dropdown etc. if needed (might be in main.js)
     }


    // --- Function to redirect based on role ---
    function redirectToRolePage(role) {
        let targetUrl = 'dashboard.html'; // Default fallback
    
        switch (role) {
            case 'artist':
            case 'producer':
            case 'dj':
            case 'sound_engineer':
                targetUrl = 'upload-artist.html';
                break;
            case 'advertiser':
                targetUrl = 'upload-advertiser.html';
                break;
            case 'blogger':
                targetUrl = 'upload-blogger.html';
                break;
            case 'event_organizer':
                targetUrl = 'manage-events.html';
                break;
            case 'podcaster':
                targetUrl = 'upload-podcaster.html';
                break;
            case 'contributor':
                targetUrl = 'upload-contributor.html';
                break;
            default:
                console.warn(`No specific upload page defined for role: ${role}. Redirecting to dashboard.`);
                targetUrl = 'dashboard.html';
        }
    
        console.log(`Redirecting to ${targetUrl}`);
        window.location.replace(targetUrl); // Use replace so back button doesn't return here
    }
    

    // --- Function to display role selection UI ---
    function displayRoleSelection(primaryRole) {
         if (roleSelectionPrompt) roleSelectionPrompt.textContent = "Select the context you want to work in:";

        roleCards.forEach(card => {
            let cardIsVisible = false;
            // Check if the card's role class matches the user's primary role or if it's the contributor card
            if (card.classList.contains(primaryRole) || card.classList.contains('contributor')) {
                 cardIsVisible = true;
            }

            // Alternative: Show all cards relevant to the user (if they can have multiple roles or context switching is allowed)
            // Check against a list of roles the user *can* access, fetched from profile/permissions
             // For now, just show primary + contributor

             // Or, if no primary role, show all non-contributor + contributor
             if (!primaryRole && !card.classList.contains('contributor') && card.classList.contains('role-specific')) {
                // cardIsVisible = true; // Show all standard roles if primary is unknown
             }
             // Always show contributor
             if (card.classList.contains('contributor')) {
                 cardIsVisible = true;
             }

            card.style.display = cardIsVisible ? 'flex' : 'none';

            // Optionally highlight the primary role card
            if (card.classList.contains(primaryRole)) {
                 card.classList.add('highlighted-role'); // Add CSS for this class
            }
        });

        if (primaryRole && detectedRoleEl && roleNote) {
            detectedRoleEl.textContent = primaryRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()); // Format role name
            roleNote.style.display = 'block';
        } else if (roleNote) {
             roleNote.style.display = 'none';
        }
    }

    // --- Start Initialization ---
    initializeUploadPage();

}); // End DOMContentLoaded