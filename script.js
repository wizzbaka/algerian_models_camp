// Supabase Configuration
const SUPABASE_CONFIG = {
    url: 'https://rzitbfwptcmdlwxemluk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aXRiZndwdGNtZGx3eGVtbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTMzMTIsImV4cCI6MjA3ODQyOTMxMn0.oCNi8pCb-3rpwc3dyKwoNkcM5Vjkys1J8eO2eoaRT9Y'
  };
  
  // Import Supabase using a more reliable method
  let supabase;
  
  // Function to initialize Supabase
  async function initializeSupabase() {
    try {
        // Try to load Supabase from CDN
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        
        // Fallback: Load via script tag
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = () => {
                supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                console.log('✅ Supabase initialized via script tag');
                resolve(true);
            };
            script.onerror = () => {
                console.error('❌ Failed to load Supabase');
                resolve(false);
            };
            document.head.appendChild(script);
        });
    }
  }
  
  // Helper function to convert file to base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }
  
  // Floating Sidebar Elements
  const floatingSidebarToggle = document.getElementById('floatingSidebarToggle');
  const floatingSidebar = document.getElementById('floatingSidebar');
  const sidebarClose = document.getElementById('sidebarClose');
  let sidebarOverlay = null;
  
  // ============================================
  // PORTFOLIO CAROUSEL FUNCTIONALITY - VERSION CORRIGÉE
  // ============================================
  
  let currentSlideIndex = 0;
  let carouselData = [];
  let carouselInterval = null;
  
  // Load Portfolio Carousel - VERSION COMPLÈTE
  async function loadPortfolioCarousel() {
    console.log('🎠 Début du chargement du carousel portfolio...');
    
    const carouselContainer = document.getElementById('portfolioCarousel');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!carouselContainer) {
        console.error('❌ ERREUR: Élément portfolioCarousel non trouvé');
        return;
    }
    
    // Afficher un indicateur de chargement
    carouselContainer.innerHTML = `
        <div style="
            width: 100%; 
            height: 400px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--primary-color);
        ">
            <div style="text-align: center;">
                <div class="loading-spinner" style="
                    width: 50px; 
                    height: 50px; 
                    border: 4px solid #f3f3f3; 
                    border-top: 4px solid var(--primary-color); 
                    border-radius: 50%; 
                    margin: 0 auto 1rem; 
                    animation: spin 1s linear infinite;
                "></div>
                <p style="font-size: 1.1rem;">Chargement des portfolios...</p>
            </div>
        </div>
    `;
    
    try {
        console.log('📡 Connexion à Supabase pour les portfolios...');
        
        const { data: portfolio, error } = await supabase
            .from('portfolio')
            .select('*')
            .eq('status', 'approved')
            .eq('is_visible', true)
            .order('created_at', { ascending: false })
            .limit(9);
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            throw error;
        }
        
        console.log(`✅ ${portfolio?.length || 0} portfolios récupérés`);
        
        // DEBUG: Afficher les données
        if (portfolio && portfolio.length > 0) {
            console.log('📊 Données brutes du premier portfolio:', portfolio[0]);
            console.log('🖼️ URL image du premier:', portfolio[0].image_url);
        }
        
        if (!portfolio || portfolio.length === 0) {
            console.log('⚠️ Aucun portfolio disponible');
            carouselContainer.innerHTML = `
                <div style="
                    text-align: center; 
                    padding: 3rem; 
                    color: var(--primary-color);
                    height: 400px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📸</div>
                    <h3 style="margin-bottom: 0.5rem;">Aucun portfolio disponible</h3>
                    <p>Les portfolios seront bientôt affichés ici.</p>
                    <button onclick="loadPortfolioCarousel()" style="
                        margin-top: 1rem; 
                        padding: 0.5rem 1rem; 
                        background: var(--primary-color); 
                        color: white; 
                        border: none; 
                        border-radius: 5px; 
                        cursor: pointer;
                    ">
                        🔄 Réessayer
                    </button>
                </div>
            `;
            return;
        }
        
        carouselData = portfolio;
        
        const itemsPerSlide = window.innerWidth <= 768 ? 1 : 3;
        const slides = [];
        for (let i = 0; i < portfolio.length; i += itemsPerSlide) {
            slides.push(portfolio.slice(i, i + itemsPerSlide));
        }

        console.log(`🎯 Création de ${slides.length} slides avec ${itemsPerSlide} items par slide`);
        
        // GÉNÉRATION DU HTML - VERSION CORRIGÉE
        const html = slides.map((slide, slideIndex) => `
            <div class="carousel-slide" data-slide="${slideIndex}">
                ${slide.map(item => {
                    // UTILISEZ DIRECTEMENT image_url DE LA TABLE
                    const imageUrl = item.image_url || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop';
                    
                    return `
                        <div class="carousel-item" onclick="showPortfolioModal('${item.id}')">
                            <div class="carousel-image-container">
                                <img src="${imageUrl}" 
                                     alt="${item.title}"
                                     class="carousel-image"
                                     loading="lazy"
                                     onerror="
                                        console.error('Image failed:', this.src);
                                        this.src='https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop';
                                        this.onerror = null;
                                     ">
                            </div>
                            <div class="carousel-overlay">
                                <h3>${item.title}</h3>
                                <p>${item.description?.substring(0, 60) || 'Découvrez ce portfolio professionnel'}</p>
                                <span class="carousel-category">Mode</span>
                                ${item.price ? `<div style="margin-top: 8px; font-weight: bold; color: #d4af37;">${item.price} DA</div>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');
        
        // Injecter le HTML
        carouselContainer.innerHTML = html;
        console.log('✅ HTML du carousel injecté');
        
        // Générer les dots
        if (dotsContainer) {
            dotsContainer.innerHTML = slides.map((_, index) => 
                `<span class="dot ${index === 0 ? 'active' : ''}" data-slide="${index}"></span>`
            ).join('');
            console.log('✅ Dots générés');
        }
        
        // Initialiser les contrôles
        if (slides.length > 1) {
            initCarouselControls(slides.length);
            startCarouselAutoPlay();
            console.log('✅ Contrôles du carousel initialisés');
        }
        
        // Vérifier le rendu
        setTimeout(() => {
            const items = document.querySelectorAll('.carousel-item');
            const images = document.querySelectorAll('.carousel-image');
            console.log(`🎉 ${items.length} items de carousel rendus`);
            console.log(`🖼️ ${images.length} images chargées`);
            
            // Tester chaque image
            images.forEach((img, i) => {
                console.log(`Image ${i + 1}: ${img.src.substring(0, 80)}...`);
            });
        }, 500);
        
    } catch (error) {
        console.error('❌ ERREUR dans loadPortfolioCarousel:', error);
        
        // Mode dégradé avec images de test
        carouselContainer.innerHTML = `
            <div class="carousel-slide" data-slide="0">
                <div class="carousel-item" onclick="alert('Mode démo - Portfolio 1')">
                    <div class="carousel-image-container">
                        <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop" 
                             alt="Modèle démo"
                             class="carousel-image">
                    </div>
                    <div class="carousel-overlay">
                        <h3>Leonardo DiCaprio</h3>
                        <p>Modèle professionnel - Oran</p>
                        <span class="carousel-category">Mode</span>
                    </div>
                </div>
                <div class="carousel-item" onclick="alert('Mode démo - Portfolio 2')">
                    <div class="carousel-image-container">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop" 
                             alt="Modèle démo"
                             class="carousel-image">
                    </div>
                    <div class="carousel-overlay">
                        <h3>Emma Watson</h3>
                        <p>Portfolio haute couture</p>
                        <span class="carousel-category">Mode</span>
                    </div>
                </div>
                <div class="carousel-item" onclick="alert('Mode démo - Portfolio 3')">
                    <div class="carousel-image-container">
                        <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=600&fit=crop" 
                             alt="Modèle démo"
                             class="carousel-image">
                    </div>
                    <div class="carousel-overlay">
                        <h3>Session Créative</h3>
                        <p>Photographie artistique</p>
                        <span class="carousel-category">Créatif</span>
                    </div>
                </div>
            </div>
        `;
        
        if (dotsContainer) {
            dotsContainer.innerHTML = '<span class="dot active" data-slide="0"></span>';
        }
        
        console.log('✅ Mode démo activé');
    }
  }
  
  // Initialiser les contrôles du carousel
  function initCarouselControls(totalSlides) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dots = document.querySelectorAll('.dot');
    
    if (prevBtn) {
        prevBtn.onclick = null; // Nettoyer les anciens événements
        prevBtn.addEventListener('click', () => {
            navigateCarousel('prev', totalSlides);
        });
    }
    
    if (nextBtn) {
        nextBtn.onclick = null; // Nettoyer les anciens événements
        nextBtn.addEventListener('click', () => {
            navigateCarousel('next', totalSlides);
        });
    }
    
    dots.forEach(dot => {
        dot.onclick = null; // Nettoyer
        dot.addEventListener('click', () => {
            const slideIndex = parseInt(dot.dataset.slide);
            goToSlide(slideIndex, totalSlides);
        });
    });
  }
  
  // Navigation du carousel
  function navigateCarousel(direction, totalSlides) {
    if (direction === 'next') {
        currentSlideIndex = (currentSlideIndex + 1) % totalSlides;
    } else {
        currentSlideIndex = (currentSlideIndex - 1 + totalSlides) % totalSlides;
    }
    
    updateCarouselPosition();
    resetCarouselAutoPlay();
  }
  
  // Aller à un slide spécifique
  function goToSlide(index, totalSlides) {
    currentSlideIndex = index;
    updateCarouselPosition();
    resetCarouselAutoPlay();
  }
  
  // Mettre à jour la position du carousel
  function updateCarouselPosition() {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    slides.forEach((slide, index) => {
        slide.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    });
    
    dots.forEach((dot, index) => {
        if (index === currentSlideIndex) {
            dot.classList.add('active');
        } else {
            dot.classList.remove('active');
        }
    });
  }
  
  // Démarrer l'auto-play
  function startCarouselAutoPlay() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length <= 1) return;
    
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    
    carouselInterval = setInterval(() => {
        navigateCarousel('next', slides.length);
    }, 5000);
  }
  
  // Réinitialiser l'auto-play
  function resetCarouselAutoPlay() {
    if (carouselInterval) {
        clearInterval(carouselInterval);
    }
    startCarouselAutoPlay();
  }
  
  // Pause au survol
  function initCarouselHoverPause() {
    const carouselContainer = document.querySelector('.portfolio-carousel-container');
    
    if (carouselContainer) {
        carouselContainer.onmouseenter = null;
        carouselContainer.onmouseleave = null;
        
        carouselContainer.addEventListener('mouseenter', () => {
            if (carouselInterval) {
                clearInterval(carouselInterval);
            }
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            startCarouselAutoPlay();
        });
    }
  }
  
  // ============================================
  // FONCTION UTILITAIRE POUR LES CATÉGORIES
  // ============================================
  
  function getCategoryName(category) {
    // Toutes les catégories seront affichées comme "Mode"
    return "Mode";
}
  
  // ============================================
  // END CAROUSEL FUNCTIONALITY
  // ============================================
  
  // MAIN CONTENT LOADING FUNCTION
  async function loadContent() {
    console.log('🚀 Loading all content...');
    
    try {
        // Load all content sections
        await Promise.all([
            loadAboutContent(),
            loadContactContent(),
            loadServices(),
            loadEvents(),
            loadFormations(),
            loadRatings(),
            loadPortfolioCarousel(), // Add carousel loading
            loadPortfolioGrid()
        ]);
        
        console.log('✅ All content loaded successfully');
    } catch (error) {
        console.error('❌ Error loading content:', error);
    }
  }
  
  // Load About Content
  async function loadAboutContent() {
    try {
        const { data: about } = await supabase
            .from('content')
            .select('*')
            .eq('section', 'about')
            .single();
        
        if (about) {
            const storyEl = document.getElementById('about-story');
            const missionEl = document.getElementById('about-mission');
            const valuesEl = document.getElementById('about-values');
            
            if (storyEl) storyEl.textContent = about.story || 'Algerian Models Camp est la première agence de mannequins professionnelle en Algérie, dédiée à la découverte et au développement de nouveaux talents dans l\'industrie de la mode.';
            if (missionEl) missionEl.textContent = about.mission || 'Nous offrons une formation complète, un encadrement professionnel et des opportunités uniques pour lancer votre carrière de mannequin sur la scène nationale et internationale.';
            if (valuesEl) valuesEl.textContent = about.values || 'Excellence, professionnalisme, diversité et développement personnel sont au cœur de notre approche. Nous croyons en chaque talent unique et nous nous engageons à révéler le meilleur de chacun.';
        }
    } catch (error) {
        console.error('Error loading about content:', error);
    }
  }
  
  // Load Contact Content
async function loadContactContent() {
    try {
        const { data: contact } = await supabase
            .from('content')
            .select('*')
            .eq('section', 'contact')
            .single();
        
        if (contact) {
            const addressEl = document.getElementById('contact-address');
            const phoneLink = document.getElementById('contact-phone-link');
            const emailLink = document.getElementById('contact-email-link');
            const whatsappEl = document.getElementById('contact-whatsapp');
            const facebookEl = document.getElementById('social-facebook');
            const instagramEl = document.getElementById('social-instagram');
            const tiktokEl = document.getElementById('social-tiktok');
            
            if (addressEl) addressEl.textContent = contact.address || 'Alger, Algérie';
            
            // Téléphone cliquable
            if (phoneLink) {
                const phoneNumber = contact.phone || '+213555123456';
                // Formater le numéro pour le lien tel: (supprimer les espaces, etc.)
                const telNumber = phoneNumber.replace(/\s+/g, '');
                phoneLink.href = `tel:${telNumber}`;
                phoneLink.textContent = phoneNumber;
            }
            
            // Email cliquable
            if (emailLink) {
                const email = contact.email || 'contact@algerianmodelscamp.com';
                emailLink.href = `mailto:${email}`;
                emailLink.textContent = email;
            }
            
            // WhatsApp cliquable - format: https://wa.me/213XXXXXXXXX
            if (whatsappEl) {
                const whatsappNumber = contact.whatsapp || '+213555123456';
                // Nettoyer le numéro pour WhatsApp (supprimer tout sauf les chiffres)
                const whatsappClean = whatsappNumber.replace(/\D/g, '');
                whatsappEl.href = `https://wa.me/${whatsappClean}`;
                whatsappEl.textContent = 'Envoyer un message WhatsApp';
            }
            
            // Réseaux sociaux
            if (facebookEl) facebookEl.href = contact.facebook || '#';
            if (instagramEl) instagramEl.href = contact.instagram || '#';
            if (tiktokEl) tiktokEl.href = contact.tiktok || '#';
        }
    } catch (error) {
        console.error('Error loading contact content:', error);
    }
}
  
  // Load Services
  async function loadServices() {
    try {
        const { data: services } = await supabase
            .from('services')
            .select('*')
            .order('display_order');
        
        if (services && services.length > 0) {
            const servicesGrid = document.getElementById('servicesGrid');
            if (servicesGrid) {
                servicesGrid.innerHTML = services.map(service => `
                    <div class="service-card">
                        <div class="service-icon">${service.icon}</div>
                        <h3>${service.title}</h3>
                        <p>${service.description}</p>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading services:', error);
    }
  }
  
  // Navbar Scroll Effect
  function initNavbarScroll() {
    const navbar = document.getElementById('mainNavbar');
    if (!navbar) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(26, 26, 26, 0.95)';
            navbar.style.backdropFilter = 'blur(20px)';
            navbar.style.boxShadow = '0 2px 30px rgba(0, 0, 0, 0.4)';
        } else {
            navbar.style.background = 'rgba(26, 26, 26, 0.98)';
            navbar.style.backdropFilter = 'blur(20px)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
        }
    });
    
    // Active link highlighting
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    function highlightNavLink() {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavLink);
  }
  
  // ================================
  // PORTFOLIO GRID FUNCTIONS
  // ================================
  
  // Load Portfolio Grid - VERSION COMPLÈTE AVEC LIGHTBOX
async function loadPortfolioGrid() {
    console.log('🖼️ === DÉBUT loadPortfolioGrid() ===');
    
    const portfolioGrid = document.getElementById('portfolioGrid');
    
    if (!portfolioGrid) {
        console.error('❌ ERREUR: Élément portfolioGrid introuvable avec l\'ID "portfolioGrid"');
        return;
    }
    
    // Afficher un indicateur de chargement
    portfolioGrid.innerHTML = `
        <div style="
            grid-column: 1 / -1; 
            text-align: center; 
            padding: 4rem; 
            color: var(--primary-color);
        ">
            <div class="loading-spinner" style="
                width: 60px; 
                height: 60px; 
                border: 4px solid rgba(212, 175, 55, 0.2); 
                border-top: 4px solid var(--primary-color); 
                border-radius: 50%; 
                margin: 0 auto 1.5rem; 
                animation: spin 1s linear infinite;
            "></div>
            <h3 style="margin-bottom: 0.5rem;">Chargement du portfolio...</h3>
            <p style="color: #666; font-size: 0.95rem;">Veuillez patienter</p>
        </div>
    `;
    
    console.log('📡 Connexion à Supabase pour les portfolios...');
    
    try {
        const { data: portfolio, error } = await supabase
            .from('portfolio')
            .select('*')
            .eq('status', 'approved')
            .eq('is_visible', true)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            throw error;
        }
        
        console.log(`✅ Réponse Supabase: ${portfolio?.length || 0} portfolios`);
        
        if (!portfolio || portfolio.length === 0) {
            console.log('⚠️ Aucun portfolio trouvé dans la base de données');
            portfolioGrid.innerHTML = `
                <div style="
                    grid-column: 1 / -1; 
                    text-align: center; 
                    padding: 3rem; 
                    color: var(--primary-color); 
                    border: 2px solid var(--primary-color); 
                    border-radius: 10px; 
                    background: rgba(212, 175, 55, 0.1);
                ">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📸</div>
                    <h3 style="margin-bottom: 0.5rem;">Aucun portfolio disponible</h3>
                    <p>Les portfolios seront bientôt disponibles.</p>
                    <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">Veuillez revenir plus tard ou contacter l'administrateur.</p>
                    <button onclick="loadPortfolioGrid()" style="
                        margin-top: 1.5rem; 
                        padding: 0.75rem 1.5rem; 
                        background: var(--primary-color); 
                        color: white; 
                        border: none; 
                        border-radius: 5px; 
                        cursor: pointer;
                        font-weight: bold;
                        transition: transform 0.3s;
                    " onmouseover="this.style.transform='translateY(-2px)'" 
                       onmouseout="this.style.transform='translateY(0)'">
                        🔄 Réessayer
                    </button>
                </div>
            `;
            return;
        }
        
        console.log('🎨 Génération du HTML pour les portfolios...');
        
        // Générer le HTML avec data-id pour chaque portfolio
        const html = portfolio.map(item => {
            const imageUrl = item.image_url || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop';
            const description = item.description ? 
                (item.description.length > 100 ? 
                    item.description.substring(0, 100) + '...' : 
                    item.description) : 
                'Découvrez ce portfolio professionnel';
            
            return `
                <div class="portfolio-item" 
                     data-id="${item.id}" 
                     data-category="${item.category}"
                     style="position: relative;">
                    
                    <img src="${imageUrl}" 
                         alt="${item.title}" 
                         loading="lazy"
                         style="width: 100%; height: 100%; object-fit: cover; display: block;"
                         onerror="
                            console.error('Image failed:', this.src);
                            this.src='https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop';
                            this.onerror = null;
                         ">
                    
                    <div class="portfolio-overlay">
                        <h3>${item.title}</h3>
                        <p>${description}</p>
                        <span class="portfolio-category">Mode</span>
                        ${item.price ? `<div class="portfolio-price">${item.price} DA</div>` : ''}
                    </div>
                    
                    <!-- Indicateur lightbox -->
                    <div class="lightbox-indicator" style="
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: rgba(212, 175, 55, 0.9);
                        color: #1a1a1a;
                        width: 35px;
                        height: 35px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 18px;
                        z-index: 10;
                        cursor: pointer;
                        opacity: 0.9;
                        transition: all 0.3s;
                        border: 2px solid white;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                    " title="Voir les photos">
                        🔍
                    </div>
                    
                    <!-- ID caché pour le debug -->
                    <div style="display: none;" data-portfolio-id="${item.id}"></div>
                </div>
            `;
        }).join('');
        
        // Injecter le HTML
        portfolioGrid.innerHTML = html;
        console.log('✅ HTML injecté dans portfolioGrid');
        
        // ============================================
        // INITIALISATION DE LA LIGHTBOX
        // ============================================
        
        // Attendre un peu que le DOM soit mis à jour
        setTimeout(() => {
            // 1. Initialiser la lightbox si elle n'existe pas
            if (typeof initLightbox === 'function') {
                console.log('🔦 Initialisation de la lightbox...');
                initLightbox();
            } else {
                console.warn('⚠️ initLightbox() non disponible');
            }
            
            // 2. Lier les événements de clic
            bindPortfolioLightboxEvents();
            
            // 3. Initialiser les filtres
            initPortfolioFilters();
            
            // Log final
            const renderedItems = document.querySelectorAll('.portfolio-item');
            console.log(`🎉 ${renderedItems.length} items portfolio rendus dans le DOM`);
            
            // Vérifier que les data-id sont présents
            const itemsWithId = document.querySelectorAll('.portfolio-item[data-id]');
            console.log(`✅ ${itemsWithId.length} items avec data-id`);
            
            // Afficher les IDs pour debug
            renderedItems.forEach((item, index) => {
                const id = item.dataset.id;
                console.log(`  ${index + 1}. ID: ${id || 'MANQUANT'}`);
            });
            
        }, 300);
        
    } catch (error) {
        console.error('❌ ERREUR dans loadPortfolioGrid():', error);
        
        portfolioGrid.innerHTML = `
            <div style="
                grid-column: 1 / -1; 
                text-align: center; 
                padding: 3rem; 
                color: #e74c3c; 
                border: 2px solid #e74c3c; 
                border-radius: 10px; 
                background: rgba(231, 76, 60, 0.1);
            ">
                <div style="font-size: 3rem; margin-bottom: 1rem;">❌</div>
                <h3 style="margin-bottom: 0.5rem;">Erreur de chargement</h3>
                <p>Une erreur est survenue lors du chargement du portfolio.</p>
                <p style="color: #666; font-size: 0.9rem; margin-top: 0.5rem;">
                    Détails: ${error.message || 'Erreur inconnue'}
                </p>
                <button onclick="loadPortfolioGrid()" style="
                    margin-top: 1.5rem; 
                    padding: 0.75rem 1.5rem; 
                    background: var(--primary-color); 
                    color: white; 
                    border: none; 
                    border-radius: 5px; 
                    cursor: pointer;
                    font-weight: bold;
                    transition: transform 0.3s;
                " onmouseover="this.style.transform='translateY(-2px)'" 
                   onmouseout="this.style.transform='translateY(0)'">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
    
    console.log('🏁 === FIN loadPortfolioGrid() ===');
}

// Fonction pour lier les événements lightbox
function bindPortfolioLightboxEvents() {
    console.log('🔗 Liaison des événements lightbox...');
    
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    
    if (portfolioItems.length === 0) {
        console.warn('⚠️ Aucun item portfolio trouvé');
        return;
    }
    
    portfolioItems.forEach((item, index) => {
        const id = item.dataset.id;
        const img = item.querySelector('img');
        const indicator = item.querySelector('.lightbox-indicator');
        
        if (!id) {
            console.warn(`⚠️ Item ${index} sans data-id`);
            return;
        }
        
        if (!img) {
            console.warn(`⚠️ Item ${index} sans image`);
            return;
        }
        
        // 1. Événement sur l'image
        img.style.cursor = 'pointer';
        img.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log(`📸 Image cliquée - Portfolio ID: ${id}`);
            
            if (typeof openPortfolioLightbox === 'function') {
                openPortfolioLightbox(id, img.src);
            } else if (typeof window.showPortfolioModal === 'function') {
                // Fallback à l'ancienne fonction
                window.showPortfolioModal(id);
            } else {
                console.error('❌ Aucune fonction lightbox disponible');
                window.open(img.src, '_blank');
            }
        });
        
        // 2. Événement sur l'indicateur
        if (indicator) {
            indicator.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`🔍 Indicateur cliqué - Portfolio ID: ${id}`);
                
                if (typeof openPortfolioLightbox === 'function') {
                    openPortfolioLightbox(id, img.src);
                }
            });
        }
        
        // 3. Événement sur l'overlay (si présent)
        const overlay = item.querySelector('.portfolio-overlay');
        if (overlay) {
            overlay.style.cursor = 'pointer';
            overlay.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log(`🎯 Overlay cliqué - Portfolio ID: ${id}`);
                
                if (typeof openPortfolioLightbox === 'function') {
                    openPortfolioLightbox(id, img.src);
                }
            });
        }
        
        // 4. Événement sur l'item entier (sauf si on clique sur autre chose)
        item.style.cursor = 'pointer';
        item.addEventListener('click', (e) => {
            // Ne déclencher que si on clique directement sur l'item (pas sur ses enfants)
            if (e.target === item) {
                e.preventDefault();
                console.log(`🎴 Item entier cliqué - Portfolio ID: ${id}`);
                
                if (typeof openPortfolioLightbox === 'function') {
                    openPortfolioLightbox(id, img.src);
                }
            }
        });
        
        console.log(`✅ Item ${index} lié - ID: ${id}`);
    });
    
    console.log(`🎯 ${portfolioItems.length} items liés à la lightbox`);
}

