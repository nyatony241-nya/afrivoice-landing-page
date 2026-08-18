/**
 * AfriVoice Premium Landing Page JavaScript
 * Production-ready vanilla JS (no frameworks)
 * Optimized for performance (60 FPS) and accessibility
 */

(function () {
  'use strict';

  // State & Config
  const state = {
    isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    lastScrollY: 0,
    rAFTimeout: null,
    canvas: {
      active: true,
      time: 0
    },
    demo: {
      generating: false,
      generated: false
    }
  };

  // Cache DOM elements
  const DOM = {
    nav: document.getElementById('nav'),
    mobileToggle: document.getElementById('nav-mobile-toggle'),
    mobileMenu: document.getElementById('nav-mobile-menu'),
    navLinks: document.querySelectorAll('.nav-link, .nav-mobile-link'),
    heroCanvas: document.getElementById('hero-canvas'),
    revealElements: document.querySelectorAll('.reveal'),
    tiltCards: document.querySelectorAll('.tilt-card'),
    magneticBtns: document.querySelectorAll('.magnetic-btn'),
    counters: document.querySelectorAll('.counter'),
    parallaxElements: document.querySelectorAll('.parallax'),
    typingText: document.querySelector('.typing-text'),
    mapCountries: document.querySelectorAll('.country-dot'),
    countryInfoCard: document.getElementById('country-info'),
    africaCountriesGrid: document.getElementById('africa-countries'),
    pricingCards: document.querySelectorAll('.pricing-card')
  };

  // Utilities
  const lerp = (start, end, factor) => start + (end - start) * factor;

  const getOffset = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY
    };
  };

  const debounce = (func, wait = 100) => {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  // 1. Custom Cursor
  const initCursor = () => {
    if (state.isTouchDevice) return;

    // Use existing cursor elements from HTML
    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Detect interactive elements
    const interactives = 'a, button, .tilt-card, .feature-card, .country-card, .pricing-card, .country-dot, input, textarea, select';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(interactives)) {
        ring.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(interactives)) {
        ring.classList.remove('cursor-hover');
      }
    });

    document.addEventListener('mousedown', () => {
      ring.classList.add('cursor-mousedown');
    });

    document.addEventListener('mouseup', () => {
      ring.classList.remove('cursor-mousedown');
    });

    const render = () => {
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      ringX = lerp(ringX, mouseX, 0.15);
      ringY = lerp(ringY, mouseY, 0.15);
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;

      requestAnimationFrame(render);
    };

    render();
  };

  // 2. Navigation Scroll Effect
  const initNav = () => {
    if (!DOM.nav) return;

    const handleScroll = () => {
      if (window.scrollY > 50) {
        DOM.nav.classList.add('nav-scrolled');
      } else {
        DOM.nav.classList.remove('nav-scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // Mobile menu toggle
    if (DOM.mobileToggle && DOM.mobileMenu) {
      DOM.mobileToggle.addEventListener('click', () => {
        const isOpen = DOM.mobileMenu.classList.toggle('active');
        DOM.mobileToggle.classList.toggle('active', isOpen);
        DOM.mobileToggle.setAttribute('aria-expanded', isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav') && DOM.mobileMenu.classList.contains('active')) {
          DOM.mobileMenu.classList.remove('active');
          DOM.mobileToggle.classList.remove('active');
          DOM.mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Close mobile menu on link click
    DOM.navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (DOM.mobileMenu && DOM.mobileMenu.classList.contains('active')) {
          DOM.mobileMenu.classList.remove('active');
          DOM.mobileToggle.classList.remove('active');
          DOM.mobileToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  // 3. Hero Waveform Canvas Animation
  const initCanvas = () => {
    if (!DOM.heroCanvas) return;

    const ctx = DOM.heroCanvas.getContext('2d');
    let width, height;

    const resize = () => {
      width = DOM.heroCanvas.offsetWidth;
      height = DOM.heroCanvas.offsetHeight;
      DOM.heroCanvas.width = width * window.devicePixelRatio;
      DOM.heroCanvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', debounce(resize, 200));
    resize();

    const drawWave = (time, amplitude, frequency, color, phase, lineWidth = 2, shadowBlur = 0) => {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      
      const segments = 100;
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * width;
        const normalizedX = i / segments;
        // Bell curve envelope to taper ends
        const envelope = Math.sin(normalizedX * Math.PI);
        const y = height / 2 + Math.sin(normalizedX * frequency + time + phase) * amplitude * envelope;
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      if (shadowBlur > 0) {
        ctx.shadowBlur = shadowBlur;
        ctx.shadowColor = color;
      } else {
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
    };

    const renderCanvas = (time) => {
      if (!state.canvas.active) return;
      
      ctx.clearRect(0, 0, width, height);

      const t = time * 0.001;
      
      if (state.prefersReducedMotion) {
        // Static waves
        drawWave(0, height * 0.15, 8, 'rgba(255, 255, 255, 0.1)', 0, 1);
        drawWave(0, height * 0.2, 5, 'rgba(0, 212, 255, 0.3)', 2, 2);
        drawWave(0, height * 0.25, 4, '#D4FF00', 1, 2, 10);
      } else {
        // Animated waves with breathing amplitude
        const breath = Math.sin(t * 0.5) * 0.2 + 0.8; 
        
        drawWave(t * -1, height * 0.15 * breath, 8, 'rgba(255, 255, 255, 0.1)', 0, 1);
        drawWave(t * 1.5, height * 0.2 * breath, 5, 'rgba(0, 212, 255, 0.3)', 2, 2);
        drawWave(t * 2, height * 0.25 * breath, 4, '#D4FF00', 1, 2, 15);
      }

      requestAnimationFrame(renderCanvas);
    };

    requestAnimationFrame(renderCanvas);

    // Pause canvas when not visible
    const observer = new IntersectionObserver((entries) => {
      state.canvas.active = entries[0].isIntersecting;
      if (state.canvas.active) requestAnimationFrame(renderCanvas);
    });
    observer.observe(DOM.heroCanvas);
    
    document.addEventListener('visibilitychange', () => {
      state.canvas.active = document.visibilityState === 'visible';
      if (state.canvas.active) requestAnimationFrame(renderCanvas);
    });
  };

  // 4. Scroll Reveal
  const initScrollReveal = () => {
    if (DOM.revealElements.length === 0) return;

    if (state.prefersReducedMotion) {
      DOM.revealElements.forEach(el => el.classList.add('active', 'no-transition'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    DOM.revealElements.forEach(el => observer.observe(el));
  };

  // 5. Smooth Scroll
  const initSmoothScroll = () => {
    const anchors = document.querySelectorAll('a[href^="#"]');
    
    anchors.forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          const navHeight = DOM.nav ? DOM.nav.offsetHeight : 0;
          const targetPos = getOffset(targetEl).top - navHeight;
          
          window.scrollTo({
            top: targetPos,
            behavior: state.prefersReducedMotion ? 'auto' : 'smooth'
          });
        }
      });
    });
  };

  // 6. Africa Map Interaction
  const initMap = () => {
    const countryData = {
      'DZ': { name: 'Algérie', flag: '🇩🇿', accent: 'Accent algérien. Consonnes fortes, livraison émotionnelle et expressive, intonation Maghrébine distincte.' },
      'MA': { name: 'Maroc', flag: '🇲🇦', accent: 'Accent marocain. Intonation Darija/Français, rythme rapide et mélodieux.' },
      'SN': { name: 'Sénégal', flag: '🇸🇳', accent: 'Accent sénégalais clair et posé. Influence du Wolof, rythme mesuré et élégant.' },
      'ML': { name: 'Mali', flag: '🇲🇱', accent: 'Accent malien. Influence du Bambara, rythme chaud et accueillant.' },
      'BF': { name: 'Burkina Faso', flag: '🇧🇫', accent: 'Accent burkinabé. Rythme Sahélien distinct, influence du Mooré, intonation ancrée.' },
      'GN': { name: 'Guinée', flag: '🇬🇳', accent: 'Accent guinéen. Influence du Soussou et Peul, intonation douce.' },
      'NE': { name: 'Niger', flag: '🇳🇪', accent: 'Accent nigérien. Influence du Haoussa, rythme calme et posé.' },
      'CI': { name: 'Côte d\'Ivoire', flag: '🇨🇮', accent: 'Accent ivoirien chaleureux et rythmé. Intonation chantante, influence du Nouchi, expressions locales colorées.' },
      'GH': { name: 'Ghana', flag: '🇬🇭', accent: 'Accent ghanéen. Influence Akan/Twi, rythme anglophone distinctif.' },
      'TG': { name: 'Togo', flag: '🇹🇬', accent: 'Accent togolais. Influence de l\'Éwé, douceur caractéristique.' },
      'BJ': { name: 'Bénin', flag: '🇧🇯', accent: 'Accent béninois. Influence du Fon, rythme clair et expressif.' },
      'NG': { name: 'Nigeria', flag: '🇳🇬', accent: 'Accent nigérian dynamique. Pidgin English, Yoruba et Igbo influences, énergie et expressivité.' },
      'CM': { name: 'Cameroun', flag: '🇨🇲', accent: 'Accent camerounais percutant. Rs gutturaux, stress sur la dernière syllabe, rythme Duala/Yaoundé vibrant.' },
      'GA': { name: 'Gabon', flag: '🇬🇦', accent: 'Accent gabonais doux et fluide. Rythme décontracté, voyelles ouvertes.' },
      'CG': { name: 'Congo', flag: '🇨🇬', accent: 'Accent congolais mélodieux (Brazzaville). Influence du Lingala, intonations chaleureuses.' },
      'CD': { name: 'RDC', flag: '🇨🇩', accent: 'Accent congolais (Kinshasa). Rythme chantant, influence du Lingala et Kikongo, expressivité unique.' },
      'KE': { name: 'Kenya', flag: '🇰🇪', accent: 'Accent kényan. Influence du Swahili, intonation anglophone est-africaine distincte.' },
      'UG': { name: 'Ouganda', flag: '🇺🇬', accent: 'Accent ougandais. Influence du Luganda, rythme doux et mesuré.' },
      'ZA': { name: 'Afrique du Sud', flag: '🇿🇦', accent: 'Accent sud-africain. Influence Zulu/Xhosa, intonation unique et diverse.' },
      'MG': { name: 'Madagascar', flag: '🇲🇬', accent: 'Accent malgache. Influence du Malagasy, rythme unique et mélodieux.' }
    };

    // Populate countries grid
    if (DOM.africaCountriesGrid) {
      const gridHTML = Object.entries(countryData).map(([code, data]) => `
        <div class="country-card" data-country="${code}">
          <span class="country-card-flag">${data.flag}</span>
          <span class="country-card-name">${data.name}</span>
          <div class="country-card-waveform"></div>
        </div>
      `).join('');
      DOM.africaCountriesGrid.innerHTML = gridHTML;
    }

    // Map dot interactions
    if (!DOM.mapCountries.length) return;

    const showCountryInfo = (code, e) => {
      const data = countryData[code];
      if (!data) return;

      // Update info card
      const flagEl = document.getElementById('country-info-flag');
      const nameEl = document.getElementById('country-info-name');
      const accentEl = document.getElementById('country-info-accent');
      const waveformEl = document.getElementById('country-info-waveform');
      const infoCard = document.getElementById('country-info');

      if (flagEl) flagEl.textContent = data.flag;
      if (nameEl) nameEl.textContent = data.name;
      if (accentEl) accentEl.textContent = data.accent;
      if (waveformEl) createWaveformBars(waveformEl, 20, true);
      if (infoCard) infoCard.style.display = 'block';

      // Highlight corresponding grid card
      document.querySelectorAll('.country-card').forEach(c => c.classList.remove('active'));
      const gridCard = document.querySelector(`.country-card[data-country="${code}"]`);
      if (gridCard) gridCard.classList.add('active');
    };

    const hideCountryInfo = () => {
      const infoCard = document.getElementById('country-info');
      if (infoCard) infoCard.style.display = 'none';
      document.querySelectorAll('.country-card').forEach(c => c.classList.remove('active'));
    };

    DOM.mapCountries.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        DOM.mapCountries.forEach(c => c.classList.remove('active'));
        el.classList.add('active');
        const code = el.getAttribute('data-country');
        showCountryInfo(code, e);
      });

      el.addEventListener('mouseleave', () => {
        el.classList.remove('active');
        hideCountryInfo();
      });
    });

    // Grid card interactions
    document.querySelectorAll('.country-card').forEach(card => {
      card.addEventListener('mouseenter', () => {
        const code = card.getAttribute('data-country');
        document.querySelectorAll('.country-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        // Highlight corresponding dot
        DOM.mapCountries.forEach(dot => {
          dot.classList.toggle('active', dot.getAttribute('data-country') === code);
        });
        showCountryInfo(code);
        // Animate waveform in card
        const wf = card.querySelector('.country-card-waveform');
        if (wf) createWaveformBars(wf, 8, true);
      });

      card.addEventListener('mouseleave', () => {
        card.classList.remove('active');
        DOM.mapCountries.forEach(dot => dot.classList.remove('active'));
        hideCountryInfo();
        const wf = card.querySelector('.country-card-waveform');
        if (wf) { clearInterval(wf._animationInterval); wf.innerHTML = ''; }
      });
    });
  };

  // 7. Interactive Demo
  const initDemo = () => {
    const demoBtn = document.getElementById('demo-generate');
    const demoText = document.getElementById('demo-text');
    const progressContainer = document.getElementById('demo-progress');
    const progressFill = document.getElementById('demo-progress-fill');
    const progressText = document.getElementById('demo-progress-text');
    const resultArea = document.getElementById('demo-result');
    const demoWaveform = document.getElementById('demo-waveform');
    const playBtn = document.getElementById('demo-play');

    if (!demoBtn) return;

    let isPlaying = false;

    demoBtn.addEventListener('click', () => {
      if (state.demo.generating) return;
      if (demoText && !demoText.value.trim()) return;

      state.demo.generating = true;
      demoBtn.disabled = true;
      demoBtn.classList.add('loading');
      
      if (resultArea) resultArea.style.display = 'none';
      if (progressContainer) progressContainer.style.display = 'block';

      const steps = [
        { progress: 25, text: 'Analyse du texte...' },
        { progress: 50, text: "Sélection de l'accent..." },
        { progress: 80, text: 'Synthèse vocale IA...' },
        { progress: 100, text: 'Mastering HD...' }
      ];

      let currentStep = 0;

      const nextStep = () => {
        if (currentStep >= steps.length) {
          setTimeout(() => {
            state.demo.generating = false;
            state.demo.generated = true;
            demoBtn.disabled = false;
            demoBtn.classList.remove('loading');
            if (progressContainer) progressContainer.style.display = 'none';
            if (resultArea) resultArea.style.display = 'block';
            if (progressFill) progressFill.style.width = '0%';
            
            if (demoWaveform) {
              createWaveformBars(demoWaveform, 50, false);
            }
          }, 500);
          return;
        }

        const step = steps[currentStep];
        if (progressFill) progressFill.style.width = `${step.progress}%`;
        if (progressText) progressText.textContent = step.text;
        
        currentStep++;
        setTimeout(nextStep, 700 + Math.random() * 500);
      };

      nextStep();
    });

    if (playBtn) {
      playBtn.addEventListener('click', () => {
        isPlaying = !isPlaying;
        playBtn.classList.toggle('playing', isPlaying);
        
        if (demoWaveform) {
          createWaveformBars(demoWaveform, 50, isPlaying);
        }
      });
    }
  };

  // 8. Waveform Bar Animations
  const createWaveformBars = (container, count = 40, animate = true) => {
    if (!container) return;
    container.innerHTML = '';
    
    const bars = [];
    for (let i = 0; i < count; i++) {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      
      // Initial random height 10% - 100%
      const height = Math.floor(Math.random() * 90) + 10;
      bar.style.height = `${height}%`;
      
      container.appendChild(bar);
      bars.push(bar);
    }

    if (container._animationInterval) {
      clearInterval(container._animationInterval);
    }

    if (animate && !state.prefersReducedMotion) {
      container._animationInterval = setInterval(() => {
        bars.forEach(bar => {
          const newHeight = Math.floor(Math.random() * 90) + 10;
          bar.style.height = `${newHeight}%`;
        });
      }, 150);
    }
  };

  // 9. Card Tilt Effect
  const initTiltCards = () => {
    if (state.isTouchDevice || state.prefersReducedMotion || DOM.tiltCards.length === 0) return;

    DOM.tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation (max 5deg)
        const rotateX = ((y - centerY) / centerY) * -5;
        const rotateY = ((x - centerX) / centerX) * 5;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        
        // Gradient highlight
        const highlight = card.querySelector('.card-highlight');
        if (highlight) {
          highlight.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 60%)`;
        }
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        const highlight = card.querySelector('.card-highlight');
        if (highlight) {
          highlight.style.background = 'none';
        }
      });
    });
  };

  // 10. Magnetic Button Effect
  const initMagneticBtns = () => {
    if (state.isTouchDevice || state.prefersReducedMotion || DOM.magneticBtns.length === 0) return;

    DOM.magneticBtns.forEach(btn => {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Max displacement 10px
        const deltaX = (e.clientX - centerX) * 0.2;
        const deltaY = (e.clientY - centerY) * 0.2;
        
        btn.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translate(0px, 0px)';
      });
    });
  };

  // 11. Pricing Cards
  const initPricing = () => {
    const toggle = document.getElementById('pricing-toggle');
    if (toggle && DOM.pricingCards.length > 0) {
      toggle.addEventListener('change', () => {
        const isAnnual = toggle.checked;
        
        document.querySelectorAll('.price-monthly').forEach(el => {
          el.style.display = isAnnual ? 'none' : 'block';
        });
        
        document.querySelectorAll('.price-annual').forEach(el => {
          el.style.display = isAnnual ? 'block' : 'none';
        });
      });
    }
  };

  // 12. Stats Counter
  const initCounters = () => {
    if (DOM.counters.length === 0) return;

    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    };

    const animateCounter = (el) => {
      const target = parseInt(el.getAttribute('data-target') || 0, 10);
      const duration = 2000;
      let start = null;
      
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        
        // easeOutQuart
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(easeProgress * target);
        
        el.innerText = formatNumber(current) + (el.getAttribute('data-suffix') || '');
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          el.innerText = formatNumber(target) + (el.getAttribute('data-suffix') || '');
        }
      };
      
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (state.prefersReducedMotion) {
            const target = entry.target.getAttribute('data-target') || 0;
            entry.target.innerText = formatNumber(target) + (entry.target.getAttribute('data-suffix') || '');
          } else {
            animateCounter(entry.target);
          }
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    DOM.counters.forEach(counter => observer.observe(counter));
  };

  // 13. Floating Elements Parallax
  const initParallax = () => {
    if (state.prefersReducedMotion || state.isTouchDevice || DOM.parallaxElements.length === 0) return;

    let rAF;
    
    const render = () => {
      const scrollY = window.scrollY;
      
      DOM.parallaxElements.forEach(el => {
        const speed = parseFloat(el.getAttribute('data-speed') || 0.1);
        const yPos = -(scrollY * speed);
        // Limit displacement
        const clampedY = Math.max(Math.min(yPos, 50), -50);
        
        el.style.transform = `translate3d(0, ${clampedY}px, 0)`;
      });
      
      rAF = null;
    };

    window.addEventListener('scroll', () => {
      if (!rAF) {
        rAF = requestAnimationFrame(render);
      }
    }, { passive: true });
  };

  // 14. Text Typing Effect
  const initTyping = () => {
    if (!DOM.typingText) return;

    const text = DOM.typingText.getAttribute('data-text') || DOM.typingText.innerText;
    
    if (state.prefersReducedMotion) {
      DOM.typingText.innerText = text;
      return;
    }

    DOM.typingText.innerText = '';
    DOM.typingText.classList.add('typing-active');

    const observer = new IntersectionObserver((entries, obs) => {
      if (entries[0].isIntersecting) {
        let i = 0;
        const speed = 40;
        
        const typeWriter = () => {
          if (i < text.length) {
            DOM.typingText.innerHTML += text.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
          }
        };
        
        typeWriter();
        obs.unobserve(DOM.typingText);
      }
    });

    observer.observe(DOM.typingText);
  };

  // 15. FAQ Accordion
  const initFAQ = () => {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const questionBtn = item.querySelector('.faq-question');
      const answerEl = item.querySelector('.faq-answer');
      if (!questionBtn || !answerEl) return;

      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all other items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            otherItem.classList.remove('open');
            const otherBtn = otherItem.querySelector('.faq-question');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
            if (otherAnswer) otherAnswer.style.maxHeight = null;
          }
        });

        // Toggle current item
        if (isOpen) {
          item.classList.remove('open');
          questionBtn.setAttribute('aria-expanded', 'false');
          answerEl.style.maxHeight = null;
        } else {
          item.classList.add('open');
          questionBtn.setAttribute('aria-expanded', 'true');
          answerEl.style.maxHeight = `${answerEl.scrollHeight}px`;
        }
      });
    });
  };

  // 16. User Examples Player
  const initExamples = () => {
    const exampleCards = document.querySelectorAll('.example-card');
    let currentlyPlayingBtn = null;
    let currentlyPlayingWaveform = null;
    let currentAudio = null;

    exampleCards.forEach(card => {
      const audioSrc = card.getAttribute('data-audio-src');
      const sampleText = card.getAttribute('data-sample-text');
      const waveformContainer = card.querySelector('.example-waveform-container');
      const playBtn = card.querySelector('.example-play-btn');
      const playIcon = playBtn ? playBtn.querySelector('.play-icon') : null;
      const pauseIcon = playBtn ? playBtn.querySelector('.pause-icon') : null;
      let cardAudio = null;

      if (audioSrc) {
        cardAudio = new Audio(audioSrc);
      }

      if (waveformContainer) {
        createWaveformBars(waveformContainer, 24, false);
      }

      const stopCurrentPlayback = () => {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
          currentAudio = null;
        }
        if (currentlyPlayingBtn) {
          currentlyPlayingBtn.classList.remove('playing');
          const otherPlayIcon = currentlyPlayingBtn.querySelector('.play-icon');
          const otherPauseIcon = currentlyPlayingBtn.querySelector('.pause-icon');
          if (otherPlayIcon) otherPlayIcon.style.display = 'block';
          if (otherPauseIcon) otherPauseIcon.style.display = 'none';
          if (currentlyPlayingWaveform) createWaveformBars(currentlyPlayingWaveform, 24, false);
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      };

      if (playBtn) {
        playBtn.addEventListener('click', () => {
          const isPlaying = playBtn.classList.contains('playing');

          if (isPlaying) {
            stopCurrentPlayback();
            currentlyPlayingBtn = null;
            currentlyPlayingWaveform = null;
          } else {
            stopCurrentPlayback();

            playBtn.classList.add('playing');
            if (playIcon) playIcon.style.display = 'none';
            if (pauseIcon) pauseIcon.style.display = 'block';
            if (waveformContainer) createWaveformBars(waveformContainer, 24, true);

            currentlyPlayingBtn = playBtn;
            currentlyPlayingWaveform = waveformContainer;

            if (cardAudio) {
              currentAudio = cardAudio;
              cardAudio.play().then(() => {
                cardAudio.onended = () => {
                  stopCurrentPlayback();
                  currentlyPlayingBtn = null;
                  currentlyPlayingWaveform = null;
                };
              }).catch(err => {
                console.warn('Playback error:', err);
              });
            } else if ('speechSynthesis' in window && sampleText) {
              const synthUtterance = new SpeechSynthesisUtterance(sampleText);
              synthUtterance.lang = 'fr-FR';
              synthUtterance.rate = 0.95;
              synthUtterance.onend = () => {
                stopCurrentPlayback();
                currentlyPlayingBtn = null;
                currentlyPlayingWaveform = null;
              };
              window.speechSynthesis.speak(synthUtterance);
            }
          }
        });
      }
    });
  };

  // Main init function
  const init = () => {
    initCursor();
    initNav();
    initCanvas();
    initScrollReveal();
    initSmoothScroll();
    initMap();
    initDemo();
    initTiltCards();
    initMagneticBtns();
    initPricing();
    initCounters();
    initParallax();
    initTyping();
    initFAQ();
    initExamples();
    
    // Page load animation (fade out loader if exists)
    const loader = document.getElementById('page-loader');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('fade-out');
        setTimeout(() => loader.remove(), 500);
      }, 300);
    }
  };

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
