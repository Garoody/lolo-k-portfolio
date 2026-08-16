document.querySelectorAll('[data-current-year]').forEach((yearElement) => {
    yearElement.textContent = new Date().getFullYear();
});

const EMAILJS_SERVICE_ID = 'service_rpuir59';
const EMAILJS_TEMPLATE_ID = 'template_jplv863';
const EMAILJS_PUBLIC_KEY = 'vR-UAJ5WOnJSgAGwH';
const emailjsClient = window.emailjs;

if (emailjsClient) {
    emailjsClient.init({
        publicKey: EMAILJS_PUBLIC_KEY,
        limitRate: {
            id: 'lolo-k-contact-form',
            throttle: 10000
        }
    });
}

const contactForm = document.getElementById('contactForm');
const formFeedback = document.getElementById('formFeedback');
const bookingButtons = [...document.querySelectorAll('.btn-agenda-booking')];
const bookingSelection = document.getElementById('bookingSelection');
const selectedEventField = document.getElementById('selectedEvent');
const mainNav = document.getElementById('mainNav');
const navLinks = [...document.querySelectorAll('.navbar .nav-link[href^="#"]')];

if (mainNav && typeof bootstrap !== 'undefined') {
    navLinks.forEach((navLink) => {
        navLink.addEventListener('click', () => {
            if (mainNav.classList.contains('show')) {
                bootstrap.Collapse.getOrCreateInstance(mainNav).hide();
            }
        });
    });
}

const setActiveNavLink = (id) => {
    navLinks.forEach((navLink) => {
        const isActive = navLink.getAttribute('href') === `#${id}`;
        navLink.classList.toggle('active', isActive);

        if (isActive) {
            navLink.setAttribute('aria-current', 'page');
        } else {
            navLink.removeAttribute('aria-current');
        }
    });
};

if ('IntersectionObserver' in window && navLinks.length) {
    const sections = navLinks
        .map((navLink) => document.querySelector(navLink.getAttribute('href')))
        .filter(Boolean);

    const sectionObserver = new IntersectionObserver((entries) => {
        const visibleSection = entries
            .filter((entry) => entry.isIntersecting)
            .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleSection) {
            setActiveNavLink(visibleSection.target.id);
        }
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0.05, 0.25, 0.5] });

    sections.forEach((section) => sectionObserver.observe(section));
}

if (contactForm) {
    const formButtons = [...contactForm.querySelectorAll('button')];
    const submitButton = contactForm.querySelector('button[type="submit"]');

    const clearFeedback = () => {
        if (formFeedback) {
            formFeedback.hidden = true;
            formFeedback.textContent = '';
            formFeedback.classList.remove('is-success', 'is-error', 'is-loading');
        }
    };

    const setFeedback = (message, state) => {
        if (formFeedback) {
            formFeedback.textContent = message;
            formFeedback.hidden = false;
            formFeedback.classList.remove('is-success', 'is-error', 'is-loading');
            formFeedback.classList.add(`is-${state}`);
        }
    };

    const setSubmitting = (isSubmitting) => {
        contactForm.setAttribute('aria-busy', String(isSubmitting));
        formButtons.forEach((button) => {
            button.disabled = isSubmitting;
        });

        if (submitButton) {
            submitButton.textContent = isSubmitting ? 'Envoi en cours…' : 'Envoyer la demande';
        }
    };

    const clearBookingSelection = () => {
        if (selectedEventField) {
            selectedEventField.value = 'Demande générale';
        }

        if (bookingSelection) {
            bookingSelection.textContent = '';
            bookingSelection.hidden = true;
        }
    };

    const setBookingSelection = (eventName) => {
        if (!eventName) {
            clearBookingSelection();
            return;
        }

        if (selectedEventField) {
            selectedEventField.value = eventName;
        }

        if (bookingSelection) {
            bookingSelection.textContent = `Demande de réservation : ${eventName}`;
            bookingSelection.hidden = false;
        }
    };

    bookingButtons.forEach((bookingButton) => {
        bookingButton.addEventListener('click', () => {
            setBookingSelection(bookingButton.dataset.event);
            clearFeedback();
        });
    });

    contactForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!contactForm.checkValidity()) {
            event.stopPropagation();
            contactForm.classList.add('was-validated');
            clearFeedback();
            contactForm.querySelector(':invalid')?.focus();
            return;
        }

        contactForm.classList.add('was-validated');

        if (!emailjsClient) {
            setFeedback('Le service d’envoi est momentanément indisponible. Réessayez dans quelques instants.', 'error');
            return;
        }

        setSubmitting(true);
        setFeedback('Envoi de votre demande…', 'loading');

        try {
            await emailjsClient.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, contactForm);

            contactForm.reset();
            contactForm.classList.remove('was-validated');
            setFeedback('Merci, votre demande a bien été envoyée.', 'success');
        } catch (error) {
            const isRateLimited = error?.status === 429;
            const message = isRateLimited
                ? 'Trop de demandes ont été envoyées. Réessayez dans quelques instants.'
                : 'L’envoi a échoué. Vérifiez votre connexion puis réessayez.';
            setFeedback(message, 'error');
        } finally {
            setSubmitting(false);
        }
    });

    contactForm.addEventListener('input', () => {
        if (contactForm.getAttribute('aria-busy') !== 'true') {
            clearFeedback();
        }
    });

    contactForm.addEventListener('reset', () => {
        contactForm.classList.remove('was-validated');
        clearFeedback();
        clearBookingSelection();
    });
}
