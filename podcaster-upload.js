// js/podcaster-upload.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements (Ensure all IDs match your HTML exactly) ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const podcasterWrapper = document.getElementById('podcaster-wrapper');
        const multistepFormMessageGlobal = document.getElementById('podcast-multistep-form-message');

    // Multi-Step Series Form
    const podcastMultistepFormSection = document.getElementById('podcast-multistep-form-section');
    const podcastSeriesForm = document.getElementById('podcast-series-multistep-form');
    const podcastFormMainTitleEl = document.getElementById('podcast-form-main-title');
    const podcastIdInput = document.getElementById('podcast-id');
    const submitPodcastSeriesBtn = document.getElementById('submit-podcast-series-btn');
    const formSteps = podcastSeriesForm?.querySelectorAll('.form-step');
    const nextStepButtons = podcastSeriesForm?.querySelectorAll('.next-step-btn');
    const prevStepButtons = podcastSeriesForm?.querySelectorAll('.prev-step-btn');
    const stepIndicators = document.querySelectorAll('.step-indicator-container .step-indicator');

    // Series Form Fields
    const podcastTitleInput = document.getElementById('podcast-title');
    const podcastDescriptionInput = document.getElementById('podcast-description');
    const podcastCategoryInput = document.getElementById('podcast-category');
    const podcastLanguageInput = document.getElementById('podcast-language');
    const podcastCountryInput = document.getElementById('podcast-country');
    const podcastHostNameInput = document.getElementById('podcast-host-name');
    const podcastContactEmailInput = document.getElementById('podcast-contact-email');
    const podcastPhoneNumberInput = document.getElementById('podcast-phone-number');
    const podcastWebsiteUrlInput = document.getElementById('podcast-website-url');
    const podcastCoverImageInput = document.getElementById('podcast-cover-image-input');
    const podcastCoverImagePreview = document.getElementById('podcast-cover-image-preview');
    const removeSeriesCoverBtn = document.querySelector('.remove-image-btn[data-input="podcast-cover-image-input"]');
    const podcastTrailerUrlInput = document.getElementById('podcast-trailer-url');
    const podcastStatusInput = document.getElementById('podcast-status');

    // Series List
    const userPodcastsGrid = document.getElementById('user-podcasts-grid');
    const podcastsLoadingMsg = document.getElementById('podcasts-loading-message');
    const noPodcastsMsg = document.getElementById('no-podcasts-message');

    // Episode Management Section & Form Elements
    const manageEpisodesSection = document.getElementById('manage-episodes-section');
    const episodeFormParentPodcastTitleEl = document.getElementById('episode-form-parent-podcast-title');
    const backToSeriesListBtn = document.getElementById('back-to-series-list-btn');
    const podcastEpisodeForm = document.getElementById('podcast-episode-form');
    const episodeIdInput = document.getElementById('episode-id');
    const episodeParentPodcastIdInput = document.getElementById('episode-parent-podcast-id');
    const submitEpisodeBtn = document.getElementById('submit-episode-btn');
    const clearEpisodeFormBtn = document.getElementById('clear-episode-form-btn');
    const currentSeriesEpisodesGrid = document.getElementById('current-series-episodes-grid');
    const episodeNumberInput = document.getElementById('episode-number');
    const episodeTitleInput = document.getElementById('episode-title');
    const episodeDescriptionTextarea = document.getElementById('episode-description');
    const episodeIsExplicitCheckbox = document.getElementById('episode-is-explicit');
    const episodeMediaTypeSelect = document.getElementById('episode-media-type');
    const episodeAudioFileGroup = document.getElementById('episode-audio-file-group');
    const episodeVideoFileGroup = document.getElementById('episode-video-file-group');
    const episodeAudioFileInput = document.getElementById('episode-audio-file-input');
    const episodeAudioFilePreview = document.getElementById('episode-audio-file-preview');
    const episodeVideoFileInput = document.getElementById('episode-video-file-input');
    const episodeVideoFilePreview = document.getElementById('episode-video-file-preview');
    const episodeCoverImageInput = document.getElementById('episode-cover-image-input');
    const episodeCoverImagePreview = document.getElementById('episode-cover-image-preview');
    const removeEpisodeCoverBtn = document.querySelector('.remove-image-btn[data-input="episode-cover-image-input"]');
    const episodeDurationInput = document.getElementById('episode-duration');
    const episodeStatusInput = document.getElementById('episode-status');
    const episodePublishDateGroup = document.getElementById('episode-publish-date-group');
    const episodePublishDateInput = document.getElementById('episode-publish-date');
    const episodeTagsInput = document.getElementById('episode-tags');

    // Header elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    let currentUser = null;
    let userBasicProfile = null;
    let editingPodcastSeriesId = null;
    let currentStep = 1;
    let selectedPodcastSeriesCoverFile = null;

    let editingPodcastEpisodeId = null;
    let currentSelectedSeriesForEpisodes = null;
    let selectedEpisodeCoverFile = null;
    let selectedEpisodeAudioFile = null;
    let selectedEpisodeVideoFile = null;

    const EMAILJS_SERVICE_ID = 'default_service';
    const EMAILJS_PODCAST_SERIES_SUBMIT_TEMPLATE_ID = 'template_t470byd';
    const EMAILJS_PODCAST_EPISODE_SUBMIT_TEMPLATE_ID = 'template_t470byd';

    // --- Initialization ---
    async function initializePage() {
        console.log("Initializing Podcaster Page...");
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
            console.log("No session, redirecting to signin.");
            window.location.replace('signin.html');
            return;
        }
        currentUser = session.user;
        console.log('User authenticated:', currentUser.email);

        await fetchHeaderProfileData();
        updateHeaderUI();
        await loadUserPodcastSeries();

        if (podcastSeriesForm) {
            resetAndPrepareSeriesFormForCreate();
        } else {
            console.error("FATAL: Podcast Series Multi-Step Form (ID: podcast-series-multistep-form) not found!");
            if(loadingIndicator) loadingIndicator.innerHTML = "<p class='status-message error-message'>Page setup error: Main form missing.</p>";
            return;
        }

        if(manageEpisodesSection) manageEpisodesSection.style.display = 'none';
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (podcasterWrapper) podcasterWrapper.style.display = 'block';
        setupEventListeners();
    }

    async function fetchHeaderProfileData() {
        if (!currentUser) return;
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('first_name, email, phone_number, profile_pic_url') // Adjust to your 'profiles' table
                .eq('id', currentUser.id)
                .single();
            if (error && error.code !== 'PGRST116') throw error;
            userBasicProfile = profile;
        } catch (err) {
            console.error("Error fetching basic profile:", err.message);
            userBasicProfile = null;
        }
    }

    function updateHeaderUI() {
        if (!currentUser) return;
        const displayName = userBasicProfile?.first_name || currentUser.email.split('@')[0];
        const displayEmail = currentUser.email;
        const displayPic = userBasicProfile?.profile_pic_url || 'assets/images/profile-placeholder.png';

        if (headerUsername) headerUsername.textContent = displayName;
        if (headerUserEmail) headerUserEmail.textContent = displayEmail;
        if (headerProfilePic) headerProfilePic.src = displayPic;
    }

    function handleLogout() {
        setLoadingState(logoutButton || mobileLogoutButton, true);
        supabase.auth.signOut()
            .then(() => { window.location.replace('signin.html'); })
            .catch((error) => {
                console.error('Sign out error:', error);
                alert(`Sign out failed: ${error.message}`);
                setLoadingState(logoutButton || mobileLogoutButton, false);
            });
    }

    // --- Multi-Step Form Logic ---
    function showStep(stepNumber) {
        if (!formSteps || !stepIndicators || !podcastSeriesForm) return;
        formSteps.forEach((step, index) => {
            step.classList.toggle('active-step', (index + 1) === stepNumber);
        });
        stepIndicators.forEach(indicator => {
            const indicatorStep = parseInt(indicator.dataset.step);
            indicator.classList.toggle('active', indicatorStep === stepNumber);
            indicator.classList.toggle('completed', indicatorStep < stepNumber);
        });
        currentStep = stepNumber;
        const formContainer = podcastSeriesForm.closest('.form-container');
        if (formContainer) formContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function validateCurrentStep(stepNumber) {
        let isValid = true;
        let firstErrorMessage = "";

        const getFieldLabel = (elementId) => {
            const el = document.getElementById(elementId);
            return el?.labels?.[0]?.textContent?.replace('*','').trim() || 'This field';
        };

        if (stepNumber === 1) {
            if (!podcastTitleInput?.value.trim()) { firstErrorMessage = `${getFieldLabel('podcast-title')} is required.`; isValid = false; }
            else if (!podcastDescriptionInput?.value.trim()) { firstErrorMessage = `${getFieldLabel('podcast-description')} is required.`; isValid = false; }
            else if (!podcastCategoryInput?.value) { firstErrorMessage = `${getFieldLabel('podcast-category')} is required.`; isValid = false; }
            else if (!podcastLanguageInput?.value.trim()) { firstErrorMessage = `${getFieldLabel('podcast-language')} is required.`; isValid = false; }
            else if (!podcastCountryInput?.value) { firstErrorMessage = `${getFieldLabel('podcast-country')} is required.`; isValid = false; }
        } else if (stepNumber === 2) {
            if (!podcastHostNameInput?.value.trim()) { firstErrorMessage = `${getFieldLabel('podcast-host-name')} is required.`; isValid = false; }
            else if (!podcastContactEmailInput?.value.trim() || !isValidEmail(podcastContactEmailInput.value)) { firstErrorMessage = `${getFieldLabel('podcast-contact-email')} requires a valid email.`; isValid = false; }
            else if (podcastWebsiteUrlInput?.value.trim() && !isValidHttpUrl(podcastWebsiteUrlInput.value.trim())) { firstErrorMessage = `Please enter a valid website URL for the Podcast Website.`; isValid = false; }
            else if (podcastPhoneNumberInput?.value.trim() && !isValidPhoneNumber(podcastPhoneNumberInput.value.trim())) { firstErrorMessage = `Please enter a valid phone number with country code.`; isValid = false; }
        } else if (stepNumber === 3) {
            if (!editingPodcastSeriesId && !selectedPodcastSeriesCoverFile) {
                firstErrorMessage = `Podcast Cover Art is required for a new series.`; isValid = false;
            } else if (editingPodcastSeriesId && !selectedPodcastSeriesCoverFile && podcastCoverImagePreview?.src.includes('placeholder.png')) {
                firstErrorMessage = `Podcast Cover Art is required if the previous image was removed.`; isValid = false;
            }
            if (podcastTrailerUrlInput?.value.trim() && !isValidHttpUrl(podcastTrailerUrlInput.value.trim())) { firstErrorMessage = `Please enter a valid trailer URL.`; isValid = false; }
        } else if (stepNumber === 4) {
            if(!podcastStatusInput?.value) { firstErrorMessage = `${getFieldLabel('podcast-status')} is required.`; isValid = false; }
        }

        if (!isValid && firstErrorMessage) {
            alert(firstErrorMessage); // Show only the first encountered error for the step
        }
        return isValid;
    }

    // --- Podcast Series Management ---
    async function loadUserPodcastSeries() {
        if (!currentUser || !userPodcastsGrid) return;
        if (podcastsLoadingMsg) podcastsLoadingMsg.style.display = 'block';
        if (noPodcastsMsg) noPodcastsMsg.style.display = 'none';
        userPodcastsGrid.innerHTML = '';

        try {
            const { data: podcasts, error } = await supabase
                .from('podcasts')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });
            if (error) throw error;
            renderPodcastSeriesGrid(podcasts || []);
        } catch (error) {
            console.error("Error fetching podcasts:", error.message);
            userPodcastsGrid.innerHTML = `<p class="status-message error-message">Could not load your podcast series.</p>`;
        } finally {
            if (podcastsLoadingMsg) podcastsLoadingMsg.style.display = 'none';
        }
    }

    function renderPodcastSeriesGrid(items) {
        if (!userPodcastsGrid) return;
        userPodcastsGrid.innerHTML = '';
        if (items.length === 0 && noPodcastsMsg) {
            noPodcastsMsg.style.display = 'block';
            return;
        }
        if(noPodcastsMsg) noPodcastsMsg.style.display = 'none';

        items.forEach(podcast => {
            const card = document.createElement('div');
            card.className = 'podcast-card-item glass-card';
            card.innerHTML = `
                <div class="podcast-card-cover">
                    <img src="${podcast.cover_image_url || 'cover-photo.png'}" alt="${podcast.title} Cover Art">
                </div>
                <div class="podcast-card-info">
                    <h3>${podcast.title}</h3>
                    <p class="podcast-card-meta">
                        <span><i class="fas fa-folder-open"></i> ${podcast.category || 'N/A'}</span>
                        <span><i class="fas fa-globe"></i> ${podcast.language || 'N/A'}</span>
                    </p>
                    <span class="podcast-card-status ${podcast.status.toLowerCase().replace(/\s+/g, '-')}">${podcast.status.charAt(0).toUpperCase() + podcast.status.slice(1)}</span>
                </div>
                <div class="article-card-actions">
                    <button class="btn btn-secondary btn-small add-episode-btn"><i class="fas fa-plus"></i> Episodes</button>
                    <button class="btn-icon edit-podcast-btn"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete-podcast-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            card.querySelector('.edit-podcast-btn').addEventListener('click', () => prepareSeriesFormForEdit(podcast));
            card.querySelector('.delete-podcast-btn').addEventListener('click', () => handleDeletePodcastSeries(podcast.id, podcast.title));
            card.querySelector('.add-episode-btn').addEventListener('click', () => showEpisodeManagementSection(podcast.id, podcast.title));
            userPodcastsGrid.appendChild(card);
        });
    }

    function resetAndPrepareSeriesFormForCreate() {
        editingPodcastSeriesId = null;
        currentStep = 1;
        if(podcastFormMainTitleEl) podcastFormMainTitleEl.textContent = 'Create New Podcast Series';
        if(podcastSeriesForm) podcastSeriesForm.reset();
        if(podcastIdInput) podcastIdInput.value = '';
        prefillSeriesFormHostInfo();
        clearSingleImagePreview(podcastCoverImagePreview, podcastCoverImageInput, 'selectedPodcastSeriesCoverFile', true);
        selectedPodcastSeriesCoverFile = null;
        if(podcastStatusInput) podcastStatusInput.value = 'draft';
        showStep(1);
        if(multistepFormMessageGlobal) displayMessage(multistepFormMessageGlobal, '', 'info'); // Clear global message
        if(submitPodcastSeriesBtn) submitPodcastSeriesBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit Series';
    }

    function prefillSeriesFormHostInfo() {
        if (!userBasicProfile || !podcastSeriesForm) return;
        const source = userBasicProfile;
        if (podcastHostNameInput) podcastHostNameInput.value = `${source.first_name || ''} ${source.last_name || ''}`.trim() || (currentUser?.email?.split('@')[0] || '');
        if (podcastContactEmailInput) podcastContactEmailInput.value = source.email || currentUser.email;
        if (podcastPhoneNumberInput) podcastPhoneNumberInput.value = source.phone_number || '';
        if (podcastWebsiteUrlInput) podcastWebsiteUrlInput.value = source.website_url || '';
    }

    async function prepareSeriesFormForEdit(podcast) {
        editingPodcastSeriesId = podcast.id;
        currentStep = 1;
        if(podcastFormMainTitleEl) podcastFormMainTitleEl.textContent = 'Edit Podcast Series';
        if(podcastSeriesForm) podcastSeriesForm.reset();
        if(podcastIdInput) podcastIdInput.value = podcast.id;

        if(podcastTitleInput) podcastTitleInput.value = podcast.title || '';
        if(podcastDescriptionInput) podcastDescriptionInput.value = podcast.description || '';
        if(podcastCategoryInput) podcastCategoryInput.value = podcast.category || '';
        if(podcastLanguageInput) podcastLanguageInput.value = podcast.language || '';
        if(podcastCountryInput) podcastCountryInput.value = podcast.country || '';
        if(podcastHostNameInput) podcastHostNameInput.value = podcast.host_name || '';
        if(podcastContactEmailInput) podcastContactEmailInput.value = podcast.contact_email || '';
        if(podcastPhoneNumberInput) podcastPhoneNumberInput.value = podcast.phone_number || '';
        if(podcastWebsiteUrlInput) podcastWebsiteUrlInput.value = podcast.website_url || '';
        if (podcastCoverImagePreview) {
            podcastCoverImagePreview.src = podcast.cover_image_url || 'cover-photo.png';
            if(removeSeriesCoverBtn) removeSeriesCoverBtn.style.display = podcast.cover_image_url ? 'inline-block' : 'none';
        }
        selectedPodcastSeriesCoverFile = null;
        if(podcastTrailerUrlInput) podcastTrailerUrlInput.value = podcast.trailer_url || '';
        if(podcastStatusInput) podcastStatusInput.value = podcast.status || 'draft';

        showStep(1);
        if(multistepFormMessageGlobal) displayMessage(multistepFormMessageGlobal, '', 'info');
        if(submitPodcastSeriesBtn) submitPodcastSeriesBtn.innerHTML = '<i class="fas fa-save"></i> Update Series';
        podcastMultistepFormSection.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

 async function handlePodcastSeriesFormSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        alert("Authentication error. Please sign in again.");
        return;
    }

    // Validate steps
    for (let i = 1; i <= 4; i++) {
        if (!validateCurrentStep(i)) {
            showStep(i);
            alert("Please correct errors on the current step before submitting the series.");
            return;
        }
    }

    setLoadingState(submitPodcastSeriesBtn, true);
    alert("Submitting your podcast series...");

    try {
        let existingSeriesData = null;
        if (editingPodcastSeriesId) {
            const { data } = await supabase
                .from('podcasts')
                .select('cover_image_url')
                .eq('id', editingPodcastSeriesId)
                .single();
            existingSeriesData = data;
        }

        let finalCoverImageUrl = existingSeriesData?.cover_image_url || null;
        if (selectedPodcastSeriesCoverFile) {
            const file = selectedPodcastSeriesCoverFile;
            const filePath = `podcast-media/${currentUser.id}/series-covers/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('podcast-media')
                .upload(filePath, file, { upsert: true });
            if (uploadError) throw new Error(`Series cover image upload failed: ${uploadError.message}`);
            finalCoverImageUrl = supabase.storage.from('podcast-media').getPublicUrl(filePath).data.publicUrl;
        } else if (
            editingPodcastSeriesId &&
            podcastCoverImagePreview &&
            podcastCoverImagePreview.src.includes('placeholder.png')
        ) {
            if (existingSeriesData?.cover_image_url)
                await deleteStorageFile(existingSeriesData.cover_image_url, 'podcast-media');
            finalCoverImageUrl = null;
        }

        // Ensure required input elements exist
        const missingField = [
            { name: 'Podcast Title', el: podcastTitleInput },
            { name: 'Description', el: podcastDescriptionInput },
            { name: 'Category', el: podcastCategoryInput },
            { name: 'Language', el: podcastLanguageInput },
            { name: 'Country', el: podcastCountryInput },
            { name: 'Host Name', el: podcastHostNameInput },
            { name: 'Contact Email', el: podcastContactEmailInput },
            { name: 'Status', el: podcastStatusInput }
        ].find(f => !f.el);

        if (missingField) {
            throw new Error(`${missingField.name} field is missing in the form. Please reload the page.`);
        }

        const seriesData = {
            user_id: currentUser.id,
            title: podcastTitleInput.value.trim(),
            description: podcastDescriptionInput.value.trim(),
            category: podcastCategoryInput.value,
            language: podcastLanguageInput.value.trim(),
            country: podcastCountryInput.value,
            host_name: podcastHostNameInput.value.trim(),
            contact_email: podcastContactEmailInput.value.trim(),
            phone_number: podcastPhoneNumberInput?.value.trim() || null,
            website_url: podcastWebsiteUrlInput?.value.trim() || null,
            cover_image_url: finalCoverImageUrl,
            trailer_url: podcastTrailerUrlInput?.value.trim() || null,
            status: podcastStatusInput.value
        };

        let savedPodcast;
        if (editingPodcastSeriesId) {
            seriesData.updated_at = new Date().toISOString();
            const { data, error } = await supabase
                .from('podcasts')
                .update(seriesData)
                .eq('id', editingPodcastSeriesId)
                .select()
                .single();
            if (error) throw error;
            savedPodcast = data;
        } else {
            const { data, error } = await supabase
                .from('podcasts')
                .insert(seriesData)
                .select()
                .single();
            if (error) throw error;
            savedPodcast = data;
        }

        alert(`Podcast series "${savedPodcast.title}" ${editingPodcastSeriesId ? 'updated' : 'created and submitted for review'} successfully!`);

        const emailParams = {
            to_email: savedPodcast.contact_email || currentUser.email,
            user_name: userBasicProfile?.first_name || 'Podcaster',
            podcast_title: savedPodcast.title,
            podcast_status: savedPodcast.status,
            submission_date: new Date().toLocaleDateString()
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_PODCAST_SERIES_SUBMIT_TEMPLATE_ID, emailParams)
            .then(res => console.log("Series email sent.", res.status))
            .catch(err => console.error("Series email failed:", err));

        await loadUserPodcastSeries();
        resetAndPrepareSeriesFormForCreate();

    } catch (error) {
        console.error("Error saving podcast series:", error.message);
        alert(`Error: ${error.message}`);
    } finally {
        setLoadingState(submitPodcastSeriesBtn, false);
    }
}

    async function handleDeletePodcastSeries(podcastId, podcastTitle) {
        if (!confirm(`Are you sure you want to delete the podcast series "${podcastTitle}"? This will also delete its cover art and ALL associated episodes.`)) {
            return;
        }
        setLoadingState(document.querySelector(`.delete-podcast-btn[data-series-id="${podcastId}"]`), true);
        try {
            const { data: seriesToDelete, error: fetchErr } = await supabase.from('podcasts')
                .select('cover_image_url').eq('id', podcastId).single();
            if (fetchErr) console.warn("Could not fetch series for cover deletion:", fetchErr.message);

            // Important: Delete associated episodes' media first (if they have separate media)
            // This requires fetching all episodes for this seriesId
            const { data: episodesToDelete, error: episodesFetchError } = await supabase
                .from('podcast_episodes')
                .select('audio_file_url, video_file_url, cover_image_url') // Episode specific media
                .eq('podcast_series_id', podcastId);

            if (episodesFetchError) console.warn("Error fetching episodes for media deletion:", episodesFetchError.message);
            else if (episodesToDelete && episodesToDelete.length > 0) {
                for (const ep of episodesToDelete) {
                    if(ep.audio_file_url) await deleteStorageFile(ep.audio_file_url, 'podcast-media');
                    if(ep.video_file_url) await deleteStorageFile(ep.video_file_url, 'podcast-media');
                    if(ep.cover_image_url) await deleteStorageFile(ep.cover_image_url, 'podcast-media');
                }
            }
            // Episodes themselves will be deleted by CASCADE if FK constraint is set up.
            // If not, you'd delete them from podcast_episodes table here.

            if (seriesToDelete?.cover_image_url) {
                await deleteStorageFile(seriesToDelete.cover_image_url, 'podcast-media');
            }

            const { error } = await supabase.from('podcasts').delete().eq('id', podcastId);
            if (error) throw error;

            showToastNotification(`Podcast series "${podcastTitle}" and its episodes deleted.`, "success");
            await loadUserPodcastSeries();
            if (editingPodcastSeriesId === podcastId) prepareSeriesFormForCreate();
            if (currentSelectedSeriesForEpisodes?.id === podcastId) hideEpisodeManagementSection(); // Hide episode section if deleted series was active

        } catch (error) {
            console.error("Error deleting podcast series:", error.message);
            showToastNotification(`Error deleting series: ${error.message}`, "error");
        } finally {
            // Reset loading state for all delete buttons or specific one
        }
    }

    // --- Episode Management Functions ---
    function showEpisodeManagementSection(seriesId, seriesTitle) {
        currentSelectedSeriesForEpisodes = { id: seriesId, title: seriesTitle };
        if(episodeFormParentPodcastTitleEl) episodeFormParentPodcastTitleEl.innerHTML = `Manage Episodes for: <strong>"${seriesTitle}"</strong>`;
        if(episodeParentPodcastIdInput) episodeParentPodcastIdInput.value = seriesId;

        document.getElementById('create-podcast-section').style.display = 'none';
        document.getElementById('podcasts-list-section').style.display = 'none';
        if(manageEpisodesSection) manageEpisodesSection.style.display = 'block';

        prepareEpisodeFormForCreate();
        loadEpisodesForSeries(seriesId);
        manageEpisodesSection.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    function hideEpisodeManagementSection() {
        currentSelectedSeriesForEpisodes = null;
        if(manageEpisodesSection) manageEpisodesSection.style.display = 'none';
        document.getElementById('create-podcast-section').style.display = 'block';
        document.getElementById('podcasts-list-section').style.display = 'block';
        prepareSeriesFormForCreate(); // Or just scroll to series form
    }

    function prepareEpisodeFormForCreate() {
        editingPodcastEpisodeId = null;
        if(podcastEpisodeForm) podcastEpisodeForm.reset();
        if(episodeIdInput) episodeIdInput.value = '';
        if(episodeParentPodcastIdInput && currentSelectedSeriesForEpisodes) {
            episodeParentPodcastIdInput.value = currentSelectedSeriesForEpisodes.id;
        }
        clearSingleImagePreview(document.getElementById('episode-cover-image-preview'), episodeCoverImageInput, 'selectedEpisodeCoverFile', true);
        if(episodeAudioFilePreview) episodeAudioFilePreview.innerHTML = '<p class="no-files-note">No audio file selected.</p>';
        if(episodeVideoFilePreview) episodeVideoFilePreview.innerHTML = '<p class="no-files-note">No video file selected.</p>';
        selectedEpisodeCoverFile = null;
        selectedEpisodeAudioFile = null;
        selectedEpisodeVideoFile = null;

        if(episodeStatusInput) episodeStatusInput.value = 'draft';
        toggleEpisodePublishDateVisibility('draft');
        toggleEpisodeMediaInputs('audio'); // Default

        clearAllFormMessages(podcastEpisodeForm);
        if(submitEpisodeBtn) submitEpisodeBtn.innerHTML = '<i class="fas fa-upload"></i> Add Episode';
        if(clearEpisodeFormBtn) clearEpisodeFormBtn.style.display = 'none';
    }

    async function prepareEpisodeFormForEdit(episodeData) { // Full episode object from DB
        editingPodcastEpisodeId = episodeData.id;
        if(podcastEpisodeForm) podcastEpisodeForm.reset();
        if(episodeIdInput) episodeIdInput.value = episodeData.id;
        if(episodeParentPodcastIdInput) episodeParentPodcastIdInput.value = episodeData.podcast_series_id;

        if(episodeNumberInput) episodeNumberInput.value = episodeData.episode_number || '';
        if(episodeTitleInput) episodeTitleInput.value = episodeData.title || '';
        if(episodeDescriptionTextarea) episodeDescriptionTextarea.value = episodeData.description || '';
        if(episodeIsExplicitCheckbox) episodeIsExplicitCheckbox.checked = episodeData.is_explicit || false;
        if(episodeDurationInput) episodeDurationInput.value = episodeData.duration_seconds || '';
        if(episodeStatusInput) episodeStatusInput.value = episodeData.status || 'draft';
        if(episodePublishDateInput) episodePublishDateInput.value = episodeData.publish_date || '';
        if(episodeTagsInput) episodeTagsInput.value = (episodeData.tags || []).join(', ');

        const epCoverPreview = document.getElementById('episode-cover-image-preview');
        if (epCoverPreview) {
            epCoverPreview.src = episodeData.cover_image_url || 'cover-photo.png';
            document.querySelector('.remove-image-btn[data-input="episode-cover-image-input"]').style.display = episodeData.cover_image_url ? 'inline-block' : 'none';
        }

        const audioPrev = document.getElementById('episode-audio-file-preview');
        if (episodeData.audio_file_url && audioPrev) {
            audioPrev.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-music file-icon"></i> ${decodeURIComponent(episodeData.audio_file_url.split('/').pop())} <a href="${episodeData.audio_file_url}" target="_blank" class="view-file-link">(View Current)</a></div></div>`;
        } else if (audioPrev) { audioPrev.innerHTML = '<p class="no-files-note">No audio file.</p>';}

        const videoPrev = document.getElementById('episode-video-file-preview');
        if (episodeData.video_file_url && videoPrev) {
            videoPrev.innerHTML = `<div class="file-preview-item existing-file"><div class="file-info"><i class="fas fa-video file-icon"></i> ${decodeURIComponent(episodeData.video_file_url.split('/').pop())} <a href="${episodeData.video_file_url}" target="_blank" class="view-file-link">(View Current)</a></div></div>`;
        } else if (videoPrev) { videoPrev.innerHTML = '<p class="no-files-note">No video file.</p>';}


        toggleEpisodePublishDateVisibility(episodeData.status);
        toggleEpisodeMediaInputs(episodeData.video_file_url ? 'video' : 'audio');

        selectedEpisodeCoverFile = null; selectedEpisodeAudioFile = null; selectedEpisodeVideoFile = null;
        clearAllFormMessages(podcastEpisodeForm);
        if(submitEpisodeBtn) submitEpisodeBtn.innerHTML = '<i class="fas fa-save"></i> Update Episode';
        if(clearEpisodeFormBtn) clearEpisodeFormBtn.style.display = 'inline-block';
        podcastEpisodeForm.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    function toggleEpisodeMediaInputs(mediaType) {
        if (episodeAudioFileGroup) episodeAudioFileGroup.style.display = mediaType === 'audio' ? 'block' : 'none';
        if (episodeVideoFileGroup) episodeVideoFileGroup.style.display = mediaType === 'video' ? 'block' : 'none';
        if (mediaType === 'audio' && episodeVideoFileInput) {
            episodeVideoFileInput.value = ''; selectedEpisodeVideoFile = null;
            if(episodeVideoFilePreview) episodeVideoFilePreview.innerHTML = '<p class="no-files-note">No video file selected.</p>';
        }
        if (mediaType === 'video' && episodeAudioFileInput) {
            episodeAudioFileInput.value = ''; selectedEpisodeAudioFile = null;
            if(episodeAudioFilePreview) episodeAudioFilePreview.innerHTML = '<p class="no-files-note">No audio file selected.</p>';
        }
        if(episodeMediaTypeSelect) episodeMediaTypeSelect.value = mediaType;
    }
    function toggleEpisodePublishDateVisibility(status) {
        if(episodePublishDateGroup) {
            episodePublishDateGroup.style.display = (status === 'published' || status === 'scheduled') ? 'block' : 'none';
            if(status === 'published' && episodePublishDateInput && !episodePublishDateInput.value) {
                episodePublishDateInput.value = new Date().toISOString().split('T')[0];
            }
        }
    }

    async function loadEpisodesForSeries(seriesId) {
        if (!currentSeriesEpisodesGrid || !seriesId) return;
        currentSeriesEpisodesGrid.innerHTML = '<p class="status-message">Loading episodes...</p>';
        try {
            const { data: episodes, error } = await supabase
                .from('podcast_episodes')
                .select('*')
                .eq('podcast_series_id', seriesId)
                .order('episode_number', { ascending: true }); // Or 'publish_date'
            if (error) throw error;
            renderEpisodeList(episodes || []);
        } catch (err) {
            console.error("Error fetching episodes:", err.message);
            currentSeriesEpisodesGrid.innerHTML = '<p class="status-message error-message">Could not load episodes.</p>';
        }
    }

    function renderEpisodeList(episodes) {
        if (!currentSeriesEpisodesGrid) return;
        currentSeriesEpisodesGrid.innerHTML = '';
        if (episodes.length === 0) {
            currentSeriesEpisodesGrid.innerHTML = '<p class="status-message">No episodes yet for this series. Add one using the form above.</p>';
            return;
        }
        episodes.forEach(ep => {
            const item = document.createElement('div');
            item.className = 'episode-list-item'; // Add CSS for this
            item.dataset.episodeId = ep.id;
            item.innerHTML = `
                <div class="info">
                    <strong>Ep ${ep.episode_number}: ${ep.title}</strong>
                    <span class="meta">Status: ${ep.status} | Published: ${ep.publish_date ? new Date(ep.publish_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div class="actions">
                    <button class="btn-icon edit-episode-btn"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete-episode-btn"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            item.querySelector('.edit-episode-btn').addEventListener('click', () => prepareEpisodeFormForEdit(ep));
            item.querySelector('.delete-episode-btn').addEventListener('click', () => handleDeleteEpisode(ep.id, ep.title));
            currentSeriesEpisodesGrid.appendChild(item);
        });
    }

    async function handlePodcastEpisodeFormSubmit(event) {
        event.preventDefault();
        // Validation
        if (!episodeNumberInput.value || !episodeTitleInput.value || !currentSelectedSeriesForEpisodes?.id) {
            displayMessage(episodeFormMessageGlobal, "Episode number, title, and a selected series are required.", "error");
            return;
        }
        const mediaType = episodeMediaTypeSelect.value;
        let mediaFileIsSelected = (mediaType === 'audio' && selectedEpisodeAudioFile) || (mediaType === 'video' && selectedEpisodeVideoFile);

        if (!editingPodcastEpisodeId && !mediaFileIsSelected) {
            displayMessage(episodeFormMessageGlobal, `Please select an ${mediaType} file for the new episode.`, "error");
            return;
        }

        setLoadingState(submitEpisodeBtn, true);
        displayMessage(episodeFormMessageGlobal, "Saving episode...", "info");

        try {
            let existingEpisode = null;
            if(editingPodcastEpisodeId) {
                const { data } = await supabase.from('podcast_episodes').select('*').eq('id', editingPodcastEpisodeId).single();
                existingEpisode = data;
            } else { existingEpisode = {}; }


            const uploadEpisodeFileToStorage = async (fileObject, type, existingUrl = null) => {
                if (fileObject) {
                    const filePath = `podcast-media/${currentUser.id}/${currentSelectedSeriesForEpisodes.id}/${type}/${Date.now()}-${fileObject.name.replace(/\s+/g, '_')}`;
                    const { error } = await supabase.storage.from('podcast-media').upload(filePath, fileObject, { upsert: true });
                    if (error) throw new Error(`${type} file upload failed: ${error.message}`);
                    return supabase.storage.from('podcast-media').getPublicUrl(filePath).data.publicUrl;
                }
                return existingUrl;
            };

            const episodePayload = {
                user_id: currentUser.id,
                podcast_series_id: currentSelectedSeriesForEpisodes.id,
                episode_number: parseInt(episodeNumberInput.value),
                title: episodeTitleInput.value.trim(),
                description: episodeDescriptionTextarea.value.trim() || null,
                cover_image_url: await uploadEpisodeFileToStorage(selectedEpisodeCoverFile, 'episode-covers', existingEpisode.cover_image_url),
                audio_file_url: mediaType === 'audio' ? await uploadEpisodeFileToStorage(selectedEpisodeAudioFile, 'episodes-audio', existingEpisode.audio_file_url) : (editingPodcastEpisodeId ? existingEpisode.audio_file_url : null),
                video_file_url: mediaType === 'video' ? await uploadEpisodeFileToStorage(selectedEpisodeVideoFile, 'episodes-video', existingEpisode.video_file_url) : (editingPodcastEpisodeId ? existingEpisode.video_file_url : null),
                duration_seconds: parseInt(episodeDurationInput.value) || null,
                publish_date: episodePublishDateInput.value || null,
                status: episodeStatusInput.value,
                is_explicit: episodeIsExplicitCheckbox.checked,
                tags: episodeTagsInput.value ? episodeTagsInput.value.split(',').map(t => t.trim()).filter(Boolean) : null,
            };
             if (episodePayload.publish_date === '') episodePayload.publish_date = null;


            let savedEpisode;
            if (editingPodcastEpisodeId) {
                episodePayload.updated_at = new Date().toISOString();
                const { data, error } = await supabase.from('podcast_episodes').update(episodePayload).eq('id', editingPodcastEpisodeId).select().single();
                if (error) throw error;
                savedEpisode = data;
            } else {
                const { data, error } = await supabase.from('podcast_episodes').insert(episodePayload).select().single();
                if (error) throw error;
                savedEpisode = data;
            }

            showToastNotification(`Episode "${savedEpisode.title}" ${editingPodcastEpisodeId ? 'updated' : 'added'} successfully!`, "success");
            const emailParams = { to_email: currentUser.email, user_name: userBasicProfile?.first_name || 'Podcaster', podcast_title: currentSelectedSeriesForEpisodes.title, episode_title: savedEpisode.title, status: savedEpisode.status, submission_date: new Date().toLocaleDateString() };
            emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_PODCAST_EPISODE_SUBMIT_TEMPLATE_ID, emailParams)
                .then(res => console.log("Episode email sent.", res.status)).catch(err => console.error("Episode email failed:", err));

            await loadEpisodesForSeries(currentSelectedSeriesForEpisodes.id);
            if (!editingPodcastEpisodeId) prepareEpisodeFormForCreate();
            else { if(clearEpisodeFormBtn) clearEpisodeFormBtn.style.display = 'inline-block'; }

        } catch (error) {
            console.error("Error saving episode:", error.message);
            displayMessage(episodeFormMessageGlobal, `Error: ${error.message}`, "error");
        } finally {
            setLoadingState(submitEpisodeBtn, false);
        }
    }

    async function handleDeleteEpisode(episodeId, episodeTitle) {
        if (!confirm(`Are you sure you want to delete episode "${episodeTitle}"?`)) return;
        try {
            const { data: epToDelete, error: fetchErr } = await supabase.from('podcast_episodes')
                .select('audio_file_url, video_file_url, cover_image_url')
                .eq('id', episodeId).single();
            if(fetchErr) console.warn("Could not fetch episode for file deletion", fetchErr.message);

            if(epToDelete) {
                if(epToDelete.audio_file_url) await deleteStorageFile(epToDelete.audio_file_url, 'podcast-media');
                if(epToDelete.video_file_url) await deleteStorageFile(epToDelete.video_file_url, 'podcast-media');
                if(epToDelete.cover_image_url) await deleteStorageFile(epToDelete.cover_image_url, 'podcast-media');
            }

            const { error } = await supabase.from('podcast_episodes').delete().eq('id', episodeId);
            if (error) throw error;
            showToastNotification(`Episode "${episodeTitle}" deleted.`, "success");
            await loadEpisodesForSeries(currentSelectedSeriesForEpisodes.id);
            if(editingPodcastEpisodeId === episodeId) prepareEpisodeFormForCreate();
        } catch (err) {
            console.error("Error deleting episode:", err.message);
            showToastNotification(`Error deleting episode: ${err.message}`, "error");
        }
    }

    async function handlePodcastEpisodeFormSubmit(event) {
        event.preventDefault();
        // ... (Validation using alert for first error found)
        const epNum = episodeNumberInput.value; // Ensure selected correctly
        const epTitle = episodeTitleInput.value; // Ensure selected correctly
        if (!epNum || !epTitle || !currentSelectedSeriesForEpisodes?.id) {
            alert("Episode number, title, and a selected series are required."); return;
        }
        // ... rest of validation

        setLoadingState(submitEpisodeBtn, true);
        alert("Saving your episode...");

        try {
            // ... (Full episode save logic from previous version)
            // Replace displayMessage/showToastNotification with alert()
            alert(`Episode "${savedEpisode.title}" ${editingPodcastEpisodeId ? 'updated' : 'added'} successfully!`);
            // ... EmailJS call for episode ...
        } catch (error) {
            console.error("Error saving episode:", error.message);
            alert(`Error saving episode: ${error.message}`);
        } finally {
            setLoadingState(submitEpisodeBtn, false);
        }
    }
    async function handleDeleteEpisode(episodeId, episodeTitle) {
        if (!confirm(`Are you sure you want to delete episode "${episodeTitle}"?`)) return;
        try {
            const { data: epToDelete, error: fetchErr } = await supabase.from('podcast_episodes')
                .select('audio_file_url, video_file_url, cover_image_url')
                .eq('id', episodeId).single();
            if(fetchErr) console.warn("Could not fetch episode for file deletion", fetchErr.message);

            if(epToDelete) {
                if(epToDelete.audio_file_url) await deleteStorageFile(epToDelete.audio_file_url, 'podcast-media');
                if(epToDelete.video_file_url) await deleteStorageFile(epToDelete.video_file_url, 'podcast-media');
                if(epToDelete.cover_image_url) await deleteStorageFile(epToDelete.cover_image_url, 'podcast-media');
            }

            const { error } = await supabase.from('podcast_episodes').delete().eq('id', episodeId);
            if (error) throw error;
            showToastNotification(`Episode "${episodeTitle}" deleted.`, "success");
            await loadEpisodesForSeries(currentSelectedSeriesForEpisodes.id);
            if(editingPodcastEpisodeId === episodeId) prepareEpisodeFormForCreate();
        } catch (err) {
            console.error("Error deleting episode:", err.message);
            showToastNotification(`Error deleting episode: ${err.message}`, "error");
        }
    }

// --- File Handling Utilities ---

function previewSingleImage(fileInput, imgPreviewElement, fileStateKeyToUpdate) {
    const file = fileInput?.files?.[0];
    if (!file || !imgPreviewElement) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        imgPreviewElement.src = e.target.result;

        const removeBtn = document.querySelector(`.remove-image-btn[data-input="${fileInput.id}"]`);
        if (removeBtn) removeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);

    // Assign file to the correct global variable
    switch (fileStateKeyToUpdate) {
        case 'selectedPodcastSeriesCoverFile':
            selectedPodcastSeriesCoverFile = file;
            break;
        case 'selectedEpisodeCoverFile':
            selectedEpisodeCoverFile = file;
            break;
        case 'selectedEpisodeAudioFile':
            selectedEpisodeAudioFile = file;
            break;
        case 'selectedEpisodeVideoFile':
            selectedEpisodeVideoFile = file;
            break;
    }
}

function clearSingleImagePreview(imgPreviewElement, fileInput, fileStateKeyToClear, forceToDefaultPlaceholder = false) {
    if (imgPreviewElement) {
        imgPreviewElement.src = forceToDefaultPlaceholder
            ? 'cover-photo.png'
            : '';
    }

    if (fileInput) {
        fileInput.value = '';
    }

    const removeBtn = document.querySelector(`.remove-image-btn[data-input="${fileInput?.id}"]`);
    if (removeBtn) removeBtn.style.display = 'none';

    // Clear the file reference from the correct global variable
    switch (fileStateKeyToClear) {
        case 'selectedPodcastSeriesCoverFile':
            selectedPodcastSeriesCoverFile = null;
            break;
        case 'selectedEpisodeCoverFile':
            selectedEpisodeCoverFile = null;
            break;
    }
}

function handleSingleFileUpload(fileInput, previewElement, fileStateKeyToUpdate) {
    const file = fileInput?.files?.[0];
    if (!file || !previewElement) return;

    const fileName = file.name;

    previewElement.innerHTML = `
        <div class="file-preview-item new-file">
            <div class="file-info">
                <i class="fas ${file.type.startsWith('audio') ? 'fa-music' : 'fa-video'} file-icon"></i>
                ${fileName}
                <span class="file-status">Ready to upload</span>
            </div>
        </div>
    `;

    switch (fileStateKeyToUpdate) {
        case 'selectedEpisodeAudioFile':
            selectedEpisodeAudioFile = file;
            break;
        case 'selectedEpisodeVideoFile':
            selectedEpisodeVideoFile = file;
            break;
    }
}

async function deleteStorageFile(fileUrl, bucketName) {
    try {
        const pathParts = fileUrl.split('/');
        const bucketIndex = pathParts.findIndex(p => p === bucketName);
        if (bucketIndex === -1) throw new Error("Bucket name not found in URL.");

        const filePath = pathParts.slice(bucketIndex + 1).join('/');
        const { error } = await supabase.storage.from(bucketName).remove([filePath]);

        if (error) {
            console.warn("Supabase file deletion failed:", error.message);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error deleting file from storage:", err.message);
        return false;
    }
}


    // --- Validation Utilities ---
    function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    function isValidHttpUrl(string) { try { new URL(string); return true; } catch (_) { return false; } }
    function isValidPhoneNumber(phone) { return /^\+[1-9]\d{7,14}$/.test(phone); }

    // --- Simplified Message & Loading Utilities (using alert) ---
    function displayMessage(globalMessageContainer, message, type = 'error') { // globalMessageContainer is optional for alert
        if (message) {
            // For alert, we don't need parentElement as much, but can keep for console
            console.log(`displayMessage (${type}): ${message}`);
            // If you still want a global message area on the page:
            if(globalMessageContainer) {
                globalMessageContainer.textContent = message;
                globalMessageContainer.className = `form-message ${type}`;
                globalMessageContainer.style.display = 'block';
            }
        } else if (globalMessageContainer) {
            globalMessageContainer.style.display = 'none';
        }
    }
    function clearAllFormMessages(formEl) { // For clearing the global message area if used
        if (multistepFormMessageGlobal) {
            multistepFormMessageGlobal.textContent = '';
            multistepFormMessageGlobal.style.display = 'none';
        }
        if (episodeFormMessageGlobal) {
            episodeFormMessageGlobal.textContent = '';
            episodeFormMessageGlobal.style.display = 'none';
        }
        // No need to clear field-specific messages if using alerts
    }
    function setLoadingState(button, isLoading) {
        if(!button) return;
        if (isLoading) {
            button.disabled = true;
            if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
            const iconHTML = button.querySelector('i')?.outerHTML || '';
            button.innerHTML = `<span class="spinner"></span> ${iconHTML} Processing...`;
        } else {
            button.disabled = false;
            if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
        }
    }
function previewSingleImage(inputEl, previewEl, globalVarName) {
    const file = inputEl?.files?.[0];
    if (!file || !previewEl) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        previewEl.src = e.target.result;
        const removeBtn = document.querySelector(`.remove-image-btn[data-input="${inputEl.id}"]`);
        if (removeBtn) removeBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);

if (globalVarName === 'selectedPodcastSeriesCoverFile') {
    selectedPodcastSeriesCoverFile = file;
} else if (globalVarName === 'selectedEpisodeCoverFile') {
    selectedEpisodeCoverFile = file;
}
// add other conditions if needed
}

    // --- Event Listener Setup ---
    function setupEventListeners() {
        if (nextStepButtons) {
            nextStepButtons.forEach(button => {
                button.addEventListener('click', () => {
                    if (validateCurrentStep(currentStep)) {
                        if (currentStep < (formSteps?.length || 0)) {
                            showStep(currentStep + 1);
                        }
                    }
                    // Else: validateCurrentStep already showed an alert
                });
            });
        }
if (prevStepButtons) {
    prevStepButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (currentStep > 1) {
                showStep(currentStep - 1);
            }
        });
    });
}
        if (podcastSeriesForm) podcastSeriesForm.addEventListener('submit', handlePodcastSeriesFormSubmit);
        if (podcastCoverImageInput) podcastCoverImageInput.addEventListener('change', () => previewSingleImage(podcastCoverImageInput, podcastCoverImagePreview, 'selectedPodcastSeriesCoverFile'));
        if (removeSeriesCoverBtn) removeSeriesCoverBtn.addEventListener('click', () => clearSingleImagePreview(podcastCoverImagePreview, podcastCoverImageInput, 'selectedPodcastSeriesCoverFile', true));

        // Episode Form Listeners
        if (podcastEpisodeForm) podcastEpisodeForm.addEventListener('submit', handlePodcastEpisodeFormSubmit);
        const clearEpFormBtn = document.getElementById('clear-episode-form-btn');
        if (clearEpFormBtn) clearEpFormBtn.addEventListener('click', prepareEpisodeFormForCreate);
        if (backToSeriesListBtn) backToSeriesListBtn.addEventListener('click', hideEpisodeManagementSection);
        if (episodeMediaTypeSelect) episodeMediaTypeSelect.addEventListener('change', (e) => toggleEpisodeMediaInputs(e.target.value));
        if (episodeAudioFileInput) episodeAudioFileInput.addEventListener('change', () => handleSingleFileUpload(episodeAudioFileInput, document.getElementById('episode-audio-file-preview'), 'selectedEpisodeAudioFile'));
        const epCoverInput = document.getElementById('episode-cover-image-input');
        const epCoverPreviewEl = document.getElementById('episode-cover-image-preview');
        if (epCoverInput && epCoverPreviewEl) epCoverInput.addEventListener('change', () => previewSingleImage(epCoverInput, epCoverPreviewEl, 'selectedEpisodeCoverFile'));
        const epCoverRemoveBtn = document.querySelector('.remove-image-btn[data-input="episode-cover-image-input"]');
        if (epCoverRemoveBtn && epCoverPreviewEl && epCoverInput) epCoverRemoveBtn.addEventListener('click', () => clearSingleImagePreview(epCoverPreviewEl, epCoverInput, 'selectedEpisodeCoverFile', true));
        if(episodeStatusInput) episodeStatusInput.addEventListener('change', (e) => toggleEpisodePublishDateVisibility(e.target.value));

        // General
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);
    }

    // --- Initialize ---
    initializePage();
});