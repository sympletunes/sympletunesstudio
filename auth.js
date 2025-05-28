// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    if (typeof emailjs !== 'undefined') {
        emailjs.init({
            publicKey: "dUczuus9AeyI36X1K"
        });
    }
    
    // --- DOM Element Selection ---
    const welcomeStep = document.getElementById('welcome-step');
    const reasonStep = document.getElementById('reason-step');
    const profileDetailsStep = document.getElementById('profile-details-step');
    const emailOtpStep = document.getElementById('email-otp-step');
    const createPasswordStep = document.getElementById('create-password-step');
    const pictureUploadStep = document.getElementById('picture-upload-step');
    const onboardingFooter = document.getElementById('onboarding-process-footer');
    const currentStepDisplay = document.getElementById('current-step-number');
    const totalStepDisplay = document.getElementById('total-step-number');

    const signupFirstNameInput = document.getElementById('signup-first-name');
    const signupLastNameInput = document.getElementById('signup-last-name');
    const signupMiddleNameInput = document.getElementById('signup-middle-name');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPhoneNumberInput = document.getElementById('signup-phone-number');
    const signupDobInput = document.getElementById('signup-dob');
    const signupGenderInput = document.getElementById('signup-gender');
    const signupNationalityInput = document.getElementById('signup-nationality');
    const signupCountryInput = document.getElementById('signup-country');
    const signupCityInput = document.getElementById('signup-city');
    const signupStateInput = document.getElementById('signup-state');
    const signupPostalCodeInput = document.getElementById('signup-postal-code');
    const signupDigitalAddressInput = document.getElementById('signup-digital-address');
    const signupNewPasswordInput = document.getElementById('signup-new-password');
    const signupConfirmNewPasswordInput = document.getElementById('signup-confirm-new-password');
    const otpInput = document.getElementById('otp-input');
    const showCreateAccountBtn = document.getElementById('show-create-account-reason');
    const roleCards = document.querySelectorAll('.role-card');
    const prevStepButtons = document.querySelectorAll('.prev-step');
    const signupProfileForm = document.getElementById('signup-profile-form');
    const otpVerificationForm = document.getElementById('otp-verification-form');
    const resendOtpButton = document.getElementById('resend-otp-button');
    const changeEmailButton = document.getElementById('change-email-button');
    const createPasswordForm = document.getElementById('create-password-form');
    const pictureUploadForm = document.getElementById('picture-upload-form');
    const profilePicInput = document.getElementById('signup-profile-pic-input');
    const coverPicInput = document.getElementById('signup-cover-pic-input');
    const profilePicImgPreview = document.getElementById('profile-pic-img-preview');
    const coverPicImgPreview = document.getElementById('cover-pic-img-preview');
    const skipPicturesButton = document.getElementById('skip-pictures-button');
    const otpEmailDisplay = document.getElementById('otp-email-display');
    const signInFormOnboard = document.getElementById('signin-form-onboard');
    const selectedRoleTitle = document.getElementById('selected-role-title');
    const selectedRoleInput = document.getElementById('selected-role-input');


    let currentStepId = 'welcome-step';
    let signupData = { role: '', emailVerifiedClientSide: false };
    let generatedOtp = '';
    const totalSignupSteps = 5;

    const EMAILJS_SERVICE_ID = 'default_service';
    const EMAILJS_TEMPLATE_ID = 'template_06iydaq';

    // --- Helper Functions ---
    function navigateToStep(stepId) {
        document.querySelectorAll('.onboarding-step').forEach(step => {
            step.classList.remove('active-step');
            step.style.display = 'none';
        });
        const targetStep = document.getElementById(stepId);
        if (targetStep) {
            targetStep.classList.add('active-step');
            targetStep.style.display = 'block';
            currentStepId = stepId;
            updateStepIndicator();
            if (targetStep.querySelector('form')) {
                clearAllFormMessages(targetStep.querySelector('form'));
                targetStep.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
            }
        } else {
            console.error("Target step not found:", stepId);
        }
    }

    function updateStepIndicator() {
        let stepNumber = 0;
        switch (currentStepId) {
            case 'reason-step': stepNumber = 1; break;
            case 'profile-details-step': stepNumber = 2; break;
            case 'email-otp-step': stepNumber = 3; break;
            case 'create-password-step': stepNumber = 4; break;
            case 'picture-upload-step': stepNumber = 5; break;
            default: stepNumber = 0;
        }
        if (currentStepDisplay) currentStepDisplay.textContent = stepNumber;
        if (totalStepDisplay) totalStepDisplay.textContent = totalSignupSteps;
        if (onboardingFooter) {
            onboardingFooter.style.display = (stepNumber > 0 && currentStepId !== 'welcome-step') ? 'flex' : 'none';
        }
        if (currentStepId === 'welcome-step') {
            if (onboardingFooter) onboardingFooter.style.display = 'none';
        }
    }

    function displayMessage(formElement, message, type = 'error', fieldId = null, isGeneralFormMessage = false) {
        const messageEl = document.createElement('p');
        messageEl.className = `form-message ${type}`;
        messageEl.textContent = message;

        if (fieldId) {
            const field = document.getElementById(fieldId);
            const parentElement = field?.parentElement;
            const existingMsg = parentElement?.querySelector(`#msg-for-${fieldId}`);
            if (existingMsg) existingMsg.remove();
            messageEl.id = `msg-for-${fieldId}`;
            if (field) field.insertAdjacentElement('afterend', messageEl);
            else if (parentElement) parentElement.prepend(messageEl);
            else if (formElement) formElement.prepend(messageEl);
            if (type === 'error' && field) field.classList.add('input-error');
        } else if (formElement) {
            const existingGeneralMsg = formElement.querySelector('.form-message:not([id^="msg-for-"])');
            if (existingGeneralMsg) existingGeneralMsg.remove();
            formElement.prepend(messageEl);
        }
    }

    function clearFieldMessage(fieldId) {
        const field = document.getElementById(fieldId);
        if (field) field.classList.remove('input-error');
        const existingMsg = document.getElementById(`msg-for-${fieldId}`);
        if (existingMsg) existingMsg.remove();
    }

    function clearAllFormMessages(formElement) {
        if (!formElement) return;
        formElement.querySelectorAll('.form-message').forEach(msg => msg.remove());
        formElement.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    }

    function setLoadingState(button, isLoading, buttonText = null) {
        if (!button) return;
        if (isLoading) {
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.innerHTML;
            }
            button.innerHTML = `<span class="spinner-dual-ring"></span> ${buttonText || 'Loading...'}`;
            button.disabled = true;
        } else {
            if (button.dataset.originalText) {
                button.innerHTML = button.dataset.originalText;
            }
            button.disabled = false;
        }
    }

    // --- Validation Functions ---
    function isValidEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
    function isValidPhoneNumber(phone) { return /^\+[1-9]\d{1,14}$/.test(phone); }
    function isValidDOB(dobString) {
        if (!dobString) return false;
        const dob = new Date(dobString);
        if (isNaN(dob.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
        return age >= 13;
    }
    function isValidPassword(password) { return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/.test(password); }
    function isValidPostalCode(postalCode, country) {
        if (country === 'US') return /^\d{5}(-\d{4})?$/.test(postalCode);
        return postalCode.trim() !== '';
    }
    function isValidDigitalAddress(digitalAddress, country) {
        if (country === 'GH') return /^[A-Z]{2}-\d{1,4}-\d{1,4}$/i.test(digitalAddress);
        return true;
    }

    function validateAndHighlight(inputElement, validationFn, errorMessage, ...args) {
        const value = inputElement.value;
        clearFieldMessage(inputElement.id);
        if (!validationFn(value, ...args)) {
            displayMessage(inputElement.form, errorMessage, 'error', inputElement.id);
            return false;
        }
        return true;
    }
    
    function validateRequiredField(inputElement, fieldName) {
        clearFieldMessage(inputElement.id);
        if (!inputElement.value.trim()) {
            displayMessage(inputElement.form, `${fieldName} is required.`, 'error', inputElement.id);
            return false;
        }
        return true;
    }

    function validateProfileDetailsForm() {
        clearAllFormMessages(signupProfileForm);
        let isValid = true;
        let firstInvalidField = null;
        const checkAndSetFirstInvalid = (field, condition) => {
            if (!condition && !firstInvalidField) firstInvalidField = field;
            return condition;
        };

        isValid = checkAndSetFirstInvalid(signupFirstNameInput, validateRequiredField(signupFirstNameInput, 'First Name')) && isValid;
        isValid = checkAndSetFirstInvalid(signupLastNameInput, validateRequiredField(signupLastNameInput, 'Last Name')) && isValid;
        isValid = checkAndSetFirstInvalid(signupNationalityInput, validateRequiredField(signupNationalityInput, 'Nationality')) && isValid;
        isValid = checkAndSetFirstInvalid(signupCityInput, validateRequiredField(signupCityInput, 'City')) && isValid;

        isValid = checkAndSetFirstInvalid(signupEmailInput, validateRequiredField(signupEmailInput, 'Email Address')) && isValid;
        if (signupEmailInput.value.trim()) {
            isValid = checkAndSetFirstInvalid(signupEmailInput, validateAndHighlight(signupEmailInput, isValidEmail, 'Please enter a valid email address (e.g., you@example.com).')) && isValid;
        }
        
        isValid = checkAndSetFirstInvalid(signupPhoneNumberInput, validateRequiredField(signupPhoneNumberInput, 'Phone Number')) && isValid;
        if (signupPhoneNumberInput.value.trim()) {
            isValid = checkAndSetFirstInvalid(signupPhoneNumberInput, validateAndHighlight(signupPhoneNumberInput, isValidPhoneNumber, 'Please enter a valid phone number with country code (e.g., +1234567890).')) && isValid;
        }

        isValid = checkAndSetFirstInvalid(signupDobInput, validateRequiredField(signupDobInput, 'Date of Birth')) && isValid;
        if (signupDobInput.value) {
            isValid = checkAndSetFirstInvalid(signupDobInput, validateAndHighlight(signupDobInput, isValidDOB, 'You must be at least 13 years old and enter a valid date.')) && isValid;
        }

        isValid = checkAndSetFirstInvalid(signupGenderInput, validateRequiredField(signupGenderInput, 'Gender')) && isValid;
        isValid = checkAndSetFirstInvalid(signupCountryInput, validateRequiredField(signupCountryInput, 'Country of Residence')) && isValid;
        isValid = checkAndSetFirstInvalid(signupPostalCodeInput, validateRequiredField(signupPostalCodeInput, 'Postal Code')) && isValid;
        if (signupPostalCodeInput.value.trim()) {
             isValid = checkAndSetFirstInvalid(signupPostalCodeInput, validateAndHighlight(signupPostalCodeInput, isValidPostalCode, 'Please enter a valid postal code.', signupCountryInput.value)) && isValid;
        }

        const digitalAddressValue = signupDigitalAddressInput.value.trim();
        if (signupCountryInput.value === 'GH') {
            isValid = checkAndSetFirstInvalid(signupDigitalAddressInput, validateRequiredField(signupDigitalAddressInput, 'Digital Address (GhanaPost GPS)')) && isValid;
            if (digitalAddressValue) {
                 isValid = checkAndSetFirstInvalid(signupDigitalAddressInput, validateAndHighlight(signupDigitalAddressInput, isValidDigitalAddress, 'Please enter a valid GhanaPost GPS digital address (e.g., GA-123-4567).', 'GH')) && isValid;
            }
        } else if (digitalAddressValue && !isValidDigitalAddress(digitalAddressValue, signupCountryInput.value)) {
            displayMessage(signupProfileForm, 'The digital address format is not recognized for the selected country.', 'error', 'signup-digital-address');
            isValid = false;
            if (!firstInvalidField) firstInvalidField = signupDigitalAddressInput;
        } else {
            clearFieldMessage('signup-digital-address');
        }

        if (!isValid && firstInvalidField) {
            displayMessage(signupProfileForm, 'Please correct the highlighted errors and fill all required fields.', 'error', null, true);
            firstInvalidField.focus();
        } else if (!isValid) {
            displayMessage(signupProfileForm, 'Please fill all required fields and correct any errors.', 'error', null, true);
        }
        return isValid;
    }

    // --- OTP Client-Side Functions ---
    function generateOtpClientSide(length = 6) {
        const digits = '0123456789';
        let OTP = '';
        for (let i = 0; i < length; i++) OTP += digits[Math.floor(Math.random() * 10)];
        return OTP;
    }

    async function sendOtpViaEmailJS(recipientEmail, otp) {
        const templateParams = { email: recipientEmail, otp_code: otp };
        try {
            if (typeof emailjs === 'undefined') { console.error('EmailJS SDK not loaded.'); return false; }
            const response = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams);
            console.log('EmailJS SUCCESS!', response.status, response.text);
            return true;
        } catch (error) {
            console.error('EmailJS FAILED...', error);
            return false;
        }
    }

    // --- Event Listeners ---
    if (showCreateAccountBtn) {
        showCreateAccountBtn.addEventListener('click', () => navigateToStep('reason-step'));
    }

    roleCards.forEach(card => {
        card.addEventListener('click', () => {
            signupData.role = card.dataset.role;
            if(selectedRoleTitle) selectedRoleTitle.textContent = card.querySelector('span').textContent;
            if(selectedRoleInput) selectedRoleInput.value = signupData.role;
            navigateToStep('profile-details-step');
        });
    });

    prevStepButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetStepId = button.dataset.targetStep;
            navigateToStep(targetStepId);
        });
    });

    if (signInFormOnboard) {
        signInFormOnboard.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllFormMessages(signInFormOnboard);
            const email = document.getElementById('onboard-signin-email').value;
            const password = document.getElementById('onboard-signin-password').value;
            const submitButton = signInFormOnboard.querySelector('button[type="submit"]');
            setLoadingState(submitButton, true, 'Signing In...');
            try {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error?.message?.toLowerCase().includes("invalid login credentials")) {
                    displayMessage(signInFormOnboard, "Invalid email or password. Please try again.", "error", null, true);
                    return;
                }
                                if (data.user) window.location.href = 'dashboard.html';
                else displayMessage(signInFormOnboard, 'Sign in failed. Please check your credentials.');
            } catch (error) {
                console.error('Sign In Error:', error);
                displayMessage(signInFormOnboard, error.message || 'Sign in failed. Please try again.');
            } finally {
                setLoadingState(submitButton, false);
            }
        });
    }

    if (signupProfileForm) {
        signupProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateProfileDetailsForm()) return;
            const formData = new FormData(signupProfileForm);
            const formProps = Object.fromEntries(formData);
            signupData = { ...signupData, ...formProps, emailVerifiedClientSide: false };
            const submitButton = signupProfileForm.querySelector('button[type="submit"]');
            setLoadingState(submitButton, true, 'Sending OTP...');
            generatedOtp = generateOtpClientSide();
            // console.log("Client Generated OTP (for testing):", generatedOtp); // REMOVED
            const emailSent = await sendOtpViaEmailJS(signupData.email, generatedOtp);
            setLoadingState(submitButton, false);
            if (emailSent) {
                if (otpEmailDisplay) otpEmailDisplay.textContent = signupData.email;
                navigateToStep('email-otp-step');
            } else {
                displayMessage(signupProfileForm, 'Could not send OTP email. Please try again or check your email address.', 'error', null, true);
            }
        });
    }

    if (otpVerificationForm) {
        otpVerificationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllFormMessages(otpVerificationForm);
            const enteredOtp = otpInput.value;
            if (!enteredOtp || enteredOtp.length !== 6 || !/^\d{6}$/.test(enteredOtp)) {
                displayMessage(otpVerificationForm, 'Please enter a valid 6-digit OTP.', 'error', 'otp-input');
                otpInput.classList.add('input-error');
                otpInput.focus();
                return;
            }
            otpInput.classList.remove('input-error');
            const submitButton = otpVerificationForm.querySelector('button[type="submit"]');
            setLoadingState(submitButton, true, 'Verifying...');
            if (enteredOtp === generatedOtp) {
                signupData.emailVerifiedClientSide = true;
                navigateToStep('create-password-step');
            } else {
                otpInput.value = '';
                displayMessage(otpVerificationForm, 'Invalid or expired OTP. Please try again.', 'error', 'otp-input');
                otpInput.classList.add('input-error');
                otpInput.focus();
            }
            setLoadingState(submitButton, false);
        });
    }

    if (resendOtpButton) {
        resendOtpButton.addEventListener('click', async () => {
            clearAllFormMessages(otpVerificationForm);
            setLoadingState(resendOtpButton, true, 'Resending...');
            generatedOtp = generateOtpClientSide();
            // console.log("Client Resent OTP (for testing):", generatedOtp); // REMOVED
            const emailSent = await sendOtpViaEmailJS(signupData.email, generatedOtp);
            setLoadingState(resendOtpButton, false);
            if (emailSent) displayMessage(otpVerificationForm, 'New OTP sent to ' + signupData.email, 'success');
            else displayMessage(otpVerificationForm, 'Could not resend OTP.');
        });
    }

    if (changeEmailButton) {
        changeEmailButton.addEventListener('click', () => {
            signupData.emailVerifiedClientSide = false;
            generatedOtp = '';
            navigateToStep('profile-details-step');
        });
    }

    if (createPasswordForm) {
        createPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAllFormMessages(createPasswordForm);
            let isValid = true;
            let firstInvalidField = null;
            const password = signupNewPasswordInput.value;
            const confirmPassword = signupConfirmNewPasswordInput.value;

            if (!signupData.emailVerifiedClientSide) {
                displayMessage(createPasswordForm, 'Email not verified. Please complete OTP step first.', 'error', null, true);
                return;
            }

            if (!password) {
                displayMessage(createPasswordForm, 'New Password is required.', 'error', 'signup-new-password');
                isValid = false; if (!firstInvalidField) firstInvalidField = signupNewPasswordInput;
            } else if (!isValidPassword(password)) {
                displayMessage(createPasswordForm, 'Password must be 8+ chars, upper, lower, num, symbol.', 'error', 'signup-new-password');
                isValid = false; if (!firstInvalidField) firstInvalidField = signupNewPasswordInput;
            } else {
                clearFieldMessage('signup-new-password');
            }

            if (!confirmPassword) {
                displayMessage(createPasswordForm, 'Confirm New Password is required.', 'error', 'signup-confirm-new-password');
                isValid = false; if (!firstInvalidField) firstInvalidField = signupConfirmNewPasswordInput;
            } else if (password && password !== confirmPassword) {
                displayMessage(createPasswordForm, 'Passwords do not match.', 'error', 'signup-confirm-new-password');
                isValid = false; if (!firstInvalidField) firstInvalidField = signupConfirmNewPasswordInput;
            } else if (password && password === confirmPassword) {
                 clearFieldMessage('signup-confirm-new-password');
            }

            if (!isValid) {
                if (firstInvalidField) firstInvalidField.focus();
                return;
            }

            const submitButton = createPasswordForm.querySelector('button[type="submit"]');
            setLoadingState(submitButton, true, 'Creating Account...');
            try {
                const { data: authData, error: signUpError } = await supabase.auth.signUp({
                    email: signupData.email,
                    password: password,
                    options: {
                        data: {
                            full_name: `${signupData.first_name || ''} ${signupData.last_name || ''}`.trim(),
                            initial_role: signupData.role,
                        }
                    }
                });
                if (signUpError) {
                    if (signUpError.message.toLowerCase().includes("user already registered")) {
                         displayMessage(createPasswordForm, "This email is already registered. Please sign in or use a different email.", 'error', null, true);
                    } else if (signUpError.message.toLowerCase().includes("rate limit exceeded")) {
                         displayMessage(createPasswordForm, "Too many attempts. Please try again later.", 'error', null, true);
                    } else {
                        throw signUpError;
                    }
                    return;
                }
                if (!authData.user) throw new Error("User registration failed, user data not returned from Supabase.");
                signupData.userId = authData.user.id;
                if (authData.session) console.log("Supabase session established after signUp.");
                else console.warn("Supabase session NOT established. 'Confirm Email' might be ON in Supabase settings.");
                navigateToStep('picture-upload-step');
            } catch (error) {
                console.error('Account Creation Error:', error);
                displayMessage(createPasswordForm, error.message || 'Could not create account.', 'error', null, true);
            } finally {
                setLoadingState(submitButton, false);
            }
        });
    }

    if (pictureUploadForm) {
        const handlePictureSubmit = async (skipPictures = false) => {
            const completeButton = document.getElementById('complete-onboarding-button');
            const skipBtn = skipPicturesButton; // Renamed to avoid conflict
            setLoadingState(completeButton, true, 'Saving Profile...');
            if (skipBtn) setLoadingState(skipBtn, true, 'Skipping...');
            clearAllFormMessages(pictureUploadForm);
            let profilePicUrl = null;
            let coverPicUrl = null;

            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                let userIdToUse = user ? user.id : signupData.userId;

                if (userError && !signupData.userId) { // If getUser fails AND we don't have stored userId
                     console.error("User session error and no stored userId:", userError);
                     displayMessage(pictureUploadForm, "User session/ID not found. Cannot save profile. Please try signing in or restarting signup.", 'error');
                     navigateToStep('welcome-step');
                     if (skipBtn) setLoadingState(skipBtn, false); // Reset skip button too
                     setLoadingState(completeButton, false);
                     return;
                }
                if (!userIdToUse && signupData.userId) { // Fallback to stored userId if getUser fails but we have one
                    console.warn("No active Supabase session, but proceeding with stored userId:", signupData.userId);
                    userIdToUse = signupData.userId;
                }
                if (!userIdToUse) { // Final check
                    displayMessage(pictureUploadForm, "User ID is missing. Cannot save profile.", 'error');
                    if (skipBtn) setLoadingState(skipBtn, false);
                    setLoadingState(completeButton, false);
                    return;
                }

             if (!skipPictures && profilePicInput.files[0]) {
    const profileFile = profilePicInput.files[0];
    const profileFileName = `public/${userIdToUse}/profile-${Date.now()}-${profileFile.name.replace(/\s+/g, '_')}`;
    const { data: uploadDataP, error: uploadErrorP } = await supabase.storage
        .from('profile-pics').upload(profileFileName, profileFile, { upsert: true });
    if (uploadErrorP) throw new Error(`Profile pic upload: ${uploadErrorP.message}`);
    const { data: urlDataP } = supabase.storage.from('profile-pics').getPublicUrl(uploadDataP.path);
    profilePicUrl = urlDataP.publicUrl;
}

if (!skipPictures && coverPicInput.files[0]) {
    const coverFile = coverPicInput.files[0];
    const coverFileName = `public/${userIdToUse}/cover-${Date.now()}-${coverFile.name.replace(/\s+/g, '_')}`;
    const { data: uploadDataC, error: uploadErrorC } = await supabase.storage
        .from('cover-pics').upload(coverFileName, coverFile, { upsert: true });
    if (uploadErrorC) throw new Error(`Cover pic upload: ${uploadErrorC.message}`);
    const { data: urlDataC } = supabase.storage.from('cover-pics').getPublicUrl(uploadDataC.path);
    coverPicUrl = urlDataC.publicUrl;
}

                const profileToInsert = {
                    id: userIdToUse, role: signupData.role, first_name: signupData.first_name,
                    middle_name: signupData.middle_name || null, last_name: signupData.last_name,
                    dob: signupData.dob, gender: signupData.gender, nationality: signupData.nationality,
                    email: signupData.email, phone_number: signupData.phone_number, country: signupData.country,
                    city: signupData.city, state: signupData.state || null, postal_code: signupData.postal_code,
                    digital_address: signupData.digital_address || null, profile_pic_url: profilePicUrl,
                    cover_pic_url: coverPicUrl,
                };
                const { error: profileError } = await supabase.from('profiles')
                    .upsert(profileToInsert, { onConflict: 'id' });
                if (profileError) {
                    console.error("Profile insert/upsert error:", profileError);
                    throw new Error(`Profile creation/update failed: ${profileError.message}`);
                }
                displayMessage(pictureUploadForm, 'Profile setup complete! Redirecting...', 'success');
                setTimeout(() => { window.location.href = 'dashboard.html'; }, 1500);
            } catch (error) {
                console.error('Final Onboarding Error:', error);
                displayMessage(pictureUploadForm, error.message || 'Could not complete profile setup.');
            } finally {
                setLoadingState(completeButton, false);
                if (skipBtn) setLoadingState(skipBtn, false);
            }
        };
        pictureUploadForm.addEventListener('submit', (e) => { e.preventDefault(); handlePictureSubmit(false); });
        if (skipPicturesButton) { skipPicturesButton.addEventListener('click', () => { handlePictureSubmit(true); }); }
    }

    // --- File Preview Logic ---
    function setupFilePreview(fileInput, imgPreview) {
        if (fileInput && imgPreview) {
            fileInput.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => { imgPreview.src = e.target.result; }
                    reader.readAsDataURL(file);
                } else { // If no file is selected (e.g., user cancels dialog), reset to placeholder
                    imgPreview.src = imgPreview.dataset.defaultSrc || (imgPreview.id === 'profile-pic-img-preview' ? 'profile-picture.png' : 'cover-photo.png');
                }
            });
            // Store default src for reset
            imgPreview.dataset.defaultSrc = imgPreview.src;
        }
    }
    setupFilePreview(profilePicInput, profilePicImgPreview);
    setupFilePreview(coverPicInput, coverPicImgPreview);

    // Initial Setup
    navigateToStep('welcome-step');
    updateStepIndicator();

    const allFormInputs = document.querySelectorAll('.form-input, .form-select');
    allFormInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.classList.contains('input-error')) clearFieldMessage(input.id);
        });
        input.addEventListener('change', () => {
             if (input.classList.contains('input-error')) clearFieldMessage(input.id);
        });
    });
});
