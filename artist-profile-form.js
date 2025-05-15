// js/artist-profile-form.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Same as before, ensure all are correct) ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const artistProfileWrapper = document.getElementById('artist-profile-wrapper');

    const termsStep = document.getElementById('terms-step-artist');
    const agreeArtistTermsCheckbox = document.getElementById('agree-artist-terms-checkbox');
    const proceedToProfileFormBtn = document.getElementById('proceed-to-profile-form-btn');

    const artistProfileFormStep = document.getElementById('artist-profile-form-step');
    const profileForm = document.getElementById('music-industry-profile-form');
    const formSubmissionMessage = document.getElementById('form-submission-message');

    // General Info Inputs (for pre-filling and submission)
    const generalInfo_firstNameInput = document.getElementById('profile-first-name');
    const generalInfo_lastNameInput = document.getElementById('profile-last-name');
    const generalInfo_emailInput = document.getElementById('profile-email'); // Readonly for display
    const generalInfo_phoneInput = document.getElementById('profile-phone-number');
    const generalInfo_dobInput = document.getElementById('profile-dob');
    const generalInfo_genderInput = document.getElementById('profile-gender');
    const generalInfo_nationalityInput = document.getElementById('profile-nationality');

    // Role Inputs
    const primaryRoleInput = document.getElementById('profile-primary-role');
    const stageNameInput = document.getElementById("profile-stage-name");
    const artistTypeInput = document.getElementById('profile-artist-type');
    const musicRightsCheckbox = document.getElementById('profile-music-rights');
const otherRolesCheckboxes = document.querySelectorAll('input[name="other_roles"]');
const affiliationsInput = document.getElementById('profile-affiliations');
const languagesCheckboxes = document.querySelectorAll('input[name="languages"]');
const featuredArtistSelect = document.getElementById('profile-featured-artist');
const featureNameGroup = document.getElementById('feature-name-group');
const otherLanguageGroup = document.getElementById('other-language-group');
const otherLanguageInput = document.getElementById('profile-other-language');


    // Media Inputs
    const coverImageInput = document.getElementById('profile-cover-image');
    const coverImagePreview = document.getElementById('cover-image-preview');
    const musicFilesInput = document.getElementById('profile-music-files'); // This is multiple
    const musicFilesList = document.getElementById('music-files-list');
    const videoOptionToggleBtns = document.querySelectorAll('.video-option-toggle .btn-toggle');
    const videoFileInput = document.getElementById('profile-video-file');
    const videoUrlEmbedInput = document.getElementById('profile-video-url-embed');
    const videoFileList = document.getElementById('video-file-list');

    // Portfolio Inputs
    const portfolioUrlsInput = document.getElementById('profile-portfolio-urls');
    const socialMediaLinksInput = document.getElementById('profile-social-media-links');
    const bioInput = document.getElementById('profile-bio');
    const bioWordCountEl = document.getElementById('bio-word-count');

    // Header elements for logged-in user display
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    const backToTermsArtistBtn = document.getElementById('back-to-terms-artist-btn');
   // In your DOMContentLoaded
const successModal = document.getElementById('success-modal');
const modalCloseBtn = successModal.querySelector('.modal-close');
const modalOkBtn   = document.getElementById('modal-ok-btn');

modalCloseBtn.addEventListener('click', () => successModal.style.display = 'none');
modalOkBtn.addEventListener('click',   () => successModal.style.display = 'none');


    let currentUser = null;
    let userBasicProfile = null; // From 'profiles' table
    let userIndustryProfile = null; // From 'music_industry_profiles' table
    let selectedMusicFilesArray = []; // To store multiple File objects for music
    let selectedVideoFileObject = null; // Single File object for video
    let selectedCoverImageFileObject = null; // Single File object for cover

    const EMAILJS_SERVICE_ID = 'default_service';
    const EMAILJS_ARTIST_PROFILE_SUBMIT_TEMPLATE_ID = 'template_bfhh17c'; // Update this


    // --- Initialization ---
    async function initializePage() {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
            window.location.replace('signup.html');
            return;
        }
        currentUser = session.user;
        console.log("✅ Authenticated user session loaded.");

        await Promise.all([
            fetchUserBasicProfile(),
            fetchUserIndustryProfile()
        ]);

        updateHeaderUI();
        prefillGeneralInfo(); // Pre-fill after fetching basic profile
        prefillIndustryProfileData(); // Pre-fill the rest of the form

        navigateToFormStep('terms-step-artist'); // Start with terms

        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (artistProfileWrapper) artistProfileWrapper.style.display = 'block';

