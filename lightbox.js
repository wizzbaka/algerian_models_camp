// ============================================
// LIGHTBOX FUNCTIONALITY - VERSION DÉFINITIVE
// ============================================

// Import Supabase configuration
const SUPABASE_CONFIG = {
    url: 'https://rzitbfwptcmdlwxemluk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aXRiZndwdGNtZGx3eGVtbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTMzMTIsImV4cCI6MjA3ODQyOTMxMn0.oCNi8pCb-3rpwc3dyKwoNkcM5Vjkys1J8eO2eoaRT9Y'
};

// Variables globales pour la lightbox
let currentLightboxIndex = 0;
let lightboxImages = [];
let lightboxInstance = null;
let supabaseClient = null;

// Initialize Supabase for lightbox
async function initSupabaseForLightbox() {
    if (supabaseClient) {
        console.log('✅ Supabase déjà initialisé pour lightbox');
        return supabaseClient;
    }
    
    console.log('🔧 Initialisation de Supabase pour lightbox...');
    
    try {
        // Try to use the global supabase instance from script.js
        if (window.supabase && typeof window.supabase.from === 'function') {
            console.log('✅ Utilisation de Supabase global de script.js');
            supabaseClient = window.supabase;
            return supabaseClient;
        }
        
        // Fallback: Create our own client
        console.log('🔄 Création d\'un client Supabase pour lightbox...');
        const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
        supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Supabase client créé pour lightbox');
        return supabaseClient;
        
    } catch (error) {
        console.error('❌ Erreur initialisation Supabase lightbox:', error);
        
        // Try fallback script tag method
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.supabase && window.supabase.createClient) {
                    console.log('✅ Supabase chargé via script tag');
                    clearInterval(checkInterval);
                    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
                    resolve(supabaseClient);
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('❌ Timeout: Supabase non initialisé');
                resolve(null);
            }, 5000);
        });
    }
}

// Fonction pour initialiser la lightbox
async function initLightbox() {
    console.log('🔦 Initialisation de la lightbox...');
    
    // Initialize Supabase first
    await initSupabaseForLightbox();
    
    // Créer la structure HTML de la lightbox
    const lightboxHTML = `
        <div id="lightbox" class="lightbox">
            <div class="lightbox-content">
                <span class="lightbox-close">&times;</span>
                <div class="lightbox-image-container">
                    <img class="lightbox-image" src="" alt="">
                </div>
                <div class="lightbox-navigation">
                    <button class="lightbox-btn prev-btn" id="lightboxPrev">‹</button>
                    <button class="lightbox-btn next-btn" id="lightboxNext">›</button>
                </div>
                <div class="lightbox-caption">
                    <h3 class="lightbox-title"></h3>
                    <p class="lightbox-description"></p>
                    <div class="lightbox-counter"></div>
                </div>
                <div class="lightbox-thumbnails" id="lightboxThumbnails"></div>
            </div>
        </div>
    `;
    
    // Ajouter la lightbox au DOM si elle n'existe pas déjà
    if (!document.getElementById('lightbox')) {
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        console.log('✅ Lightbox ajoutée au DOM');
    }
    
    // Initialiser les événements de la lightbox
    setupLightboxEvents();
}

// Initialiser les événements de la lightbox
function setupLightboxEvents() {
    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    
    if (!lightbox || !closeBtn) {
        console.error('❌ Éléments de lightbox non trouvés');
        return;
    }
    
    // Fermer la lightbox
    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });
    
    // Navigation
    if (prevBtn) prevBtn.addEventListener('click', showPrevLightboxImage);
    if (nextBtn) nextBtn.addEventListener('click', showNextLightboxImage);
    
    // Navigation clavier
    document.addEventListener('keydown', handleLightboxKeyboard);
    
    // Navigation tactile (mobile)
    setupTouchNavigation();
    
    console.log('✅ Événements de lightbox initialisés');
}

