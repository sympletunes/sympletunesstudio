document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const faqSearchInput = document.getElementById('faq-search-input');
  const faqAccordionContainer = document.getElementById('faq-accordion-container');
  const faqLoadingMessage = document.getElementById('faq-loading-message');
  const faqNoResultsMessage = document.getElementById('faq-no-results-message');
  const contactSupportSection = document.getElementById('contact-support-section');
  const supportContactForm = document.getElementById('contact-form');

  const contactFullnameInput = document.getElementById('contact-fullname');
  const contactEmailInput = document.getElementById('contact-email');
  const contactPhoneInput = document.getElementById('contact-phone');

  const popupNotification = document.getElementById('form-submission-popup');
  const popupIconEl = popupNotification?.querySelector('.popup-icon i');
  const popupTitleEl = popupNotification?.querySelector('.popup-title');
  const popupMessageEl = popupNotification?.querySelector('.popup-message');
  const popupCloseBtn = popupNotification?.querySelector('.popup-close-btn');
const faqSuggestionList = document.getElementById('faq-suggestion-list');

  const authActionsContainer = document.getElementById('header-auth-actions');

  let currentUser = null;
  let userBasicProfile = null;
  let allFaqs = [];

  const sampleFaqs = [
    {
      id: 1,
      question: "How do I create an account on SympleTunes Studio?",
      answer: "<p>To create an account, click the 'Join Now' or 'Sign Up' button typically found in the website header...</p>",
      tags: ["account", "signup", "register", "new user"]
    },
    {
      id: 2,
      question: "How can I upload my music as an artist?",
      answer: "<p>Once you've registered as an Artist, navigate to your Dashboard...</p>",
      tags: ["music", "upload", "artist"]
    },
    {
      id: 3,
      question: "What are the requirements for podcast cover art?",
      answer: "<p>We recommend a square cover image, ideally 1400x1400 to 3000x3000 px...</p>",
      tags: ["podcast", "cover art", "image"]
    },
    {
      id: 4,
      question: "How do I reset my password?",
      answer: "<p>Use the 'Forgot Password?' link on the Sign In page...</p>",
      tags: ["password", "reset", "forgot"]
    },
    {
      id: 5,
      question: "Can I monetize my content on SympleTunes?",
      answer: "<p>Yes! Through ad revenue, tips, sales, and more...</p>",
      tags: ["monetize", "earnings", "creator"]
    },
    {
      id: 6,
      question: "How do I contact support for other issues?",
      answer: "<p>Use the contact form below if you can't find an answer...</p>",
      tags: ["support", "help", "contact"]
    }
  ];

  // --- Initialization ---
  async function initializeHelpPage() {
    try {
      if (typeof supabase !== 'undefined') {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          currentUser = session.user;
          await fetchUserBasicProfileForPrefill();
        }
      }
    } catch (err) {
      console.warn("Supabase session check failed:", err.message);
    }

    updateHeaderAuthState();
    allFaqs = sampleFaqs;
    renderFaqs(allFaqs); // default 5
    if (faqLoadingMessage) faqLoadingMessage.style.display = 'none';
    setupHelpEventListeners();
    if (contactSupportSection) contactSupportSection.style.display = 'none';
  }

  async function fetchUserBasicProfileForPrefill() {
    if (!currentUser || typeof supabase === 'undefined') return;
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone_number')
        .eq('id', currentUser.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      userBasicProfile = profile;
      prefillContactForm();
    } catch (err) {
      console.error("User profile prefill failed:", err.message);
    }
  }

  function prefillContactForm() {
    if (!userBasicProfile || !supportContactForm) return;
    if (contactFullnameInput) contactFullnameInput.value = `${userBasicProfile.first_name || ''} ${userBasicProfile.last_name || ''}`.trim();
    if (contactEmailInput) contactEmailInput.value = userBasicProfile.email || currentUser.email;
    if (contactPhoneInput) contactPhoneInput.value = userBasicProfile.phone_number || '';
  }

  function updateHeaderAuthState() {
    if (!authActionsContainer) return;
    authActionsContainer.innerHTML = '';
    if (currentUser) {
      const dashboardLink = document.createElement('a');
      dashboardLink.href = 'dashboard.html';
      dashboardLink.className = 'btn btn-secondary btn-small';
      dashboardLink.textContent = 'My Dashboard';
      authActionsContainer.appendChild(dashboardLink);
    } else {
      const signInLink = document.createElement('a');
      signInLink.href = 'signin.html';
      signInLink.className = 'btn btn-secondary';
      signInLink.textContent = 'Sign In';

      const joinNowLink = document.createElement('a');
      joinNowLink.href = 'signup.html';
      joinNowLink.className = 'btn btn-primary';
      joinNowLink.textContent = 'Join Now';

      authActionsContainer.appendChild(signInLink);
      authActionsContainer.appendChild(joinNowLink);
    }
  }

  // --- FAQ Rendering ---
  function renderFaqs(faqsToRender = [], limit = 5) {
    faqAccordionContainer.innerHTML = '';
    const faqs = faqsToRender.slice(0, limit);

    if (faqs.length === 0) {
      faqNoResultsMessage?.classList.remove('hidden');
      faqNoResultsMessage.style.display = 'block';
      contactSupportSection?.style.setProperty('display', 'block');
      return;
    }

    faqNoResultsMessage?.classList.add('hidden');
    faqNoResultsMessage.style.display = 'none';
    contactSupportSection?.style.setProperty('display', 'none');

    faqs.forEach(faq => {
      const details = document.createElement('details');
      details.className = 'faq-item';
      details.innerHTML = `
        <summary>
          ${faq.question}
          <span class="faq-icon"><i class="fas fa-plus"></i></span>
        </summary>
        <div class="faq-answer">${faq.answer}</div>
      `;
      details.addEventListener('toggle', function () {
        const icon = this.querySelector('.faq-icon i');
        if (icon) {
          icon.classList.toggle('fa-plus', !this.open);
          icon.classList.toggle('fa-minus', this.open);
        }
      });
      faqAccordionContainer.appendChild(details);
    });
  }

