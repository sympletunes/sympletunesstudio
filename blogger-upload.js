// js/blogger-upload.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const loadingIndicator = document.getElementById('loading-indicator');
    const bloggerWrapper = document.getElementById('blogger-wrapper');
    const articlesGrid = document.getElementById('user-articles-grid');
    const articlesLoadingMsg = document.getElementById('articles-loading-message');
    const noArticlesMsg = document.getElementById('no-articles-message');

    const articleForm = document.getElementById('news-article-form');
    const articleFormTitleEl = document.getElementById('article-form-title');
    const articleIdInput = document.getElementById('article-id');
    const submitArticleBtn = document.getElementById('submit-article-btn');
    const clearArticleFormBtn = document.getElementById('clear-article-form-btn');
    const formSubmissionMsgGlobal = document.getElementById('form-submission-message'); // General message area for form

    // Key form fields
    const titleInput = document.getElementById('article-title');
    const slugInput = document.getElementById('article-slug');
    const contentInput = document.getElementById('article-content'); // Textarea or Quill editor target
    const coverImageInput = document.getElementById('article-cover-image-input');
    const coverImagePreview = document.getElementById('article-cover-image-preview');
    const removeCoverBtn = document.querySelector('.remove-image-btn[data-target="article-cover-image-preview"]');
    const mediaGalleryInput = document.getElementById('article-media-gallery-input');
    const mediaGalleryPreviewList = document.getElementById('media-gallery-preview-list');
    const attachmentsInput = document.getElementById('article-attachments-input');
    const attachmentsPreviewList = document.getElementById('attachments-preview-list');
    const statusInput = document.getElementById('article-status');
    const publishDateGroup = document.getElementById('publish-date-group');
    const publishDateInput = document.getElementById('article-publish-date');


        // Header elements
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerUsername = document.getElementById('header-username');
    const headerUserEmail = document.getElementById('header-user-email');
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    let currentUser = null;
    let userProfile = null; // Basic profile for header
    let editingArticleId = null;
    let selectedCoverImageFile = null;
    let selectedMediaGalleryFiles = []; // Array for multiple gallery images
    let selectedAttachmentFiles = []; // Array for multiple attachments
    let userIndustryProfile = {}; // TEMPORARY empty fallback


    // EmailJS Config
    const EMAILJS_SERVICE_ID = 'default_service';
    const EMAILJS_ARTICLE_SUBMIT_TEMPLATE_ID = 'template_f0tj972';

    // Quill Editor Instance (Optional)
    // let quillEditor = null;

    // --- Initialization ---
    async function initializeBloggerPage() {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) { window.location.replace('signup.html'); return; }
        currentUser = session.user;

        await fetchHeaderProfileData();
        await loadUserArticles();
        prepareFormForCreate(); // Default to creating a new article

        if (loadingIndicator) loadingIndicator.style.display = 'none';
        if (bloggerWrapper) bloggerWrapper.style.display = 'block';

        setupEventListeners();
        // initializeQuillEditor(); // If using Quill
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

    // --- Load User's Articles ---
    async function loadUserArticles() {
        if (!currentUser) return;
        if (articlesLoadingMsg) articlesLoadingMsg.style.display = 'block';
        if (noArticlesMsg) noArticlesMsg.style.display = 'none';
        if (articlesGrid) articlesGrid.innerHTML = '';

        try {
            const { data: articles, error } = await supabase
                .from('news')
                .select('id, title, summary, cover_image_url, status, publish_date, category, created_at')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            renderArticlesGrid(articles || []);
        } catch (error) {
            console.error("Error fetching articles:", error.message);
            if (articlesGrid) articlesGrid.innerHTML = `<p class="status-message error-message">Could not load your articles: ${error.message}</p>`;
        } finally {
            if (articlesLoadingMsg) articlesLoadingMsg.style.display = 'none';
        }
    }

    function renderArticlesGrid(articles) {
        if (!articlesGrid) return;
        articlesGrid.innerHTML = '';
        if (articles.length === 0 && noArticlesMsg) {
            noArticlesMsg.style.display = 'block';
            return;
        }
        if(noArticlesMsg) noArticlesMsg.style.display = 'none';

        articles.forEach(article => {
            const card = document.createElement('div');
            card.className = 'article-card-item glass-card'; // Use glass-card
            card.dataset.articleId = article.id;
            const publishDate = article.publish_date ? new Date(article.publish_date).toLocaleDateString() : 'Not set';

            card.innerHTML = `
                <div class="article-card-cover">
                    <img src="${article.cover_image_url || 'assets/images/content-placeholder1.jpg'}" alt="${article.title} Cover">
                </div>
                <div class="article-card-info">
                    <h3>${article.title}</h3>
                    <div class="article-card-meta">
                        <span><i class="fas fa-calendar-alt"></i> ${publishDate}</span>
                        ${article.category ? `<span><i class="fas fa-folder-open"></i> ${article.category}</span>` : ''}
                    </div>
                    <p class="article-card-summary">${article.summary || 'No summary available.'}</p>
                    <span class="article-card-status ${article.status.toLowerCase()}">${article.status.charAt(0).toUpperCase() + article.status.slice(1)}</span>
                </div>
                <div class="article-card-actions">
                    <button class="btn-icon edit-article-btn" aria-label="Edit Article"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete-article-btn" aria-label="Delete Article"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            card.querySelector('.edit-article-btn').addEventListener('click', () => prepareFormForEdit(article));
            card.querySelector('.delete-article-btn').addEventListener('click', () => handleDeleteArticle(article.id, article.title));
            articlesGrid.appendChild(card);
        });
    }


    // --- Form State Management ---
    function prepareFormForCreate() {
        editingArticleId = null;
        if(articleFormTitleEl) articleFormTitleEl.textContent = 'Create New Article/News';
        if(articleForm) articleForm.reset();
        // if (quillEditor) quillEditor.setText(''); // Reset Quill editor
        if(articleIdInput) articleIdInput.value = '';
        if(coverImagePreview) coverImagePreview.src = 'profile-picture.png';
        if(removeCoverBtn) removeCoverBtn.style.display = 'none';
        if(mediaGalleryPreviewList) mediaGalleryPreviewList.innerHTML = '<p class="no-files-note">No gallery images selected.</p>';
        if(attachmentsPreviewList) attachmentsPreviewList.innerHTML = '<p class="no-files-note">No attachments selected.</p>';
        selectedCoverImageFile = null;
        selectedMediaGalleryFiles = [];
        selectedAttachmentFiles = [];
        if(statusInput) statusInput.value = 'draft'; // Default status
        togglePublishDateVisibility('draft');
        clearAllFormMessages(articleForm);
if (submitArticleBtn) submitArticleBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Form';
        if(clearArticleFormBtn) clearArticleFormBtn.style.display = 'none';
        window.scrollTo({ top: articleForm.offsetTop - 80, behavior: 'smooth' });
    }

    async function prepareFormForEdit(article) {
        editingArticleId = article.id;
        if(articleFormTitleEl) articleFormTitleEl.textContent = 'Edit Article';
        if(articleForm) articleForm.reset();
        if(articleIdInput) articleIdInput.value = article.id;

        // Pre-fill form (this is extensive, so break it down)
        titleInput.value = article.title || '';
        slugInput.value = article.slug || ''; // Important: slug should ideally not change much once published
        if(document.getElementById('article-subtitle')) document.getElementById('article-subtitle').value = article.subtitle || '';
        if(contentInput) contentInput.value = article.content || ''; // For textarea
        // if (quillEditor) quillEditor.clipboard.dangerouslyPasteHTML(article.content || ''); // For Quill
        if(document.getElementById('article-summary')) document.getElementById('article-summary').value = article.summary || '';
        if(document.getElementById('article-category')) document.getElementById('article-category').value = article.category || '';
        if(document.getElementById('article-tags')) document.getElementById('article-tags').value = (article.tags || []).join(', ');
        if(document.getElementById('article-language')) document.getElementById('article-language').value = article.language || 'en';

        if(coverImagePreview) coverImagePreview.src = article.cover_image_url || 'profile-picture.png';
        if(removeCoverBtn && article.cover_image_url) removeCoverBtn.style.display = 'inline-block'; else if(removeCoverBtn) removeCoverBtn.style.display = 'none';

        // Pre-fill media gallery & attachments (display existing, don't pre-fill file inputs)
        renderExistingFiles(mediaGalleryPreviewList, article.media_gallery || [], 'image');
        renderExistingFiles(attachmentsPreviewList, article.attachments || [], 'attachment');

        if(document.getElementById('article-video-url')) document.getElementById('article-video-url').value = article.video_url || '';
        if(document.getElementById('article-seo-title')) document.getElementById('article-seo-title').value = article.seo_title || '';
        if(document.getElementById('article-seo-description')) document.getElementById('article-seo-description').value = article.seo_description || '';
        if(statusInput) statusInput.value = article.status || 'draft';
        if(document.getElementById('article-is-featured')) document.getElementById('article-is-featured').checked = article.is_featured || false;
        if(publishDateInput) publishDateInput.value = article.publish_date || '';
        if(document.getElementById('article-expire-date')) document.getElementById('article-expire-date').value = article.expire_date || '';
        togglePublishDateVisibility(statusInput.value);

        selectedCoverImageFile = null; // Reset selections
        selectedMediaGalleryFiles = [];
        selectedAttachmentFiles = [];
        clearAllFormMessages(articleForm);
        if(submitArticleBtn) submitArticleBtn.innerHTML = '<i class="fas fa-save"></i> Update Article';
        if(clearArticleFormBtn) clearArticleFormBtn.style.display = 'inline-block';
        window.scrollTo({ top: articleForm.offsetTop - 80, behavior: 'smooth' });
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        if (articleForm) articleForm.addEventListener('submit', handleArticleFormSubmit);
        if (clearArticleFormBtn) clearArticleFormBtn.addEventListener('click', prepareFormForCreate);

        // Slug generation from title
        if (titleInput && slugInput) {
            titleInput.addEventListener('keyup', () => {
                if (!editingArticleId) { // Only auto-generate for new articles
                    slugInput.value = generateSlug(titleInput.value);
                }
            });
        }

        // File input change listeners
        if (coverImageInput) coverImageInput.addEventListener('change', () => previewSingleImage(coverImageInput, coverImagePreview, 'cover_image_file'));
        if (mediaGalleryInput) mediaGalleryInput.addEventListener('change', () => handleMultipleFileSelection(mediaGalleryInput, mediaGalleryPreviewList, 'media_gallery_files'));
        if (attachmentsInput) attachmentsInput.addEventListener('change', () => handleMultipleFileSelection(attachmentsInput, attachmentsPreviewList, 'attachment_files'));
        if (removeCoverBtn) removeCoverBtn.addEventListener('click', () => clearSingleImagePreview(coverImagePreview, coverImageInput, 'cover_image_file'));


        // Status change to toggle publish date visibility
        if (statusInput) {
            statusInput.addEventListener('change', (e) => togglePublishDateVisibility(e.target.value));
        }

        // Logout
        if (logoutButton) logoutButton.addEventListener('click', handleLogout);
        if (mobileLogoutButton) mobileLogoutButton.addEventListener('click', handleLogout);
    }

    function togglePublishDateVisibility(status) {
        if (publishDateGroup) {
            publishDateGroup.style.display = (status === 'published' || status === 'scheduled') ? 'block' : 'none';
            if (status === 'draft' && publishDateInput) {
                // publishDateInput.value = new Date().toISOString().split('T')[0]; // Default to today for draft
            } else if (status === 'published' && publishDateInput && !publishDateInput.value) {
                 publishDateInput.value = new Date().toISOString().split('T')[0]; // Default to today if publishing now
            }
        }
    }

    // --- File Handling ---
    function previewSingleImage(fileInput, imgPreviewElement, fileStateType) {
        const file = fileInput.files[0];
        const removeBtn = document.querySelector(`.remove-image-btn[data-target="${imgPreviewElement.id}"]`);

        if (file && imgPreviewElement) {
            if (fileStateType === 'cover_image_file') selectedCoverImageFile = file;
            // Add for other single file types if needed

            const reader = new FileReader();
            reader.onload = (e) => { imgPreviewElement.src = e.target.result; };
            reader.readAsDataURL(file);
            if(removeBtn) removeBtn.style.display = 'inline-block';
        }
    }
    function clearSingleImagePreview(imgPreviewElement, fileInput, fileStateType) {
        if (imgPreviewElement) imgPreviewElement.src = 'profile-picture.png'; // Or specific placeholder
        if (fileInput) fileInput.value = '';
        if (fileStateType === 'cover_image_file') selectedCoverImageFile = null;
        const removeBtn = document.querySelector(`.remove-image-btn[data-target="${imgPreviewElement.id}"]`);
        if (removeBtn) removeBtn.style.display = 'none';
    }

    function handleMultipleFileSelection(fileInput, previewListElement, fileStateType) {
        if (!fileInput || !previewListElement) return;
        const files = Array.from(fileInput.files);

        if (fileStateType === 'media_gallery_files') selectedMediaGalleryFiles = files;
        else if (fileStateType === 'attachment_files') selectedAttachmentFiles = files;

        previewListElement.innerHTML = ''; // Clear previous new files

        // Optionally show existing files if editing (more complex, requires tracking existing)
        renderExistingFiles(previewListElement, userIndustryProfile ? userIndustryProfile[fileStateType] || [] : [], fileStateType === 'media_gallery_files' ? 'image' : 'attachment', true);


        if (files.length === 0 && !previewListElement.querySelector('.existing-file')) {
            previewListElement.innerHTML = `<p class="no-files-note">No ${fileStateType.includes('gallery') ? 'gallery images' : 'attachments'} selected.</p>`;
            return;
        }

        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-preview-item new-file'; // Mark as new
            const iconClass = file.type.startsWith('image/') ? 'fa-file-image' : (file.type === 'application/pdf' ? 'fa-file-pdf' : 'fa-file');
            item.innerHTML = `
                <div class="file-info">
                    <i class="fas ${iconClass} file-icon"></i>
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">(${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                </div>
                <button type="button" class="remove-file-btn" data-type="${fileStateType}" data-index="${index}" aria-label="Remove file">×</button>
            `;
            item.querySelector('.remove-file-btn').addEventListener('click', (e) => removeNewlySelectedMultipleFile(e.target.dataset.type, e.target.dataset.index));
            previewListElement.appendChild(item);
        });
    }

    function removeNewlySelectedMultipleFile(fileStateType, indexToRemove) {
        indexToRemove = parseInt(indexToRemove, 10);
        if (fileStateType === 'media_gallery_files') {
            selectedMediaGalleryFiles.splice(indexToRemove, 1);
            handleMultipleFileSelection(mediaGalleryInput, mediaGalleryPreviewList, 'media_gallery_files'); // Re-render
        } else if (fileStateType === 'attachment_files') {
            selectedAttachmentFiles.splice(indexToRemove, 1);
            handleMultipleFileSelection(attachmentsInput, attachmentsPreviewList, 'attachment_files'); // Re-render
        }
        // To fully remove from input type=file multiple, we'd clear and ask user to reselect remaining.
        // For now, selected...Files array is the source of truth for new uploads.
    }

    function renderExistingFiles(previewListElement, fileUrls, type, isEditing = false) {
        if(!isEditing) previewListElement.innerHTML = ''; // Clear if not in edit mode prefill

        if (!fileUrls || fileUrls.length === 0) {
            if(!previewListElement.querySelector('.new-file')) { // Only show if no new files either
                previewListElement.innerHTML = `<p class="no-files-note">No existing ${type === 'image' ? 'gallery images' : 'attachments'}.</p>`;
            }
            return;
        }

        fileUrls.forEach(url => {
            const fileName = decodeURIComponent(url.substring(url.lastIndexOf('/') + 1).split('?')[0]); // Basic name extraction
            const item = document.createElement('div');
            item.className = 'file-preview-item existing-file';
            const iconClass = type === 'image' ? 'fa-file-image' : 'fa-file-alt';
             item.innerHTML = `
                <div class="file-info">
                    <i class="fas ${iconClass} file-icon"></i>
                    <span class="file-name">${fileName}</span>
                     <a href="${url}" target="_blank" class="view-file-link">(View)</a>
                </div>
                ${isEditing ? '<span class="file-note">Previously uploaded</span>' : ''}
                <!-- Add a delete button for existing files if edit mode allows removal -->
            `;
            previewListElement.appendChild(item);
        });
    }


    // --- Slug Generation ---
    function generateSlug(text) {
        if (!text) return '';
        return text.toString().toLowerCase().trim()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    // --- Form Validation (Client-side) ---
    function validateArticleForm() {
        clearAllFormMessages(articleForm);
        let isValid = true;
        const fieldError = (fieldId, message) => { /* ... same as artist profile ... */ displayMessage(articleForm,message,'error', fieldId); isValid = false; };

        if (!titleInput.value.trim()) fieldError('article-title', 'Title is required.');
        if (!slugInput.value.trim()) fieldError('article-slug', 'Slug is required.');
        else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugInput.value)) fieldError('article-slug', 'Slug must be lowercase, alphanumeric with hyphens.');

        const contentValue = contentInput.value.trim(); // For Quill: quillEditor.getText().trim();
        if (!contentValue || contentValue.length < 50) fieldError('article-content', 'Main content is required (min 50 characters).');

        if (statusInput.value === 'published' || statusInput.value === 'scheduled') {
            if (!publishDateInput.value) fieldError('article-publish-date', 'Publish date is required for published/scheduled articles.');
        }
        // Add more validations (SEO length, URL formats, etc.)

        return isValid;
    }


    // --- Form Submission ---
   async function isSlugTaken(slug) {
    const { data, error } = await supabase
        .from('news')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
    return data !== null;
}

async function handleArticleFormSubmit(event) {
    event.preventDefault();

    if (!currentUser) {
        displayMessage(articleForm, "Authentication error.", "error", "form-submission-message");
        return;
    }

    if (!validateArticleForm()) {
        displayMessage(articleForm, "Please correct the errors above.", "error", "form-submission-message");
        return;
    }

    setLoadingState(submitArticleBtn, true);
    displayMessage(articleForm, "Submitting article...", "info", "form-submission-message");

    try {
        const formData = new FormData(articleForm);
        const slug = formData.get('slug');

        // ✅ Slug uniqueness check
        if (!editingArticleId && await isSlugTaken(slug)) {
            displayMessage(articleForm, "This slug is already used. Please choose a different one.", "error", "form-submission-message");
            setLoadingState(submitArticleBtn, false);
            return;
        }

        // --- 1. Upload Cover Image ---
        let finalCoverImageUrl = null;
        if (selectedCoverImageFile) {
            const file = selectedCoverImageFile;
            const filePath = `news-media/${currentUser.id}/covers/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const { error } = await supabase.storage.from('news-media').upload(filePath, file, { upsert: true });
            if (error) throw new Error(`Cover image upload failed: ${error.message}`);
            finalCoverImageUrl = supabase.storage.from('news-media').getPublicUrl(filePath).data.publicUrl;
        }

        // --- 2. Upload Media Gallery Files ---
        let finalMediaGalleryUrls = [];
        for (const file of selectedMediaGalleryFiles) {
            const filePath = `news-media/${currentUser.id}/gallery/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const { error } = await supabase.storage.from('news-media').upload(filePath, file);
            if (!error) finalMediaGalleryUrls.push(supabase.storage.from('news-media').getPublicUrl(filePath).data.publicUrl);
        }

        // --- 3. Upload Attachments ---
        let finalAttachmentUrls = [];
        for (const file of selectedAttachmentFiles) {
            const filePath = `news-media/${currentUser.id}/attachments/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
            const { error } = await supabase.storage.from('news-media').upload(filePath, file);
            if (!error) finalAttachmentUrls.push(supabase.storage.from('news-media').getPublicUrl(filePath).data.publicUrl);
        }

        // --- 4. Prepare article data ---
        const articleData = {
            user_id: currentUser.id,
            title: formData.get('title'),
            subtitle: formData.get('subtitle') || null,
            content: formData.get('content'),
            summary: formData.get('summary') || null,
            category: formData.get('category') || null,
            tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean) : null,
            slug,
            language: formData.get('language') || 'en',
            cover_image_url: finalCoverImageUrl,
            media_gallery: finalMediaGalleryUrls.length > 0 ? finalMediaGalleryUrls : null,
            video_url: formData.get('video_url') || null,
            attachments: finalAttachmentUrls.length > 0 ? finalAttachmentUrls : null,
            seo_title: formData.get('seo_title') || null,
            seo_description: formData.get('seo_description') || null,
            status: formData.get('status'),
            is_featured: formData.get('is_featured') === 'on',
            publish_date: formData.get('publish_date') || new Date().toISOString().split('T')[0],
            expire_date: formData.get('expire_date') || null,
            updated_at: new Date().toISOString()
        };

        if (!editingArticleId) {
            articleData.created_at = new Date().toISOString();
        }

        // --- 5. Submit to Supabase ---
        let savedArticle;
        if (editingArticleId) {
            const { data, error } = await supabase
                .from('news')
                .update(articleData)
                .eq('id', editingArticleId)
                .select()
                .single();
            if (error) throw error;
            savedArticle = data;
        } else {
            const { data, error } = await supabase
                .from('news')
                .insert(articleData)
                .select()
                .single();
            if (error) {
                if (error.code === '23505' && error.message.includes('slug')) {
                    throw new Error('This slug is already in use. Please choose a different one.');
                }
                throw error;
            }
            savedArticle = data;
        }

        console.log("Article saved:", savedArticle);
        showToastNotification(`Article "${savedArticle.title}" ${editingArticleId ? 'updated' : 'submitted'} successfully!`, "success");
alert(`The article titled "${savedArticle.title}" has been saved and submitted for review.`);


        // --- 6. Email Notification (optional) ---
        if (!editingArticleId) {
            const emailParams = {
                to_email: currentUser.email,
                user_name: userProfile?.first_name || 'Blogger',
                article_title: savedArticle.title,
                article_status: savedArticle.status,
                submission_date: new Date().toLocaleDateString()
            };
 try {
    const res = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_ARTICLE_SUBMIT_TEMPLATE_ID, emailParams);
    console.log("Article submission email sent.", res.status);
alert("✅ Confirmation email has been sent to your inbox.");
} catch (err) {
    console.error("Failed to send article submission email.", err);
    showToastNotification("Failed to send confirmation email.", "error");
}


        }

       await loadUserArticles();