// Gérer la navigation clavier
function handleLightboxKeyboard(e) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;
    
    switch(e.key) {
        case 'Escape':
            closeLightbox();
            break;
        case 'ArrowLeft':
            showPrevLightboxImage();
            break;
        case 'ArrowRight':
            showNextLightboxImage();
            break;
    }
}

// Navigation tactile pour mobile
function setupTouchNavigation() {
    const lightboxContainer = document.querySelector('.lightbox-image-container');
    if (!lightboxContainer) return;
    
    let touchStartX = 0;
    let touchEndX = 0;
    
    lightboxContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    lightboxContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe gauche -> image suivante
                showNextLightboxImage();
            } else {
                // Swipe droit -> image précédente
                showPrevLightboxImage();
            }
        }
    }
}

// Ouvrir la lightbox
function openLightbox(images, startIndex = 0) {
    console.log('🖼️ Ouverture de la lightbox avec', images.length, 'images');
    
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) {
        console.error('❌ Lightbox non trouvée');
        return;
    }
    
    // Stocker les images globalement
    lightboxImages = images;
    currentLightboxIndex = startIndex;
    
    // Afficher la lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden'; // Empêcher le scroll
    
    // Mettre à jour l'affichage
    updateLightboxDisplay();
    
    // Générer les miniatures (seulement si plus d'une image)
    if (images.length > 1) {
        generateLightboxThumbnails();
    } else {
        const thumbnailsContainer = document.getElementById('lightboxThumbnails');
        if (thumbnailsContainer) {
            thumbnailsContainer.style.display = 'none';
        }
    }
    
    console.log('✅ Lightbox ouverte');
}

