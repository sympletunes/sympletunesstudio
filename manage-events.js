// js/manage-events.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const eventsWrapper = document.getElementById('events-wrapper');
    const userEventsGrid = document.getElementById('user-events-grid');
    const eventsLoadingMsg = document.getElementById('events-loading-message');
    const noEventsMsg = document.getElementById('no-events-message');

    const openCreateEventModalBtn = document.getElementById('open-create-event-modal-btn');
    const eventFormModal = document.getElementById('event-form-modal');
    const eventForm = document.getElementById('event-form');
    const eventModalTitle = document.getElementById('event-modal-title');
    const eventFormTitle = document.getElementById('event-form-title');
const eventFormSubtitle = document.getElementById('event-form-subtitle');
const submitEventBtn = document.getElementById('submit-event-btn');
const clearEventFormBtn = document.getElementById('clear-event-form-btn');
    const eventIdInput = document.getElementById('event-id'); // Hidden input for editing
    const closeEventModalBtn = eventFormModal?.querySelector('.close-modal-btn');
    const cancelEventFormBtn = document.getElementById('cancel-event-form-btn');
    const saveEventBtn = document.getElementById('save-event-btn');
    const eventFormMessage = document.getElementById('event-form-message');

    // Form Fields
    const eventNameInput = document.getElementById('event-name');
    const eventDescriptionInput = document.getElementById('event-description');
    const eventCategoryInput = document.getElementById('event-category');
    const eventDateInput = document.getElementById('event-date');
    const eventStartTimeInput = document.getElementById('event-start-time');
    const eventEndTimeInput = document.getElementById('event-end-time');
    const eventLocationInput = document.getElementById('event-location');
    const eventCityInput = document.getElementById('event-city');
    const eventCountryInput = document.getElementById('event-country');
    const eventTicketRequiredCheckbox = document.getElementById('event-ticket-required');
    const ticketLinkGroup = document.getElementById('ticket-link-group');
    const eventTicketLinkInput = document.getElementById('event-ticket-link');
    const eventPosterInput = document.getElementById('event-poster-input');
    const eventPosterPreview = document.getElementById('event-poster-preview');
    const eventCoverInput = document.getElementById('event-cover-input');
    const eventCoverPreview = document.getElementById('event-cover-preview');
    const eventContactEmailInput = document.getElementById('event-contact-email');
    const eventContactPhoneInput = document.getElementById('event-contact-phone');
    const eventPosterLinkInput = document.getElementById('event-poster-link');
    const eventCoverLinkInput = document.getElementById('event-cover-link');

    // Header elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');


    let currentUser = null;
    let userProfile = null; // Store basic profile for header
    let editingEventId = null; // To know if we are editing or creating
    let selectedPosterFile = null;
    let selectedCoverFile = null;


    // EmailJS Config
    const EMAILJS_SERVICE_ID = 'default_service'; // From your EmailJS account
    const EMAILJS_EVENT_SUBMIT_TEMPLATE_ID = 'template_8y6dzbf'; 


    // --- Initialization ---
    async function initializeEventsPage() {
        // ... (Auth check and fetchHeaderProfileData - same as before) ...
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) { window.location.replace('signup.html'); return; }
        currentUser = session.user;
        await fetchHeaderProfileData();

        await loadUserEvents();
        prepareFormForCreate(); // Prepare form for new event by default

        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (eventsWrapper) eventsWrapper.style.display = 'block';

        setupEventListeners();
    }

 async function fetchHeaderProfileData() {
         if (!currentUser) return;
         const { data: profile } = await supabase
             .from('profiles')
             .select('first_name, profile_pic_url')
             .eq('id', currentUser.id)
             .single();
         if (profile) {
             userProfile = profile; // Store for later use if needed
             if (headerProfilePic && profile.profile_pic_url) headerProfilePic.src = profile.profile_pic_url;
             if (headerUsername) headerUsername.textContent = profile.first_name || currentUser.email.split('@')[0];
         } else {
            if (headerUsername) headerUsername.textContent = currentUser.email.split('@')[0];
         }
         if (headerUserEmail) headerUserEmail.textContent = currentUser.email;
    }
 // --- Load User's Events ---
    async function loadUserEvents() {
        if (!currentUser) return;
        if (eventsLoadingMsg) eventsLoadingMsg.style.display = 'block';
        if (noEventsMsg) noEventsMsg.style.display = 'none';
        if (userEventsGrid) userEventsGrid.innerHTML = ''; // Clear previous

        try {
            const { data: events, error } = await supabase
                .from('events')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('date', { ascending: false }); // Show most recent first

            if (error) throw error;

            if (events && events.length > 0) {
                renderEventsGrid(events);
            } else {
                if (noEventsMsg) noEventsMsg.style.display = 'block';
            }
        } catch (error) {
            console.error("Error fetching events:", error.message);
            if (userEventsGrid) userEventsGrid.innerHTML = `<p class="status-message error-message">Could not load your events: ${error.message}</p>`;
        } finally {
            if (eventsLoadingMsg) eventsLoadingMsg.style.display = 'none';
        }
    }
    function renderEventsGrid(events) { /* ... (same, but edit/delete buttons will call prepareFormForEdit) ... */
        if (!userEventsGrid) return;
        userEventsGrid.innerHTML = ''; // Clear
        if (events.length === 0 && noEventsMsg) {
            noEventsMsg.style.display = 'block';
            return;
        }
        if(noEventsMsg) noEventsMsg.style.display = 'none';

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card-item glass-card';
            card.dataset.eventId = event.id;
            // ... (rest of card HTML generation - same)
            card.querySelector('.edit-event-btn').addEventListener('click', () => prepareFormForEdit(event));
            card.querySelector('.delete-event-btn').addEventListener('click', () => handleDeleteEvent(event.id, event.event_name));
            userEventsGrid.appendChild(card);
        });
    }
    function formatTime(timeString) { /* ... same ... */ }


    // --- Form State Management ---
    function prepareFormForCreate() {
        editingEventId = null;
        if(eventFormTitle) eventFormTitle.textContent = 'Create a New Event';
        if(eventFormSubtitle) eventFormSubtitle.textContent = 'Fill in the details below to set up your event.';
        if(eventForm) eventForm.reset();
        if(eventIdInput) eventIdInput.value = ''; // Clear hidden ID field
        if(eventPosterPreview) eventPosterPreview.src = 'profile-picture.png';
        if(eventCoverPreview) eventCoverPreview.src = 'cover-photo.png';
        document.querySelectorAll('.remove-image-btn').forEach(btn => btn.style.display = 'none');
        if(ticketLinkGroup) ticketLinkGroup.style.display = 'none';
        selectedPosterFile = null;
        selectedCoverFile = null;
        clearFormMessage(eventForm);
        if(submitEventBtn) submitEventBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Event for Review';
        if(clearEventFormBtn) clearEventFormBtn.style.display = 'none'; // Hide clear button when creating
        window.scrollTo({ top: eventForm.offsetTop - 80, behavior: 'smooth' }); // Scroll to form
    }

    function prepareFormForEdit(event) {
        editingEventId = event.id;
        if(eventFormTitle) eventFormTitle.textContent = 'Edit Event Details';
        if(eventFormSubtitle) eventFormSubtitle.textContent = `You are currently editing: ${event.event_name}`;
        if(eventIdInput) eventIdInput.value = event.id;

        // Pre-fill form fields (same as openEventModalForEdit previously)
        if(eventForm) {
            eventNameInput.value = event.event_name || '';
            // ... (prefill all other form fields from 'event' object)
            eventDescriptionInput.value = event.description || '';
            eventCategoryInput.value = event.category || '';
            eventDateInput.value = event.date || '';
            eventStartTimeInput.value = event.start_time || '';
            eventEndTimeInput.value = event.end_time || '';
            eventLocationInput.value = event.location || '';
            eventCityInput.value = event.city || '';
            eventCountryInput.value = event.country || '';
            eventTicketRequiredCheckbox.checked = event.ticket_required || false;
            if(ticketLinkGroup) ticketLinkGroup.style.display = event.ticket_required ? 'block' : 'none';
            if(eventTicketLinkInput) eventTicketLinkInput.value = event.ticket_link || '';
            if(eventPosterPreview) eventPosterPreview.src = event.poster_url || 'profile-picture.png';
            if(eventCoverPreview) eventCoverPreview.src = event.cover_url || 'cover-photo.png';
            if(eventContactEmailInput) eventContactEmailInput.value = event.contact_email || '';
            if(eventContactPhoneInput) eventContactPhoneInput.value = event.phone_number || '';
        }
        selectedPosterFile = null;
        selectedCoverFile = null;
        document.querySelectorAll('.remove-image-btn').forEach(btn => btn.style.display = 'none'); // Hide remove buttons initially
        if(eventPosterPreview.src && !eventPosterPreview.src.endsWith('image-placeholder.png')) {
             document.querySelector('.remove-image-btn[data-target="event-poster-preview"]').style.display = 'inline-block';
        }
        if(eventCoverPreview.src && !eventCoverPreview.src.endsWith('cover-placeholder.png')) {
             document.querySelector('.remove-image-btn[data-target="event-cover-preview"]').style.display = 'inline-block';
        }


        clearFormMessage(eventForm);
        if(submitEventBtn) submitEventBtn.innerHTML = '<i class="fas fa-save"></i> Update Event';
        if(clearEventFormBtn) clearEventFormBtn.style.display = 'inline-block'; // Show clear/new button
        window.scrollTo({ top: eventForm.offsetTop - 80, behavior: 'smooth' }); // Scroll to form
    }

 // --- Event Listeners Setup ---