// Exposer la fonction globalement
window.bindPortfolioLightboxEvents = bindPortfolioLightboxEvents;

// Ajouter l'animation spin si elle n'existe pas
if (!document.querySelector('style[data-spin-animation]')) {
    const style = document.createElement('style');
    style.setAttribute('data-spin-animation', 'true');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
}

  // Initialize portfolio filters
  function initPortfolioFilters() {
    const filterBtns = document.querySelectorAll('.portfolio-filters .filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.dataset.filter;
            const portfolioItems = document.querySelectorAll('.portfolio-item');
            
            let visibleCount = 0;
            portfolioItems.forEach(item => {
                // Pour la catégorie "fashion", afficher tous les items puisque tous sont mode maintenant
                if (filter === 'all' || filter === 'fashion') {
                    item.style.display = 'block';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            console.log(`Filtered: ${filter}, Showing: ${visibleCount} items`);
        });
    });
}
  
 
  
  // Smooth Scroll
  document.querySelectorAll('.social-link[href^="#"]').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const section = document.getElementById(targetId);
        if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
  
  // Load Events
  async function loadEvents() {
    try {
        const { data: events } = await supabase
            .from('news')
            .select('*')
            .order('date', { ascending: false });
        
        if (events && events.length > 0) {
            const today = new Date().toISOString().split('T')[0];
            const upcomingEvents = events.filter(e => e.date >= today && !e.is_archived);
            const archivedEvents = events.filter(e => e.date < today || e.is_archived);
  
            // Show upcoming event banner
            if (upcomingEvents.length > 0) {
                const nextEvent = upcomingEvents[0];
                const banner = document.getElementById('upcomingEventBanner');
                banner.innerHTML = `
                    <h2>🎉 Événement à venir : ${nextEvent.title}</h2>
                    <p>${new Date(nextEvent.date).toLocaleDateString('fr-FR')} - ${nextEvent.content}</p>
                `;
                banner.style.display = 'block';
                banner.onclick = () => {
                    document.getElementById('events').scrollIntoView({ behavior: 'smooth' });
                };
            }
  
            // Display upcoming events
            const upcomingGrid = document.getElementById('upcomingEvents');
            upcomingGrid.innerHTML = upcomingEvents.map(event => `
                <div class="news-card">
                    ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" onerror="this.style.display='none'">` : ''}
                    <div class="news-content">
                        <span class="news-date">${new Date(event.date).toLocaleDateString('fr-FR')}</span>
                        <h3>${event.title}</h3>
                        <p>${event.content}</p>
                    </div>
                </div>
            `).join('') || '<p>Aucun événement à venir pour le moment.</p>';
  
            // Display archived events with reviews
            const archivedGrid = document.getElementById('archivedEvents');
            archivedGrid.innerHTML = archivedEvents.map(event => {
                const photos = event.photos ? JSON.parse(event.photos) : [];
                const reviews = event.reviews ? JSON.parse(event.reviews) : [];
                
                return `
                    <div class="news-card">
                        ${event.image_url ? `<img src="${event.image_url}" alt="${event.title}" onerror="this.style.display='none'">` : ''}
                        <div class="news-content">
                            <span class="news-date">${new Date(event.date).toLocaleDateString('fr-FR')}</span>
                            <h3>${event.title}</h3>
                            <p>${event.content}</p>
                            ${photos.length > 0 ? `
                                <div class="event-photos" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin-top: 1rem;">
                                    ${photos.slice(0, 3).map(photo => `<img src="${photo}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 5px;" onerror="this.style.display='none'">`).join('')}
                                </div>
                            ` : ''}
                            ${reviews.length > 0 ? `
                                <div class="event-reviews">
                                    <h4>Avis des participants :</h4>
                                    ${reviews.slice(0, 3).map(review => `
                                        <div class="review-item">
                                            <strong>${review.name}:</strong> ${review.comment}
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }).join('') || '<p>Aucun événement archivé.</p>';
        }
    } catch (error) {
        console.error('Error loading events:', error);
    }
  }
  
  // Events Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.dataset.tab;
        document.getElementById('upcomingEvents').style.display = tab === 'upcoming' ? 'grid' : 'none';
        document.getElementById('archivedEvents').style.display = tab === 'archived' ? 'grid' : 'none';
    });
  });
  
  // Load Formations - VERSION BEAU DESIGN