const termsCheckbox = document.getElementById('agree-artist-terms-checkbox');
const continueBtn = document.getElementById('proceed-to-profile-form-btn');

if (termsCheckbox && continueBtn) {
    termsCheckbox.addEventListener('change', () => {
        continueBtn.disabled = !termsCheckbox.checked;
    });
}
// Add click handler to proceed button
const proceedToProfileFormBtn = document.getElementById('proceed-to-profile-form-btn');
if (proceedToProfileFormBtn) {
    proceedToProfileFormBtn.addEventListener('click', () => {
        console.log("✅ Proceed button clicked.");
        navigateToFormStep('artist-profile-form-step');
    });
}

        setupEventListeners();
    }

    async function fetchUserBasicProfile() {
        try {
            const { data, error } = await supabase
                .from('profiles') // Your general profiles table
                .select('first_name, last_name, email, phone_number, dob, gender, nationality, profile_pic_url') // Added profile_pic_url
                .eq('id', currentUser.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = 0 rows
            userBasicProfile = data;
            console.log("✅ Basic profile loaded.");        } catch (error) {
            console.error("Error fetching basic profile data:", error.message);
            // Handle error, maybe show a message
        }
    }

    async function fetchUserIndustryProfile() {
        try {
            const { data, error } = await supabase
                .from('music_industry_profiles')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            userIndustryProfile = data;
            console.log("✅ Industry profile loaded.");        } catch (error) {
            console.error("Error fetching industry profile data:", error.message);
        }
    }

    function updateHeaderUI() {
        if (!currentUser) return;

        // Use basic profile for header if available, otherwise auth email
        const displayName = userBasicProfile?.first_name || currentUser.email.split('@')[0];
        const displayEmail = currentUser.email;
        const displayPic = userBasicProfile?.profile_pic_url || 'assets/images/profile-placeholder.png';

        if (headerUsername) headerUsername.textContent = displayName;
        if (headerUserEmail) headerUserEmail.textContent = displayEmail;
        if (headerProfilePic) headerProfilePic.src = displayPic;
    }

    function prefillGeneralInfo() {
        // Pre-fill "General Information" section from userBasicProfile if available,
        // or from userIndustryProfile as a fallback if editing an existing industry profile.
        const source = userIndustryProfile || userBasicProfile || {}; // Prioritize industry profile if it has these general fields

        if (generalInfo_firstNameInput) generalInfo_firstNameInput.value = source.first_name || userBasicProfile?.first_name || '';
        if (generalInfo_lastNameInput) generalInfo_lastNameInput.value = source.last_name || userBasicProfile?.last_name || '';
        if (generalInfo_emailInput) generalInfo_emailInput.value = currentUser.email; // Always from auth
        if (generalInfo_phoneInput) generalInfo_phoneInput.value = source.phone_number || userBasicProfile?.phone_number || '';
        if (generalInfo_dobInput) generalInfo_dobInput.value = source.dob || userBasicProfile?.dob || '';
        if (generalInfo_genderInput) generalInfo_genderInput.value = source.gender || userBasicProfile?.gender || '';
        if (generalInfo_nationalityInput) generalInfo_nationalityInput.value = source.nationality || userBasicProfile?.nationality || '';
    }

    function prefillIndustryProfileData() {
      if (!userIndustryProfile) {
          console.log("No existing industry profile to prefill specific fields.");
          if (artistTypeInput) artistTypeInput.value = 'Independent';
          if (musicRightsCheckbox) musicRightsCheckbox.checked = false;
          return;
      }
  
      console.log("Prefilling industry specific data:", userIndustryProfile);
      const ip = userIndustryProfile;
  
      // Role
      if (primaryRoleInput) primaryRoleInput.value = ip.primary_role || '';
      if (ip.other_roles && ip.other_roles.length > 0) {
          otherRolesCheckboxes.forEach(cb => {
              if (ip.other_roles.includes(cb.value)) cb.checked = true;
          });
      }
      if (affiliationsInput) affiliationsInput.value = ip.affiliations || '';
  
      // Profile & Media
      if (coverImagePreview && ip.cover_image_url) {
          coverImagePreview.src = ip.cover_image_url;
          coverImagePreview.style.display = 'block';
      }
  
      if (musicFilesList && Array.isArray(ip.music_files) && ip.music_files.length > 0) {
          musicFilesList.innerHTML = '';
          ip.music_files.forEach(fileUrl => {
              const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
              const item = document.createElement('div');
              item.className = 'file-preview-item existing-file';
              item.innerHTML = `<div class="file-info"><i class="fas fa-music file-icon"></i><span class="file-name">${decodeURIComponent(fileName)}</span> <a href="${fileUrl}" target="_blank" class="view-file-link">(View)</a></div> <span class="file-note">Previously uploaded</span>`;
              musicFilesList.appendChild(item);
          });
          const noFilesNote = musicFilesList.querySelector('.no-files-note');
          if (noFilesNote) noFilesNote.style.display = 'none';
      }
  
      if (ip.video_url) {
          if (ip.video_url.startsWith('http')) {
              if (videoUrlEmbedInput) videoUrlEmbedInput.value = ip.video_url;
              toggleVideoInput('url');
              if (videoFileList) videoFileList.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-link file-icon"></i><span class="file-name">${ip.video_url}</span></div></div>`;
          } else {
              toggleVideoInput('upload');
              if (videoFileList) videoFileList.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-video file-icon"></i><span class="file-name">${ip.video_url.substring(ip.video_url.lastIndexOf('/') + 1)}</span> <a href="${ip.video_url}" target="_blank" class="view-file-link">(View)</a></div></div>`;
          }
      }
  
      // Text fields that may be arrays or strings
      if (portfolioUrlsInput)
          portfolioUrlsInput.value = Array.isArray(ip.portfolio_url) ? ip.portfolio_url.join(', ') : ip.portfolio_url || '';
      if (socialMediaLinksInput)
          socialMediaLinksInput.value = Array.isArray(ip.social_media_links) ? ip.social_media_links.join(', ') : ip.social_media_links || '';
      if (bioInput) bioInput.value = ip.bio || '';
      updateBioWordCount();
  
      if (document.getElementById('profile-skills')) {
          const val = ip.skills;
          document.getElementById('profile-skills').value = Array.isArray(val) ? val.join(', ') : val || '';
      }
  
      if (document.getElementById('profile-certifications')) {
          const certs = ip.certifications;
          document.getElementById('profile-certifications').value = Array.isArray(certs) ? certs.join(', ') : certs || '';
      }
  
      if (document.getElementById('profile-collaborations')) {
          const val = ip.collaborations;
          document.getElementById('profile-collaborations').value = Array.isArray(val) ? val.join(', ') : val || '';
      }
  
      if (document.getElementById('profile-availability'))
          document.getElementById('profile-availability').value = ip.availability || '';
  
      // Distribution
      if (artistTypeInput) artistTypeInput.value = ip.artist_type || 'Independent';
      if (featuredArtistSelect) {
          featuredArtistSelect.value = ip.featured_artist ? 'Yes' : 'No';
          toggleFeatureNameField(ip.featured_artist);
      }
      if (featureNameGroup && ip.feature_name && document.getElementById('profile-feature-name')) {
          document.getElementById('profile-feature-name').value = ip.feature_name;
      }
      if (document.getElementById('profile-distributor-name'))
          document.getElementById('profile-distributor-name').value = ip.distributor_name || '';
  
      // Pre-fill multi-select arrays (checkboxes)
      ['distribution_channels', 'specialized_genres', 'regions_covered'].forEach(fieldName => {
          const inputs = document.querySelectorAll(`input[name="${fieldName}"]`);
          if (Array.isArray(ip[fieldName]) && ip[fieldName].length > 0) {
              inputs.forEach(cb => {
                  if (ip[fieldName].includes(cb.value)) cb.checked = true;
              });
          }
      });
  
      // Also populate text inputs for genre/region (if used)
      if (document.getElementById('profile-specialized-genres')) {
          const val = ip.specialized_genres;
          document.getElementById('profile-specialized-genres').value = Array.isArray(val) ? val.join(', ') : val || '';
      }
      if (document.getElementById('profile-regions-covered')) {
          const val = ip.regions_covered;
          document.getElementById('profile-regions-covered').value = Array.isArray(val) ? val.join(', ') : val || '';
      }
  
      if (musicRightsCheckbox) musicRightsCheckbox.checked = ip.music_rights_confirmed || false;
  
      // Emergency & Communication
      if (document.getElementById('profile-emergency-contact-name'))
          document.getElementById('profile-emergency-contact-name').value = ip.emergency_contact_name || '';
      if (document.getElementById('profile-emergency-relationship'))
          document.getElementById('profile-emergency-relationship').value = ip.emergency_relationship || '';
      if (document.getElementById('profile-emergency-phone'))
          document.getElementById('profile-emergency-phone').value = ip.emergency_phone || '';
  
      // Languages
      if (Array.isArray(ip.languages) && ip.languages.length > 0) {
          let otherLangValue = '';
          languagesCheckboxes.forEach(cb => {
              if (ip.languages.includes(cb.value)) {
                  cb.checked = true;
                  if (cb.value === 'Other' && ip.other_language) {
                      otherLangValue = ip.other_language;
                  }
              }
          });
          if (otherLanguageGroup && Array.from(languagesCheckboxes).find(cb => cb.value === 'Other' && cb.checked)) {
              otherLanguageGroup.style.display = 'block';
              if (otherLanguageInput) otherLanguageInput.value = otherLangValue;
          }
      }
  
      if (document.getElementById('profile-communication-method'))
          document.getElementById('profile-communication-method').value = ip.communication_method || 'Email';
      if (document.getElementById('profile-time-zone'))
          document.getElementById('profile-time-zone').value = ip.time_zone || '';
      if (document.getElementById('profile-relocation'))
          document.getElementById('profile-relocation').value = ip.relocation || '';
      if (document.getElementById('profile-work-availability'))
          document.getElementById('profile-work-availability').value = ip.work_availability || 'Freelance/Contract';
      if (document.getElementById('profile-health-considerations'))
          document.getElementById('profile-health-considerations').value = ip.health_considerations || '';
      if (document.getElementById('profile-additional-notes'))
          document.getElementById('profile-additional-notes').value = ip.additional_notes || '';
  }
  

    // --- Step Navigation and UI Toggles (toggleVideoInput, toggleFeatureNameField, updateBioWordCount - same as before) ---
    function navigateToFormStep(stepId) {
        const allSteps = document.querySelectorAll('.form-step');
        allSteps.forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active-step');
        });
    
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.style.display = 'block';
            targetStep.classList.add('active-step');
            console.log(`✅ Navigated to step: ${stepId}`);
        } else {
            console.error(`❌ Could not find element with ID "${stepId}"`);
        }
    }
        function toggleVideoInput(option) { /* ... */ }
    function toggleFeatureNameField(isFeatured) { /* ... */ }
    function updateBioWordCount() { /* ... */ }

    // --- File Handling (previewSingleImage, handleMusicFilesSelection, removeMusicFile, handleVideoFileSelection - same as before) ---
    function previewSingleImage(fileInput, imgPreviewElement) {
        const file = fileInput.files[0];
        if (file && imgPreviewElement) {
            // Store the file object for later upload
            if (fileInput.id === 'profile-cover-image') selectedCoverImageFileObject = file;

            const reader = new FileReader();
            reader.onload = (e) => { imgPreviewElement.src = e.target.result; };
            reader.readAsDataURL(file);
            imgPreviewElement.style.display = 'block'; // Ensure it's visible
        } else if (imgPreviewElement) {
            // Don't clear if prefilled from existing profile
            // imgPreviewElement.src = 'assets/images/cover-placeholder.png';
        }
    }

    function handleMusicFilesSelection() {
        if (!musicFilesInput || !musicFilesList) return;
        selectedMusicFilesArray = Array.from(musicFilesInput.files); // Store File objects
        musicFilesList.innerHTML = ''; // Clear previous previews of *newly selected* files

        if (userIndustryProfile && userIndustryProfile.music_files && userIndustryProfile.music_files.length > 0) {
            userIndustryProfile.music_files.forEach(fileUrl => {
                const fileName = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
                const item = document.createElement('div');
                item.className = 'file-preview-item existing-file';
                item.innerHTML = `<div class="file-info"><i class="fas fa-music file-icon"></i><span class="file-name">${decodeURIComponent(fileName)}</span> <a href="${fileUrl}" target="_blank" class="view-file-link">(View Existing)</a></div> <span class="file-note">Previously uploaded</span>`;
                musicFilesList.appendChild(item);
            });
        }


        if (selectedMusicFilesArray.length === 0 && !(userIndustryProfile && userIndustryProfile.music_files && userIndustryProfile.music_files.length > 0) ) {
            musicFilesList.innerHTML = '<p class="no-files-note">No music files selected yet.</p>';
            return;
        }

        const totalMusicFiles = selectedMusicFilesArray.length + (userIndustryProfile?.music_files?.length || 0);

        if (totalMusicFiles < 2) {
             displayFormMessage(profileForm, "Please ensure at least 2 music files are present (new or existing).", "error", "music-files-upload-group");
        } else {
            clearFormMessage(profileForm, "music-files-upload-group");
        }

        selectedMusicFilesArray.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-preview-item new-file';
            item.innerHTML = `
                <div class="file-info">
                    <i class="fas fa-music file-icon"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" class="remove-file-btn" data-index="${index}" aria-label="Remove file">×</button>
            `;
            item.querySelector('.remove-file-btn').addEventListener('click', (e) => removeNewlySelectedMusicFile(e.target.dataset.index));
            musicFilesList.appendChild(item);
        });
    }

    function removeNewlySelectedMusicFile(indexToRemove) {
        selectedMusicFilesArray.splice(indexToRemove, 1);
        handleMusicFilesSelection(); // Re-render the list of newly selected files
        // Important: This doesn't easily remove from the <input type="file" multiple>.
        // The user would have to clear and re-select if they want to remove one from the input's FileList.
        // `musicFilesInput.files = new FileList()` is not directly possible.
        // A common workaround is to clear `musicFilesInput.value = null;` which clears all selections.
        // For robust individual removal from a multiple file input before upload, more complex UI (e.g. hidden inputs per file) is needed.
        // For now, rely on the `selectedMusicFilesArray` which is what we'll upload.
    }


    function handleVideoFileSelection() {
        if (!videoFileInput || !videoFileList) return;
        selectedVideoFileObject = videoFileInput.files[0]; // Store the File object
        videoFileList.innerHTML = '';

        if (!selectedVideoFileObject) {
             videoFileList.innerHTML = '<p class="no-files-note">No video file selected.</p>';
            return;
        }
        // Basic validation (example)
        if (selectedVideoFileObject.size > 50 * 1024 * 1024) { // 50MB
            displayFormMessage(profileForm, "Video file exceeds 50MB limit.", "error", "video-upload-group");
            selectedVideoFileObject = null; videoFileInput.value = '';
            videoFileList.innerHTML = '<p class="no-files-note">Video file too large.</p>';
            return;
        } else {
             clearFormMessage(profileForm, "video-upload-group");
        }

        const item = document.createElement('div');
        item.className = 'file-preview-item new-file';
        item.innerHTML = `
            <div class="file-info">
                <i class="fas fa-video file-icon"></i>
                <span class="file-name">${selectedVideoFileObject.name}</span>
                <span class="file-size">(${(selectedVideoFileObject.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <button type="button" class="remove-file-btn" aria-label="Remove file">×</button>
        `;
        item.querySelector('.remove-file-btn').addEventListener('click', () => {
            selectedVideoFileObject = null; videoFileInput.value = '';
            videoFileList.innerHTML = '<p class="no-files-note">No video file selected.</p>';
        });
        videoFileList.appendChild(item);
    }