if (!editingArticleId) {
    // Delay form reset to let success message be seen
    setTimeout(() => {
        prepareFormForCreate();
    }, 3000); // 3-second delay
} else {
    if (clearArticleFormBtn) clearArticleFormBtn.style.display = 'inline-block';
}


    } catch (error) {
        console.error("Error submitting article:", error.message);
        displayMessage(articleForm, `Error: ${error.message}`, "error", "form-submission-message");
    } finally {
        setLoadingState(submitArticleBtn, false);
    }
}
function setLoadingState(button, isLoading) {
    const spinner = document.getElementById('submit-spinner');
    const btnText = button.querySelector('.btn-text');

    if (isLoading) {
        button.disabled = true;
        if (spinner) spinner.style.display = 'inline-block';
        if (btnText) btnText.style.opacity = 0.6;
    } else {
        button.disabled = false;
        if (spinner) spinner.style.display = 'none';
        if (btnText) btnText.style.opacity = 1;
    }
}

function displayMessage(formEl, message, type = "info", targetId = "form-submission-message") {
    const target = document.getElementById(targetId);
    if (!target) return;

    target.textContent = message;
    target.className = `form-feedback-message ${type}`;
    target.style.display = "block";

    // Optional: auto-hide after 6 seconds
    setTimeout(() => {
        target.style.display = "none";
    }, 6000);
}

    async function deleteStorageFile(fileUrl, bucketName) {
        if (!fileUrl) return;
        try {
            const filePath = fileUrl.substring(fileUrl.indexOf(`/${bucketName}/`) + `/${bucketName}/`.length);
            console.log("Attempting to delete from storage:", bucketName, filePath);
            const { error } = await supabase.storage.from(bucketName).remove([filePath]);
            if (error) console.warn(`Could not delete ${filePath} from ${bucketName}:`, error.message);
        } catch (e) {
            console.warn(`Error parsing URL for deletion: ${fileUrl}`, e);
        }
    }
