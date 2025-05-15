const supabase = window.supabase;
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('auth-container') || document.body;

  // Inject HTML blocks
  container.insertAdjacentHTML('beforeend', `
    <!-- Not Logged In -->
    <div class="auth-actions" style="display: none;">
      <a href="signup.html" class="btn btn-secondary">Sign In</a>
      <a href="upload.html" class="btn btn-primary"><i class="fas fa-upload"></i> Upload</a>
    </div>
  
    <!-- Logged In -->
    <div class="user-actions" style="display: none; align-items: center; gap: 1rem;">
      <a href="dashboard.html" class="btn btn-secondary">Dashboard</a>
      <button class="btn-icon notifications-btn" aria-label="Notifications">
        <i class="fas fa-bell"></i>
        <span class="badge notification-count" style="display: none;">0</span>
      </button>
      <div class="profile-dropdown">
        <button class="profile-trigger" aria-label="Profile menu">
          <img src="profile-picture.png" alt="My Profile" id="header-profile-pic" class="header-avatar">
        </button>
        <div class="dropdown-menu glass-element">
          <div class="dropdown-header">
            <span id="header-username">User Name</span>
            <span id="header-user-email">user@email.com</span>
          </div>
          <a href="profile.html" class="dropdown-item"><i class="fas fa-user"></i> My Profile</a>
          <a href="dashboard.html" class="dropdown-item"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
          <a href="#settings-section" class="dropdown-item" id="settings-link"><i class="fas fa-cog"></i> Account Settings</a>
          <hr class="dropdown-divider">
          <button class="dropdown-item" id="logout-button"><i class="fas fa-sign-out-alt"></i> Sign Out</button>
        </div>
      </div>
    </div>
  `);
  
  const authActions = document.querySelector('.auth-actions');
  const userActions = document.querySelector('.user-actions');
  const usernameSpan = document.getElementById('header-username');
  const emailSpan = document.getElementById('header-user-email');
  const profilePic = document.getElementById('header-profile-pic');
  const logoutBtn = document.getElementById('logout-button');

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (session?.user) {
      // Show logged-in UI
      if (authActions) authActions.style.display = 'none';
      if (userActions) userActions.style.display = 'flex';

      const user = session.user;
      const name = user.user_metadata?.full_name || 'My Account';
      const email = user.email || '';
      const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('first_name, profile_pic_url')
      .eq('id', user.id)
      .single();
      
      if (usernameSpan) usernameSpan.textContent = name;
      if (emailSpan) emailSpan.textContent = email;
      if (profileError) {
        console.warn("Failed to fetch profile for header:", profileError.message);
      } else if (profileData) {
        if (usernameSpan) usernameSpan.textContent = profileData.first_name || name;
        if (profilePic && profileData.profile_pic_url) {
          profilePic.src = profileData.profile_pic_url;
        }
      }
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
          await supabase.auth.signOut();
          window.location.href = 'signup.html';
        });
      }
    } else {
      // Not logged in
      if (authActions) authActions.style.display = 'flex';
      if (userActions) userActions.style.display = 'none';
    }
  } catch (err) {
    console.error('Supabase auth check failed:', err.message);
    if (authActions) authActions.style.display = 'flex';
    if (userActions) userActions.style.display = 'none';
  }
});