// Mettre à jour l'affichage de la lightbox
function updateLightboxDisplay() {
    const lightboxImage = document.querySelector('.lightbox-image');
    const lightboxTitle = document.querySelector('.lightbox-title');
    const lightboxDescription = document.querySelector('.lightbox-description');
    const lightboxCounter = document.querySelector('.lightbox-counter');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    
    if (lightboxImages.length === 0) {
        console.warn('⚠️ Aucune image à afficher dans la lightbox');
        return;
    }
    
    const currentImage = lightboxImages[currentLightboxIndex];
    
    // Mettre à jour l'image
    if (lightboxImage) {
        lightboxImage.src = currentImage.src || currentImage.url;
        lightboxImage.alt = currentImage.alt || currentImage.title || '';
        
        // Ajouter un indicateur de chargement
        lightboxImage.onload = () => {
            lightboxImage.classList.add('loaded');
        };
        
        lightboxImage.classList.remove('loaded');
    }
    
    // Mettre à jour le titre
    if (lightboxTitle) {
        lightboxTitle.textContent = currentImage.title || '';
    }
    
    // Mettre à jour la description
    if (lightboxDescription) {
        lightboxDescription.textContent = currentImage.description || '';
    }
    
    // Mettre à jour le compteur
    if (lightboxCounter) {
        lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${lightboxImages.length}`;
    }
    
    // Afficher/masquer les boutons de navigation selon le nombre d'images
    if (prevBtn) {
        prevBtn.style.display = lightboxImages.length > 1 ? 'flex' : 'none';
    }
    if (nextBtn) {
        nextBtn.style.display = lightboxImages.length > 1 ? 'flex' : 'none';
    }
    
    // Mettre à jour la miniature active
    updateActiveThumbnail();
    
    console.log(`📷 Affichage image ${currentLightboxIndex + 1}/${lightboxImages.length}`);
}

// Générer les miniatures
function generateLightboxThumbnails() {
    const thumbnailsContainer = document.getElementById('lightboxThumbnails');
    if (!thumbnailsContainer || lightboxImages.length <= 1) {
        if (thumbnailsContainer) {
            thumbnailsContainer.style.display = 'none';
        }
        return;
    }
    
    thumbnailsContainer.style.display = 'flex';
    thumbnailsContainer.innerHTML = '';
    
    lightboxImages.forEach((image, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'lightbox-thumbnail';
        if (index === currentLightboxIndex) {
            thumbnail.classList.add('active');
        }
        
        thumbnail.innerHTML = `
            <img src="${image.src || image.url}" 
                 alt="${image.alt || ''}"
                 loading="lazy"
                 onerror="this.src='https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=150&h=100&fit=crop'">
        `;
        
        thumbnail.addEventListener('click', () => {
            currentLightboxIndex = index;
            updateLightboxDisplay();
        });
        
        thumbnailsContainer.appendChild(thumbnail);
    });
}

// Mettre à jour la miniature active
function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.lightbox-thumbnail');
    thumbnails.forEach((thumb, index) => {
        if (index === currentLightboxIndex) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

// Afficher l'image précédente
function showPrevLightboxImage() {
    if (lightboxImages.length <= 1) return;
    
    currentLightboxIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    updateLightboxDisplay();
}

// Afficher l'image suivante
function showNextLightboxImage() {
    if (lightboxImages.length <= 1) return;
    
    currentLightboxIndex = (currentLightboxIndex + 1) % lightboxImages.length;
    updateLightboxDisplay();
}

// Fermer la lightbox
function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Réactiver le scroll
        lightboxImages = [];
        currentLightboxIndex = 0;
        console.log('✅ Lightbox fermée');
    }
}

// Fonction principale pour ouvrir la lightbox d'un portfolio
async function openPortfolioLightbox(portfolioId, clickedImageSrc = null) {
    console.log('🎯 Ouverture lightbox pour portfolio ID:', portfolioId);
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        console.log('🔄 Initialisation de Supabase pour la lightbox...');
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Impossible d\'initialiser Supabase pour la lightbox');
        openLightboxFromVisibleImage(portfolioId, clickedImageSrc);
        return;
    }
    
    try {
        // Récupérer les données du portfolio depuis Supabase
        const { data: portfolioItem, error } = await supabaseClient
            .from('portfolio')
            .select('*')
            .eq('id', portfolioId)
            .single();
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            openLightboxFromVisibleImage(portfolioId, clickedImageSrc);
            return;
        }
        
        if (!portfolioItem) {
            console.error('❌ Portfolio non trouvé');
            return;
        }
        
        console.log('📊 Portfolio récupéré:', portfolioItem.title);
        console.log('📸 Champ photos:', portfolioItem.photos);
        console.log('📸 Type de photos:', typeof portfolioItem.photos);
        
        // Créer un tableau pour toutes les images du portfolio
        const portfolioImages = [];
        
        // 1. Ajouter l'image principale (OBLIGATOIRE - champ NOT NULL)
        if (portfolioItem.image_url) {
            portfolioImages.push({
                src: portfolioItem.image_url,
                alt: portfolioItem.title || 'Portfolio',
                title: portfolioItem.title || '',
                description: portfolioItem.description || '',
                price: portfolioItem.price ? `${portfolioItem.price} DA` : '',
                isMain: true
            });
        }
        
        // 2. Ajouter les photos supplémentaires depuis le champ JSONB
        if (portfolioItem.photos) {
            try {
                let additionalPhotos = [];
                
                // Gérer différents formats possibles
                if (Array.isArray(portfolioItem.photos)) {
                    // Déjà un tableau
                    additionalPhotos = portfolioItem.photos;
                } else if (typeof portfolioItem.photos === 'string') {
                    // Chaîne JSON
                    try {
                        additionalPhotos = JSON.parse(portfolioItem.photos);
                    } catch (parseError) {
                        console.log('⚠️ Impossible de parser JSON, traitement comme texte brut');
                        // Si c'est une simple chaîne URL, la traiter comme un tableau
                        if (portfolioItem.photos.includes('http')) {
                            additionalPhotos = [portfolioItem.photos];
                        } else if (portfolioItem.photos.includes(',')) {
                            // Séparer par virgules
                            additionalPhotos = portfolioItem.photos.split(',').map(url => url.trim());
                        }
                    }
                } else if (portfolioItem.photos && typeof portfolioItem.photos === 'object') {
                    // Objet JSONB
                    additionalPhotos = Object.values(portfolioItem.photos);
                }
                
                console.log(`📸 ${additionalPhotos.length} photos supplémentaires trouvées`);
                
                // Ajouter chaque photo supplémentaire
                if (Array.isArray(additionalPhotos)) {
                    additionalPhotos.forEach((photo, index) => {
                        if (photo && typeof photo === 'string') {
                            portfolioImages.push({
                                src: photo.trim(),
                                alt: `${portfolioItem.title} - Photo ${index + 2}`,
                                title: `${portfolioItem.title} - Vue ${index + 2}`,
                                description: `${portfolioItem.description || ''} - Angle ${index + 2}`,
                                price: portfolioItem.price ? `${portfolioItem.price} DA` : '',
                                isMain: false
                            });
                        }
                    });
                }
                
            } catch (e) {
                console.error('❌ Erreur lors du traitement des photos:', e);
                console.log('Valeur brute de photos:', portfolioItem.photos);
            }
        }
        
        console.log(`🎯 Total images pour ce portfolio: ${portfolioImages.length}`);
        
        // 3. Si aucune photo supplémentaire, on peut ajouter un message
        if (portfolioImages.length === 1) {
            console.log('ℹ️ Ce portfolio n\'a qu\'une seule image');
        }
        
        // Afficher toutes les URLs pour debug
        portfolioImages.forEach((img, index) => {
            console.log(`  Image ${index + 1}: ${img.src.substring(0, 80)}...`);
        });
        
        // 4. Trouver l'index de départ
        let startIndex = 0;
        if (clickedImageSrc) {
            startIndex = portfolioImages.findIndex(img => {
                // Comparer les URLs (peuvent être différents formats)
                const imgSrc = img.src.trim();
                const clickedSrc = clickedImageSrc.trim();
                return imgSrc === clickedSrc || 
                       imgSrc.includes(clickedSrc) || 
                       clickedSrc.includes(imgSrc);
            });
            if (startIndex === -1) startIndex = 0;
        }
        
        // 5. Ouvrir la lightbox
        if (portfolioImages.length > 0) {
            openLightbox(portfolioImages, startIndex);
        } else {
            console.error('❌ Aucune image trouvée pour ce portfolio');
            openLightboxFromVisibleImage(portfolioId, clickedImageSrc);
        }
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du portfolio:', error);
        openLightboxFromVisibleImage(portfolioId, clickedImageSrc);
    }
}

// Fallback : utiliser l'image visible sur la page
function openLightboxFromVisibleImage(portfolioId, clickedImageSrc = null) {
    console.log('🔄 Fallback: Utilisation de l\'image visible');
    
    const portfolioElement = document.querySelector(`.portfolio-item[data-id="${portfolioId}"], .carousel-item[data-id="${portfolioId}"]`);
    
    if (!portfolioElement) return;
    
    const mainImg = portfolioElement.querySelector('img');
    const portfolioImages = [];
    
    if (mainImg && mainImg.src) {
        portfolioImages.push({
            src: mainImg.src,
            alt: mainImg.alt || '',
            title: portfolioElement.querySelector('h3')?.textContent || '',
            description: portfolioElement.querySelector('p')?.textContent || ''
        });
    }
    
    if (portfolioImages.length > 0) {
        openLightbox(portfolioImages, 0);
    }
}

// Remplacer la fonction showPortfolioModal existante
window.showPortfolioModal = async function(itemId, event) {
    console.log('🔍 showPortfolioModal appelé pour:', itemId);
    
    // Récupérer l'élément qui a été cliqué
    const clickedElement = event?.target || document.activeElement;
    const clickedImage = clickedElement.tagName === 'IMG' ? clickedElement : clickedElement.querySelector('img');
    const clickedImageSrc = clickedImage ? clickedImage.src : null;
    
    console.log('📸 Image cliquée:', clickedImageSrc);
    
    // Utiliser la nouvelle fonction
    await openPortfolioLightbox(itemId, clickedImageSrc);
};

// Initialiser la lightbox au chargement
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎬 Initialisation de la lightbox au chargement...');
    
    // Attendre un peu que le DOM soit chargé
    setTimeout(async () => {
        try {
            // Initialiser la lightbox (qui initialisera Supabase)
            await initLightbox();
            
            // Ajouter des événements de clic directs aux images
            document.querySelectorAll('.portfolio-item img, .carousel-item img').forEach((img) => {
                img.style.cursor = 'pointer';
                
                // Trouver l'ID du portfolio
                const portfolioItem = img.closest('.portfolio-item, .carousel-item');
                if (portfolioItem) {
                    const portfolioId = portfolioItem.dataset.id;
                    if (portfolioId) {
                        img.addEventListener('click', async (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('📸 Image cliquée, portfolio ID:', portfolioId);
                            await openPortfolioLightbox(portfolioId, img.src);
                        });
                    }
                }
            });
            
            console.log('✅ Lightbox initialisée avec succès');
        } catch (error) {
            console.error('❌ Erreur initialisation lightbox:', error);
        }
    }, 1500);
});

// ============================================
// FONCTIONS UTILITAIRES POUR L'ADMINISTRATION
// ============================================

// Fonction pour tester un portfolio spécifique
window.testPortfolioLightbox = async function(portfolioId) {
    console.log('🧪 TEST: Vérification des données du portfolio', portfolioId);
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Supabase non disponible pour le test');
        return;
    }
    
    const { data, error } = await supabaseClient
        .from('portfolio')
        .select('id, title, image_url, photos')
        .eq('id', portfolioId)
        .single();
    
    if (error) {
        console.error('❌ Erreur Supabase:', error);
        return;
    }
    
    console.log('📊 Données portfolio:', {
        id: data.id,
        title: data.title,
        image_url: data.image_url,
        photos: data.photos,
        photos_type: typeof data.photos,
        photos_length: Array.isArray(data.photos) ? data.photos.length : 'N/A'
    });
    
    // Afficher chaque photo
    if (data.photos && Array.isArray(data.photos)) {
        data.photos.forEach((photo, index) => {
            console.log(`  Photo ${index + 1}:`, photo);
        });
    }
    
    // Ouvrir la lightbox pour tester
    await openPortfolioLightbox(portfolioId);
};

// Fonction pour ajouter des photos de test à un portfolio
window.addDemoPhotosToPortfolio = async function(portfolioId) {
    console.log('🎭 Ajout de photos de démo au portfolio:', portfolioId);
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Supabase non disponible');
        return;
    }
    
    const demoPhotos = [
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop",
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&h=600&fit=crop"
    ];
    
    const { error } = await supabaseClient
        .from('portfolio')
        .update({ photos: demoPhotos })
        .eq('id', portfolioId);
    
    if (error) {
        console.error('❌ Erreur:', error);
        return;
    }
    
    console.log('✅ Photos de démo ajoutées');
    alert('✅ Photos de démo ajoutées avec succès !');
    
    // Recharger la lightbox
    await openPortfolioLightbox(portfolioId);
};

// Fonction pour vider les photos d'un portfolio
window.clearPortfolioPhotos = async function(portfolioId) {
    console.log('🗑️ Nettoyage des photos du portfolio:', portfolioId);
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Supabase non disponible');
        return;
    }
    
    const { error } = await supabaseClient
        .from('portfolio')
        .update({ photos: [] })
        .eq('id', portfolioId);
    
    if (error) {
        console.error('❌ Erreur:', error);
        return;
    }
    
    console.log('✅ Photos vidées');
    alert('✅ Photos vidées avec succès !');
};

// ============================================
// FONCTIONS DE DEBUG POUR L'ADMINISTRATION
// ============================================

// Fonction de debug pour voir les données brutes d'un portfolio
window.debugPortfolioData = async function(portfolioId) {
    console.log('🔍 DEBUG: Vérification des données portfolio', portfolioId);
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Supabase non disponible pour le debug');
        return;
    }
    
    try {
        const { data: portfolioItem, error } = await supabaseClient
            .from('portfolio')
            .select('id, title, image_url, photos, description')
            .eq('id', portfolioId)
            .single();
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return;
        }
        
        console.log('📊 ========== DONNÉES BRUTES DU PORTFOLIO ==========');
        console.log('📋 ID:', portfolioItem.id);
        console.log('🏷️ Titre:', portfolioItem.title);
        console.log('🖼️ image_url:', portfolioItem.image_url);
        console.log('📸 photos (type):', typeof portfolioItem.photos);
        console.log('📸 photos (valeur brute):', portfolioItem.photos);
        
        // Vérifier si les photos sont un array
        console.log('📸 Est un array?', Array.isArray(portfolioItem.photos));
        
        // Afficher la structure si c'est un objet
        if (portfolioItem.photos && typeof portfolioItem.photos === 'object' && !Array.isArray(portfolioItem.photos)) {
            console.log('📸 Clés de l\'objet photos:', Object.keys(portfolioItem.photos));
            console.log('📸 Valeurs de l\'objet photos:', Object.values(portfolioItem.photos));
        }
        
        // Essayer de parser les photos si c'est une chaîne
        if (typeof portfolioItem.photos === 'string') {
            console.log('📸 Longueur de la chaîne:', portfolioItem.photos.length);
            console.log('📸 50 premiers caractères:', portfolioItem.photos.substring(0, 50) + '...');
            
            try {
                const parsed = JSON.parse(portfolioItem.photos);
                console.log('✅ Parsing JSON réussi!');
                console.log('📸 photos (parsed):', parsed);
                console.log('📸 Type après parsing:', typeof parsed);
                console.log('📸 Est un array après parsing?', Array.isArray(parsed));
                
                if (Array.isArray(parsed)) {
                    console.log(`📸 Nombre de photos dans l'array: ${parsed.length}`);
                    parsed.forEach((photo, i) => {
                        console.log(`  📷 Photo ${i + 1}: ${photo}`);
                    });
                }
            } catch (e) {
                console.log('❌ Échec du parsing JSON:', e.message);
                console.log('📸 La chaîne pourrait contenir:');
                if (portfolioItem.photos.includes('[') && portfolioItem.photos.includes(']')) {
                    console.log('  - Crochets détectés, essayez de corriger le JSON');
                } else if (portfolioItem.photos.includes('http')) {
                    console.log('  - URL(s) détectée(s) dans la chaîne');
                    // Trouver toutes les URLs
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = portfolioItem.photos.match(urlRegex);
                    if (urls) {
                        console.log(`  - ${urls.length} URL(s) trouvée(s):`);
                        urls.forEach((url, i) => {
                            console.log(`    URL ${i + 1}: ${url}`);
                        });
                    }
                }
            }
        }
        
        console.log('📊 ========== FIN DU DEBUG ==========');
        
        // Tester la fonction openPortfolioLightbox
        console.log('🎯 Test de openPortfolioLightbox...');
        await openPortfolioLightbox(portfolioId);
        
    } catch (error) {
        console.error('❌ Erreur debug:', error);
    }
};