function handleFaqSearch() {
  const term = faqSearchInput.value.toLowerCase().trim();

  // Reset dropdown
  faqSuggestionList.innerHTML = '';
  faqSuggestionList.style.display = 'none';

  if (!term) {
    renderFaqs(allFaqs); // Reset to default 5
    return;
  }

  const filteredFaqs = allFaqs.filter(faq =>
    faq.question.toLowerCase().includes(term) ||
    (faq.tags || []).some(tag => tag.toLowerCase().includes(term))
  );

  renderFaqs(filteredFaqs, filteredFaqs.length);

  if (filteredFaqs.length === 0) {
    contactSupportSection?.style.setProperty('display', 'block');
    faqNoResultsMessage?.style.setProperty('display', 'block');
  } else {
    contactSupportSection?.style.setProperty('display', 'none');
    faqNoResultsMessage?.style.setProperty('display', 'none');

    // Suggest dropdown
    filteredFaqs.slice(0, 5).forEach(faq => {
      const li = document.createElement('li');
      li.textContent = faq.question;
      li.addEventListener('click', () => {
        // Scroll to and expand
        const allDetails = faqAccordionContainer.querySelectorAll('details');
        allDetails.forEach(details => {
          if (details.textContent.includes(faq.question)) {
            details.scrollIntoView({ behavior: 'smooth', block: 'center' });
            details.open = true;
          } else {
            details.open = false;
          }
        });
        faqSuggestionList.style.display = 'none';
      });
      faqSuggestionList.appendChild(li);
    });

    if (faqSuggestionList.children.length > 0) {
      faqSuggestionList.style.display = 'block';
    }
  }
}

  // --- Form Submit ---
  async function handleSupportFormSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');

    const name = formData.get('name');
    const email = formData.get('email');
    const number = formData.get('number');
    const message = formData.get('message');

    if (!name || !email || !message) {
      showPopupNotification("Error", "Please fill in all required fields.", "error");
      return;
    }

    if (!isValidEmail(email)) {
      showPopupNotification("Error", "Please enter a valid email address.", "error");
      return;
    }

    setLoadingState(submitButton, true);

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      });

      if (response.ok) {
        showPopupNotification("Thank You!", "Your message has been sent successfully.", "success");
        form.reset();
      } else {
        throw new Error("Form submission failed. Please try again.");
      }
    } catch (err) {
      showPopupNotification("Submission Error", err.message, "error");
    } finally {
      setLoadingState(submitButton, false);
    }
  }

  // --- Popup ---
  function showPopupNotification(title, message, type = 'info') {
    if (!popupNotification || !popupTitleEl || !popupMessageEl || !popupIconEl) {
      alert(`${title}: ${message}`);
      return;
    }
    popupTitleEl.textContent = title;
    popupMessageEl.textContent = message;
    popupIconEl.className = `fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`;
    popupNotification.classList.add('show');
  }

  function closePopupNotification() {
    popupNotification?.classList.remove('show');
  }

  // --- Utility ---
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setLoadingState(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.disabled = true;
      if (!button.dataset.originalText) button.dataset.originalText = button.innerHTML;
      const iconHTML = button.querySelector('i')?.outerHTML || '';
      button.innerHTML = `<span class="spinner"></span> ${iconHTML} Sending...`;
    } else {
      button.disabled = false;
      if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
    }
  }

  function handleLogout() {
    if (typeof supabase !== 'undefined') {
      supabase.auth.signOut().then(() => {
        currentUser = null;
        userBasicProfile = null;
        updateHeaderAuthState();
        prefillContactForm();
      }).catch(console.error);
    } else {
      console.warn("Supabase client not found.");
    }
  }

  // --- Event Listeners ---
  function setupHelpEventListeners() {
    faqSearchInput?.addEventListener('input', handleFaqSearch);
    supportContactForm?.addEventListener('submit', handleSupportFormSubmit);
    popupCloseBtn?.addEventListener('click', closePopupNotification);
    popupNotification?.addEventListener('click', (e) => {
      if (e.target === popupNotification) closePopupNotification();
    });
    document.getElementById('logout-button')?.addEventListener('click', handleLogout);
    document.getElementById('mobile-logout-button')?.addEventListener('click', handleLogout);
  }

  // --- Run App ---
  initializeHelpPage();
});