// --- Client-Side Validation ---
function validateArtistProfileForm() {

    // First & Last Name
    if (!generalInfo_firstNameInput.value.trim()) {
      alert("Please enter your first name.");
      generalInfo_firstNameInput.focus();
      return false;
    }
  
    if (!generalInfo_lastNameInput.value.trim()) {
      alert("Please enter your last name.");
      generalInfo_lastNameInput.focus();
      return false;
    }
  
    // Phone
    if (!isValidPhoneNumber(generalInfo_phoneInput.value.trim())) {
      alert("Please enter a valid phone number (e.g., +233XXXXXXXXX).");
      generalInfo_phoneInput.focus();
      return false;
    }
  
    // Date of Birth
    if (!isValidDOB(generalInfo_dobInput.value)) {
      alert("You must be at least 13 years old.");
      generalInfo_dobInput.focus();
      return false;
    }
  
    // Gender & Nationality
    if (!generalInfo_genderInput.value) {
      alert("Please select your gender.");
      generalInfo_genderInput.focus();
      return false;
    }
  
    if (!generalInfo_nationalityInput.value.trim()) {
      alert("Please enter your nationality.");
      generalInfo_nationalityInput.focus();
      return false;
    }
  
    // Primary Role
    if (!primaryRoleInput.value) {
      alert("Please select your primary role.");
      primaryRoleInput.focus();
      return false;
    }
  
    if (!stageNameInput.value.trim()) {
        alert("Please enter your stage name.");
        stageNameInput.focus();
        return false;
      }
      
    // Cover Image
    const coverFile = coverImageInput.files[0];
    if (!coverFile && !userIndustryProfile?.cover_image_url) {
      alert("Please upload a cover image.");
      coverImageInput.focus();
      return false;
    }
  
    // Music Files
    const newMusicFiles = Array.from(musicFilesInput.files);
    const existingMusic = userIndustryProfile?.music_files || [];
    if (newMusicFiles.length + existingMusic.length < 2) {
      alert("Please upload at least two music files.");
      musicFilesInput.focus();
      return false;
    }
  
    // Bio
    const bioText = bioInput.value.trim();
    const wordCount = bioText.split(/\s+/).filter(Boolean).length;
    if (wordCount < 150) {
      alert(`Your bio must be at least 150 words. You currently have ${wordCount}.`);
      bioInput.focus();
      return false;
    }
  
    // Portfolio Links
    const portfolioLinks = portfolioUrlsInput.value.split(',').map(link => link.trim()).filter(Boolean);
    if (portfolioLinks.length < 2 || !portfolioLinks.every(isValidHttpUrl)) {
      alert("Please enter at least two valid portfolio URLs (comma-separated).");
      portfolioUrlsInput.focus();
      return false;
    }
  
    // Social Media Links
    const socialLinks = socialMediaLinksInput.value.split(',').map(link => link.trim()).filter(Boolean);
    if (socialLinks.length < 2 || !socialLinks.every(isValidHttpUrl)) {
      alert("Please enter at least two valid social media URLs (comma-separated).");
      socialMediaLinksInput.focus();
      return false;
    }
  
    // Optional Video URL validation
    if (videoUrlEmbedInput.style.display !== 'none') {
      const urlVal = videoUrlEmbedInput.value.trim();
      if (urlVal && !isValidHttpUrl(urlVal)) {
        alert("Please enter a valid YouTube/Vimeo URL.");
        videoUrlEmbedInput.focus();
        return false;
      }
    }
  
    return true;
  }
  
  
  function isValidHttpUrl(string) {
    try {
      const url = new URL(string);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
      return false;
    }
  }
  
  function isValidPhoneNumber(phone) {
    // E.164 format: +[country][number], 8–15 digits total
    return /^\+[1-9]\d{7,14}$/.test(phone);
  }
  
  function isValidDOB(dobString) {
    if (!dobString) return false;
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    const minDate = new Date(
      today.getFullYear() - 13,
      today.getMonth(),
      today.getDate()
    );
    return dob <= minDate;
  }
  