async function loadFormations() {
    console.log('🎓 Chargement des formations...');
    
    const formationsGrid = document.getElementById('formationsGrid');
    if (!formationsGrid) {
        console.error('❌ ERREUR: formationsGrid introuvable');
        return;
    }
    
    try {
        const { data: formations, error } = await supabase
            .from('formations')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            throw error;
        }
        
        console.log(`📊 ${formations?.length || 0} formations récupérées`);
        
        if (!formations || formations.length === 0) {
            formationsGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 5rem; color: var(--primary-color);">
                    <div style="font-size: 4rem; margin-bottom: 1.5rem;">🎓</div>
                    <h3 style="font-size: 2rem; margin-bottom: 1rem;">Aucune formation disponible</h3>
                    <p style="color: #666; font-size: 1.1rem;">De nouvelles formations arrivent bientôt !</p>
                    <button onclick="loadFormations()" style="
                        margin-top: 2rem; 
                        padding: 1rem 2rem; 
                        background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); 
                        color: var(--dark-color); 
                        border: none; 
                        border-radius: 10px; 
                        cursor: pointer;
                        font-weight: bold;
                        font-size: 1rem;
                        transition: transform 0.3s;
                    " onmouseover="this.style.transform='translateY(-3px)'" 
                       onmouseout="this.style.transform='translateY(0)'">
                        🔄 Actualiser
                    </button>
                </div>
            `;
            return;
        }
        
        // NOUVEAU HTML AVEC DESIGN MODERNE
        const formationsHTML = formations.map(formation => {
            const imageUrl = formation.image_url || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=500&fit=crop';
            const formationDate = formation.formation_date ? 
                new Date(formation.formation_date).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : 
                'À définir';
            
            const isLimited = formation.capacity && formation.capacity < 20;
            
            return `
                <div class="formation-card" onclick="showFormationDetails('${formation.id}')">
                    
                    ${isLimited ? `
                        <div class="formation-limited">
                            ⚡ Places limitées !
                        </div>
                    ` : ''}
                    
                    <div class="formation-header">
                        <div class="formation-badge">
                            🎓 Formation
                        </div>
                        <img src="${imageUrl}" alt="${formation.title}" class="formation-image">
                        <div class="formation-overlay"></div>
                    </div>
                    
                    <div class="formation-content">
                        <h3 class="formation-title">${formation.title}</h3>
                        <p class="formation-description">
                            ${formation.description || 'Découvrez cette formation exclusive pour développer vos compétences.'}
                        </p>
                        
                        <div class="formation-info-grid">
                            <div class="info-item">
                                <div class="info-icon">📅</div>
                                <div class="info-content">
                                    <span class="info-label">Date</span>
                                    <span class="info-value">${formationDate}</span>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-icon">📍</div>
                                <div class="info-content">
                                    <span class="info-label">Lieu</span>
                                    <span class="info-value">${formation.location || 'En ligne/Présentiel'}</span>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-icon">⏱️</div>
                                <div class="info-content">
                                    <span class="info-label">Durée</span>
                                    <span class="info-value">${formation.duration || 'Flexible'}</span>
                                </div>
                            </div>
                            
                            <div class="info-item">
                                <div class="info-icon">👥</div>
                                <div class="info-content">
                                    <span class="info-label">Niveau</span>
                                    <span class="info-value">${formation.level || 'Tous niveaux'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="formation-price">
                            <div class="price-amount">
                                ${formation.price ? `${formation.price} DA` : 'Sur devis'}
                            </div>
                            <div class="price-text">
                                Investissement pour votre avenir professionnel
                            </div>
                        </div>
                        
                        <button class="formation-btn" onclick="event.stopPropagation(); showFormationDetails('${formation.id}')">
                            <span class="btn-icon">🚀</span>
                            Découvrir & S'inscrire
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        formationsGrid.innerHTML = formationsHTML;
        console.log('✅ Formations affichées avec nouveau design');
        
    } catch (error) {
        console.error('❌ Erreur chargement formations:', error);
        formationsGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: #e74c3c;">
                <div style="font-size: 4rem; margin-bottom: 1.5rem;">❌</div>
                <h3 style="font-size: 1.8rem; margin-bottom: 1rem;">Erreur de chargement</h3>
                <p style="color: #666; margin-bottom: 2rem;">Impossible de charger les formations. Veuillez réessayer.</p>
                <button onclick="loadFormations()" style="
                    padding: 1rem 2rem; 
                    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); 
                    color: var(--dark-color); 
                    border: none; 
                    border-radius: 10px; 
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 1rem;
                ">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
}
  
  // Show Formation Details
  window.showFormationDetails = async function(formationId) {
    console.log('🔍 Chargement des détails pour la formation ID:', formationId);
    
    try {
        const { data: formation, error } = await supabase
            .from('formations')
            .select('*')
            .eq('id', formationId)
            .single();
        
        if (error) {
            console.error('❌ Erreur lors du chargement de la formation:', error);
            alert('❌ Erreur lors du chargement de la formation');
            return;
        }
        
        if (formation) {
            let photos = [];
            if (formation.photos) {
                try {
                    photos = JSON.parse(formation.photos);
                } catch (e) {
                    console.warn('Erreur lors du parsing des photos:', e);
                    photos = [];
                }
            }
            
            let formationDateText = 'À définir';
            if (formation.formation_date) {
                try {
                    const date = new Date(formation.formation_date);
                    if (!isNaN(date.getTime())) {
                        formationDateText = date.toLocaleDateString('fr-FR');
                    }
                } catch (e) {
                    console.warn('Date de formation invalide:', formation.formation_date);
                }
            }
            
            const modal = document.getElementById('formationModal');
            const details = document.getElementById('formationDetails');
            
            if (!modal || !details) {
                console.error('❌ Éléments de modal introuvables');
                return;
            }
            
            const mainImage = formation.image_url || (photos.length > 0 ? photos[0] : null);
            
            // Dans ta fonction showFormationDetails(), améliore le HTML :
// À l'intérieur de showFormationDetails(), remplacez le details.innerHTML = `...` par :
        details.innerHTML = `
            <div class="modal-header">
                <h2>${formation.title}</h2>
                <div class="modal-subtitle">Formation professionnelle exclusive</div>
            </div>
            
            ${mainImage ? `
                <div class="modal-hero-image">
                    <img src="${mainImage}" alt="${formation.title}">
                </div>
            ` : ''}
            
            <div class="modal-description">
                <h3>Description détaillée</h3>
                <p>${formation.description || 'Cette formation vous offre une opportunité unique de développer vos compétences avec des experts du secteur.'}</p>
                
                <div class="modal-stats">
                    <div class="stat-item">
                        <div class="stat-icon">💰</div>
                        <div class="stat-value">${formation.price || 'Sur devis'}</div>
                        <div class="stat-label">Investissement</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">⏱️</div>
                        <div class="stat-value">${formation.duration || 'Flexible'}</div>
                        <div class="stat-label">Durée</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">👥</div>
                        <div class="stat-value">${formation.capacity || 'Illimitées'}</div>
                        <div class="stat-label">Places</div>
                    </div>
                    
                    <div class="stat-item">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-value">${formation.level || 'Tous'}</div>
                        <div class="stat-label">Niveau</div>
                    </div>
                </div>
            </div>
            
            ${photos.length > 1 ? `
                <div class="modal-gallery">
                    <h3>Galerie de la formation</h3>
                    <div class="gallery-grid">
                        ${photos.map((photo, index) => `
                            <div class="gallery-item" onclick="window.open('${photo}', '_blank')">
                                <img src="${photo}" alt="Photo ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="modal-registration">
                <h3>🎯 Réserver ma place</h3>
                <p>Complétez le formulaire ci-dessous pour vous inscrire à cette formation.</p>
                
                <form id="formationRegistrationForm">
                    <input type="hidden" id="formationId" value="${formation.id}">
                    
                    <div class="registration-grid">
                        <div class="form-group-modern">
                            <label for="regFullName">Nom Complet *</label>
                            <input type="text" id="regFullName" required placeholder="Votre nom et prénom">
                        </div>
                        
                        <div class="form-group-modern">
                            <label for="regEmail">Email *</label>
                            <input type="email" id="regEmail" required placeholder="email@exemple.com">
                        </div>
                        
                        <div class="form-group-modern">
                            <label for="regPhone">Téléphone *</label>
                            <input type="tel" id="regPhone" required placeholder="+213 XX XX XX XX">
                        </div>
                        
                        <div class="form-group-modern">
                            <label for="regAge">Âge *</label>
                            <input type="number" id="regAge" min="16" max="35" required placeholder="Entre 16 et 35 ans">
                        </div>
                        
                        <div class="form-group-modern">
                            <label for="regCity">Ville *</label>
                            <input type="text" id="regCity" required placeholder="Votre ville de résidence">
                        </div>
                        
                        <div class="form-group-modern">
                            <label for="regHeight">Taille (cm) *</label>
                            <input type="number" id="regHeight" min="160" max="210" required placeholder="Entre 160 et 210 cm">
                        </div>
                    </div>
                    
                    <div class="form-group-modern">
                        <label for="regInstagram">Instagram (optionnel)</label>
                        <input type="text" id="regInstagram" placeholder="@votre_compte">
                    </div>
                    
                    <!-- Section photos -->
                    <div class="photos-section">
                        <div class="photos-header">
                            <h4>📷 Ajouter vos photos</h4>
                            <div class="photo-count">Minimum 2 photos</div>
                        </div>
                        
                        <button type="button" id="addRegPhotoBtn" style="
                            padding: 1rem 2rem; 
                            background: rgba(212, 175, 55, 0.1); 
                            color: var(--primary-color); 
                            border: 2px dashed var(--primary-color); 
                            border-radius: 10px; 
                            cursor: pointer; 
                            font-weight: 600;
                            width: 100%;
                            margin-bottom: 1.5rem;
                        ">
                            + Cliquez pour ajouter des photos
                        </button>
                        <input type="file" id="regPhotos" accept="image/*" multiple style="display: none;">
                        
                        <div id="regPhotoPreview" class="photo-preview-grid"></div>
                    </div>
                    
                    <button type="submit" class="submit-btn">
                        <span>✅</span>
                        Confirmer mon inscription
                    </button>
                </form>
            </div>
        `;
            
            modal.style.display = 'block';
            
            // Initialize photo upload for registration form
            initFormationRegistrationPhotoUpload();
            
            console.log('✅ Modal de formation affichée avec succès');
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement des détails de la formation:', error);
        alert('❌ Erreur lors du chargement des détails de la formation');
    }
  };
  
  // Initialize photo upload for formation registration
  function initFormationRegistrationPhotoUpload() {
    const photoInput = document.getElementById('regPhotos');
    const addPhotoBtn = document.getElementById('addRegPhotoBtn');
    const photoPreview = document.getElementById('regPhotoPreview');
    let selectedPhotos = [];
  
    if (!photoInput || !addPhotoBtn || !photoPreview) {
        console.error('Photo upload elements not found');
        return;
    }
  
    addPhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });
  
    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        selectedPhotos = [...selectedPhotos, ...files];
        photoInput.value = '';
        
        displayRegPhotoPreview(selectedPhotos);
    });
  
    function displayRegPhotoPreview(files) {
        photoPreview.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'photo-preview-item';
                div.style.cssText = 'position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 2px solid #d4af37;';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Photo ${index + 1}" style="width: 100%; height: 100%; object-fit: cover;">
                    <button type="button" class="remove-photo" data-index="${index}" style="position: absolute; top: 5px; right: 5px; background: rgba(255, 0, 0, 0.9); color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; justify-content: center;">×</button>
                    <span class="photo-number" style="position: absolute; bottom: 5px; left: 5px; background: rgba(212, 175, 55, 0.9); color: #333; padding: 0.25rem 0.5rem; border-radius: 5px; font-size: 0.8rem; font-weight: bold;">${index + 1}</span>
                `;
                photoPreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
        
        if (files.length > 0) {
            const addMoreDiv = document.createElement('div');
            addMoreDiv.className = 'photo-preview-item add-more-photo';
            addMoreDiv.style.cssText = 'border: 2px dashed #d4af37; background: rgba(212, 175, 55, 0.05); display: flex; align-items: center; justify-content: center; aspect-ratio: 1; border-radius: 8px;';
            addMoreDiv.innerHTML = `
                <button type="button" class="btn-add-more-photo" id="addMoreRegPhotoBtn" style="background: none; border: none; color: #d4af37; cursor: pointer; font-size: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem; padding: 1rem; width: 100%; height: 100%;">
                    <span style="font-size: 2rem;">+</span>
                    <span>Ajouter</span>
                </button>
            `;
            photoPreview.appendChild(addMoreDiv);
            
            const addMoreBtn = document.getElementById('addMoreRegPhotoBtn');
            if (addMoreBtn) {
                addMoreBtn.addEventListener('click', () => {
                    photoInput.click();
                });
            }
        }
    }
  
    photoPreview.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-photo')) {
            const index = parseInt(e.target.dataset.index);
            selectedPhotos.splice(index, 1);
            displayRegPhotoPreview(selectedPhotos);
        }
    });
  
    const form = document.getElementById('formationRegistrationForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (selectedPhotos.length < 2) {
                alert('⚠️ Veuillez ajouter au moins 2 photos');
                return;
            }
  
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '⏳ Inscription en cours...';
            submitBtn.disabled = true;
  
            try {
                const formData = {
                    formation_id: document.getElementById('formationId').value,
                    full_name: document.getElementById('regFullName').value,
                    age: parseInt(document.getElementById('regAge').value),
                    height: parseInt(document.getElementById('regHeight').value),
                    city: document.getElementById('regCity').value,
                    email: document.getElementById('regEmail').value,
                    phone: document.getElementById('regPhone').value,
                    instagram: document.getElementById('regInstagram').value || null,
                    photos: []
                };
  
                for (let file of selectedPhotos) {
                    try {
                        const base64 = await fileToBase64(file);
                        formData.photos.push(base64);
                    } catch (error) {
                        console.error('Erreur conversion photo:', error);
                    }
                }
                
                const { data, error } = await supabase
                    .from('formation_registrations')
                    .insert([formData]);
  
                if (error) {
                    console.error('❌ Erreur Supabase:', error);
                    throw error;
                }
  
                alert('✅ Votre inscription a été envoyée avec succès ! Nous vous contacterons bientôt.');
                
                const modal = document.getElementById('formationModal');
                if (modal) modal.style.display = 'none';
                
                form.reset();
                selectedPhotos = [];
                photoPreview.innerHTML = '';
  
            } catch (error) {
                console.error('❌ Erreur complète:', error);
                
                let errorMessage = 'Une erreur est survenue. ';
                
                if (error.name === 'AbortError' || error.message.includes('Failed to fetch')) {
                    errorMessage += 'Problème de connexion internet. ';
                    errorMessage += 'Veuillez vérifier votre connexion et réessayer.';
                } else if (error.message.includes('CORS')) {
                    errorMessage += 'Erreur de sécurité. ';
                    errorMessage += 'Veuillez contacter l\'administrateur du site.';
                } else if (error.message.includes('timeout')) {
                    errorMessage += 'La requête a pris trop de temps. ';
                    errorMessage += 'Veuillez réessayer.';
                } else {
                    errorMessage += 'Détails: ' + error.message;
                }
                
                alert(errorMessage);
                
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
  }
  
  // Portfolio Filter
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.dataset.filter;
        document.querySelectorAll('.portfolio-item').forEach(item => {
            if (filter === 'all' || item.dataset.category === filter) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });
  });
  
  // Multiple Photo Upload with "Add More" Button
  const photoInput = document.getElementById('photos');
  const addPhotoBtn = document.getElementById('addPhotoBtn');
  const photoPreview = document.getElementById('photoPreview');
  let selectedPhotos = [];
  
  if (photoInput && addPhotoBtn && photoPreview) {
    addPhotoBtn.addEventListener('click', () => {
        photoInput.click();
    });
  
    photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        
        if (files.length === 0) return;
        
        selectedPhotos = [...selectedPhotos, ...files];
        photoInput.value = '';
        
        displayPhotoPreview(selectedPhotos);
    });
  
    function displayPhotoPreview(files) {
        photoPreview.innerHTML = '';
        
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'photo-preview-item';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="Photo ${index + 1}">
                    <button type="button" class="remove-photo" data-index="${index}">×</button>
                    <span class="photo-number">${index + 1}</span>
                `;
                photoPreview.appendChild(div);
            };
            reader.readAsDataURL(file);
        });
        
        if (files.length > 0) {
            const addMoreDiv = document.createElement('div');
            addMoreDiv.className = 'photo-preview-item add-more-photo';
            addMoreDiv.innerHTML = `
                <button type="button" class="btn-add-more-photo" id="addMorePhotoBtn">
                    <span style="font-size: 2rem;">+</span>
                    <span>Ajouter plus</span>
                </button>
            `;
            photoPreview.appendChild(addMoreDiv);
            
            const addMoreBtn = document.getElementById('addMorePhotoBtn');
            if (addMoreBtn) {
                addMoreBtn.addEventListener('click', () => {
                    photoInput.click();
                });
            }
        }
    }
  
    photoPreview.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-photo')) {
            const index = parseInt(e.target.dataset.index);
            selectedPhotos.splice(index, 1);
            displayPhotoPreview(selectedPhotos);
        }
    });
  }
  
  // Join Form Submission
  const joinForm = document.getElementById('joinForm');
  if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (selectedPhotos.length < 2) {
            alert('⚠️ Veuillez ajouter au moins 2 photos');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '⏳ Envoi en cours...';
        submitBtn.disabled = true;
        
        try {
            const formData = {
                full_name: document.getElementById('fullName').value,
                age: parseInt(document.getElementById('age').value),
                height: parseInt(document.getElementById('height').value),
                city: document.getElementById('city').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                instagram: document.getElementById('instagram').value,
                photos: [],
                status: 'pending'
            };
            
            for (let file of selectedPhotos) {
                const base64 = await fileToBase64(file);
                formData.photos.push(base64);
            }
            
            const { error } = await supabase
                .from('applications')
                .insert([formData]);
            
            if (error) throw error;
            
            alert('✅ Votre candidature a été envoyée avec succès ! Nous vous contacterons bientôt pour vous informer de la suite du processus de sélection.');
            
            e.target.reset();
            photoPreview.innerHTML = '';
            selectedPhotos = [];
            
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Une erreur est survenue lors de l\'envoi de votre candidature. Veuillez réessayer.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
  }
  
  // Contact Form Submission
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Envoi...';
        submitBtn.disabled = true;
        
        try {
            const formData = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                message: document.getElementById('contactMessage').value,
                source: 'visitor'
            };
            
            const { error } = await supabase
                .from('messages')
                .insert([formData]);
            
            if (error) throw error;
            
            alert('✅ Message envoyé avec succès !');
            e.target.reset();
            
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Une erreur est survenue. Veuillez réessayer.');
        } finally {
            submitBtn.textContent = 'Envoyer';
            submitBtn.disabled = false;
        }
    });
  }
  
  // Star Rating System
  let currentRating = 0;
  const stars = document.querySelectorAll('.star');
  
  stars.forEach(star => {
    star.addEventListener('click', () => {
        currentRating = parseInt(star.dataset.rating);
        document.getElementById('ratingValue').value = currentRating;
        updateStarDisplay(stars, currentRating);
    });
    
    star.addEventListener('mouseover', () => {
        const rating = parseInt(star.dataset.rating);
        updateStarDisplay(stars, rating);
    });
  });
  
  const starRating = document.getElementById('starRating');
  if (starRating) {
    starRating.addEventListener('mouseleave', () => {
        updateStarDisplay(stars, currentRating);
    });
  }
  
  function updateStarDisplay(starElements, rating) {
    starElements.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('active');
        } else {
            star.textContent = '☆';
            star.classList.remove('active');
        }
    });
  }
  
  // Rating Form Submission
  const ratingForm = document.getElementById('ratingForm');
  if (ratingForm) {
    ratingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (currentRating === 0) {
            alert('Veuillez sélectionner une note');
            return;
        }
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = 'Envoi...';
        submitBtn.disabled = true;
        
        try {
            const formData = {
                rating: currentRating,
                user_name: document.getElementById('ratingName').value || 'Anonyme',
                comment: document.getElementById('ratingComment').value
            };
            
            const { error } = await supabase
                .from('ratings')
                .insert([formData]);
            
            if (error) throw error;
            
            alert('✅ Merci pour votre avis !');
            e.target.reset();
            currentRating = 0;
            updateStarDisplay(stars, 0);
            await loadRatings();
            
        } catch (error) {
            console.error('Error:', error);
            alert('❌ Une erreur est survenue. Veuillez réessayer.');
        } finally {
            submitBtn.textContent = 'Envoyer mon avis';
            submitBtn.disabled = false;
        }
    });
  }
  
  // Load Ratings
  async function loadRatings() {
    try {
        const { data: ratings } = await supabase
            .from('ratings')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (ratings && ratings.length > 0) {
            const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
            const avgElement = document.getElementById('averageRating');
            const countElement = document.getElementById('ratingCount');
            const starsElement = document.getElementById('averageStars');
            
            if (avgElement) avgElement.textContent = average.toFixed(1);
            if (countElement) countElement.textContent = `${ratings.length} avis`;
            
            const starsHtml = '★'.repeat(Math.round(average)) + '☆'.repeat(5 - Math.round(average));
            if (starsElement) starsElement.textContent = starsHtml;
            
            const ratingsList = document.getElementById('ratingsList');
            if (ratingsList) {
                ratingsList.innerHTML = ratings.map(rating => `
                    <div class="rating-item">
                        <div class="rating-header">
                            <span class="rating-author">${rating.user_name}</span>
                            <span class="rating-stars">${'★'.repeat(rating.rating)}${'☆'.repeat(5 - rating.rating)}</span>
                        </div>
                        ${rating.comment ? `<p>${rating.comment}</p>` : ''}
                        <div class="rating-date">${new Date(rating.created_at).toLocaleDateString('fr-FR')}</div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading ratings:', error);
    }
  }
  
  // Modal Close
  document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    });
  });
  
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
  });
  
  // Debug function to check page structure
  function debugPageStructure() {
    console.log('🔍 DEBUG: Page Structure Check');
    console.log('1. Checking portfolio section...');
    const portfolioSection = document.getElementById('portfolio');
    console.log('   portfolio section found:', !!portfolioSection);
    
    console.log('2. Checking portfolioGrid element...');
    const portfolioGrid = document.getElementById('portfolioGrid');
    console.log('   portfolioGrid found:', !!portfolioGrid);
    
    console.log('3. Checking portfolioCarousel element...');
    const portfolioCarousel = document.getElementById('portfolioCarousel');
    console.log('   portfolioCarousel found:', !!portfolioCarousel);
  }
  
  // ============================================
  // FLOATING SIDEBAR FUNCTIONS
  // ============================================
  
  function initFloatingSidebar() {
    console.log('🔧 Initializing floating sidebar...');
    
    // Don't initialize on mobile
    if (window.innerWidth <= 768) {
        console.log('📱 Mobile detected, skipping floating sidebar');
        return;
    }
    
    // Check if elements exist
    if (!floatingSidebarToggle || !floatingSidebar || !sidebarClose) {
        console.warn('⚠️ Floating sidebar elements not found');
        return;
    }
    
    console.log('✅ Floating sidebar elements found');
    
    // Create overlay if it doesn't exist
    if (!sidebarOverlay) {
        sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
        console.log('✅ Sidebar overlay created');
    }
    
    // Toggle sidebar
    floatingSidebarToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔄 Toggling floating sidebar...');
        
        const isActive = floatingSidebar.classList.contains('active');
        
        if (!isActive) {
            floatingSidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
            floatingSidebarToggle.style.transform = 'translateY(-50%) rotate(90deg)';
            console.log('📖 Sidebar opened');
        } else {
            floatingSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            floatingSidebarToggle.style.transform = 'translateY(-50%)';
            console.log('📕 Sidebar closed');
        }
    });
    
    // Close sidebar
    sidebarClose.addEventListener('click', () => {
        console.log('❌ Closing sidebar via close button');
        floatingSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        floatingSidebarToggle.style.transform = 'translateY(-50%)';
    });
    
    // Close sidebar when clicking overlay
    sidebarOverlay.addEventListener('click', () => {
        console.log('🎯 Closing sidebar via overlay');
        floatingSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        floatingSidebarToggle.style.transform = 'translateY(-50%)';
    });
    
    // Close sidebar when clicking sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            console.log('🔗 Closing sidebar via link click');
            floatingSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            floatingSidebarToggle.style.transform = 'translateY(-50%)';
        });
    });
    
    // Close sidebar with ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && floatingSidebar.classList.contains('active')) {
            console.log('⌨️ Closing sidebar via ESC key');
            floatingSidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
            floatingSidebarToggle.style.transform = 'translateY(-50%)';
        }
    });
    
    console.log('✅ Floating sidebar initialized successfully');
  }
  
  // ============================================
  // MOBILE NAVIGATION
  // ============================================
  
  // Mobile Toggle Button
  const mobileToggle = document.getElementById('mobileToggle');
  const mobileNav = document.getElementById('mobileNav');
  
  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
        
        // Animate hamburger to X
        const spans = mobileToggle.querySelectorAll('span');
        if (mobileNav.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(6px, 6px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });
  }
  
  // Close mobile menu when clicking a link
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        // Reset hamburger
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    });
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (mobileNav.classList.contains('active') && 
        !mobileNav.contains(e.target) && 
        !mobileToggle.contains(e.target)) {
        mobileNav.classList.remove('active');
        // Reset hamburger
        const spans = mobileToggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
  });
  
  // ============================================
  // INITIALIZATION
  // ============================================
  
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 === INITIALISATION COMPLÈTE ===');
    console.log('📅 Date/Heure:', new Date().toLocaleString('fr-FR'));
    console.log('🌐 URL:', window.location.href);
    
    // Debug first
    debugPageStructure();
    
    try {
        // Initialize Supabase first
        console.log('🔌 Initializing Supabase...');
        const supabaseInitialized = await initializeSupabase();
        
        if (!supabaseInitialized) {
            console.error('❌ Failed to initialize Supabase');
            showErrorToUser('Impossible de se connecter à la base de données. Veuillez réessayer plus tard.');
            return;
        }
        
        // Initialize all components
        console.log('🚀 Lancement du chargement du contenu...');
        await loadContent();
        
        console.log('🧭 Initialisation de la navigation...');
        initNavbarScroll();
        
        console.log('✨ Initialisation du floating sidebar...');
        initFloatingSidebar();
        
        console.log('🎠 Initialisation du carousel hover pause...');
        initCarouselHoverPause();
        
        console.log('🌙 Initialisation du mode nuit...');
        initThemeToggle();
        
        console.log('✅ Initialisation terminée avec succès');
        
        // TEST FINAL
        setTimeout(() => {
            console.log('🎯 TEST FINAL DU CAROUSEL');
            const carouselItems = document.querySelectorAll('.carousel-item');
            const carouselImages = document.querySelectorAll('.carousel-image');
            console.log(`🎉 ${carouselItems.length} items dans le carousel`);
            console.log(`🖼️ ${carouselImages.length} images chargées`);
            
            if (carouselItems.length === 0) {
                console.log('⚠️ ATTENTION: Carousel vide!');
                console.log('Essayez de rafraîchir la page (Ctrl+F5)');
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showErrorToUser('Une erreur est survenue lors du chargement de la page.');
    }
    
    console.log('🎯 === FIN INITIALISATION ===');
  });
  

  // Helper function to show error to user
function showErrorToUser(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #e74c3c;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        max-width: 300px;
    `;
    errorDiv.innerHTML = `
        <strong>⚠️ Erreur</strong>
        <p>${message}</p>
        <button onclick="this.parentElement.remove()" style="
            background: white;
            color: #e74c3c;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            margin-top: 0.5rem;
            cursor: pointer;
        ">Fermer</button>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

// Fonction pour forcer le rechargement du carousel
window.reloadCarousel = function() {
    console.log('🔄 Rechargement forcé du carousel...');
    currentSlideIndex = 0;
    carouselData = [];
    if (carouselInterval) {
        clearInterval(carouselInterval);
        carouselInterval = null;
    }
    loadPortfolioCarousel();
};
// Add this function at the end of your script.js
function handleCarouselResize() {
    if (carouselData.length > 0) {
        // Recalculate slides based on current window width
        const itemsPerSlide = window.innerWidth <= 768 ? 1 : 3;
        const slides = [];
        
        for (let i = 0; i < carouselData.length; i += itemsPerSlide) {
            slides.push(carouselData.slice(i, i + itemsPerSlide));
        }
        
        // Regenerate carousel HTML
        const carouselContainer = document.getElementById('portfolioCarousel');
        const dotsContainer = document.getElementById('carouselDots');
        
        if (carouselContainer) {
            const html = slides.map((slide, slideIndex) => `
                <div class="carousel-slide" data-slide="${slideIndex}">
                    ${slide.map(item => {
                        const imageUrl = item.image_url || 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop';
                        
                        return `
                            <div class="carousel-item" onclick="showPortfolioModal('${item.id}')">
                                <div class="carousel-image-container">
                                    <img src="${imageUrl}" 
                                         alt="${item.title}"
                                         class="carousel-image"
                                         loading="lazy"
                                         onerror="
                                            console.error('Image failed:', this.src);
                                            this.src='https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&h=600&fit=crop';
                                            this.onerror = null;
                                         ">
                                </div>
                                <div class="carousel-overlay">
                                    <h3>${item.title}</h3>
                                    <p>${item.description?.substring(0, 60) || 'Découvrez ce portfolio professionnel'}</p>
                                    <span class="carousel-category">Mode</span>
                                    ${item.price ? `<div style="margin-top: 8px; font-weight: bold; color: #d4af37;">${item.price} DA</div>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('');
            
            carouselContainer.innerHTML = html;
            
            // Regenerate dots
            if (dotsContainer) {
                dotsContainer.innerHTML = slides.map((_, index) => 
                    `<span class="dot ${index === currentSlideIndex ? 'active' : ''}" data-slide="${index}"></span>`
                ).join('');
            }
            
            // Reinitialize controls
            if (slides.length > 1) {
                initCarouselControls(slides.length);
                updateCarouselPosition();
            }
        }
    }
}

// Add resize listener
window.addEventListener('resize', function() {
    // Debounce the resize event
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(function() {
        handleCarouselResize();
    }, 250);
});

// Test automatique après 3 secondes
setTimeout(() => {
    console.log('⏰ Test automatique du carousel...');
    const carousel = document.getElementById('portfolioCarousel');
    if (carousel) {
        const items = carousel.querySelectorAll('.carousel-item');
        if (items.length === 0) {
            console.log('⚠️ Carousel vide, tentative de rechargement...');
            window.reloadCarousel();
        }
    }
}, 3000);





// ============================================
// THEME TOGGLE FUNCTIONALITY
// ============================================

function initThemeToggle() {
    console.log('🌙 Initializing theme toggle...');
    
    // Sélectionner les boutons
    const themeToggleDesktop = document.getElementById('themeToggle'); // Desktop
    const themeToggleMobileMenu = document.getElementById('themeToggleMobile'); // Menu mobile déroulant
    const themeToggleMobileHeader = document.getElementById('themeToggleMobileHeader'); // Header mobile
    
    // Vérifier si on est sur mobile ou desktop
    const isMobile = window.innerWidth <= 768;
    console.log('📱 Mobile:', isMobile);
    
    // Fonction pour mettre à jour le thème
    function updateTheme(isDark) {
        if (isDark) {
            // Activer le thème sombre
            document.body.classList.add('dark-theme');
            
            // Mettre à jour TOUS les boutons
            document.querySelectorAll('.theme-icon').forEach(icon => {
                icon.textContent = '☀️';
            });
            
            document.querySelectorAll('.theme-text').forEach(text => {
                if (text) text.textContent = 'Mode Jour';
            });
            
            console.log('🌑 Dark theme applied');
        } else {
            // Désactiver le thème sombre
            document.body.classList.remove('dark-theme');
            
            // Mettre à jour TOUS les boutons
            document.querySelectorAll('.theme-icon').forEach(icon => {
                icon.textContent = '🌙';
            });
            
            document.querySelectorAll('.theme-text').forEach(text => {
                if (text) text.textContent = 'Mode Nuit';
            });
            
            console.log('🌞 Light theme applied');
        }
        
        // Sauvegarder la préférence
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        // Déclencher un événement personnalisé
        window.dispatchEvent(new CustomEvent('themechange', { 
            detail: { isDark } 
        }));
    }
    
    // Vérifier les préférences de thème
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = localStorage.getItem('theme');
    
    // Appliquer le thème initial
    if (storedTheme === 'dark' || (!storedTheme && prefersDarkScheme.matches)) {
        updateTheme(true);
    } else {
        updateTheme(false);
    }
    
    // Fonction pour basculer le thème
    function handleThemeToggle() {
        const isDark = !document.body.classList.contains('dark-theme');
        updateTheme(isDark);
    }
    
    // Lier les événements
    if (themeToggleDesktop) {
        themeToggleDesktop.addEventListener('click', handleThemeToggle);
    }
    
    if (themeToggleMobileMenu) {
        themeToggleMobileMenu.addEventListener('click', handleThemeToggle);
    }
    
    if (themeToggleMobileHeader) {
        themeToggleMobileHeader.addEventListener('click', handleThemeToggle);
    }
    
    // Écouter les changements de préférence système
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            updateTheme(e.matches);
        }
    });
    
    // Écouter les changements de taille d'écran pour le débogage
    window.addEventListener('resize', () => {
        const nowMobile = window.innerWidth <= 768;
        if (nowMobile !== isMobile) {
            console.log('🔄 Screen size changed to:', nowMobile ? 'mobile' : 'desktop');
            console.log('Desktop button visible:', themeToggleDesktop?.offsetParent !== null);
            console.log('Mobile button visible:', themeToggleMobileHeader?.offsetParent !== null);
        }
    });
    
    console.log('✅ Theme toggle initialized');
    console.log('🔘 Buttons status:',
        'Desktop:', !!themeToggleDesktop,
        'Mobile Menu:', !!themeToggleMobileMenu,
        'Mobile Header:', !!themeToggleMobileHeader
    );
}