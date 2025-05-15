// js/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    const loadingIndicator = document.getElementById('loading-indicator');
    const dashboardWrapper = document.getElementById('dashboard-wrapper');
    const welcomeUsername = document.getElementById('welcome-username');
    const dashboardTitle = document.getElementById('dashboard-title');

    // Header elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    // Sidebar links and dynamic content sections
    const sidebarLinks = document.querySelectorAll('.sidebar-nav li[data-section]');
    const dynamicContentSections = document.querySelectorAll('.dashboard-section');

    // Widget placeholders
    const widgetTotalUploads = document.getElementById('widget-total-uploads');
    const widgetTotalEarnings = document.getElementById('widget-total-earnings');
    const widgetFollowers = document.getElementById('widget-followers');
    const widgetPlays = document.getElementById('widget-plays');

    // Recent content/notification placeholders
    const recentContentGrid = document.getElementById('recent-content-grid');
    const recentNotificationList = document.getElementById('recent-notification-list');
    const noRecentContentMsg = document.getElementById('no-recent-content');
    const noRecentNotificationsMsg = document.getElementById('no-recent-notifications');

    // Role specific elements
    const roleSpecificElements = document.querySelectorAll('.role-specific');

    let currentUser = null;
    let userProfile = null;

    // --- Authentication Check ---
    async function checkAuthAndLoad() {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
            console.error('No active session found. Redirecting to sign in.');
            // Redirect to login page if not authenticated
            window.location.replace('signup.html'); // Use replace to prevent back button
            return; // Stop further execution
        }

        // User is logged in
        currentUser = session.user;
        console.log('User authenticated:', currentUser.email);

        // Fetch user profile data
        await fetchUserProfile();

        // Hide loading, show dashboard
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (dashboardWrapper) dashboardWrapper.style.display = 'block';

        // Load initial dashboard data (Overview)
        switchDashboardSection('overview');// Load default section
        updateHeaderUI();
        updateRoleSpecificUI();

        // Add listeners AFTER auth check
        setupEventListeners();
    }
    function setupSmoothScroll() {
        document.querySelectorAll('.sidebar-nav a[href^="#"], .view-all-link[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                const href = this.getAttribute('href');
                if (href.length > 1 && href.startsWith('#')) {
                    const targetElement = document.getElementById(href.substring(1));
                    if (targetElement) {
                        e.preventDefault();
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start' // Align to top
                        });
                        // Optionally update active state in sidebar immediately on click
                        // updateSidebarActiveState(href.substring(1));
                    }
                }
            });
        });
    }

    function setupScrollSpy() {
        const sections = document.querySelectorAll('.dashboard-section.scroll-target');
        const sidebarLinksMap = new Map();
        document.querySelectorAll('.sidebar-nav li[data-section-target]').forEach(li => {
            sidebarLinksMap.set(li.dataset.sectionTarget, li);
        });
    
        const observerOptions = {
            root: null, // relative to document viewport
            rootMargin: '-40% 0px -60% 0px', // Adjust margins to trigger when section is roughly centered
            threshold: 0 // Trigger as soon as even 1px is visible within margins
        };
    
        const observerCallback = (entries) => {
            entries.forEach(entry => {
                const targetId = entry.target.id;
                const correspondingLinkLi = sidebarLinksMap.get(targetId);
    
                if (entry.isIntersecting && correspondingLinkLi) {
                     // Remove active from all others
                     sidebarLinksMap.forEach(li => li.classList.remove('active'));
                     // Add active to the current one
                     correspondingLinkLi.classList.add('active');
                }
            });
        };
    
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        sections.forEach(section => observer.observe(section));
    }
    
  // --- Data Fetching ---