// --- Form Submission ---
async function handleProfileFormSubmit(event) {
    event.preventDefault();
  
    if (!currentUser) {
      alert("Authentication error. Please sign in.");
      return;
    }
  
    // 1. Validate form
    if (!validateArtistProfileForm()) {
        return;
      }  
    // 2. Show loading state
    const submitProfileBtn = document.getElementById("submit-artist-profile-btn");
  
    try {
      // 3. Upload/Update Cover Image
      let finalCoverImageUrl = userIndustryProfile?.cover_image_url || null;
      if (selectedCoverImageFileObject) {
        const filePath = `users/${currentUser.id}/cover/${Date.now()}-${selectedCoverImageFileObject.name.replace(/\s+/g, '_')}`;
        const { error } = await supabase.storage
          .from('profile-media')
          .upload(filePath, selectedCoverImageFileObject, { upsert: true });
        if (error) throw new Error("Cover image upload failed.");
        finalCoverImageUrl = supabase.storage.from('profile-media').getPublicUrl(filePath).data.publicUrl;
      }
  
      // 4. Upload/Update Music Files
      let finalMusicFileUrls = userIndustryProfile?.music_files || [];
      if (selectedMusicFilesArray.length > 0) {
        finalMusicFileUrls = [];
        for (const file of selectedMusicFilesArray) {
          const filePath = `users/${currentUser.id}/music/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
          const { error: musicErr } = await supabase.storage.from('profile-media').upload(filePath, file);
          if (musicErr) console.warn("A music file failed to upload.");
          else finalMusicFileUrls.push(supabase.storage.from('profile-media').getPublicUrl(filePath).data.publicUrl);
        }
      }
  
      // 5. Upload/Update Video
      let finalVideoUrl = userIndustryProfile?.video_url || null;
      if (selectedVideoFileObject) {
        const filePath = `users/${currentUser.id}/video/${Date.now()}-${selectedVideoFileObject.name.replace(/\s+/g, '_')}`;
        const { error: videoErr } = await supabase.storage.from('profile-media').upload(filePath, selectedVideoFileObject, { upsert: true });
        if (videoErr) throw new Error("Video upload failed.");
        finalVideoUrl = supabase.storage.from('profile-media').getPublicUrl(filePath).data.publicUrl;
      } else if (videoUrlEmbedInput.style.display !== 'none' && videoUrlEmbedInput.value.trim()) {
        finalVideoUrl = videoUrlEmbedInput.value.trim();
      }
  
      // 6. Prepare data object
      const formData = new FormData(profileForm);
      const profileDataToSave = {
        user_id: currentUser.id,
        first_name: formData.get('first_name'),
        last_name: formData.get('last_name'),
        display_name: formData.get('display_name'), // Stage name
        dob: formData.get('dob'),
        gender: formData.get('gender'),
        nationality: formData.get('nationality'),
        email: currentUser.email,
        phone_number: formData.get('phone_number'),
        primary_role: formData.get('primary_role'),
        other_roles: formData.getAll('other_roles'),
        affiliations: formData.get('affiliations') || null,
        cover_image_url: finalCoverImageUrl,
        music_files: finalMusicFileUrls,
        video_url: finalVideoUrl,
        portfolio_url: (formData.get('portfolio_url') || "")
          .split(',')
          .map(u => u.trim())
          .filter(Boolean),
        social_media_links: (formData.get('social_media_links') || "")
          .split(',')
          .map(u => u.trim())
          .filter(Boolean),
        bio: formData.get('bio'),
        skills: (formData.get('skills') || "")
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        certifications: (formData.get('certifications') || "")
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        collaborations: (formData.get('collaborations') || "")
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        artist_type: formData.get('artist_type'),
        featured_artist: formData.get('featured_artist') === 'Yes',
        feature_name: formData.get('featured_artist') === 'Yes'
          ? formData.get('feature_name')
          : null,
        distributor_name: formData.get('distributor_name') || null,
        distribution_channels: formData.getAll('distribution_channels'),
        specialized_genres: (formData.get('profile-specialized-genres') || "")
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        regions_covered: (formData.get('profile-regions-covered') || "")
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        music_rights_confirmed: formData.get('music_rights_confirmed') === 'on',
        availability: formData.get('availability'),
        emergency_contact_name: formData.get('emergency_contact_name'),
        emergency_relationship: formData.get('emergency_relationship'),
        emergency_phone: formData.get('emergency_phone'),
        languages: formData.getAll('languages'),
        other_language: formData.getAll('languages').includes('Other')
          ? formData.get('other_language')
          : null,
        communication_method: formData.get('communication_method'),
        time_zone: formData.get('time_zone'),
        relocation: formData.get('relocation') || null,
        work_availability: formData.get('work_availability'),
        health_considerations: formData.get('health_considerations') || null,
        additional_notes: formData.get('additional_notes') || null,
        verified: userIndustryProfile?.verified || false,
      };
      
  
      // 7. Upsert to Supabase
      const { data, error: upsertErr } = await supabase
        .from('music_industry_profiles')
        .upsert(profileDataToSave, { onConflict: 'user_id' })
        .select()
        .single();
      if (upsertErr) throw upsertErr;
  
      // 8. Update local cache
      userIndustryProfile = data;
  
      // 9. Send confirmation email via EmailJS
      const emailParams = {
        to_email: currentUser.email,
        user_name: `${profileDataToSave.first_name} ${profileDataToSave.last_name}`,
        submission_date: new Date().toLocaleDateString(),
        profile_link: `${window.location.origin}/profile.html?id=${currentUser.id}`
      };
      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ARTIST_PROFILE_SUBMIT_TEMPLATE_ID, emailParams)
        .then(() => console.log("✅ Confirmation email sent."))
        .catch(() => console.warn("⚠️ EmailJS send failed."));
  
      // 10. Show success modal
      successModal.style.display = 'flex';
  
    } catch (err) {
      console.error("Error submitting profile:", err.message);
      alert("Something went wrong during submission. Please try again.");
    } finally {
      setLoadingState(submitProfileBtn, false);
    }
  }
  

    async function updateBasicProfileIfNeeded(industryProfileData) {
        // Compare industryProfileData general fields with userBasicProfile
        // and update 'profiles' table if necessary.
        // This ensures data consistency if the 'music_industry_profiles' form is the source of truth for these shared fields.
        if (!userBasicProfile) return; // No basic profile to compare against

        const basicProfileUpdates = {};
        if (industryProfileData.first_name !== userBasicProfile.first_name) basicProfileUpdates.first_name = industryProfileData.first_name;
        if (industryProfileData.last_name !== userBasicProfile.last_name) basicProfileUpdates.last_name = industryProfileData.last_name;
        if (industryProfileData.phone_number !== userBasicProfile.phone_number) basicProfileUpdates.phone_number = industryProfileData.phone_number;
        // Add other general fields if they are also in 'profiles' table and editable here

        if (Object.keys(basicProfileUpdates).length > 0) {
            console.log("Updating basic profile with:", basicProfileUpdates);
            const { error } = await supabase
                .from('profiles')
                .update(basicProfileUpdates)
                .eq('id', currentUser.id);
            if (error) {
                console.error("Error updating basic profile:", error.message);
                // Non-critical error, so don't throw, just log
            } else {
                 userBasicProfile = {...userBasicProfile, ...basicProfileUpdates}; // Update local cache
                 updateHeaderUI(); // Refresh header with potentially new name
            }
        }
    }

    // Reusable validation helpers (ensure these are defined or imported)
    function isValidPhoneNumber(phone) { return /^\+[1-9]\d{7,14}$/.test(phone); }
    function isValidDOB(dobString) {
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return false; // Invalid date format
        const minDob = new Date();
        minDob.setFullYear(minDob.getFullYear() - 13);
        return dob <= minDob;
    }
    function displayFormMessage(formEl, message, type, fieldId = null) { /* ...  from previous example ... */
        const msgContainer = fieldId ? document.getElementById(fieldId)?.parentElement.querySelector('.field-message-container') : formEl.querySelector('.form-submission-message-container'); // Adjust selector
        if (!msgContainer) {
             const el = document.getElementById(fieldId) || formEl;
             const newMsgContainer = document.createElement('div');
             newMsgContainer.className = fieldId ? 'field-message-container' : 'form-submission-message-container';
             el.parentNode.insertBefore(newMsgContainer, el.nextSibling);
             // Call again
             displayFormMessage(formEl, message, type, fieldId);
             return;
        }
        msgContainer.innerHTML = `<p class="form-message ${type}">${message}</p>`;
        msgContainer.style.display = message ? 'block' : 'none';
    }
    function clearFormMessage(formEl, fieldId = null) {
        const msgContainer = fieldId ? document.getElementById(fieldId)?.parentElement.querySelector('.field-message-container') : formEl.querySelector('.form-submission-message-container');
        if (msgContainer) {
            msgContainer.innerHTML = '';
            msgContainer.style.display = 'none';
        }
    }
    function clearAllFormMessages(formEl) {
        formEl.querySelectorAll('.field-message-container, .form-submission-message-container').forEach(el => {
            el.innerHTML = '';
            el.style.display = 'none';
        });
        if(formSubmissionMessage) { // Clear main form message
            formSubmissionMessage.textContent = '';
            formSubmissionMessage.style.display = 'none';
            formSubmissionMessage.className = 'form-message';
        }
    }

    function setLoadingState(button, isLoading) {
        if (!button) return;
      
        if (isLoading) {
          button.disabled = true;
          button.setAttribute("data-original-text", button.innerHTML);
          button.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Submitting...`;
        } else {
          button.disabled = false;
          const originalText = button.getAttribute("data-original-text");
          if (originalText) {
            button.innerHTML = originalText;
            button.removeAttribute("data-original-text");
          }
        }
      }
      function setupEventListeners() {
        // Submit handler
        if (profileForm) {
          profileForm.addEventListener("submit", handleProfileFormSubmit);
        }
      
        // Cover image selection
        if (coverImageInput) {
          coverImageInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (file) {
              selectedCoverImageFileObject = file;
              const reader = new FileReader();
              reader.onload = () => {
                document.getElementById("cover-image-preview").innerHTML =
                  `<img src="${reader.result}" alt="Cover Preview" style="max-width: 100%; border-radius: 6px;">`;
              };
              reader.readAsDataURL(file);
            }
          });
        }
      
        // Music file selection
        if (musicFilesInput) {
          musicFilesInput.addEventListener("change", (event) => {
            selectedMusicFilesArray = Array.from(event.target.files);
            const previewList = musicFilesList;
            previewList.innerHTML = "";
      
            if (selectedMusicFilesArray.length > 0) {
              selectedMusicFilesArray.forEach((file) => {
                const item = document.createElement("div");
                item.className = "file-preview-item";
                item.innerText = file.name;
                previewList.appendChild(item);
              });
            } else {
              previewList.innerHTML = `<p class="no-files-note">No music files selected yet.</p>`;
            }
          });
        }
      
        // Video file selection
        if (videoFileInput) {
          videoFileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            selectedVideoFileObject = file || null;
      
            if (file) {
              videoFileList.innerHTML = `<div class="file-preview-item">${file.name}</div>`;
            } else {
              videoFileList.innerHTML = `<p class="no-files-note">No video file selected.</p>`;
            }
          });
        }
      
        // Toggle between video file and URL
        document.querySelectorAll(".video-option-toggle .btn-toggle").forEach((btn) => {
          btn.addEventListener("click", () => {
            const selectedOption = btn.getAttribute("data-video-option");
            document.querySelectorAll(".video-option-toggle .btn-toggle").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
      
            if (selectedOption === "upload") {
              videoFileInput.style.display = "block";
              videoUrlEmbedInput.style.display = "none";
            } else {
              videoFileInput.style.display = "none";
              videoUrlEmbedInput.style.display = "block";
            }
          });
        });
      }
      

    // --- Initialize ---
    initializePage();
});