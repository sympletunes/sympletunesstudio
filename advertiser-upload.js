// js/advertiser-upload.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const advertiserWrapper = document.getElementById('advertiser-wrapper');

    const termsStep = document.getElementById('terms-step');
    const metadataStep = document.getElementById('metadata-step');
    const uploadStep = document.getElementById('upload-step');
    const confirmationStep = document.getElementById('confirmation-step');

    const agreeCheckbox = document.getElementById('agree-terms-checkbox');
    const proceedToFormBtn = document.getElementById('proceed-to-form-btn');
    const backToTermsBtn = document.getElementById('back-to-terms-btn');
    const adMetadataForm = document.getElementById('ad-metadata-form');
    const proceedToUploadBtn = document.getElementById('proceed-to-upload-btn');
    const backToMetadataBtn = document.getElementById('back-to-metadata-btn');
    const adFileUploadForm = document.getElementById('ad-file-upload-form');
    const adFileInput = document.getElementById('ad-file-input');
    const adFileDropzone = document.getElementById('ad-file-dropzone');
    const adFilePreview = document.getElementById('ad-file-preview');
    const noFileSelectedMsg = adFilePreview?.querySelector('.no-file-selected');
    const submitAdBtn = document.getElementById('submit-ad-for-review-btn');

    const uploadProgressContainer = document.querySelector('.upload-progress-container');
    const adUploadProgressBar = document.getElementById('ad-upload-progress-bar');
    const adUploadProgressText = document.getElementById('ad-upload-progress-text');

    const requirementsDisplay = document.getElementById('ad-format-requirements-display');
    const requiredFormatNameEl = document.getElementById('required-format-name');
    const requiredFormatSpecsEl = document.getElementById('required-format-specs');

    // Confirmation elements
    const confirmBusinessName = document.getElementById('confirm-business-name');
    const confirmAdTitle = document.getElementById('confirm-ad-title');
    const confirmContactEmail = document.getElementById('confirm-contact-email');

    // Header elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    // --- State ---
    let currentUser = null;
    let adMetadata = {}; // To store data from metadata form
    let uploadedFileUrl = null; // To store URL after upload
    let selectedAdFile = null; // To store the File object

     // --- EmailJS Config ---
    const EMAILJS_SERVICE_ID = 'default_service'; // Replace if needed
    const EMAILJS_TEMPLATE_ID_AD_RECEIVED = 'template_cbck3pa'; // *** IMPORTANT: Create this template in EmailJS ***
    const EMAILJS_ADMIN_TEMPLATE_ID_AD_REVIEW = 'YOUR_ADMIN_AD_REVIEW_TEMPLATE_ID'; // *** Optional: Create this template for admin notification ***

    // --- Ad Format Requirements (Example) ---
    const adFormatRequirements = {
        image: {
            name: "Image (Banner, Thumbnail, etc.)",
            accept: "image/jpeg, image/png, image/webp",
            specs: [
                "Formats: JPG, PNG, WEBP",
                "Recommended Aspect Ratios: 16:9, 1:1, 9:16",
                "Max File Size: 5 MB",
                "Resolution: Min 72dpi, Rec 150-300dpi"
            ]
        },
        video: {
            name: "Video (Pre/Mid-roll, Promo)",
            accept: "video/mp4, video/webm, video/quicktime",
            specs: [
                "Formats: MP4 (H.264), WEBM, MOV",
                "Recommended Ratios: 16:9, 9:16",
                "Resolution: Min 720p, Rec 1080p",
                "Max File Size: 150 MB",
                "Max Duration: 60 seconds",
                "Audio: Stereo, normalized"
            ]
        },
        audio: {
            name: "Audio (Podcast Insert, Promo)",
            accept: "audio/mpeg, audio/ogg, audio/wav, audio/aac",
            specs: [
                "Formats: MP3, OGG, WAV, AAC",
                "Bitrate: Min 128kbps, Rec 192-320kbps",
                "Sample Rate: 44.1kHz or 48kHz",
                "Max File Size: 20 MB",
                "Max Duration: 60 seconds",
                "Loudness: ~ -16 LUFS"
            ]
        }
        // Add more formats as needed
    };

