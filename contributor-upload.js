// js/contributor-upload.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const contributorWrapper = document.getElementById('contributor-wrapper');
    const contributionsGrid = document.getElementById('user-contributions-grid');
    const contributionsLoadingMsg = document.getElementById('contributions-loading-message');
    const noContributionsMsg = document.getElementById('no-contributions-message');

    const contributorForm = document.getElementById('contributor-submission-form');
    const formTitleEl = document.getElementById('contributor-form-title');
    const submissionIdInput = document.getElementById('submission-id'); // Hidden input for editing
    const submitBtn = document.getElementById('submit-contribution-btn');
    const clearFormBtn = document.getElementById('clear-contributor-form-btn');
    const formMessageGlobal = document.getElementById('contributor-form-message');

    // Section 1: Contributor Info Inputs
    const fullNameInput = document.getElementById('contributor-full-name');
    const stageNameInput = document.getElementById('contributor-stage-name');
    const emailInput = document.getElementById('contributor-email');
    const phoneInput = document.getElementById('contributor-phone');
    const websiteUrlInput = document.getElementById('contributor-website');
    const socialLinksTextarea = document.getElementById('contributor-social-links');
    const countryInput = document.getElementById('contributor-country');
    const cityInput = document.getElementById('contributor-city');
    const bioTextarea = document.getElementById('contributor-bio');
    const genresTextInput = document.getElementById('contributor-genres'); // For user's general genres
    const profileImageInput = document.getElementById('contributor-profile-image-input');
    const profileImagePreview = document.getElementById('contributor-profile-image-preview');
    const profileImageRemoveBtn = document.querySelector('.remove-image-btn[data-input="contributor-profile-image-input"]');
    const coverImageInput = document.getElementById('contributor-cover-image-input'); // User's general cover
    const coverImagePreview = document.getElementById('contributor-cover-image-preview');
    const coverImageRemoveBtn = document.querySelector('.remove-image-btn[data-input="contributor-cover-image-input"]');

    // Section 2: Content Details
    const contentTypeInput = document.getElementById('content-type');
    const titleInput = document.getElementById('content-title'); // Content Title
    const descriptionTextarea = document.getElementById('content-description');
    const albumIdGroup = document.getElementById('album-id-group');
    const albumIdSelect = document.getElementById('content-album-id');

    // Section 3: Media Files
    const mediaFilesFieldset = document.getElementById('media-files-fieldset');
    const musicFileGroup = document.getElementById('music-file-group');
    const musicFileInput = document.getElementById('content-music-file-input');
    const musicFilePreview = document.getElementById('music-file-preview');
    const videoFileGroup = document.getElementById('video-file-group');
    const videoFileInput = document.getElementById('content-video-file-input');
    const videoFilePreview = document.getElementById('video-file-preview');
    const coverArtGroup = document.getElementById('cover-art-group'); // Content specific cover art
    const coverArtInput = document.getElementById('content-cover-art-input');
    const coverArtPreview = document.getElementById('content-cover-art-preview');
    const removeCoverArtBtn = document.querySelector('.remove-image-btn[data-input="content-cover-art-input"]');

    // Section 4: Additional Details
    const additionalDetailsFieldset = document.getElementById('additional-details-fieldset');
    const musicRelatedAdditionalGroup = additionalDetailsFieldset?.querySelector('.music-related');
    const lyricsTextarea = document.getElementById('content-lyrics');
    const lyricsFileInput = document.getElementById('content-lyrics-file-input');
    const lyricsFilePreview = document.getElementById('lyrics-file-preview');
    const releaseDateInput = document.getElementById('content-release-date');
    const durationInput = document.getElementById('content-duration');
    const isExplicitCheckbox = document.getElementById('content-is-explicit');
    const genreInput = document.getElementById('content-genre'); // Content specific genre
    const languageInput = document.getElementById('content-language'); // Content language
    const bpmInput = document.getElementById('content-bpm');
    const keyInput = document.getElementById('content-key');
    const moodInput = document.getElementById('content-mood');
    const tagsTextInput = document.getElementById('content-tags'); // Content tags
    const creditsTextarea = document.getElementById('content-credits');

    // Section 5: Visibility
    const visibilitySelect = document.getElementById('content-visibility');

    // Header elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');
    const notificationCountBadges = document.querySelectorAll('.notification-count');


    let currentUser = null;
    let userBasicProfile = null; // Stores data from 'profiles' table for prefill & header
    let editingSubmissionId = null; // Stores ID if editing an existing contribution

    // Selected files state (File objects for NEW uploads)
    let selectedContributorProfileImageFile = null;
    let selectedContributorCoverImageFile = null;
    let selectedContentMusicFile = null;
    let selectedContentVideoFile = null;
    let selectedContentCoverArtFile = null;
    let selectedContentLyricsFile = null;

    // EmailJS Config
    const EMAILJS_SERVICE_ID = 'default_service';
    const EMAILJS_CONTRIBUTION_TEMPLATE_ID = 'template_o89o8ec'; // ** CREATE & UPDATE THIS **

    // --- Initialization ---
    async function initializePage() {
        console.log("Initializing Contributor Page...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            console.log("No session, redirecting to signin.");
            window.location.replace('signup.html');
            return;
        }
        currentUser = session.user;
        console.log('User authenticated:', currentUser.email);

        await fetchUserBasicProfile(); // Fetch basic profile first
        updateHeaderUI(); // Update header with basic profile info

        await loadUserContributions();
        prepareFormForCreate(); // This will now use the fetched userBasicProfile

        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (contributorWrapper) contributorWrapper.style.display = 'block';
        setupEventListeners();
    }

 async function fetchUserBasicProfile() {
    if (!currentUser) return; // Check if the user is authenticated
    console.log("Fetching user's basic profile data for user:", currentUser.id);

    try {
        // ***** VERIFY THIS SELECT LIST MATCHES YOUR 'profiles' TABLE COLUMNS *****
        const { data: profile, error } = await supabase
            .from('profiles') // Access the 'profiles' table
            .select('first_name, middle_name, last_name, email, phone_number, profile_pic_url, country, city, bio, cover_pic_url') // Ensure these column names match your schema
            .eq('id', currentUser.id) // Filter by user ID
            .single(); // Ensure only a single profile is fetched

        // If there's an error but it's not a known non-error (e.g., PGRST116, which is no data found)
        if (error) {
            if (error.code !== 'PGRST116') {
                console.error("Supabase error fetching 'profiles' table:", error);
            }
            userBasicProfile = null; // Set user profile as null in case of error
            return;
        }

        // Assign fetched profile data to userBasicProfile
        userBasicProfile = profile;
        console.log("Fetched userBasicProfile for prefill & header:", userBasicProfile);

    } catch (err) {
        // Handle JavaScript errors (e.g., network issues)
        console.error("JavaScript error fetching user basic profile:", err.message);
        userBasicProfile = null; // Set to null in case of error
    }
}


    function updateHeaderUI() {
        if (!currentUser) return;
        const displayName = userBasicProfile?.first_name || currentUser.email.split('@')[0];
        const displayEmail = currentUser.email;
        const displayPic = userBasicProfile?.profile_pic_url || 'profile-picture.png'; // Ensure placeholder exists

        if (headerUsername) headerUsername.textContent = displayName;
        if (headerUserEmail) headerUserEmail.textContent = displayEmail;
        if (headerProfilePic) headerProfilePic.src = displayPic;
    }

    function prefillContributorInfoSection() {
        console.log("Prefilling Contributor Info Section with userBasicProfile:", userBasicProfile);
        // This function is called ONLY by prepareFormForCreate.
        // It uses `userBasicProfile` to fill Section 1 for NEW submissions.
        // When editing an existing submission, `prepareFormForEdit` will populate Section 1 from THAT submission's data.

        const source = userBasicProfile || {}; // Use fetched basic profile or an empty object if not found

        if (emailInput) {
            emailInput.value = currentUser.email; // Always set from the authenticated user
            emailInput.readOnly = true;
            emailInput.disabled = true;
        }

        if (fullNameInput) fullNameInput.value = `${source.first_name || ''} ${source.last_name || ''}`.trim();
        if (stageNameInput) stageNameInput.value = ''; // Stage name is specific to this contribution, clear for new
        if (phoneInput) phoneInput.value = source.phone_number || '';
        if (websiteUrlInput) websiteUrlInput.value = source.website_url || '';
        if (socialLinksTextarea) {
            socialLinksTextarea.value = (source.social_links && typeof source.social_links === 'object') ?
                Object.entries(source.social_links).map(([platform, url]) => `${platform}:${url}`).join(', ') : '';
        }
        if (countryInput) countryInput.value = source.country || '';
        if (cityInput) cityInput.value = source.city || '';
        if (bioTextarea) bioTextarea.value = source.bio || ''; // Pre-fill contributor's bio
        if (genresTextInput) genresTextInput.value = (source.genres || []).join(', '); // Pre-fill contributor's general genres

        if (profileImagePreview) {
            profileImagePreview.src = source.profile_pic_url || 'profile-picture.png';
            if(profileImageRemoveBtn) profileImageRemoveBtn.style.display = source.profile_pic_url ? 'inline-block' : 'none';
        } else { console.warn("profileImagePreview element not found for prefill."); }

        if (coverImagePreview) {
            coverImagePreview.src = source.cover_image_url || 'cover-photo.png';
            if(coverImageRemoveBtn) coverImageRemoveBtn.style.display = source.cover_image_url ? 'inline-block' : 'none';
        } else { console.warn("coverImagePreview element not found for prefill."); }
    }

    async function loadUserContributions() {
        if (!currentUser || !contributionsGrid) return;
        if (contributionsLoadingMsg) contributionsLoadingMsg.style.display = 'block';
        if (noContributionsMsg) noContributionsMsg.style.display = 'none';
        contributionsGrid.innerHTML = '';

        try {
            const { data: contributions, error } = await supabase
                .from('contributor_form')
                .select('id, title, type, cover_art_url, visibility, created_at, profile_image_url')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderContributionsGrid(contributions || []);
        } catch (error) {
            console.error("Error fetching contributions:", error.message);
            contributionsGrid.innerHTML = `<p class="status-message error-message">Could not load contributions.</p>`;
        } finally {
            if (contributionsLoadingMsg) contributionsLoadingMsg.style.display = 'none';
        }
    }

    function renderContributionsGrid(items) {
        if (!contributionsGrid) return;
        contributionsGrid.innerHTML = '';
        if (items.length === 0 && noContributionsMsg) {
            noContributionsMsg.style.display = 'block';
            return;
        }
        if (noContributionsMsg) noContributionsMsg.style.display = 'none';

        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'contribution-card-item glass-card';
            card.dataset.submissionId = item.id;
            const itemCover = item.cover_art_url || item.profile_image_url || 'content-placeholder1.jpg';
            card.innerHTML = `
                <div class="contribution-card-cover">
                    <img src="${itemCover}" alt="${item.title || 'Contribution'} Cover">
                </div>
                <div class="contribution-card-info">
                    <h4>${item.title || 'Untitled Submission'}</h4>
                    <p class="contribution-card-meta">
                        <span class="type-badge">${item.type || 'Unknown'}</span>
                        <span>Submitted: ${new Date(item.created_at).toLocaleDateString()}</span>
                    </p>
                    <span class="contribution-card-status ${item.visibility?.toLowerCase().replace(/\s+/g, '-') || 'draft'}">${item.visibility || 'Draft'}</span>
                </div>
                <div class="article-card-actions">
                    <button class="btn-icon edit-contribution-btn" aria-label="Edit Submission"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete-contribution-btn" aria-label="Delete Submission"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            card.querySelector('.edit-contribution-btn').addEventListener('click', () => prepareFormForEdit(item.id));
            card.querySelector('.delete-contribution-btn').addEventListener('click', () => handleDeleteContribution(item.id, item.title));
            contributionsGrid.appendChild(card);
        });
    }

    function prepareFormForCreate() {
        editingSubmissionId = null;
        if(formTitleEl) formTitleEl.textContent = 'Contribute Your Work';
        if(contributorForm) contributorForm.reset();
        
        prefillContributorInfoSection(); // This is KEY for new submissions

        if(submissionIdInput) submissionIdInput.value = '';

        // Reset file previews AND selected file state variables for content-specific files
        clearSingleImagePreview(coverArtPreview, coverArtInput, 'selectedContentCoverArtFile', true);
        if(musicFilePreview) musicFilePreview.innerHTML = '<p class="no-files-note">No music file selected.</p>';
        selectedMusicFile = null;
        if(videoFilePreview) videoFilePreview.innerHTML = '<p class="no-files-note">No video file selected.</p>';
        selectedVideoFile = null;
        if(lyricsFilePreview) lyricsFilePreview.innerHTML = '<p class="no-files-note">No lyrics file selected.</p>';
        selectedLyricsFile = null;

        // Also reset the files selected for Section 1 (Contributor Info's own images)
        // Their previews are handled by prefillContributorInfoSection based on userBasicProfile or placeholders
        selectedContributorProfileImageFile = null;
        selectedContributorCoverImageFile = null;


        toggleMediaFieldsBasedOnType('');
        clearAllFormMessages(contributorForm);
        if(submitBtn) submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Contribution';
        if(clearFormBtn) clearFormBtn.style.display = 'none';
        // window.scrollTo({ top: contributorForm.offsetTop - 80, behavior: 'smooth' }); // Optional scroll
    }

    async function prepareFormForEdit(submissionIdToEdit) {
        editingSubmissionId = submissionIdToEdit;
        if(formTitleEl) formTitleEl.textContent = 'Edit Your Contribution';
        if(contributorForm) contributorForm.reset();
        if(submissionIdInput) submissionIdInput.value = submissionIdToEdit;

        displayMessage(formMessageGlobal, "Loading submission data...", "info");
        try {
            const { data: submission, error } = await supabase
                .from('contributor_form')
                .select('*')
                .eq('id', submissionIdToEdit)
                .eq('user_id', currentUser.id)
                .single();
            if (error) throw error;
            if (!submission) throw new Error("Submission not found or access denied.");

            // Pre-fill ALL form fields from the fetched 'submission' object
            // This OVERRIDES any basic profile prefill for the context of this specific edit.
            if(fullNameInput) fullNameInput.value = submission.full_name || '';
            if(stageNameInput) stageNameInput.value = submission.stage_name || '';
            if(emailInput) {
                emailInput.value = submission.email || currentUser.email;
                emailInput.readOnly = true; emailInput.disabled = true;
            }
            if(phoneInput) phoneInput.value = submission.phone_number || '';
            if(websiteUrlInput) websiteUrlInput.value = submission.website_url || '';
            if (socialLinksTextarea) {
                socialLinksTextarea.value = (submission.social_links && typeof submission.social_links === 'object') ?
                    Object.entries(submission.social_links).map(([p, u]) => `${p}:${u}`).join(', ') : '';
            }
            if(countryInput) countryInput.value = submission.country || '';
            if(cityInput) cityInput.value = submission.city || '';
            if(bioTextarea) bioTextarea.value = submission.bio || '';
            if(genresTextInput) genresTextInput.value = (submission.genres || []).join(', ');

            if (profileImagePreview) {
                profileImagePreview.src = submission.profile_image_url || 'profile-picture.png';
                if(profileImageRemoveBtn) profileImageRemoveBtn.style.display = submission.profile_image_url ? 'inline-block' : 'none';
            }
            if (coverImagePreview) {
                coverImagePreview.src = submission.cover_image_url || 'cover-photo.png';
                if(coverImageRemoveBtn) coverImageRemoveBtn.style.display = submission.cover_image_url ? 'inline-block' : 'none';
            }

            if(contentTypeInput) contentTypeInput.value = submission.type || '';
            if(titleInput) titleInput.value = submission.title || '';
            if(descriptionTextarea) descriptionTextarea.value = submission.description || '';
            if(albumIdSelect) albumIdSelect.value = submission.album_id || '';

            toggleMediaFieldsBasedOnType(submission.type);

            if (submission.music_file_url && musicFilePreview) {
                 musicFilePreview.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-music file-icon"></i> ${decodeURIComponent(submission.music_file_url.split('/').pop())} <a href="${submission.music_file_url}" target="_blank" class="view-file-link">(View Current)</a></div></div>`;
            } else if (musicFilePreview) { musicFilePreview.innerHTML = '<p class="no-files-note">No music file.</p>';}

            if (submission.video_file_url && videoFilePreview) {
                 videoFilePreview.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-video file-icon"></i> ${decodeURIComponent(submission.video_file_url.split('/').pop())} <a href="${submission.video_file_url}" target="_blank" class="view-file-link">(View Current)</a></div></div>`;
            } else if (videoFilePreview) { videoFilePreview.innerHTML = '<p class="no-files-note">No video file.</p>';}

            if (coverArtPreview) {
                coverArtPreview.src = submission.cover_art_url || 'profile-picture.png';
                if(removeCoverArtBtn) removeCoverArtBtn.style.display = submission.cover_art_url ? 'inline-block' : 'none';
            }

            if(lyricsTextarea) lyricsTextarea.value = submission.lyrics || '';
            const lyricsFilePrev = document.getElementById('lyrics-file-preview');
            if (submission.lyrics_file_url && lyricsFilePrev) {
                lyricsFilePrev.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-file-alt file-icon"></i> ${decodeURIComponent(submission.lyrics_file_url.split('/').pop())} <a href="${submission.lyrics_file_url}" target="_blank" class="view-file-link">(View Current)</a></div></div>`;
            } else if (lyricsFilePrev) { lyricsFilePrev.innerHTML = '<p class="no-files-note">No lyrics file.</p>';}

            if(releaseDateInput) releaseDateInput.value = submission.release_date || '';
            if(durationInput) durationInput.value = submission.duration || '';
            if(isExplicitCheckbox) isExplicitCheckbox.checked = submission.is_explicit || false;
            if(genreInput) genreInput.value = submission.genre || ''; // Content-specific genre
            if(languageInput) languageInput.value = submission.language || ''; // Content-specific lang
            if(bpmInput) bpmInput.value = submission.bpm || '';
            if(keyInput) keyInput.value = submission.key || '';
            if(moodInput) moodInput.value = submission.mood || '';
            if(tagsTextInput) tagsTextInput.value = (submission.tags || []).join(', ');
            if (creditsTextarea) {
                creditsTextarea.value = (submission.credits && typeof submission.credits === 'object') ?
                    JSON.stringify(submission.credits, null, 2) : (submission.credits || '');
            }
            if(visibilitySelect) visibilitySelect.value = submission.visibility || 'Draft';

            selectedContributorProfileImageFile = null; selectedContributorCoverImageFile = null;
            selectedMusicFile = null; selectedVideoFile = null; selectedContentCoverArtFile = null;
            selectedLyricsFile = null;

            clearAllFormMessages(contributorForm);
            if(submitBtn) submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Contribution';
            if(clearFormBtn) clearFormBtn.style.display = 'inline-block';
            window.scrollTo({ top: contributorForm.offsetTop - 80, behavior: 'smooth' });

        } catch (err) {
            console.error("Error loading submission for edit:", err.message);
            displayMessage(formMessageGlobal, `Could not load submission: ${err.message}`, "error");
            editingSubmissionId = null;
        }
    }

    function toggleMediaFieldsBasedOnType(type) {
        if(!mediaFilesFieldset || !additionalDetailsFieldset) return;

        mediaFilesFieldset.querySelectorAll('.media-group').forEach(g => g.style.display = 'none');
        additionalDetailsFieldset.querySelectorAll('.additional-group').forEach(g => g.style.display = 'none');
        additionalDetailsFieldset.style.display = 'none';
        if (albumIdGroup) albumIdGroup.style.display = 'none';

        if (!type) return;

        const showMusicRelated = ['Song', 'Album', 'Beat'].includes(type);
        const showCoverArt = ['Song', 'Album', 'Beat', 'Playlist', 'Video'].includes(type);

        if (showMusicRelated) {
            if(musicFileGroup) musicFileGroup.style.display = 'block';
            if(musicRelatedAdditionalGroup) musicRelatedAdditionalGroup.style.display = 'block';
        }
        if (type === 'Video') {
            if(videoFileGroup) videoFileGroup.style.display = 'block';
        }
        if (showCoverArt) {
            if(coverArtGroup) coverArtGroup.style.display = 'block';
        }
        if (type === 'Song' && albumIdGroup) {
            albumIdGroup.style.display = 'block';
        }
        if (showMusicRelated || type === 'Video' || type === 'Playlist') {
             additionalDetailsFieldset.style.display = 'block';
        }

        // Clear file selections for inputs in groups that are now hidden to prevent accidental submission
        // when type changes and fields become hidden.
        mediaFilesFieldset.querySelectorAll('.media-group:not([style*="display: block"]) .form-input-file').forEach(input => {
            if(input) input.value = '';
            if(input === musicFileInput) selectedMusicFile = null;
            if(input === videoFileInput) selectedVideoFile = null;
            if(input === coverArtInput) selectedContentCoverArtFile = null;
        });
         additionalDetailsFieldset.querySelectorAll('.additional-group:not([style*="display: block"]) .form-input-file').forEach(input => {
            if(input) input.value = '';
            if(input === lyricsFileInput) selectedLyricsFile = null;
        });
    }

    function setupEventListeners() {
        if (contributorForm) contributorForm.addEventListener('submit', handleFormSubmit);
        if (clearFormBtn) clearFormBtn.addEventListener('click', prepareFormForCreate);
        if (contentTypeInput) contentTypeInput.addEventListener('change', (e) => toggleMediaFieldsBasedOnType(e.target.value));

        if(profileImageInput) profileImageInput.addEventListener('change', () => previewSingleImage(profileImageInput, profileImagePreview, 'selectedContributorProfileImageFile'));
        if(coverImageInput) coverImageInput.addEventListener('change', () => previewSingleImage(coverImageInput, coverImagePreview, 'selectedContributorCoverImageFile'));
        if(musicFileInput) musicFileInput.addEventListener('change', () => handleSingleFileUpload(musicFileInput, musicFilePreview, 'selectedMusicFile'));
        if(videoFileInput) videoFileInput.addEventListener('change', () => handleSingleFileUpload(videoFileInput, videoFilePreview, 'selectedVideoFile'));
        if(coverArtInput) coverArtInput.addEventListener('change', () => previewSingleImage(coverArtInput, coverArtPreview, 'selectedContentCoverArtFile'));
        if(lyricsFileInput) lyricsFileInput.addEventListener('change', () => handleSingleFileUpload(lyricsFileInput, lyricsFilePreview, 'selectedLyricsFile'));

        document.querySelectorAll('.remove-image-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetPreviewId = btn.dataset.target;
                const targetInputId = btn.dataset.input;
                let fileStateKeyToClear = '';
                if (targetInputId === profileImageInput?.id) fileStateKeyToClear = 'selectedContributorProfileImageFile';
                else if (targetInputId === coverImageInput?.id) fileStateKeyToClear = 'selectedContributorCoverImageFile';
                else if (targetInputId === coverArtInput?.id) fileStateKeyToClear = 'selectedContentCoverArtFile';

                clearSingleImagePreview(document.getElementById(targetPreviewId), document.getElementById(targetInputId), fileStateKeyToClear, true); // Force to default placeholder
                btn.style.display = 'none';
            });
        });

        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);
    }
     // Logout Function
      function handleLogout() { 
         supabase.auth.signOut().then(() => window.location.replace('signup.html')).catch(console.error);
      }


    function previewSingleImage(fileInput, imgPreviewElement, fileStateKeyToUpdate) {
        if (!fileInput || !imgPreviewElement) return;
        const file = fileInput.files[0];
        const removeBtn = document.querySelector(`.remove-image-btn[data-input="${fileInput.id}"]`);
        if (file) {
            window[fileStateKeyToUpdate] = file; // Uses window scope for simplicity here
            const reader = new FileReader();
            reader.onload = (e) => { imgPreviewElement.src = e.target.result; };
            reader.readAsDataURL(file);
            if(removeBtn) removeBtn.style.display = 'inline-block';
        }
    }

    function clearSingleImagePreview(imgPreviewElement, fileInput, fileStateKeyToClear, forceToDefaultPlaceholder = false) {
        const defaultSrcMap = {
            'contributor-profile-image-preview': 'profile-picture.png',
            'contributor-cover-image-preview': 'cover-photo.png',
            'content-cover-art-preview': 'profile-picture.png'
        };

        let resetSrc = defaultSrcMap[imgPreviewElement?.id] || 'profile-picture.png';

        if (editingSubmissionId && !forceToDefaultPlaceholder) {
            // Attempt to get the original URL from the submission being edited, if available
            // This requires `existingSubmission` data to be accessible or passed
            // For now, simpler logic: if not forcing default, it might already show the DB image.
            // The main purpose of this function when editing is if user *newly selected* a file then cleared it.
        }

        if (imgPreviewElement) imgPreviewElement.src = resetSrc;
        if (fileInput) fileInput.value = ''; // Important to clear the file input
        window[fileStateKeyToClear] = null; // Clear the File object from state

        const removeBtn = document.querySelector(`.remove-image-btn[data-input="${fileInput?.id}"]`);
        if (removeBtn) removeBtn.style.display = 'none';
    }

    function handleSingleFileUpload(fileInput, previewElement, fileStateKeyToUpdate) {
        if (!fileInput || !previewElement) return;
        const file = fileInput.files[0];
        previewElement.innerHTML = '';

        if (!file) {
            previewElement.innerHTML = `<p class="no-files-note">No file selected.</p>`;
            window[fileStateKeyToUpdate] = null;
            return;
        }
        window[fileStateKeyToUpdate] = file;

        const item = document.createElement('div');
        item.className = 'file-preview-item';
        const iconClass = file.type.startsWith('audio/') ? 'fa-music' : file.type.startsWith('video/') ? 'fa-video' : 'fa-file-alt';
        item.innerHTML = `
            <div class="file-info">
                <i class="fas ${iconClass} file-icon"></i>
                <span class="file-name">${file.name}</span>
                <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            </div>
            <button type="button" class="remove-file-btn" data-inputid="${fileInput.id}" data-previewid="${previewElement.id}" data-statekey="${fileStateKeyToUpdate}" aria-label="Remove file">×</button>
        `;
        item.querySelector('.remove-file-btn').addEventListener('click', (e) => {
            const inpId = e.target.dataset.inputid;
            const prevId = e.target.dataset.previewid;
            const stateKey = e.target.dataset.statekey;
            document.getElementById(inpId).value = '';
            handleSingleFileUpload(document.getElementById(inpId), document.getElementById(prevId), stateKey);
        });
        previewElement.appendChild(item);
    }

function isValidHttpUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch (_) {
        return false;
    }
}

    async function handleFormSubmit(event) {
        event.preventDefault();
        if (!currentUser) { displayMessage(formMessageGlobal, "Authentication error.", "error"); return; }
        // Add robust validation call here
        // if (!validateContributorForm()) {
        //     displayMessage(formMessageGlobal, "Please correct the errors in the form.", "error");
        //     return;
        // }

        setLoadingState(submitBtn, true);
        displayMessage(formMessageGlobal, "Submitting your contribution...", "info");

        try {
            const formDataRaw = new FormData(contributorForm);
            const submissionPayload = { user_id: currentUser.id };

            let existingDataForEdit = null;
            if (editingSubmissionId) {
                const { data } = await supabase.from('contributor_form').select('*').eq('id', editingSubmissionId).single();
                existingDataForEdit = data || {};
            } else {
                existingDataForEdit = {};
            }

            const uploadFileToStorage = async (fileObject, subfolder, existingUrl = null, fileNamePrefix = 'file') => {
                if (fileObject) {
                    const filePath = `contributor-media/${currentUser.id}/${subfolder}/${Date.now()}-${fileNamePrefix}-${fileObject.name.replace(/\s+/g, '_')}`;
                    const { error } = await supabase.storage.from('contributor-media').upload(filePath, fileObject, { upsert: true });
                    if (error) throw new Error(`${subfolder} upload failed: ${error.message}`);
                    return supabase.storage.from('contributor-media').getPublicUrl(filePath).data.publicUrl;
                }
                return existingUrl;
            };

            submissionPayload.profile_image_url = await uploadFileToStorage(selectedContributorProfileImageFile, 'profile-images', existingDataForEdit.profile_image_url, 'profile');
            submissionPayload.cover_image_url = await uploadFileToStorage(selectedContributorCoverImageFile, 'profile-covers', existingDataForEdit.cover_image_url, 'cover');
            submissionPayload.music_file_url = await uploadFileToStorage(selectedMusicFile, 'music', existingDataForEdit.music_file_url, 'music');
            submissionPayload.video_file_url = await uploadFileToStorage(selectedVideoFile, 'videos', existingDataForEdit.video_file_url, 'video');
            submissionPayload.cover_art_url = await uploadFileToStorage(selectedContentCoverArtFile, 'artworks', existingDataForEdit.cover_art_url, 'artwork');
            submissionPayload.lyrics_file_url = await uploadFileToStorage(selectedLyricsFile, 'lyrics', existingDataForEdit.lyrics_file_url, 'lyrics');

            // Populate text and select fields from FormData
            const formFieldsToProcess = [
                'full_name', 'stage_name', 'email', 'phone_number', 'website_url',
                'bio', 'country', 'city', 'title', 'type', 'description', 'lyrics',
                'release_date', 'duration', 'genre', 'language', 'bpm', 'key', 'mood',
                'visibility', 'album_id', 'portfolio_url'
                // Add all direct input field names from your form (excluding files and special parsing ones)
            ];

            formFieldsToProcess.forEach(fieldName => {
                let actualFormName = fieldName;
                // Adjust if form input ID/name differs from DB column (e.g., contributor-full-name vs full_name)
                if (document.getElementById(`contributor-${fieldName}`)) actualFormName = `contributor-${fieldName}`;
                else if (document.getElementById(`content-${fieldName}`)) actualFormName = `content-${fieldName}`;
                
                const value = formDataRaw.get(actualFormName); // Get value using the actual name attribute from HTML form
                submissionPayload[fieldName] = (value === undefined || value === null || value.trim() === '') ? null : value.trim();
            });
            
            // Handle specific array/JSON/boolean fields
            const socialLinksText = formDataRaw.get('social_links_text'); // Assuming name="social_links_text"
            submissionPayload.social_links = socialLinksText ? socialLinksText.split(',').reduce((acc, pair) => {
                const [platform, url] = pair.split(':').map(s => s.trim());
                if (platform && url && isValidHttpUrl(url)) acc[platform.toLowerCase()] = url;
                return acc;
            }, {}) : null;

            const genresText = formDataRaw.get('genres_text'); // Assuming name="genres_text" for contributor genres
            submissionPayload.genres = genresText ? genresText.split(',').map(g => g.trim()).filter(Boolean) : [];
            
            const tagsText = formDataRaw.get('tags_text'); // Assuming name="tags_text" for content tags
            submissionPayload.tags = tagsText ? tagsText.split(',').map(t => t.trim()).filter(Boolean) : [];

            const creditsText = formDataRaw.get('credits_text'); // Assuming name="credits_text"
             try { submissionPayload.credits = creditsText ? JSON.parse(creditsText) : null; }
             catch(e) { submissionPayload.credits = creditsText ? { "raw_text": creditsText } : null; }

            submissionPayload.is_explicit = isExplicitCheckbox ? isExplicitCheckbox.checked : false;
            if (submissionPayload.album_id === "") submissionPayload.album_id = null;
            if (submissionPayload.release_date === "") submissionPayload.release_date = null;


            let savedData;
            if (editingSubmissionId) {
                submissionPayload.updated_at = new Date().toISOString();
                const { data, error } = await supabase.from('contributor_form').update(submissionPayload).eq('id', editingSubmissionId).select().single();
                if (error) throw error;
                savedData = data;
            } else {
                const { data, error } = await supabase.from('contributor_form').insert(submissionPayload).select().single();
                if (error) throw error;
                savedData = data;
            }

            showToastNotification(`Contribution "${savedData.title || 'Item'}" ${editingSubmissionId ? 'updated' : 'submitted for review'}!`, "success");
            // EmailJS
            const emailParams = { to_email: savedData.email || currentUser.email, user_name: savedData.full_name || savedData.stage_name || userBasicProfile?.first_name || 'Contributor', content_title: savedData.title, content_type: savedData.type, submission_date: new Date().toLocaleDateString() };
            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CONTRIBUTION_TEMPLATE_ID, emailParams)
                .then(res => console.log("Email sent:", res.status)).catch(err => console.error("Email send failed:", err));

            await loadUserContributions();
            if(!editingSubmissionId) prepareFormForCreate();
            else { if(clearFormBtn) clearFormBtn.style.display = 'inline-block'; }

        } catch (error) {
            console.error("Error submitting contribution:", error.message);
            displayMessage(formMessageGlobal, `Error: ${error.message}`, "error");
        } finally {
            setLoadingState(submitBtn, false);
        }
    }

    async function handleDeleteContribution(submissionId, title) {
         if (!confirm(`Are you sure you want to delete the contribution "${title}"? This may also delete associated files.`)) return;
         setLoadingState(document.querySelector(`.contribution-card-item[data-submission-id="${submissionId}"] .delete-contribution-btn`), true); // Example for specific button
         try {
            const { data: subToDelete, error: fetchErr } = await supabase.from('contributor_form')
                .select('profile_image_url, cover_image_url, music_file_url, video_file_url, cover_art_url, lyrics_file_url')
                .eq('id', submissionId).single();

            if (fetchErr) console.warn("Could not fetch submission details for file deletion:", fetchErr.message);

            if (subToDelete) { // Attempt to delete associated files
                const filesToDelete = [
                    subToDelete.profile_image_url, subToDelete.cover_image_url, subToDelete.music_file_url,
                    subToDelete.video_file_url, subToDelete.cover_art_url, subToDelete.lyrics_file_url
                ].filter(Boolean); // Filter out null/empty URLs

                if (filesToDelete.length > 0) {
                    const filePathsToDelete = filesToDelete.map(url => {
                        try { return new URL(url).pathname.split('/contributor-media/')[1]; } // Extract path after bucket
                        catch { return null; }
                    }).filter(Boolean);

                    if (filePathsToDelete.length > 0) {
                        const { error: storageError } = await supabase.storage.from('contributor-media').remove(filePathsToDelete);
                        if (storageError) console.warn("Error deleting some files from storage:", storageError.message);
                        else console.log("Associated files deleted from storage:", filePathsToDelete);
                    }
                }
            }

            const { error } = await supabase.from('contributor_form').delete().eq('id', submissionId);
            if (error) throw error;
            showToastNotification(`Contribution "${title}" deleted successfully.`, "success");
            await loadUserContributions();
            if (editingSubmissionId === submissionId) prepareFormForCreate();
         } catch (err) {
            console.error("Error deleting contribution:", err.message);
            showToastNotification(`Error deleting: ${err.message}`, "error");
         } finally {
             // Reset loading state for all delete buttons if needed, or just the one clicked
         }
    }

    // --- Toast & Utility ---
    const toastNotification = document.getElementById('toast-notification');
    const toastMessageEl = toastNotification?.querySelector('.toast-message');
    const toastIconEl = toastNotification?.querySelector('.toast-icon i');
    const toastCloseBtn = toastNotification?.querySelector('.toast-close-btn');

    function showToastNotification(message, type = 'info') {
        if (!toastNotification || !toastMessageEl || !toastIconEl) return;
        toastMessageEl.textContent = message;
        toastNotification.className = `toast show ${type}`;
        toastIconEl.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`;
        setTimeout(() => { toastNotification.classList.remove('show'); }, 5000);
    }
    if (toastCloseBtn) { toastCloseBtn.addEventListener('click', () => toastNotification.classList.remove('show')); }

    function displayMessage(parentElement, message, type = 'error') {
        if (!parentElement && formMessageGlobal) parentElement = formMessageGlobal;
        if(!parentElement) return;
        parentElement.innerHTML = ''; parentElement.className = 'form-message';
        if (!message) { parentElement.style.display = 'none'; return; }
        parentElement.textContent = message; parentElement.classList.add(type);
        parentElement.style.display = 'block';
    }
    function clearAllFormMessages(formEl) {
        if(formEl) formEl.querySelectorAll('.form-message').forEach(el => { el.textContent = ''; el.style.display = 'none';});
        if(formMessageGlobal) { formMessageGlobal.textContent = ''; formMessageGlobal.style.display = 'none';}
    }
    function setLoadingState(button, isLoading) {
        if(!button) return;
        if (isLoading) {
            button.disabled = true;
            if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner"></span> Processing...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
        }
    }

    // --- Initialize ---
    initializePage();
});