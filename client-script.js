// ============================================
// CLIENT SCRIPT - ALGERIAN MODELS CAMP
// ============================================

console.log('🚀 client-script.js chargé');

// Charger Supabase via script tag
function loadSupabase() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            console.log('✅ Supabase déjà chargé');
            resolve(window.supabase);
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        script.onload = () => {
            console.log('✅ Supabase chargé via UMD');
            resolve(window.supabase);
        };
        script.onerror = (error) => {
            console.error('❌ Erreur de chargement de Supabase:', error);
            reject(error);
        };
        document.head.appendChild(script);
    });
}

// Configuration Supabase
const SUPABASE_CONFIG = {
    url: 'https://rzitbfwptcmdlwxemluk.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aXRiZndwdGNtZGx3eGVtbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTMzMTIsImV4cCI6MjA3ODQyOTMxMn0.oCNi8pCb-3rpwc3dyKwoNkcM5Vjkys1J8eO2eoaRT9Y'
};

let supabase;
let negotiatedPrices = {};

// ============================================
// DARK THEME FUNCTIONS
// ============================================

function initializeClientDarkMode() {
    console.log('🌙 Initialisation du dark mode client...');
    
    const themeToggle = document.getElementById('clientThemeToggle');
    
    if (!themeToggle) {
        console.error('❌ Bouton clientThemeToggle non trouvé !');
        return;
    }
    
    console.log('✅ Bouton clientThemeToggle trouvé');
    
    // Fonction pour basculer le thème
    const toggleTheme = () => {
        const html = document.documentElement;
        const isDark = html.classList.contains('dark-theme');
        
        if (isDark) {
            html.classList.remove('dark-theme');
            localStorage.setItem('clientTheme', 'light');
            themeToggle.innerHTML = '<span>🌙</span><span class="toggle-text">Mode Sombre</span>';
            console.log('🔆 Passage en mode clair');
        } else {
            html.classList.add('dark-theme');
            localStorage.setItem('clientTheme', 'dark');
            themeToggle.innerHTML = '<span>☀️</span><span class="toggle-text">Mode Clair</span>';
            console.log('🌙 Passage en mode sombre');
        }
    };
    
    // Appliquer le thème sauvegardé
    const savedTheme = localStorage.getItem('clientTheme') || 'light';
    console.log('📁 Thème sauvegardé:', savedTheme);
    
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark-theme');
        themeToggle.innerHTML = '<span>☀️</span><span class="toggle-text">Mode Clair</span>';
        console.log('✅ Mode sombre appliqué');
    } else {
        document.documentElement.classList.remove('dark-theme');
        themeToggle.innerHTML = '<span>🌙</span><span class="toggle-text">Mode Sombre</span>';
        console.log('✅ Mode clair appliqué');
    }
    
    // Ajouter l'événement click
    themeToggle.addEventListener('click', toggleTheme);
    console.log('✅ Écouteur d\'événement ajouté au bouton');
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        text-align: center;
        max-width: 80%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', sans-serif;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #4caf50;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 9999;
        text-align: center;
        max-width: 80%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        font-family: 'Segoe UI', sans-serif;
    `;
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 5000);
}

function getCategoryName(category) {
    return "Mode";
}

function getDurationText(durationValue, startDate, endDate, simpleDate) {
    if (!durationValue) return 'Durée non spécifiée';
    
    const selectedDate = simpleDate || startDate;
    
    switch(durationValue) {
        case 'half-day':
            return `Demi-journée (4h) le ${formatDateFR(selectedDate)}`;
        case 'full-day':
            return `Journée complète (8h) le ${formatDateFR(selectedDate)}`;
        case 'weekend':
            if (!selectedDate) return 'Week-end (2 jours)';
            const weekendEnd = new Date(selectedDate);
            weekendEnd.setDate(weekendEnd.getDate() + 1);
            return `Week-end (2 jours) du ${formatDateFR(selectedDate)} au ${formatDateFR(weekendEnd.toISOString().split('T')[0])}`;
        case 'week':
            if (!selectedDate) return 'Semaine (5 jours)';
            const weekEnd = new Date(selectedDate);
            weekEnd.setDate(weekEnd.getDate() + 4);
            return `Semaine (5 jours) du ${formatDateFR(selectedDate)} au ${formatDateFR(weekEnd.toISOString().split('T')[0])}`;
        case 'custom':
            if (!startDate || !endDate) return 'Période personnalisée';
            return `Période personnalisée du ${formatDateFR(startDate)} au ${formatDateFR(endDate)}`;
        default:
            return 'Durée non spécifiée';
    }
}

function formatDateFR(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('fr-FR', options);
    } catch (error) {
        console.error('Erreur formatage date:', error);
        return dateString;
    }
}



// ============================================
// CHARGEMENT DES DONNÉES
// ============================================

async function loadModels() {
    console.log('🔍 Chargement des modèles...');
    
    const modelsGrid = document.getElementById('modelsGrid');
    if (!modelsGrid) {
        console.error('❌ modelsGrid non trouvé');
        return;
    }
    
    modelsGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #666;">Chargement des modèles...</div>';
    
    try {
        const { data: models, error } = await supabase
            .from('portfolio')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            modelsGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #f44336;">Erreur de chargement des modèles</div>';
            return;
        }
        
        if (models && models.length > 0) {
            console.log(`✅ ${models.length} modèles trouvés`);
            
            const modelSelect = document.getElementById('modelSelect');
            
            // Générer le HTML des modèles
            const modelsHTML = models.map(model => {
                const basePrice = model.price || 5000;
                negotiatedPrices[model.id] = basePrice;
                
                return `
                <div class="model-card" data-category="${model.category}">
                    <div style="width: 100%; height: 300px; display: flex; justify-content: center; align-items: center; background: #f5f5f5; border-radius: 10px 10px 0 0; overflow: hidden;">
                        <img src="${model.image_url}" alt="${model.title}" 
                             style="max-width: 100%; max-height: 100%; object-fit: contain; display: block;">
                    </div>
                    <div class="model-info">
                        <h3>${model.title}</h3>
                        <p>${model.description}</p>
                        <span class="model-category">Mode</span>
                        ${model.price ? `
                            <div class="model-price">${model.price} DA</div>
                            <div class="price-negotiation">
                                <button class="price-btn minus-btn" data-model-id="${model.id}">−</button>
                                <span class="negotiated-price" id="price-${model.id}">${model.price} DA</span>
                                <button class="price-btn plus-btn" data-model-id="${model.id}">+</button>
                            </div>
                        ` : ''}
                        <button class="btn-primary details-btn" style="width: 100%; margin-top: 1rem;" 
                                data-model-id="${model.id}">
                            Voir les détails
                        </button>
                    </div>
                </div>
                `;
            }).join('');
            
            modelsGrid.innerHTML = modelsHTML;
            
            // Remplir le select des modèles
            if (modelSelect) {
                modelSelect.innerHTML = '<option value="">Choisir un modèle...</option>' + 
                    models.map(model => `<option value="${model.id}">${model.title}</option>`).join('');
            }
            
            // Ajouter les événements
            addModelEventListeners();
            
        } else {
            console.log('ℹ️ Aucun modèle trouvé');
            modelsGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #666;">Aucun modèle disponible pour le moment.</div>';
        }
    } catch (error) {
        console.error('❌ Erreur de chargement:', error);
        modelsGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #f44336;">Erreur de chargement des modèles</div>';
    }
}

async function loadPrices() {
    console.log('💰 Chargement des tarifs...');
    
    const pricesGrid = document.getElementById('pricesGrid');
    if (!pricesGrid) {
        console.error('❌ pricesGrid non trouvé');
        return;
    }
    
    pricesGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #666;">Chargement des tarifs...</div>';
    
    try {
        const { data: prices, error } = await supabase
            .from('prices')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('❌ Erreur Supabase:', error);
            pricesGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #f44336;">Erreur de chargement des tarifs</div>';
            return;
        }
        
        if (prices && prices.length > 0) {
            console.log(`✅ ${prices.length} tarifs trouvés`);
            
            pricesGrid.innerHTML = prices.map(price => `
                <div class="price-card">
                    <h3>${price.service_type}</h3>
                    <div class="price-amount">${price.price} DA</div>
                    <p>${price.description || ''}</p>
                </div>
            `).join('');
        } else {
            console.log('ℹ️ Aucun tarif trouvé');
            pricesGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #666;">Aucun tarif disponible pour le moment.</div>';
        }
    } catch (error) {
        console.error('❌ Erreur de chargement:', error);
        pricesGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #f44336;">Erreur de chargement des tarifs</div>';
    }
}

// ============================================
// GESTION DES ÉVÉNEMENTS
// ============================================

function addModelEventListeners() {
    console.log('🔗 Ajout des événements modèles');
    
    // Boutons de prix
    document.querySelectorAll('.price-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const modelId = this.getAttribute('data-model-id');
            const adjustment = this.classList.contains('minus-btn') ? -500 : 500;
            adjustPrice(modelId, adjustment);
        });
    });
    
    // Boutons détails
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const modelId = this.getAttribute('data-model-id');
            showModelDetails(modelId);
        });
    });
    
    // Filtres
    document.querySelectorAll('.models-filters .filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.models-filters .filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            document.querySelectorAll('.model-card').forEach(item => {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

function adjustPrice(modelId, adjustment) {
    console.log(`💰 Ajustement prix ${modelId}: ${adjustment}`);
    
    const currentPrice = negotiatedPrices[modelId] || 0;
    const newPrice = Math.max(0, currentPrice + adjustment);
    negotiatedPrices[modelId] = newPrice;
    
    const priceElement = document.getElementById(`price-${modelId}`);
    if (priceElement) {
        priceElement.textContent = `${newPrice} DA`;
        
        // Feedback visuel
        priceElement.style.transform = 'scale(1.2)';
        priceElement.style.color = adjustment > 0 ? '#4caf50' : '#ff6b6b';
        
        setTimeout(() => {
            priceElement.style.transform = 'scale(1)';
            priceElement.style.color = 'var(--primary-color)';
        }, 300);
        
        // Mettre à jour l'affichage dans la section paiement si ce modèle est sélectionné
        const modelSelect = document.getElementById('modelSelect');
        if (modelSelect && modelSelect.value === modelId) {
            // Appeler la fonction updatePriceDisplay si elle existe
            if (typeof updatePriceDisplay === 'function') {
                updatePriceDisplay();
            }
        }
    }
}

async function showModelDetails(modelId) {
    console.log(`📋 Détails modèle: ${modelId}`);
    
    try {
        const { data: model, error } = await supabase
            .from('portfolio')
            .select('*')
            .eq('id', modelId)
            .single();
        
        if (error) {
            console.error('❌ Erreur détails:', error);
            showError('Erreur de chargement des détails');
            return;
        }
        
        if (model) {
            const modal = document.getElementById('modelModal');
            const details = document.getElementById('modelDetails');
            const negotiatedPrice = negotiatedPrices[modelId] || model.price || 0;
            
            details.innerHTML = `
                <h2 style="color: var(--secondary-color); margin-bottom: 1.5rem;">${model.title}</h2>
                <div style="display: flex; justify-content: center; margin: 1rem 0;">
                    <img src="${model.image_url}" alt="${model.title}" 
                         style="max-width: 100%; max-height: 500px; object-fit: contain; border-radius: 10px;">
                </div>
                <p style="margin: 1rem 0; line-height: 1.8; color: var(--text-color);">${model.description}</p>
                <p><strong>Catégorie :</strong> Mode</p>
                ${model.price ? `
                    <p><strong>Prix de base :</strong> ${model.price} DA</p>
                    <p><strong>Prix négocié :</strong> 
                        <span style="color: var(--primary-color); font-size: 1.5rem; font-weight: bold;">
                            ${negotiatedPrice} DA
                        </span>
                    </p>
                ` : ''}
                <button class="btn-primary" style="width: 100%; margin-top: 2rem;" 
                        onclick="closeModalAndBook('${modelId}')">
                    Réserver ce modèle
                </button>
            `;
            
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('❌ Erreur détails:', error);
        showError('Erreur de chargement des détails');
    }
}

// Fonction globale pour fermer modal et réserver
window.closeModalAndBook = function(modelId) {
    const modal = document.getElementById('modelModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
        bookingSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.value = modelId;
    }
};

// ============================================
// CONFIGURATION DE L'INTERFACE
// ============================================

function setupSidebar() {
    console.log('📱 Configuration sidebar');
    
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('clientSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sidebarClose = document.getElementById('sidebarClose');

    if (mobileMenuToggle && sidebar) {
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        });
    }

    if (sidebarClose) {
        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }

    // Fermer sidebar au clic sur les liens
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 1024) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        });
    });
}

function setupSmoothScroll() {
    console.log('🔗 Configuration smooth scroll');
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

function setupPaymentToggle() {
    console.log('💳 Configuration paiement');
    
    const paymentMethod = document.getElementById('paymentMethod');
    const onlineSection = document.getElementById('onlinePaymentSection');
    
    if (paymentMethod && onlineSection) {
        paymentMethod.addEventListener('change', (e) => {
            onlineSection.style.display = e.target.value === 'online' ? 'block' : 'none';
        });
    }
}

// Setup Payment Information (pour paiement sur place)
function setupPaymentInfo() {
    console.log('💰 Configuration des informations de paiement');
    
    const paymentMethod = document.getElementById('paymentMethod');
    const onlineSection = document.getElementById('onlinePaymentSection');
    const originalPriceElement = document.getElementById('originalPrice');
    const negotiatedPriceElement = document.getElementById('negotiatedPriceDisplay');
    const priceDifferenceElement = document.getElementById('priceDifference');
    const differenceAmountElement = document.getElementById('differenceAmount');
    const differenceTextElement = document.getElementById('differenceText');
    
    // Mettre à jour les prix affichés
    function updatePriceDisplay() {
        const modelSelect = document.getElementById('modelSelect');
        if (!modelSelect || !originalPriceElement || !negotiatedPriceElement) return;
        
        const selectedModelId = modelSelect.value;
        
        if (selectedModelId) {
            // Récupérer le prix de base du modèle (fixe)
            const basePrice = getModelBasePrice(selectedModelId);
            // Récupérer le prix négocié (ou le prix de base si pas encore négocié)
            const negotiatedPrice = negotiatedPrices[selectedModelId] || basePrice;
            
            // Afficher les deux prix
            originalPriceElement.textContent = `${basePrice} DA`;
            negotiatedPriceElement.textContent = `${negotiatedPrice} DA`;
            
            // Afficher la différence si négociation
            if (negotiatedPrice !== basePrice) {
                const difference = negotiatedPrice - basePrice;
                const differenceAbs = Math.abs(difference);
                
                // Configurer l'affichage de la différence
                if (difference > 0) {
                    // Client a augmenté le prix
                    priceDifferenceElement.style.display = 'block';
                    priceDifferenceElement.style.background = 'rgba(76, 175, 80, 0.1)';
                    priceDifferenceElement.style.color = 'var(--success-color)';
                    priceDifferenceElement.style.border = '1px solid var(--success-color)';
                    differenceAmountElement.textContent = `+${difference} DA`;
                    differenceTextElement.textContent = `(vous proposez ${differenceAbs} DA de plus)`;
                } else if (difference < 0) {
                    // Client a baissé le prix
                    priceDifferenceElement.style.display = 'block';
                    priceDifferenceElement.style.background = 'rgba(244, 67, 54, 0.1)';
                    priceDifferenceElement.style.color = 'var(--error-color)';
                    priceDifferenceElement.style.border = '1px solid var(--error-color)';
                    differenceAmountElement.textContent = `${difference} DA`;
                    differenceTextElement.textContent = `(vous proposez ${differenceAbs} DA de moins)`;
                }
            } else {
                // Pas de négociation, cacher l'indicateur
                priceDifferenceElement.style.display = 'none';
            }
        } else {
            // Pas de modèle sélectionné
            originalPriceElement.textContent = '0 DA';
            negotiatedPriceElement.textContent = '0 DA';
            priceDifferenceElement.style.display = 'none';
        }
    }
    
    // Fonction pour obtenir le prix de base du modèle (fixe)
    function getModelBasePrice(modelId) {
        // Chercher le prix original dans la liste des modèles chargés
        const modelCards = document.querySelectorAll('.model-card');
        for (const card of modelCards) {
            if (card.getAttribute('data-category')) { // Vérifier que c'est bien une carte modèle
                const modelTitle = card.querySelector('h3');
                if (modelTitle) {
                    // Chercher par titre approximatif
                    const modelSelect = document.getElementById('modelSelect');
                    if (modelSelect) {
                        const options = modelSelect.options;
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].value === modelId) {
                                // Trouvé le modèle correspondant, chercher son prix
                                const priceElement = card.querySelector('.model-price');
                                if (priceElement) {
                                    const priceText = priceElement.textContent.replace(' DA', '').trim();
                                    return parseInt(priceText) || 0;
                                }
                            }
                        }
                    }
                }
            }
        }
        return 0;
    }
    
    // Écouter les changements de modèle
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', updatePriceDisplay);
    }
    
    // Fonction pour surveiller les changements de prix négociés
    function monitorPriceChanges() {
        // Observer les changements dans les prix négociés
        const priceElements = document.querySelectorAll('.negotiated-price');
        priceElements.forEach(element => {
            // Utiliser MutationObserver pour détecter les changements de texte
            const observer = new MutationObserver(() => {
                const selectedModelId = document.getElementById('modelSelect').value;
                if (selectedModelId) {
                    // Extraire le nouveau prix de l'élément
                    const newPriceText = element.textContent.replace(' DA', '').trim();
                    const newPrice = parseInt(newPriceText) || 0;
                    
                    // Mettre à jour dans negotiatedPrices
                    negotiatedPrices[selectedModelId] = newPrice;
                    
                    // Mettre à jour l'affichage
                    updatePriceDisplay();
                }
            });
            
            observer.observe(element, {
                characterData: true,
                childList: true,
                subtree: true
            });
        });
    }
    
    // Écouter les changements de méthode de paiement
    if (paymentMethod && onlineSection) {
        paymentMethod.addEventListener('change', (e) => {
            if (e.target.value === 'online' || e.target.value === 'onsite') {
                onlineSection.style.display = 'block';
                updatePriceDisplay();
                
                // Démarrer la surveillance des changements de prix
                setTimeout(monitorPriceChanges, 500);
            } else {
                onlineSection.style.display = 'none';
            }
        });
    }
    
    // Initialiser les prix
    updatePriceDisplay();
    
    console.log('✅ Configuration du paiement terminée');
}
function setupBookingDuration() {
    console.log('📅 Configuration de la durée de réservation');
    
    const bookingDuration = document.getElementById('bookingDuration');
    const customDateRange = document.getElementById('customDateRange');
    const standardDate = document.getElementById('standardDate');
    const bookingDateInput = document.getElementById('bookingDate');
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!bookingDuration || !customDateRange || !standardDate) {
        console.warn('⚠️ Éléments de durée de réservation non trouvés');
        return;
    }
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    if (bookingDateInput) bookingDateInput.min = today;
    if (startDateInput) startDateInput.min = today;
    if (endDateInput) endDateInput.min = today;
    
    // Gérer le changement de durée
    bookingDuration.addEventListener('change', (e) => {
        const duration = e.target.value;
        
        if (duration === 'custom') {
            // Afficher la période personnalisée
            customDateRange.style.display = 'block';
            standardDate.style.display = 'none';
            
            // Rendre les champs obligatoires
            if (startDateInput) startDateInput.required = true;
            if (endDateInput) endDateInput.required = true;
            if (bookingDateInput) bookingDateInput.required = false;
            
            // Focus sur la première date
            setTimeout(() => {
                if (startDateInput) startDateInput.focus();
            }, 100);
            
        } else {
            // Afficher la date simple pour les durées standards
            customDateRange.style.display = 'none';
            standardDate.style.display = 'block';
            
            // Rendre les champs obligatoires
            if (startDateInput) startDateInput.required = false;
            if (endDateInput) endDateInput.required = false;
            if (bookingDateInput) bookingDateInput.required = true;
            
            // Focus sur la date
            setTimeout(() => {
                if (bookingDateInput) bookingDateInput.focus();
            }, 100);
        }
    });
    
    // Validation des dates personnalisées
    if (startDateInput && endDateInput) {
        startDateInput.addEventListener('change', () => {
            if (startDateInput.value) {
                endDateInput.min = startDateInput.value;
                // Si endDate est antérieur à la nouvelle startDate, le réinitialiser
                if (endDateInput.value && endDateInput.value < startDateInput.value) {
                    endDateInput.value = '';
                }
            }
        });
    }
    
    // Ajouter un placeholder pour la date simple
    if (bookingDateInput) {
        bookingDateInput.placeholder = 'JJ/MM/AAAA';
    }
    
    console.log('✅ Configuration de la durée terminée');
}

function setupBookingForm() {
    console.log('📝 Configuration du formulaire');
    
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;
    
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
        
        try {
            // Récupérer les valeurs du formulaire
            const modelId = document.getElementById('modelSelect').value;
            const clientName = document.getElementById('clientName').value;
            const clientEmail = document.getElementById('clientEmail').value;
            const clientPhone = document.getElementById('clientPhone').value;
            const bookingDuration = document.getElementById('bookingDuration').value;
            const bookingType = document.getElementById('bookingType').value;
            const paymentMethod = document.getElementById('paymentMethod').value;
            
            // Validation de base
            if (!modelId || !clientName || !clientEmail || !clientPhone || !bookingDuration || !bookingType || !paymentMethod) {
                throw new Error('Veuillez remplir tous les champs obligatoires');
            }
            
            // Variables pour les dates
            let bookingDate = null;
            let startDate = null;
            let endDate = null;
            
            // Logique selon la durée choisie
            switch(bookingDuration) {
                case 'half-day':
                    bookingDate = document.getElementById('bookingDate').value;
                    if (!bookingDate) throw new Error('Veuillez sélectionner une date');
                    startDate = bookingDate;
                    endDate = bookingDate;
                    break;
                    
                case 'full-day':
                    bookingDate = document.getElementById('bookingDate').value;
                    if (!bookingDate) throw new Error('Veuillez sélectionner une date');
                    startDate = bookingDate;
                    endDate = bookingDate;
                    break;
                    
                case 'weekend':
                    bookingDate = document.getElementById('bookingDate').value;
                    if (!bookingDate) throw new Error('Veuillez sélectionner une date');
                    startDate = bookingDate;
                    const weekendEnd = new Date(bookingDate);
                    weekendEnd.setDate(weekendEnd.getDate() + 1);
                    endDate = weekendEnd.toISOString().split('T')[0];
                    break;
                    
                case 'week':
                    bookingDate = document.getElementById('bookingDate').value;
                    if (!bookingDate) throw new Error('Veuillez sélectionner une date');
                    startDate = bookingDate;
                    const weekEnd = new Date(bookingDate);
                    weekEnd.setDate(weekEnd.getDate() + 4);
                    endDate = weekEnd.toISOString().split('T')[0];
                    break;
                    
                case 'custom':
                    startDate = document.getElementById('startDate').value;
                    endDate = document.getElementById('endDate').value;
                    
                    if (!startDate || !endDate) {
                        throw new Error('Veuillez sélectionner une période (du... au...)');
                    }
                    
                    if (new Date(endDate) < new Date(startDate)) {
                        throw new Error('La date de fin doit être postérieure à la date de début');
                    }
                    
                    bookingDate = startDate;
                    break;
                    
                default:
                    throw new Error('Durée de réservation invalide');
            }
            
            // Récupérer le prix négocié
            const negotiatedPrice = negotiatedPrices[modelId] || 0;
            
            // Créer le texte de durée pour l'ajouter au booking_type
            const durationText = getDurationText(bookingDuration, startDate, endDate, bookingDate);
            
            // Préparer les données POUR VOTRE TABLE EXACTE
            const formData = {
                model_id: modelId,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                booking_date: bookingDate,
                start_date: startDate,
                end_date: endDate,
                booking_type: `${bookingType} (${durationText})`, // Combiner type et durée
                payment_method: paymentMethod,
                payment_status: 'pending', // CORRECT: votre table a payment_status
                source: 'client',
                negotiated_price: negotiatedPrice
                // Ne pas inclure: 'status', 'notes' - ils n'existent pas dans votre table
            };
            
            console.log('📤 Envoi réservation:', formData);
            
            // Envoyer à Supabase
            const { data, error } = await supabase
                .from('bookings')
                .insert([formData])
                .select();
            
            if (error) {
                console.error('❌ Erreur Supabase:', error);
                throw new Error(`Erreur d'enregistrement: ${error.message}`);
            }
            
            // Message de succès
            let successMessage = `
✅ Réservation enregistrée avec succès !
📋 Référence: #${data[0].id.slice(0, 8).toUpperCase()}
👤 Client: ${clientName}
📞 Contact: ${clientPhone}
📅 ${durationText}
💼 Type: ${bookingType}
💰 Prix négocié: ${negotiatedPrice} DA
💳 Paiement: ${paymentMethod === 'onsite' ? 'Sur place' : 'En ligne'}

Nous vous contacterons dans les 24h pour finaliser les détails.
            `;
            
            showSuccess(successMessage);
            
            // Réinitialiser le formulaire
            bookingForm.reset();
            
            // Masquer les sections
            document.getElementById('onlinePaymentSection').style.display = 'none';
            document.getElementById('customDateRange').style.display = 'none';
            document.getElementById('standardDate').style.display = 'block';
            
            // Réinitialiser les prix négociés
            negotiatedPrices = {};
            
            // Recharger les prix affichés
            if (typeof updatePriceDisplay === 'function') {
                updatePriceDisplay();
            }
            
            // Scroll vers le haut
            window.scrollTo({ top: 0, behavior: 'smooth' });
            
        } catch (error) {
            console.error('❌ Erreur réservation:', error);
            showError(error.message || 'Erreur lors de la réservation. Veuillez réessayer.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

function setupModal() {
    console.log('🎭 Configuration des modals');
    
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

// ============================================
// INITIALISATION
// ============================================

async function init() {
    console.log('🔧 Initialisation application...');
    
    try {
        // Charger Supabase
        const supabaseModule = await loadSupabase();
        if (!supabaseModule || !supabaseModule.createClient) {
            throw new Error('Supabase non chargé correctement');
        }
        
        supabase = supabaseModule.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        console.log('✅ Client Supabase créé');
        
        // Configurer l'interface
        setupSidebar();
        setupSmoothScroll();
        setupPaymentToggle();
        setupPaymentInfo();
        setupBookingDuration();
        setupBookingForm();
        setupModal();
        initializeClientDarkMode(); // Initialize dark mode
        
        // Charger les données
        await Promise.all([loadModels(), loadPrices()]);
        
        console.log('✅ Application prête');
        
    } catch (error) {
        console.error('❌ Erreur initialisation:', error);
        showError('Erreur de chargement de l\'application. Veuillez rafraîchir la page.');
        
        // Afficher un message d'erreur dans les sections
        const modelsGrid = document.getElementById('modelsGrid');
        const pricesGrid = document.getElementById('pricesGrid');
        
        if (modelsGrid) {
            modelsGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #f44336;">Erreur de connexion au serveur</div>';
        }
        
        if (pricesGrid) {
            pricesGrid.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: #f44336;">Erreur de connexion au serveur</div>';
        }
    }
}

// Démarrer l'application
document.addEventListener('DOMContentLoaded', init);

// Exporter les fonctions globales
window.adjustPrice = adjustPrice;
window.showModelDetails = showModelDetails;
window.closeModalAndBook = window.closeModalAndBook;
window.updatePriceDisplay = updatePriceDisplay;