// --- Initialization ---
async function initializeAdvertiserPage() {
    try {
        // 1. Auth Check (RLS-safe user fetch)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            console.error("User not authenticated:", error);
            window.location.replace('signup.html');
            return;
        }

        // 2. Store authenticated user globally
        currentUser = user;
        console.log('Advertiser authenticated:', currentUser.email);
        console.log('User ID for RLS:', currentUser.id);

        // 3. (Optional) Debug check: ensure auth.uid matches
        const { data: { user: confirmUser } } = await supabase.auth.getUser();
        if (confirmUser.id !== currentUser.id) {
            console.warn("Mismatch in auth.uid and currentUser.id — RLS may fail.");
        }

        // 4. Fetch header profile (UX)
        fetchHeaderProfileData();

        // 5. Start ad form wizard at step 1
        navigateToAdvertiserStep('terms-step');

        // 6. Unhide content, hide loader
        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (advertiserWrapper) advertiserWrapper.style.display = 'block';

        // 7. Setup form and button events
        setupAdvertiserEventListeners();

    } catch (err) {
        console.error("Initialization error:", err);
        alert("Something went wrong while loading the advertiser page.");
    }
}

     async function fetchHeaderProfileData() { // Simplified header update
         if (!currentUser) return;
         const { data: profile } = await supabase
             .from('profiles')
             .select('first_name, profile_pic_url')
             .eq('id', currentUser.id)
             .single();
         if (profile) {
             if (headerProfilePic && profile.profile_pic_url) headerProfilePic.src = profile.profile_pic_url;
             if (headerUsername) headerUsername.textContent = profile.first_name || currentUser.email.split('@')[0];
         }
         if (headerUserEmail) headerUserEmail.textContent = currentUser.email;
    }


    // --- Step Navigation ---
    function navigateToAdvertiserStep(stepId) {
        document.querySelectorAll('.advertiser-step').forEach(step => step.style.display = 'none');
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.style.display = 'block';
            targetStep.classList.add('active-step'); // Add active class if needed for CSS
            window.scrollTo(0, 0); // Scroll to top when changing steps
        } else {
            console.error("Target step not found:", stepId);
        }
    }

    // --- Event Listeners Setup ---
    function setupAdvertiserEventListeners() {
        // Terms Agreement
        if (agreeCheckbox) {
            agreeCheckbox.addEventListener('change', () => {
                if (proceedToFormBtn) proceedToFormBtn.disabled = !agreeCheckbox.checked;
            });
        }
        if (proceedToFormBtn) {
            proceedToFormBtn.addEventListener('click', () => {
                if (agreeCheckbox.checked) {
                    navigateToAdvertiserStep('metadata-step');
                }
            });
        }
        if(backToTermsBtn){
            backToTermsBtn.addEventListener('click', () => navigateToAdvertiserStep('terms-step'));
        }

        // Metadata Form Submission
        if (adMetadataForm) {
            adMetadataForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Basic validation could be added here
                const formData = new FormData(adMetadataForm);
                adMetadata = Object.fromEntries(formData);
                adMetadata.ad_placements = formData.getAll('ad_placements'); // Get array for checkboxes

                console.log("Ad Metadata:", adMetadata);

                 // Determine required format based on placement (simplified logic)
                 let requiredFormat = determineRequiredFormat(adMetadata.ad_placements);
                 adMetadata.ad_format = requiredFormat; // Store the determined format

                 if (!requiredFormat) {
                    displayMessage(adMetadataForm, "Please select at least one ad placement.", "error", "metadata-form-message");
                    return;
                 }

                updateUploadStepUI(requiredFormat);
                navigateToAdvertiserStep('upload-step');
            });
        }
        if(backToMetadataBtn){
            backToMetadataBtn.addEventListener('click', () => navigateToAdvertiserStep('metadata-step'));
        }

        // File Upload Handling (Drag & Drop)
        if (adFileDropzone) {
            adFileDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
                adFileDropzone.classList.add('dragover');
            });
            adFileDropzone.addEventListener('dragleave', () => {
                adFileDropzone.classList.remove('dragover');
            });
            adFileDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                adFileDropzone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    adFileInput.files = files; // Assign dropped file to hidden input
                    handleFileSelection(files[0]); // Process the first dropped file
                }
            });
            // Trigger hidden file input when dropzone label/area is clicked
             adFileDropzone.addEventListener('click', (e) => {
                if (e.target.tagName !== 'INPUT') { // Prevent loop if clicking input itself
                    adFileInput.click();
                }
             });
        }
        if (adFileInput) {
            adFileInput.addEventListener('change', () => {
                if (adFileInput.files.length > 0) {
                    handleFileSelection(adFileInput.files[0]);
                }
            });
        }

        // Final Ad Submission
        if (adFileUploadForm) {
            adFileUploadForm.addEventListener('submit', handleSubmitAdForReview);
        }

        // Logout
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);
    }

    // --- File Handling & UI Update ---
    function determineRequiredFormat(placements) {
         // Simple logic: Video if explore feed, Audio if podcast, else Image
         if (placements.includes('explore_feed')) return 'video';
         if (placements.includes('podcast_preroll') || placements.includes('podcast_midroll')) return 'audio';
         if (placements.includes('homepage_banner') || placements.includes('sidebar_display')) return 'image';
         return null; // Or default to image?
    }

    function updateUploadStepUI(format) {
        if (!requirementsDisplay || !adFormatRequirements[format]) {
             console.error("Cannot update requirements UI for format:", format);
             // Display a generic message or hide the section
             if(requirementsDisplay) requirementsDisplay.innerHTML = '<p class="error-message">Could not determine file requirements for selected placements.</p>';
             adFileInput.accept = '*/*'; // Allow any file if format unknown
             return;
        }
        const reqs = adFormatRequirements[format];
        if(requiredFormatNameEl) requiredFormatNameEl.textContent = reqs.name;
        if(requiredFormatSpecsEl) {
            requiredFormatSpecsEl.innerHTML = ''; // Clear previous
            reqs.specs.forEach(spec => {
                const li = document.createElement('li');
                li.textContent = spec;
                requiredFormatSpecsEl.appendChild(li);
            });
        }
        adFileInput.accept = reqs.accept; // Set accepted file types
         // Store the format for submission
         const hiddenFormatInput = document.getElementById('final-ad-format');
         if(hiddenFormatInput) hiddenFormatInput.value = format;

         clearFileUploadPreview(); // Clear previous file selection when format changes
    }

    function handleFileSelection(file) {
        if (!file) {
            clearFileUploadPreview();
            return;
        }
        selectedAdFile = file; // Store the selected file object

        // Basic Validation (Client-side check based on determined format)
        const currentFormat = adMetadata.ad_format;
        if (currentFormat && adFormatRequirements[currentFormat]) {
             const allowedTypes = adFormatRequirements[currentFormat].accept.split(',').map(t => t.trim());
             if (!allowedTypes.includes(file.type)) {
                 alert(`Invalid file type. Please upload a ${currentFormat} file (${adFormatRequirements[currentFormat].accept}).`);
                 clearFileUploadPreview();
                 return;
             }
             // Add size validation if needed here
        }


        // Update preview area
        if (adFilePreview) {
            adFilePreview.innerHTML = ''; // Clear 'No file selected' or previous preview
            const item = document.createElement('div');
            item.className = 'file-preview-item';
            item.innerHTML = `
                <div class="file-info">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" class="remove-file-btn" aria-label="Remove file">×</button>
            `;
            item.querySelector('.remove-file-btn').addEventListener('click', clearFileUploadPreview);
            adFilePreview.appendChild(item);
        }
         if (uploadProgressContainer) uploadProgressContainer.style.display = 'none'; // Hide progress initially
    }

    function clearFileUploadPreview() {
        selectedAdFile = null;
        adFileInput.value = ''; // Reset file input
        if (adFilePreview) adFilePreview.innerHTML = '<p class="no-file-selected">No file selected.</p>';
         if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
        if(adUploadProgressBar) adUploadProgressBar.value = 0;
        if(adUploadProgressText) adUploadProgressText.textContent = '0%';
    }