async function fetchUserProfile() {
    if (!currentUser) return;

    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select(`first_name, last_name, profile_pic_url`)
            .eq('id', currentUser.id)
            .single();

        if (error && status !== 406) {
            throw error;
        }

        if (data) {
            // ✅ Assign profile object
            userProfile = data;
            console.log('User profile loaded:', data);

            // ✅ Welcome name
            if (welcomeUsername) {
                welcomeUsername.textContent = data.first_name || currentUser.email;
            }

            // ✅ Profile picture with cache busting
            if (headerProfilePic) {
                if (data.profile_pic_url) {
                    headerProfilePic.src = `${data.profile_pic_url}?t=${Date.now()}`;
                } else {
                    headerProfilePic.src = 'profile-picture.png'; // fallback
                }
            }

        } else {
            console.warn("User profile not found.");
            if (welcomeUsername) {
                welcomeUsername.textContent = currentUser.email;
            }
        }

    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        if (welcomeUsername) {
            welcomeUsername.textContent = currentUser.email;
        }
    }
}


    async function fetchOverviewData() {
        // --- Fetch Widget Data (Example Placeholders) ---
        // Replace with your actual Supabase queries
        try {
            // Example: Get content count
            const { count: uploadCount, error: countError } = await supabase
                .from('content') // Assuming a 'content' table linked to user_id
                .select('*', { count: 'exact', head: true })
                .eq('user_id', currentUser.id); // Make sure content table has user_id

            if (countError) console.error("Error fetching upload count:", countError);
            else if (widgetTotalUploads) widgetTotalUploads.textContent = uploadCount ?? 0;

            // Fetch other widget data similarly (earnings, followers, plays)
            // These might involve more complex queries or Supabase Functions
            if (widgetTotalEarnings) widgetTotalEarnings.textContent = "$12.34"; // Placeholder
            if (widgetFollowers) widgetFollowers.textContent = "15"; // Placeholder
            if (widgetPlays) widgetPlays.textContent = "1,280"; // Placeholder

        } catch (error) {
            console.error("Error fetching widget data:", error.message);
        }


        // --- Fetch Recent Content (Example) ---
        try {
            const { data: contentData, error: contentError } = await supabase
                .from('content') // Replace 'content' with your actual table name
                .select('id, title, thumbnail_url, type') // Select necessary fields
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false }) // Get latest
                .limit(4); // Limit to a few items

            if (contentError) throw contentError;

            renderRecentContent(contentData || []);
        } catch (error) {
            console.error("Error fetching recent content:", error.message);
            if (recentContentGrid) recentContentGrid.innerHTML = '<p class="error-message">Could not load recent content.</p>';
        }


        // --- Fetch Recent Notifications (Example) ---
        try {
            const { data: notificationData, error: notificationError } = await supabase
                .from('notifications') // Replace 'notifications' with your actual table name
                .select('id, message, created_at, is_read, link_url') // Select fields
                .eq('user_id', currentUser.id) // Assuming notifications are user-specific
                .eq('is_read', false) // Example: Show unread notifications
                .order('created_at', { ascending: false })
                .limit(5);

            if (notificationError) throw notificationError;

            renderRecentNotifications(notificationData || []);
        } catch (error) {
            console.error("Error fetching notifications:", error.message);
             if (recentNotificationList) recentNotificationList.innerHTML = '<p class="error-message">Could not load notifications.</p>';
        }
    }

    // --- Rendering Functions ---
    function renderRecentContent(items) {
        if (!recentContentGrid) return;
        recentContentGrid.innerHTML = ''; // Clear previous items

        if (!items || items.length === 0) {
            if (noRecentContentMsg) noRecentContentMsg.style.display = 'block';
            return;
        }

        if (noRecentContentMsg) noRecentContentMsg.style.display = 'none';

        items.forEach(item => {
            // Reusing the .content-card structure (simplified for minimal grid)
            const card = document.createElement('article');
            card.className = 'content-card minimal-card'; // Add specific class if needed
            card.innerHTML = `
                <a href="/content/${item.id}"> <!-- Adjust link structure -->
                    <div class="card-thumbnail">
                        <img src="${item.thumbnail_url || 'assets/images/content-placeholder1.jpg'}" alt="${item.title || 'Content'} Thumbnail">
                    </div>
                    <div class="card-info">
                        <h3 class="card-title">${item.title || 'Untitled'}</h3>
                        <!-- Optionally add type back if desired -->
                        <!-- <span class="card-type-badge">${item.type || 'Unknown'}</span> -->
                    </div>
                </a>
            `;
            recentContentGrid.appendChild(card);
        });
    }

    function renderRecentNotifications(items) {
        if (!recentNotificationList) return;
        recentNotificationList.innerHTML = ''; // Clear previous

        const unreadCount = items.filter(n => !n.is_read).length; // Assuming you fetch all recent and filter or fetch only unread
        updateNotificationBadge(unreadCount); // Update badges

        if (!items || items.length === 0) {
            if (noRecentNotificationsMsg) noRecentNotificationsMsg.style.display = 'block';
            return;
        }
         if (noRecentNotificationsMsg) noRecentNotificationsMsg.style.display = 'none';


        items.forEach(item => {
            const listItem = document.createElement('li');
            listItem.className = `notification-item ${item.is_read ? 'read' : 'unread'}`;
            // Use item.link_url if available to make it clickable
            listItem.innerHTML = `
                ${item.link_url ? `<a href="${item.link_url}">` : ''}
                ${item.message || 'No message content.'}
                <span class="notification-time">${timeAgo(item.created_at)}</span>
                ${item.link_url ? `</a>` : ''}
            `;
            // Add event listener to mark as read on click if needed
            recentNotificationList.appendChild(listItem);
        });
    }

    function updateNotificationBadge(count) {
        const badgeElements = document.querySelectorAll('.notification-count, .sidebar-badge');
        badgeElements.forEach(badge => {
            if (count > 0) {
                badge.textContent = count > 9 ? '9+' : count;
                badge.style.display = 'inline-block';
            } else {
                badge.style.display = 'none';
            }
        });
    }

    // --- UI Updates & Event Handlers ---
    function updateHeaderUI() {
        if (!currentUser) return;
        if (headerUsername) headerUsername.textContent = userProfile?.first_name || currentUser.email.split('@')[0]; // Show first name or part of email
        if (headerUserEmail) headerUserEmail.textContent = currentUser.email;
    }

    function updateRoleSpecificUI() {
        if (!userProfile || !userProfile.primary_role) return; // Assuming role is fetched in profile

        const userRole = userProfile.primary_role.toLowerCase().replace(/\s+/g, '_'); // e.g., "event_organizer"

        roleSpecificElements.forEach(el => {
            let isVisible = false;
            el.classList.forEach(cls => {
                if (cls === userRole) {
                    isVisible = true;
                }
            });
            el.style.display = isVisible ? (el.tagName === 'A' || el.tagName === 'BUTTON' || el.tagName === 'LI' ? 'flex' : 'block') : 'none';
        });
    }


    function handleLogout() {
        setLoadingState(logoutButton || mobileLogoutButton, true); // Show loading on whichever was clicked
        supabase.auth.signOut()
            .then(() => {
                console.log('User signed out.');
                window.location.replace('signup.html'); // Redirect to sign-in page
            })
            .catch((error) => {
                console.error('Sign out error:', error);
                // Optionally display an error message to the user
                 setLoadingState(logoutButton || mobileLogoutButton, false);
            });
    }

    function switchDashboardSection(targetSectionId) {
        // Remove active class from all sections and sidebar links
        dynamicContentSections.forEach(section => section.classList.remove('active-section'));
        sidebarLinks.forEach(link => link.classList.remove('active'));

        // Add active class to the target section and corresponding sidebar link
        const targetSection = document.getElementById(`${targetSectionId}-section`);
        const targetLink = document.querySelector(`.sidebar-nav li[data-section="${targetSectionId}"]`);

        if (targetSection) {
            targetSection.classList.add('active-section');
            if (dashboardTitle) dashboardTitle.textContent = targetLink?.textContent.trim() || 'Dashboard'; // Update title
             // Load data for the specific section if needed (e.g., fetch full notification list)
             if(targetSectionId === 'overview') fetchOverviewData();
             // else if(targetSectionId === 'analytics') fetchAnalyticsData(); // etc.

        } else {
             console.warn(`Dashboard section "${targetSectionId}-section" not found.`);
             // Optionally show the overview section as a fallback
             document.getElementById('overview-section')?.classList.add('active-section');
             document.querySelector('.sidebar-nav li[data-section="overview"]')?.classList.add('active');
             if (dashboardTitle) dashboardTitle.textContent = 'Overview';

        }
        if (targetLink) {
            targetLink.classList.add('active');
        }
    }

    function setupEventListeners() {
        // Logout Buttons
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);
    
        // Sidebar Navigation
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                if (sectionId) {
                    switchDashboardSection(sectionId);
    
                    // Auto-close sidebar on mobile
                    if (window.innerWidth <= 768) {
                        const sidebar = document.querySelector('.dashboard-sidebar');
                        const icon = document.getElementById('sidebar-toggle-icon');
                        if (sidebar) sidebar.classList.remove('open');
                        if (icon) {
                            icon.classList.remove('fa-arrow-left');
                            icon.classList.add('fa-arrow-right');
                        }
                    }
                }
            });
        });
    
        // View All Links (that switch sections)
        document.querySelectorAll('.view-all-link[data-section]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.dataset.section;
                if (sectionId) {
                    switchDashboardSection(sectionId);
                }
            });
        });
    
        // Mobile Sidebar Toggle Button with Icon Swap
        const sidebarToggle = document.getElementById('mobile-sidebar-toggle');
        const sidebar = document.querySelector('.dashboard-sidebar');
        const icon = document.getElementById('sidebar-toggle-icon');
    
        if (sidebarToggle && sidebar && icon) {
            sidebarToggle.addEventListener('click', () => {
                const isOpen = sidebar.classList.toggle('open');
                icon.classList.toggle('fa-arrow-right', !isOpen);
                icon.classList.toggle('fa-arrow-left', isOpen);
            });
        }
    }
    

    // --- Initial Load ---
    checkAuthAndLoad();

}); // End DOMContentLoaded