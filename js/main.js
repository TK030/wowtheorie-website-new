/* ============================================
   WowTheorie.nl - Main JavaScript
   Pure vanilla JS, geen frameworks
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    /* ─── MOBILE MENU TOGGLE ─── */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('hamburger--active');
            mobileMenu.classList.toggle('mobile-menu--open');
            // Prevent body scroll when menu is open
            document.body.style.overflow = mobileMenu.classList.contains('mobile-menu--open') ? 'hidden' : '';
        });

        // Close menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('hamburger--active');
                mobileMenu.classList.remove('mobile-menu--open');
                document.body.style.overflow = '';
            });
        });
    }
    /* ─── MOBILE DROPDOWN TOGGLE ─── */
    document.querySelectorAll('.mobile-menu__dropdown-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', !expanded);
            const list = btn.nextElementSibling;
            if (list) {
                list.classList.toggle('mobile-menu__dropdown-list--open');
            }
            // Toggle chevron rotation
            btn.classList.toggle('mobile-menu__dropdown-toggle--open');
        });
    });

    // Close mobile menu when clicking a dropdown sub-link
    if (mobileMenu) {
        mobileMenu.querySelectorAll('.mobile-menu__dropdown-list a').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('hamburger--active');
                mobileMenu.classList.remove('mobile-menu--open');
                document.body.style.overflow = '';
            });
        });
    }

    /* ─── LANGUAGE PICKER TOGGLE ─── */
    document.querySelectorAll('.language-picker').forEach((picker) => {
        const toggle = picker.querySelector('.language-picker__toggle');
        if (!toggle) return;

        toggle.addEventListener('click', (event) => {
            event.stopPropagation();
            const isOpen = picker.classList.toggle('language-picker--open');
            toggle.setAttribute('aria-expanded', String(isOpen));
        });

        document.addEventListener('click', (event) => {
            if (!picker.contains(event.target)) {
                picker.classList.remove('language-picker--open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    });

    /* ─── HEADER SCROLL EFFECT ─── */
    const header = document.getElementById('header');

    if (header) {
        const onScroll = () => {
            if (window.scrollY > 20) {
                header.classList.add('header--scrolled');
            } else {
                header.classList.remove('header--scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll(); // Run on load
    }

    /* ─── SMOOTH SCROLL FOR ANCHOR LINKS ─── */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            const targetId = anchor.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerHeight = header ? header.offsetHeight : 0;
                const targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });

    /* ─── AOS INITIALISATIE ─── */
    const initAOS = () => {
        if (window.AOS) {
            AOS.init({
                once: true,
                duration: 800,
                easing: 'ease-out-cubic',
                offset: 120,
            });
        }
    };

    window.addEventListener('load', initAOS);

    /* ─── SCROLL TOP BUTTON ─── */
    const scrollTopButton = document.getElementById('scrollTop');
    if (scrollTopButton) {
        const toggleScrollTopButton = () => {
            scrollTopButton.classList.toggle('show', window.scrollY > 400);
        };
        toggleScrollTopButton();
        window.addEventListener('scroll', toggleScrollTopButton, { passive: true });
        scrollTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    /* ─── SHOW B2B PARTNER TAG ON WIDER SCREENS ─── */
    const partnerTag = document.getElementById('tag1');
    if (partnerTag) {
        const togglePartnerTag = () => {
            partnerTag.style.display = window.innerWidth > 640 ? 'inline-flex' : 'none';
        };
        togglePartnerTag();
        window.addEventListener('resize', togglePartnerTag);
    }

    /* ─── CLOSE MOBILE MENU ON OUTSIDE CLICK ─── */
    document.addEventListener('click', (e) => {
        if (mobileMenu && mobileMenu.classList.contains('mobile-menu--open')) {
            if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('hamburger--active');
                mobileMenu.classList.remove('mobile-menu--open');
                document.body.style.overflow = '';
            }
        }
    });

    /* ─── CLOSE MOBILE MENU ON ESCAPE ─── */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('mobile-menu--open')) {
            hamburger.classList.remove('hamburger--active');
            mobileMenu.classList.remove('mobile-menu--open');
            document.body.style.overflow = '';
        }
    });

    /* ─── CLOSE MOBILE MENU ON RESIZE (desktop breakpoint) ─── */
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (window.innerWidth >= 1024 && mobileMenu && mobileMenu.classList.contains('mobile-menu--open')) {
                hamburger.classList.remove('hamburger--active');
                mobileMenu.classList.remove('mobile-menu--open');
                document.body.style.overflow = '';
            }
        }, 100);
    });

    /* ─── NUMBER ANIMATION ─── */
    const formatNumber = (value, originalText) => {
        // Determine the type
        if (originalText.match(/^\d{1,3}(\.\d{3})*\+$/)) {
            const num = Math.round(value);
            return num.toLocaleString('nl-NL', {maximumFractionDigits:0}) + '+';
        } else if (originalText.match(/^\d+%$/)) {
            const num = Math.round(value);
            return num.toLocaleString('nl-NL', {maximumFractionDigits:0}) + '%';
        } else if (originalText.match(/^\d+ \w+$/)) {
            const num = Math.round(value);
            const [, suffix] = originalText.split(' ');
            return num.toLocaleString('nl-NL', {maximumFractionDigits:0}) + ' ' + suffix;
        } else if (originalText.match(/^\d+,\d+$/)) {
            // We want to show one decimal place
            return value.toFixed(1).replace('.', ',');
        } else {
            // Fallback: try to see if it's integer or decimal
            if (originalText.includes(',') && !originalText.includes('.')) {
                // Likely decimal with comma
                return value.toFixed(1).replace('.', ',');
            } else {
                // Integer
                return Math.round(value).toLocaleString('nl-NL', {maximumFractionDigits:0});
            }
        }
    };

    const startAnimation = (el) => {
        const target = parseFloat(el.dataset.target);
        const originalText = el.dataset.original;
        let startTime = null;

        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = timestamp - startTime;
            const percentage = Math.min(progress / 2000, 1); // 2 seconds
            const value = percentage * target;

            el.textContent = formatNumber(value, originalText);

            if (percentage < 1) {
                requestAnimationFrame(step);
            }
        };

        requestAnimationFrame(step);
    };

    // Select all number elements
    const numberElements = document.querySelectorAll('.stat__number, .stat-highlight__number, .success-ring__number, .reviews__summary-score');

    numberElements.forEach(el => {
        const originalText = el.textContent.trim();
        // Skip elements that contain a slash (e.g., "4,8/5") as they are not simple numbers to animate
        if (originalText.includes('/')) {
            return;
        }
        el.dataset.original = originalText;

        // Extract the target value from originalText
        let numericString = originalText;

        // Remove known suffixes: 
        if (originalText.endsWith('+')) {
            numericString = originalText.slice(0, -1);
        } else if (originalText.endsWith('%')) {
            numericString = originalText.slice(0, -1);
        } else if (originalText.includes(' ')) {
            // Assume the last part is the label and we only want the first part
            numericString = originalText.split(' ')[0];
        }
        // For the decimal case, we don't remove anything because the numericString is the whole string.

        // Now, we have a string that may contain dots as thousand separators and a comma as decimal separator.
        // We want to convert this to a number.

        // Replace thousand separators (dots) with nothing, and replace the decimal comma with a dot.
        // But note: we don't know which dot is thousand and which is decimal? We assume:
        //   If there is a comma, then it's the decimal separator and the dots are thousand separators.
        //   If there is no comma, then dots are thousand separators.

        if (numericString.includes(',')) {
            // Then we assume the comma is the decimal separator and dots are thousand separators.
            numericString = numericString.replace(/\./g, '').replace(',', '.');
        } else {
            // No comma, so we remove dots (thousand separators)
            numericString = numericString.replace(/\./g, '');
        }

        const targetValue = parseFloat(numericString);

        el.dataset.target = targetValue;

        // Initially, set the text to the formatted value of 0
        el.textContent = formatNumber(0, originalText);
    });

    // Now set up the IntersectionObserver
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                // If we haven't animated this element yet, start the animation
                if (!el.dataset.animated) {
                    el.dataset.animated = 'true';
                    startAnimation(el);
                }
            }
        });
    }, {
        threshold: 0.5 // when 50% of the element is in view
    });

    numberElements.forEach(el => {
        observer.observe(el);
    });

    const initSuccessSlider = () => {
        document.querySelectorAll('[data-slider]').forEach(slider => {
            const track = slider.querySelector('.success-slider__track');
            const slides = Array.from(track.children);
            const prevButton = slider.querySelector('.success-slider__button--prev');
            const nextButton = slider.querySelector('.success-slider__button--next');
            const dotsContainer = slider.querySelector('.success-slider__dots');
            let activeIndex = 0;
            let autoplayInterval = null;
            const trackGap = parseFloat(getComputedStyle(track).gap) || 0;

            const setPosition = () => {
                const offset = -activeIndex * (slider.clientWidth + trackGap);
                track.style.transform = `translate3d(${offset}px, 0, 0)`;
                Array.from(dotsContainer.children).forEach((dot, index) => {
                    dot.classList.toggle('success-slider__dot--active', index === activeIndex);
                });
            };

            const createDots = () => {
                slides.forEach((_, index) => {
                    const dot = document.createElement('button');
                    dot.type = 'button';
                    dot.className = 'success-slider__dot';
                    dot.setAttribute('aria-label', `Ga naar dia ${index + 1}`);
                    dot.addEventListener('click', () => {
                        activeIndex = index;
                        setPosition();
                        resetAutoplay();
                    });
                    dotsContainer.appendChild(dot);
                });
            };

            const showSlide = (index) => {
                if (index < 0) {
                    activeIndex = slides.length - 1;
                } else if (index >= slides.length) {
                    activeIndex = 0;
                } else {
                    activeIndex = index;
                }
                setPosition();
            };

            const resetAutoplay = () => {
                clearInterval(autoplayInterval);
                autoplayInterval = setInterval(() => showSlide(activeIndex + 1), 7000);
            };

            if (dotsContainer && slides.length > 1) {
                createDots();
                setPosition();
                resetAutoplay();
            }

            if (prevButton) {
                prevButton.addEventListener('click', () => {
                    showSlide(activeIndex - 1);
                    resetAutoplay();
                });
            }

            if (nextButton) {
                nextButton.addEventListener('click', () => {
                    showSlide(activeIndex + 1);
                    resetAutoplay();
                });
            }

            window.addEventListener('resize', setPosition);
            slider.addEventListener('mouseenter', () => clearInterval(autoplayInterval));
            slider.addEventListener('mouseleave', resetAutoplay);
        });
    };

    initSuccessSlider();
});