async function isSlugTaken(slug) {
  const { data, error } = await supabase
    .from('news')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  return data !== null;
}


    // --- Delete Article ---
    async function handleDeleteArticle(articleId, articleTitle) {
        if (!confirm(`Are you sure you want to delete the article "${articleTitle}"? This will also remove associated media.`)) {
            return;
        }
        // Add loading state to delete button or globally
        try {
            // 1. Fetch media URLs to delete from storage
            const { data: articleToDelete, error: fetchError } = await supabase
                .from('news')
                .select('cover_image_url, media_gallery, attachments')
                .eq('id', articleId)
                .single();

            if (fetchError) throw new Error(`Could not fetch article details for deletion: ${fetchError.message}`);

            // 2. Delete files from storage
            if (articleToDelete) {
                if (articleToDelete.cover_image_url) await deleteStorageFile(articleToDelete.cover_image_url, 'news-media');
                if (articleToDelete.media_gallery && articleToDelete.media_gallery.length > 0) {
                    for (const url of articleToDelete.media_gallery) { await deleteStorageFile(url, 'news-media'); }
                }
                if (articleToDelete.attachments && articleToDelete.attachments.length > 0) {
                    for (const url of articleToDelete.attachments) { await deleteStorageFile(url, 'news-media'); }
                }
            }

            // 3. Delete article record from database
            const { error: deleteError } = await supabase.from('news').delete().eq('id', articleId);
            if (deleteError) throw deleteError;

            showToastNotification(`Article "${articleTitle}" deleted successfully.`, "success");
            await loadUserArticles();
            if (editingArticleId === articleId) prepareFormForCreate(); // If deleted article was in edit form, reset form

        } catch (error) {
            console.error("Error deleting article:", error.message);
            showToastNotification(`Error deleting article: ${error.message}`, "error");
        }
    }


    // --- Toast Notification ---
    const toastNotification = document.getElementById('toast-notification');
    const toastMessageEl = toastNotification?.querySelector('.toast-message');
    const toastIconEl = toastNotification?.querySelector('.toast-icon i');
    const toastCloseBtn = toastNotification?.querySelector('.toast-close-btn');

    function showToastNotification(message, type = 'info') { // type: info, success, error
        if (!toastNotification || !toastMessageEl || !toastIconEl) return;

        toastMessageEl.textContent = message;
        toastNotification.className = `toast show ${type}`; // Remove old type, add new
        toastIconEl.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`;

        // Auto-hide after some time
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 5000);
    }
    if (toastCloseBtn) {
        toastCloseBtn.addEventListener('click', () => toastNotification.classList.remove('show'));
    }

    // --- Utility Functions ---
    function displayMessage(formEl, message, type, msgId) { /* ... */ }
    function clearAllFormMessages(formEl) { /* ... */ }
    function setLoadingState(button, isLoading) { /* ... */ }
    function handleLogout() { /* ... */ }


    // --- Initialize ---
    initializeBloggerPage();
});