// Fonction pour tester TOUS les portfolios
window.debugAllPortfolios = async function() {
    console.log('🔍 DEBUG: Vérification de TOUS les portfolios');
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Supabase non disponible pour le debug');
        return;
    }
    
    try {
        const { data: portfolios, error } = await supabaseClient
            .from('portfolio')
            .select('id, title, image_url, photos')
            .eq('status', 'approved')
            .eq('is_visible', true)
            .limit(10);
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return;
        }
        
        console.log(`📊 ${portfolios.length} portfolios trouvés`);
        
        portfolios.forEach((portfolio, index) => {
            console.log(`\n📋 Portfolio ${index + 1}: ${portfolio.title} (ID: ${portfolio.id})`);
            console.log(`  🖼️ image_url: ${portfolio.image_url}`);
            console.log(`  📸 photos type: ${typeof portfolio.photos}`);
            
            if (Array.isArray(portfolio.photos)) {
                console.log(`  📸 ${portfolio.photos.length} photo(s) supplémentaire(s)`);
                portfolio.photos.forEach((photo, i) => {
                    console.log(`    📷 ${i + 1}: ${photo}`);
                });
            } else if (typeof portfolio.photos === 'string') {
                console.log(`  📸 Chaîne photos: ${portfolio.photos.substring(0, 100)}...`);
            }
        });
        
    } catch (error) {
        console.error('❌ Erreur debugAllPortfolios:', error);
    }
};