function setupEventListeners() {
    // No open modal button now, form is always visible for create/edit

    if (eventTicketRequiredCheckbox && ticketLinkGroup) {
        eventTicketRequiredCheckbox.addEventListener('change', () => {
            ticketLinkGroup.style.display = eventTicketRequiredCheckbox.checked ? 'block' : 'none';
        });
    }

    if (eventPosterInput) {
        eventPosterInput.addEventListener('change', () => previewFile(eventPosterInput, eventPosterPreview, 'poster'));
    }

    if (eventCoverInput) {
        eventCoverInput.addEventListener('change', () => previewFile(eventCoverInput, eventCoverPreview, 'cover'));
    }

    if (eventPosterLinkInput) {
        eventPosterLinkInput.addEventListener('input', () => {
            const url = eventPosterLinkInput.value.trim();
            if (url && isValidImageUrl(url)) eventPosterPreview.src = url;
        });
    }

    if (eventCoverLinkInput) {
        eventCoverLinkInput.addEventListener('input', () => {
            const url = eventCoverLinkInput.value.trim();
            if (url && isValidImageUrl(url)) eventCoverPreview.src = url;
        });
    }

    document.querySelectorAll('.remove-image-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetPreviewId = btn.dataset.target;
            const targetInputId = btn.dataset.input;
            clearImagePreview(targetPreviewId, targetInputId, targetPreviewId.includes('poster') ? 'poster' : 'cover');
            btn.style.display = 'none';
        });
    });

    if (eventForm) eventForm.addEventListener('submit', handleEventFormSubmit);
    if (clearEventFormBtn) clearEventFormBtn.addEventListener('click', prepareFormForCreate); // Reset form to "Create New" state

    if (logoutButton) logoutButton.addEventListener('click', handleLogout);
    if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);
}