// --- Final Submission ---
async function handleSubmitAdForReview(event) {
    event.preventDefault();

    if (!selectedAdFile) {
        displayMessage(adFileUploadForm, "Please select an ad creative file to upload.", "error", "upload-form-message");
        return;
    }
    if (!currentUser) {
        displayMessage(adFileUploadForm, "Authentication error. Please sign in again.", "error", "upload-form-message");
        return;
    }

    const submitButton = document.getElementById('submit-ad-for-review-btn');
    if (!submitButton.dataset.originalText) submitButton.dataset.originalText = submitButton.textContent;
    setLoadingState(submitButton, true);
    displayMessage(adFileUploadForm, '', 'info');
    if (uploadProgressContainer) uploadProgressContainer.style.display = 'block';

    try {
        // 1. Upload file to Supabase Storage
        const file = selectedAdFile;
        const filePath = `advertisements/${currentUser.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('advertisement-creatives')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) throw new Error(`File upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage.from('advertisement-creatives').getPublicUrl(filePath);
        uploadedFileUrl = urlData.publicUrl;
        console.log("File uploaded:", uploadedFileUrl);

        if (adUploadProgressBar) adUploadProgressBar.value = 100;
        if (adUploadProgressText) adUploadProgressText.textContent = '100%';

        // 2. Save Ad Metadata to Database
        const adRecord = {
            user_id: currentUser.id,
            business_name: adMetadata.business_name,
            ad_title: adMetadata.ad_title,
            ad_description: adMetadata.ad_description || null,
            target_audience: adMetadata.target_audience || null,
            ad_duration: parseInt(adMetadata.ad_duration) || null,
            ad_placements: adMetadata.ad_placements || [],
            ad_format: adMetadata.ad_format,
            file_url: uploadedFileUrl,
            landing_url: adMetadata.landing_url,
            contact_email: adMetadata.contact_email,
            phone_number: adMetadata.phone_number || null,
            status: 'pending',
            start_date: adMetadata.start_date || null,
            end_date: adMetadata.end_date || null
        };

        const { data: insertedAd, error: insertError } = await supabase
            .from('advertisements')
            .insert([adRecord])
            .select()
            .single();

        if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);
        console.log("Ad record created:", insertedAd);

        // 3. Send confirmation email to user
        const userEmailParams = {
            to_email: insertedAd.contact_email,
            business_name: insertedAd.business_name,
            ad_title: insertedAd.ad_title,
            ad_id: insertedAd.id,
            status: insertedAd.status,
            submission_date: new Date(insertedAd.created_at).toLocaleDateString()
        };

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_AD_RECEIVED, userEmailParams)
            .then(res => console.log("User confirmation email sent.", res.status))
            .catch(err => console.error("Failed to send user confirmation email.", err));

        // 4. Show Confirmation Step
        displayConfirmationData(insertedAd);
        navigateToAdvertiserStep('confirmation-step');

    } catch (error) {
        console.error("Ad Submission Error:", error);
        displayMessage(adFileUploadForm, `Submission failed: ${error.message}`, "error", "upload-form-message");
        if (uploadProgressContainer) uploadProgressContainer.style.display = 'none';
    } finally {
        setLoadingState(submitButton, false);
    }
}


    function displayConfirmationData(adData) {
        if(confirmBusinessName) confirmBusinessName.textContent = adData.business_name;
        if(confirmAdTitle) confirmAdTitle.textContent = adData.ad_title;
        if(confirmContactEmail) confirmContactEmail.textContent = adData.contact_email;
    }


    // Helper: Display message in form
    function displayMessage(formElement, message, type = 'error', messageId = null) {
         const msgElementId = messageId || `${formElement.id}-message`; // Default message element ID
         let messageEl = document.getElementById(msgElementId);

        // Create message element if it doesn't exist
         if (!messageEl && formElement) {
             messageEl = document.createElement('p');
             messageEl.id = msgElementId;
             messageEl.className = 'form-message'; // Base class
             // Insert after form actions or at the end
             const formActions = formElement.querySelector('.form-actions');
             if (formActions) {
                 formActions.parentNode.insertBefore(messageEl, formActions.nextSibling);
             } else {
                 formElement.appendChild(messageEl);
             }
         }

         if(messageEl) {
             messageEl.textContent = message;
             messageEl.className = `form-message ${type}`; // Apply type class (e.g., 'error', 'success')
             messageEl.style.display = message ? 'block' : 'none';
         }
    }
     // Helper: Set Loading State
     function setLoadingState(button, isLoading) { /* ... reuse from previous examples ... */
         if(!button) return;
         if (isLoading) {
            button.disabled = true;
            if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
            button.innerHTML = '<span class="spinner"></span> Working...';
        } else {
            button.disabled = false;
            if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
        }
     }
      // Logout Function
      function handleLogout() { 
         supabase.auth.signOut().then(() => window.location.replace('signup.html')).catch(console.error);
      }


    // --- Start ---
    initializeAdvertiserPage();

});