// Fonction pour corriger un portfolio spécifique
window.fixPortfolioPhotos = async function(portfolioId) {
    console.log('🔧 Fix: Correction du format des photos pour portfolio', portfolioId);
    
    // Ensure supabaseClient is available
    if (!supabaseClient) {
        await initSupabaseForLightbox();
    }
    
    if (!supabaseClient) {
        console.error('❌ Supabase non disponible');
        return;
    }
    
    try {
        // Récupérer le portfolio
        const { data: portfolioItem, error } = await supabaseClient
            .from('portfolio')
            .select('id, title, photos')
            .eq('id', portfolioId)
            .single();
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            return;
        }
        
        console.log('📊 Portfolio avant correction:', portfolioItem);
        
        let correctedPhotos = [];
        
        // Si photos est une chaîne
        if (typeof portfolioItem.photos === 'string') {
            try {
                // Essayer de parser comme JSON
                const parsed = JSON.parse(portfolioItem.photos);
                if (Array.isArray(parsed)) {
                    correctedPhotos = parsed;
                } else if (parsed && typeof parsed === 'object') {
                    correctedPhotos = Object.values(parsed);
                } else {
                    correctedPhotos = [portfolioItem.photos];
                }
            } catch (e) {
                // Si échec, traiter comme URL simple ou liste séparée par virgules
                if (portfolioItem.photos.includes(',')) {
                    correctedPhotos = portfolioItem.photos.split(',').map(url => url.trim());
                } else {
                    correctedPhotos = [portfolioItem.photos];
                }
            }
        } 
        // Si photos est un objet
        else if (portfolioItem.photos && typeof portfolioItem.photos === 'object' && !Array.isArray(portfolioItem.photos)) {
            correctedPhotos = Object.values(portfolioItem.photos);
        }
        // Si photos est déjà un array
        else if (Array.isArray(portfolioItem.photos)) {
            correctedPhotos = portfolioItem.photos;
        }
        
        console.log('📸 Photos après correction:', correctedPhotos);
        
        // Mettre à jour dans la base de données
        const { data, error: updateError } = await supabaseClient
            .from('portfolio')
            .update({ photos: correctedPhotos })
            .eq('id', portfolioId)
            .select();
        
        if (updateError) {
            console.error('❌ Erreur lors de la mise à jour:', updateError);
            return;
        }
        
        console.log('✅ Portfolio mis à jour avec succès!');
        console.log('📊 Données mises à jour:', data);
        
        // Tester la lightbox après correction
        setTimeout(() => {
            openPortfolioLightbox(portfolioId);
        }, 1000);
        
    } catch (error) {
        console.error('❌ Erreur fixPortfolioPhotos:', error);
    }
};

// ============================================
// Exporter les fonctions
// ============================================
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.showPrevLightboxImage = showPrevLightboxImage;
window.showNextLightboxImage = showNextLightboxImage;
window.openPortfolioLightbox = openPortfolioLightbox;