// Helper function for validating image URLs
function isValidImageUrl(url) {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
}


    // --- File Handling ---
    function previewFile(fileInput, imgPreviewElement, type) {
        const file = fileInput.files[0];
        const removeBtn = document.querySelector(`.remove-image-btn[data-target="${imgPreviewElement.id}"]`);
        if (file && imgPreviewElement) {
            if (type === 'poster') selectedPosterFile = file;
            else if (type === 'cover') selectedCoverFile = file;
            const reader = new FileReader();
            reader.onload = (e) => { imgPreviewElement.src = e.target.result; };
            reader.readAsDataURL(file);
            if (removeBtn) removeBtn.style.display = 'inline-block';
        } else if (imgPreviewElement) {
            // Keep existing image if prefilled for edit and user clears input
            // imgPreviewElement.src = type === 'poster' ? 'profile-picture.png' : 'cover-photo.png';
            // if (removeBtn) removeBtn.style.display = 'none';
        }
    }
    function clearImagePreview(previewId, inputId, type) {
        const previewEl = document.getElementById(previewId);
        const inputEl = document.getElementById(inputId);
        if (previewEl) previewEl.src = type === 'poster' ? 'profile-picture.png' : 'cover-photo.png';
        if (inputEl) inputEl.value = ''; // Clear the file input
        if (type === 'poster') selectedPosterFile = null;
        else if (type === 'cover') selectedCoverFile = null;
    }


    // --- Form Submission (Create/Update Event) ---
    async function handleEventFormSubmit(event) {
        event.preventDefault();
        // ... (Validation logic - same as before) ...
        if (!currentUser) { /* ... */ return; }
const requiredFieldsFilled = [eventNameInput, eventDescriptionInput, eventCategoryInput, eventDateInput, eventLocationInput, eventCityInput, eventCountryInput]
  .every(input => input && input.value && input.value.trim() !== '');

        if (!requiredFieldsFilled) {
            displayFormMessage(eventForm, "Please fill in all required fields (*).", "error");
            return;
        }

        clearFormMessage(eventForm);
        setLoadingState(submitEventBtn, true);

        try {
           let posterUrlToSave = null;
if (selectedPosterFile) {
  const filePath = `events/${currentUser.id}/posters/${Date.now()}-${selectedPosterFile.name.replace(/\s+/g, '_')}`;
  const { error } = await supabase.storage.from('event-media').upload(filePath, selectedPosterFile, { upsert: true });
  if (error) throw new Error(`Poster upload failed: ${error.message}`);
  posterUrlToSave = supabase.storage.from('event-media').getPublicUrl(filePath).data.publicUrl;
} else if (eventPosterLinkInput?.value?.trim() !== '') {
  posterUrlToSave = eventPosterLinkInput.value.trim();
} else if (editingEventId) {
  posterUrlToSave = userEventsGrid.querySelector(`.event-card-item[data-event-id="${editingEventId}"] img`)?.src || null;
  if (posterUrlToSave && posterUrlToSave.includes('image-placeholder.png')) posterUrlToSave = null;
}

     let coverUrlToSave = null;
if (selectedCoverFile) {
  const filePath = `events/${currentUser.id}/covers/${Date.now()}-${selectedCoverFile.name.replace(/\s+/g, '_')}`;
  const { error } = await supabase.storage.from('event-media').upload(filePath, selectedCoverFile, { upsert: true });
  if (error) throw new Error(`Cover image upload failed: ${error.message}`);
  coverUrlToSave = supabase.storage.from('event-media').getPublicUrl(filePath).data.publicUrl;
} else if (eventCoverLinkInput?.value?.trim() !== '') {
  coverUrlToSave = eventCoverLinkInput.value.trim();
} else if (editingEventId) {
  const { data } = await supabase.from('events').select('cover_url').eq('id', editingEventId).single();
  coverUrlToSave = data?.cover_url || null;
  if (coverUrlToSave && coverUrlToSave.includes('cover-placeholder.png')) coverUrlToSave = null;
}

            // 1. Upload Poster if a new one is selected
            if (selectedPosterFile) {
                const filePath = `events/${currentUser.id}/posters/${Date.now()}-${selectedPosterFile.name.replace(/\s+/g, '_')}`;
                // If editing and an old poster exists, delete it first (optional, depends on strategy)
                // if (editingEventId && posterUrlToSave && !posterUrlToSave.includes('placeholder')) { await deleteStorageFile(posterUrlToSave); }
                const { error } = await supabase.storage.from('event-media').upload(filePath, selectedPosterFile, { upsert: true });
                if (error) throw new Error(`Poster upload failed: ${error.message}`);
                posterUrlToSave = supabase.storage.from('event-media').getPublicUrl(filePath).data.publicUrl;
            } else if (editingEventId && eventPosterPreview.src.includes('image-placeholder.png')) {
                // If editing and preview is placeholder, means user removed old image without adding new one
                // await deleteStorageFile(posterUrlToSave); // Delete old one from storage
                posterUrlToSave = null;
            }


            // 2. Upload Cover if a new one is selected
            if (selectedCoverFile) {
                const filePath = `events/${currentUser.id}/covers/${Date.now()}-${selectedCoverFile.name.replace(/\s+/g, '_')}`;
                // if (editingEventId && coverUrlToSave && !coverUrlToSave.includes('placeholder')) { await deleteStorageFile(coverUrlToSave); }
                const { error } = await supabase.storage.from('event-media').upload(filePath, selectedCoverFile, { upsert: true });
                if (error) throw new Error(`Cover image upload failed: ${error.message}`);
                coverUrlToSave = supabase.storage.from('event-media').getPublicUrl(filePath).data.publicUrl;
            } else if (editingEventId && eventCoverPreview.src.includes('cover-placeholder.png')) {
                // await deleteStorageFile(coverUrlToSave);
                coverUrlToSave = null;
            }

            // 3. Prepare data for DB
            const eventData = {
                user_id: currentUser.id,
                event_name: eventNameInput.value.trim(),
                // ... (gather all other form data - same as before)
                description: eventDescriptionInput.value.trim(),
                category: eventCategoryInput.value,
                location: eventLocationInput.value.trim(),
                country: eventCountryInput.value,
                city: eventCityInput.value.trim(),
                date: eventDateInput.value,
                start_time: eventStartTimeInput.value || null,
                end_time: eventEndTimeInput.value || null,
                ticket_required: eventTicketRequiredCheckbox.checked,
                ticket_link: eventTicketRequiredCheckbox.checked ? (eventTicketLinkInput.value.trim() || null) : null,
                poster_url: posterUrlToSave,
                cover_url: coverUrlToSave,
                contact_email: document.getElementById('event-contact-email').value.trim() || null,
                phone_number: document.getElementById('event-contact-phone').value.trim() || null,
            };
            if (!editingEventId) { eventData.status = 'pending_review'; } // Set status on create


            // 4. Upsert data
            let savedEvent;
            if (editingEventId) {
                const { data, error } = await supabase.from('events').update(eventData).eq('id', editingEventId).select().single();
                if (error) throw error;
                savedEvent = data;
            } else {
                const { data, error } = await supabase.from('events').insert(eventData).select().single();
                if (error) throw error;
                savedEvent = data;
            }

            console.log("Event saved:", savedEvent);
            const actionText = editingEventId ? 'updated' : 'submitted for review';
            displayFormMessage(eventForm, `Event "${savedEvent.event_name}" ${actionText} successfully!`, "success");
            showToast(`Event "${savedEvent.event_name}" ${actionText} successfully!`, "success");
            // Send EmailJS notification if creating a new event
            if (!editingEventId) {
                const emailParams = {
                    to_email: currentUser.email, // Or eventData.contact_email if preferred
                    user_name: userProfile?.first_name || 'Creator',
                    event_name: savedEvent.event_name,
                    event_date: new Date(savedEvent.date).toLocaleDateString(),
                    status: savedEvent.status,
                    submission_date: new Date().toLocaleDateString()
                };
                emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_EVENT_SUBMIT_TEMPLATE_ID, emailParams)
                    .then(res => console.log("Event submission email sent.", res.status, res.text))
                    .catch(err => console.error("Failed to send event submission email.", err));
            }

            await loadUserEvents();
            if (!editingEventId) { // If creating, clear form for next one
                prepareFormForCreate();
            } else { // If editing, keep form populated but show success
                 if(clearEventFormBtn) clearEventFormBtn.style.display = 'inline-block';
            }


        } catch (error) {
            console.error("Error saving event:", error.message);
            displayFormMessage(eventForm, `Error: ${error.message}`, "error");
            showToast(`Error submitting event: ${error.message}`, "error");
        } finally {
            setLoadingState(submitEventBtn, false);
        }
    }

   // --- Delete Event ---
    async function handleDeleteEvent(eventId, eventName) {
        if (!confirm(`Are you sure you want to delete the event "${eventName}"? This action cannot be undone.`)) {
            return;
        }

        // Add loading state to the specific card's delete button or a general page loader
        try {
            // Optional: Delete associated images from storage first
            const { data: eventToDelete, error: fetchError } = await supabase.from('events').select('poster_url, cover_url').eq('id', eventId).single();
            if (fetchError) console.warn("Could not fetch event details for image deletion:", fetchError.message);

            if (eventToDelete?.poster_url) {
                const posterPath = eventToDelete.poster_url.substring(eventToDelete.poster_url.indexOf('/events/')); // Extract path after bucket name
                await supabase.storage.from('event-media').remove([posterPath.substring(1)]); // Remove leading '/'
            }
            if (eventToDelete?.cover_url) {
                const coverPath = eventToDelete.cover_url.substring(eventToDelete.cover_url.indexOf('/events/'));
                await supabase.storage.from('event-media').remove([coverPath.substring(1)]);
            }


            const { error } = await supabase.from('events').delete().eq('id', eventId);
            if (error) throw error;

            console.log(`Event "${eventName}" deleted.`);
            // Add a success message to the page (not inside a modal)
            // displayPageMessage("Event deleted successfully.", "success");
            alert("Event deleted successfully.");
            await loadUserEvents(); // Refresh list

        } catch (error) {
            console.error("Error deleting event:", error.message);
            // displayPageMessage(`Error deleting event: ${error.message}`, "error");
            alert(`Error deleting event: ${error.message}`);
        }
    }


    // --- Utility Functions ---
    function displayFormMessage(formEl, message, type) {
        const messageEl = formEl.querySelector('.form-message') || document.getElementById('event-form-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `form-message ${type}`;
            messageEl.style.display = message ? 'block' : 'none';
        }
    }
    function clearFormMessage(formEl) {
        const messageEl = formEl.querySelector('.form-message') || document.getElementById('event-form-message');
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.style.display = 'none';
        }
    }
    function setLoadingState(button, isLoading) {
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
    function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}
    function handleLogout() { supabase.auth.signOut().then(() => window.location.replace('signup.html')).catch(console.error); }
    // --- Initialize ---
    initializeEventsPage();
});

 
