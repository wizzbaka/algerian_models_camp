// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://rzitbfwptcmdlwxemluk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aXRiZndwdGNtZGx3eGVtbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTMzMTIsImV4cCI6MjA3ODQyOTMxMn0.oCNi8pCb-3rpwc3dyKwoNkcM5Vjkys1J8eO2eoaRT9Y'
};

// Initialize Supabase client - Using global CDN version
//let supabase = null;

// Variables pour la lightbox des candidatures
let currentCandidatePhotos = [];
let currentCandidateIndex = 0;
let currentCandidateInfo = {};
let touchStartX = 0;
let touchEndX = 0;



// Au lieu d'initialiser un nouveau client, utilisez celui déjà créé
async function initializeApp() {
  try {
    // Utiliser le client Supabase déjà initialisé par auth-admin.js
    if (window.supabase && window.supabase.auth) {
      console.log('✅ Utilisation du client Supabase existant');
      // Récupérer le client depuis la variable globale
      supabase = window.supabase;
    } else {
      // Fallback si pour une raison le client n'existe pas
      console.warn('⚠️ Supabase non trouvé, initialisation de secours...');
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@supabase/supabase-js@2';
      script.onload = () => {
        supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        setupNavigation();
        loadDashboard();
      };
      document.head.appendChild(script);
      return;
    }
    
    // Continuer avec le reste de l'initialisation
    console.log('🔄 Initialisation de l\'application admin...');
    setupNavigation();
    loadDashboard();
    
  } catch (error) {
    console.error('Error initializing app:', error);
    alert('Erreur d\'initialisation: ' + error.message);
  }
}
// Fonction de fallback si le premier chargement échoue
function loadSupabaseFallback() {
  console.log('🔄 Tentative de fallback...');
  
  // Essayer une autre URL CDN
  const fallbackScript = document.createElement('script');
  fallbackScript.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.39.7/dist/umd/supabase.min.js';
  
  fallbackScript.onload = () => {
      setTimeout(() => {
          if (window.supabase && window.supabase.createClient) {
              supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
              console.log('✅ Client Supabase initialisé (fallback)');
              setupNavigation();
              loadDashboard();
          } else {
              console.error('❌ Fallback a échoué aussi');
              setupNavigation(); // Dernier recours
          }
      }, 100);
  };
  
  fallbackScript.onerror = () => {
      console.error('❌ Fallback a échoué au chargement');
      setupNavigation();
  };
  
  document.head.appendChild(fallbackScript);
}

let currentEditItem = null;

// Email Templates
const emailTemplates = {
  acceptance: (name) => `
Bonjour ${name},

Félicitations ! 🎉

Nous sommes ravis de vous informer que votre candidature a été acceptée par Algerian Models Camp.

Votre profil sera bientôt ajouté à notre portfolio et vous pourrez commencer votre carrière de mannequin professionnel avec nous.

Nous vous contacterons prochainement pour les prochaines étapes.

Bienvenue dans la famille Algerian Models Camp !

Cordialement,
L'équipe Algerian Models Camp
  `,
  rejection: (name, reason) => `
Bonjour ${name},

Nous vous remercions d'avoir postulé chez Algerian Models Camp.

Après examen attentif de votre candidature, nous regrettons de vous informer que nous ne pouvons pas donner suite à votre demande pour le moment.

${reason ? `Raison : ${reason}` : ''}

Cela ne remet pas en question vos qualités, et nous vous encourageons à postuler à nouveau dans le futur.

Nous vous souhaitons beaucoup de succès dans vos projets.

Cordialement,
L'équipe Algerian Models Camp
  `
};

// Navigation Setup - FIXED VERSION
function setupNavigation() {
  console.log('🔧 Setting up navigation...');
  
  // Clear any existing event listeners
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(btn => {
      // Remove existing listeners by cloning the element
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
  });

  // Add fresh event listeners
  document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
          e.preventDefault();
          const section = btn.dataset.section;
          console.log('🖱️ Navigation clicked:', section);
          switchSection(section);
      });
  });
  
  console.log('✅ Navigation setup complete');
}

function switchSection(section) {
  console.log('🔄 Switching to section:', section);
  
  // Fermer le menu sur mobile
  if (window.innerWidth <= 1024) {
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.getElementById('sidebarBackdrop');
    const menuToggle = document.getElementById('menuToggle');
    
    if (sidebar) sidebar.classList.remove('active');
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('active');
    if (menuToggle) {
      menuToggle.innerHTML = '☰';
      menuToggle.style.background = 'var(--primary-color)';
    }
  }
  
  try {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked nav item
    const activeNavItem = document.querySelector(`[data-section="${section}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
      console.log('✅ Active nav item set for:', section);
    } else {
      console.error('❌ Nav item not found for section:', section);
    }
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(sec => {
      sec.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(`section-${section}`);
    if (targetSection) {
      targetSection.classList.add('active');
      console.log('✅ Content section shown for:', section);
    } else {
      console.error('❌ Content section not found for:', `section-${section}`);
      return;
    }

    // Load section-specific data
    switch(section) {
      case 'dashboard': 
        console.log('📊 Loading dashboard...');
        loadDashboard(); 
        break;
      case 'content': 
        console.log('📝 Loading content...');
        loadContent(); 
        break;
      case 'services': 
        console.log('⚙️ Loading services...');
        loadServices(); 
        break;
      case 'portfolio': 
        console.log('🖼️ Loading portfolio...');
        loadPortfolio(); 
        break;
      case 'news': 
        console.log('📰 Loading news...');
        loadNews(); 
        break;
      case 'formations': 
        console.log('🎓 Loading formations...');
        loadFormations(); 
        break;
      case 'applications': 
        console.log('📋 Loading applications...');
        loadApplications(); 
        break;
      case 'model-messages': 
        console.log('💬 Loading model messages...');
        loadModelMessages(); 
        break;
      case 'client-bookings': 
        console.log('📅 Loading client bookings...');
        loadClientBookings(); 
        break;
      case 'prices': 
        console.log('💰 Loading prices...');
        loadPrices(); 
        break;
      case 'settings': 
        console.log('⚙️ Loading settings...');
        loadSettings(); 
        break;
      default:
        console.warn('⚠️ Unknown section:', section);
    }
    
    console.log('✅ Section switch completed:', section);
  } catch (error) {
    console.error('❌ Error switching section:', error);
  }
}

// Dashboard
async function loadDashboard() {
  console.log('📊 Loading dashboard data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized, showing placeholder data');
      document.getElementById('statsPortfolio').textContent = '0';
      document.getElementById('statsNews').textContent = '0';
      document.getElementById('statsApplications').textContent = '0';
      document.getElementById('statsModelMessages').textContent = '0';
      document.getElementById('statsClientBookings').textContent = '0';
      return;
  }
  
  try {
      const [portfolio, news, applications, modelMessages, clientBookings] = await Promise.all([
          supabase.from('portfolio').select('*', { count: 'exact' }),
          supabase.from('news').select('*', { count: 'exact' }),
          supabase.from('applications').select('*', { count: 'exact' }),
          supabase.from('messages').select('*', { count: 'exact' }).eq('source', 'visitor'),
          supabase.from('bookings').select('*', { count: 'exact' })
      ]);

      document.getElementById('statsPortfolio').textContent = portfolio.count || 0;
      document.getElementById('statsNews').textContent = news.count || 0;
      document.getElementById('statsApplications').textContent = applications.count || 0;
      document.getElementById('statsModelMessages').textContent = modelMessages.count || 0;
      document.getElementById('statsClientBookings').textContent = clientBookings.count || 0;
      
      console.log('✅ Dashboard loaded successfully');
  } catch (error) {
      console.error('❌ Error loading dashboard:', error);
      // Show placeholder data on error
      document.getElementById('statsPortfolio').textContent = '0';
      document.getElementById('statsNews').textContent = '0';
      document.getElementById('statsApplications').textContent = '0';
      document.getElementById('statsModelMessages').textContent = '0';
      document.getElementById('statsClientBookings').textContent = '0';
  }
}

// Content Management - FIXED VERSION
async function loadContent() {
  console.log('📝 Loading content data...');
  
  if (!supabase) {
    console.warn('⚠️ Supabase not initialized');
    return;
  }
  
  try {
    // Load about content
    const { data: about, error: aboutError } = await supabase
      .from('content')
      .select('*')
      .eq('section', 'about')
      .single();
    
    console.log('📊 About data response:', about);
    console.log('📊 About error:', aboutError);
    
    if (aboutError) {
      console.error('❌ Error loading about:', aboutError);
      // Create empty about entry if it doesn't exist
      if (aboutError.code === 'PGRST116') { // Not found error
        await createInitialContent();
        await loadContent(); // Reload after creation
        return;
      }
    } else if (about) {
      document.getElementById('aboutStory').value = about.story || '';
      document.getElementById('aboutMission').value = about.mission || '';
      // Note: 'values' is a reserved keyword, we need to access it properly
      document.getElementById('aboutValues').value = about.values || '';
      console.log('✅ About content loaded successfully');
    }

    // Load contact content
    const { data: contact, error: contactError } = await supabase
      .from('content')
      .select('*')
      .eq('section', 'contact')
      .single();
    
    console.log('📊 Contact data response:', contact);
    console.log('📊 Contact error:', contactError);
    
    if (contactError) {
      console.error('❌ Error loading contact:', contactError);
      // Create empty contact entry if it doesn't exist
      if (contactError.code === 'PGRST116') { // Not found error
        await createInitialContent();
        await loadContent(); // Reload after creation
        return;
      }
    } else if (contact) {
      document.getElementById('contactAddress').value = contact.address || '';
      document.getElementById('contactPhone').value = contact.phone || '';
      document.getElementById('contactEmail').value = contact.email || '';
      document.getElementById('contactWhatsapp').value = contact.whatsapp || '';
      document.getElementById('contactFacebook').value = contact.facebook || '';
      document.getElementById('contactInstagram').value = contact.instagram || '';
      document.getElementById('contactTiktok').value = contact.tiktok || '';
      console.log('✅ Contact content loaded successfully');
    }
    
    console.log('✅ Content loaded successfully');
  } catch (error) {
    console.error('❌ Error loading content:', error);
    alert(`❌ Erreur lors du chargement du contenu: ${error.message}`);
  }
}

// Function to create initial content entries if they don't exist
async function createInitialContent() {
  console.log('➕ Creating initial content entries...');
  
  try {
    // Create about entry
    const { error: aboutError } = await supabase
      .from('content')
      .upsert({
        section: 'about',
        story: 'Algerian Models Camp est la première agence de mannequins professionnelle en Algérie, dédiée à la découverte et au développement de nouveaux talents dans l\'industrie de la mode.',
        mission: 'Nous offrons une formation complète, un encadrement professionnel et des opportunités uniques pour lancer votre carrière de mannequin sur la scène nationale et internationale.',
        values: 'Excellence, professionnalisme, diversité et développement personnel sont au cœur de notre approche. Nous croyons en chaque talent unique et nous nous engageons à révéler le meilleur de chacun.'
      }, { onConflict: 'section' });
    
    if (aboutError) {
      console.error('❌ Error creating about:', aboutError);
    } else {
      console.log('✅ About entry created');
    }
    
    // Create contact entry
    const { error: contactError } = await supabase
      .from('content')
      .upsert({
        section: 'contact',
        address: 'Alger, Algérie',
        phone: '+213 XXX XXX XXX',
        email: 'contact@algerianmodelscamp.com',
        whatsapp: '+213 XXX XXX XXX',
        facebook: 'https://facebook.com/algerianmodelscamp',
        instagram: 'https://instagram.com/algerianmodelscamp',
        tiktok: 'https://tiktok.com/@algerianmodelscamp'
      }, { onConflict: 'section' });
    
    if (contactError) {
      console.error('❌ Error creating contact:', contactError);
    } else {
      console.log('✅ Contact entry created');
    }
    
  } catch (error) {
    console.error('❌ Error creating initial content:', error);
  }
}

// Services Management
async function loadServices() {
  console.log('⚙️ Loading services data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('servicesList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data } = await supabase.from('services').select('*').order('display_order');
      
      const container = document.getElementById('servicesList');
      container.innerHTML = data.map(service => `
          <div class="item-card">
              <div style="font-size: 2rem; margin-bottom: 1rem;">${service.icon}</div>
              <h3>${service.title}</h3>
              <p>${service.description}</p>
              <div class="item-actions">
                  <button class="btn-edit" onclick="editService('${service.id}')">✏️ Modifier</button>
                  <button class="btn-delete" onclick="deleteService('${service.id}')">🗑️ Supprimer</button>
              </div>
          </div>
      `).join('');
      
      console.log('✅ Services loaded successfully');
  } catch (error) {
      console.error('❌ Error loading services:', error);
      document.getElementById('servicesList').innerHTML = '<p>Erreur lors du chargement des services</p>';
  }
}

// Portfolio Management - FIXED VERSION
async function loadPortfolio() {
  console.log('🖼️ Loading portfolio data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('portfolioList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data, error } = await supabase.from('portfolio').select('*').order('created_at', { ascending: false });
      
      if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
      }
      
      const container = document.getElementById('portfolioList');
      if (!data || data.length === 0) {
          container.innerHTML = '<p>Aucun élément de portfolio trouvé.</p>';
          return;
      }
      
      container.innerHTML = data.map(item => {
          const imageUrl = item.image_url || 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop';
          
          return `
            <div class="item-card">
                <div class="portfolio-image-container">
                    <img src="${imageUrl}" alt="${item.title}" 
                        class="portfolio-full-image"
                        onerror="this.src='https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop'">
                </div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <p><strong>Catégorie:</strong> ${getCategoryName(item.category)}</p>
                <p><strong>Prix:</strong> ${item.price ? item.price + ' DA' : 'Non défini'}</p>
                <p><strong>Statut:</strong> <span class="status-badge status-${item.status}">${getStatusText(item.status)}</span></p>
                <div class="item-actions">
                    <button class="btn-edit" onclick="editPortfolio('${item.id}')">✏️ Modifier</button>
                    <button class="btn-delete" onclick="deletePortfolio('${item.id}')">🗑️ Supprimer</button>
                </div>
            </div>
        `;
      }).join('');
      
      console.log('✅ Portfolio loaded successfully');
  } catch (error) {
      console.error('❌ Error loading portfolio:', error);
      document.getElementById('portfolioList').innerHTML = `<p>Erreur lors du chargement du portfolio: ${error.message}</p>`;
  }
}

// Helper function for category names
function getCategoryName(category) {
  const categories = {
      'fashion': 'Mode',
      'creative': 'Créatif',
      'ecommerce': 'E-commerce'
  };
  return categories[category] || category;
}

// News/Events Management
async function loadNews() {
  console.log('📰 Loading news data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('newsList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data } = await supabase.from('news').select('*').order('date', { ascending: false });
      
      const container = document.getElementById('newsList');
      container.innerHTML = data.map(item => `
          <div class="item-card">
              ${item.image_url ? `<img src="${item.image_url}" alt="${item.title}">` : ''}
              <h3>${item.title}</h3>
              <p>${item.content}</p>
              <p><strong>Date:</strong> ${new Date(item.date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Type:</strong> ${item.event_type === 'event' ? 'Événement' : 'Actualité'}</p>
              <p><strong>Archivé:</strong> ${item.is_archived ? 'Oui' : 'Non'}</p>
              <div class="item-actions">
                  <button class="btn-edit" onclick="editNews('${item.id}')">✏️ Modifier</button>
                  <button class="btn-delete" onclick="deleteNews('${item.id}')">🗑️ Supprimer</button>
                  ${!item.is_archived ? `<button class="btn-edit" onclick="archiveEvent('${item.id}')">📦 Archiver</button>` : ''}
              </div>
          </div>
      `).join('');
      
      console.log('✅ News loaded successfully');
  } catch (error) {
      console.error('❌ Error loading news:', error);
      document.getElementById('newsList').innerHTML = '<p>Erreur lors du chargement des actualités</p>';
  }
}

// Formations Management - FIXED VERSION
async function loadFormations() {
  console.log('🎓 Loading formations data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('formationsList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data, error } = await supabase.from('formations').select('*').order('created_at', { ascending: false });
      
      if (error) {
          console.error('❌ Erreur Supabase:', error);
          throw error;
      }
      
      const container = document.getElementById('formationsList');
      if (!container) {
          console.error('❌ Container formationsList introuvable');
          return;
      }
      
      if (!data || data.length === 0) {
          container.innerHTML = '<p>Aucune formation trouvée.</p>';
          return;
      }
      
      container.innerHTML = data.map(formation => {
          let photos = [];
          try {
              photos = formation.photos ? JSON.parse(formation.photos) : [];
          } catch (e) {
              console.error('Error parsing photos:', e);
              photos = [];
          }
          
          const firstPhoto = formation.image_url || (photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop');
          
          return `
              <div class="item-card">
                  ${firstPhoto ? `
                      <img src="${firstPhoto}" alt="${formation.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;" onerror="this.src='https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop'">
                  ` : ''}
                  <h3>${formation.title}</h3>
                  <p>${formation.description}</p>
                  <p><strong>Date de formation:</strong> ${formation.formation_date ? new Date(formation.formation_date).toLocaleDateString('fr-FR') : 'Non définie'}</p>
                  <p><strong>Prix:</strong> ${formation.price} DA</p>
                  <p><strong>Durée:</strong> ${formation.duration}</p>
                  <div class="item-actions">
                      <button class="btn-edit" onclick="editFormation('${formation.id}')">✏️ Modifier</button>
                      <button class="btn-delete" onclick="deleteFormation('${formation.id}')">🗑️ Supprimer</button>
                      <button class="btn-edit" onclick="viewFormationRegistrations('${formation.id}')">👥 Voir les inscriptions</button>
                  </div>
              </div>
          `;
      }).join('');
      
      console.log('✅ Formations loaded successfully');
  } catch (error) {
      console.error('❌ Error loading formations:', error);
      const container = document.getElementById('formationsList');
      if (container) {
          container.innerHTML = `<p>Erreur lors du chargement des formations: ${error.message}</p>`;
      }
  }
}

// Applications Management - FIXED VERSION avec Lightbox
async function loadApplications() {
  console.log('📋 Loading applications data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('applicationsList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false });
      
      if (error) {
          console.error('❌ Supabase error:', error);
          throw error;
      }
      
      const container = document.getElementById('applicationsList');
      if (!data || data.length === 0) {
          container.innerHTML = '<p>Aucune candidature pour le moment.</p>';
          return;
      }
      
      container.innerHTML = data.map(app => {
          // FIXED: Safely parse photos array
          let photos = [];
          try {
              if (app.photos && Array.isArray(app.photos)) {
                  photos = app.photos;
              } else if (app.photos && typeof app.photos === 'string') {
                  photos = JSON.parse(app.photos);
              }
          } catch (e) {
              console.error('Error parsing photos for application:', app.id, e);
              photos = [];
          }
          
          return `
              <div class="application-card">
                  <div class="application-header">
                      <div>
                          <h3>${app.full_name}</h3>
                          <p style="color: #666; font-size: 0.9rem; margin-top: 0.25rem;">
                              Postulé le: ${new Date(app.created_at).toLocaleDateString('fr-FR')}
                              ${app.approved_at ? ` • Approuvé le: ${new Date(app.approved_at).toLocaleDateString('fr-FR')}` : ''}
                          </p>
                      </div>
                      <span class="status-badge status-${app.status || 'pending'}">${getStatusText(app.status)}</span>
                  </div>
                  
                  <div class="application-info">
                      <div class="info-item"><strong>Âge:</strong> ${app.age} ans</div>
                      <div class="info-item"><strong>Taille:</strong> ${app.height} cm</div>
                      <div class="info-item"><strong>Ville:</strong> ${app.city}</div>
                      <div class="info-item"><strong>Email:</strong> ${app.email}</div>
                      <div class="info-item"><strong>Téléphone:</strong> ${app.phone}</div>
                      <div class="info-item"><strong>Instagram:</strong> ${app.instagram || 'N/A'}</div>
                  </div>
                  
                  ${photos.length > 0 ? `
                      <div class="application-photos">
                          ${photos.map((photo, index) => `
                              <img src="${photo}" alt="Photo ${index + 1}" 
                                   onclick="openCandidateGallery('${app.id}', ${index}, '${app.full_name}', '${app.age} ans, ${app.city}')"
                                   onerror="this.style.display='none'"
                                   style="cursor: pointer; transition: transform 0.2s;"
                                   onmouseover="this.style.transform='scale(1.05)'"
                                   onmouseout="this.style.transform='scale(1)'">
                          `).join('')}
                      </div>
                      
                      <div style="text-align: center; margin-top: 0.5rem; color: var(--accent-color); font-size: 0.85rem;">
                          💡 Cliquez sur une photo pour ouvrir la galerie (${photos.length} photo${photos.length > 1 ? 's' : ''})
                      </div>
                  ` : `
                      <div style="text-align: center; padding: 2rem; background: var(--bg-color); border-radius: 8px; margin: 1rem 0;">
                          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                          <p style="color: var(--accent-color);">Aucune photo fournie par le candidat</p>
                      </div>
                  `}
                  
                  <div class="item-actions">
                      ${app.status === 'pending' ? `
                          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                              <button class="btn-edit" onclick="approveApplication('${app.id}', '${app.full_name}', '${app.email}')">✅ Approuver</button>
                              <button class="btn-delete" onclick="rejectApplication('${app.id}', '${app.full_name}', '${app.email}')">❌ Rejeter</button>
                              <button class="btn-delete" onclick="deleteApplication('${app.id}', '${app.full_name}')" style="background: rgba(255, 0, 0, 0.2); border-color: #ff0000; color: #ff0000;">
                                  🗑️ Supprimer
                              </button>
                          </div>
                      ` : `
                          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                              <button class="btn-delete" onclick="deleteApplication('${app.id}', '${app.full_name}')" style="background: rgba(255, 0, 0, 0.2); border-color: #ff0000; color: #ff0000;">
                                  🗑️ Supprimer définitivement
                              </button>
                              ${app.status === 'rejected' ? `
                                  <button class="btn-edit" onclick="approveApplication('${app.id}', '${app.full_name}', '${app.email}')" style="background: rgba(76, 175, 80, 0.2); border-color: #4caf50; color: #4caf50;">
                                      🔄 Ré-approuver
                                  </button>
                              ` : ''}
                          </div>
                      `}
                  </div>
                  
                  ${app.status === 'rejected' && app.rejection_reason ? `
                      <div style="margin-top: 1rem; padding: 1rem; background: rgba(244, 67, 54, 0.1); border-radius: 8px;">
                          <strong>Raison du rejet:</strong> ${app.rejection_reason}
                      </div>
                  ` : ''}
              </div>
          `;
      }).join('');
      
      console.log('✅ Applications loaded successfully');
  } catch (error) {
      console.error('❌ Error loading applications:', error);
      document.getElementById('applicationsList').innerHTML = `<p>Erreur lors du chargement des candidatures: ${error.message}</p>`;
  }
}

// Model Messages Management
async function loadModelMessages() {
  console.log('💬 Loading model messages data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('modelMessagesList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data } = await supabase.from('messages').select('*').eq('source', 'visitor').order('created_at', { ascending: false });
      
      const container = document.getElementById('modelMessagesList');
      container.innerHTML = data.map(msg => `
          <div class="message-card" style="border-left: 4px solid #d4af37;">
              <h3>💬 ${msg.name}</h3>
              <p><strong>Email:</strong> ${msg.email}</p>
              <p><strong>Message:</strong> ${msg.message}</p>
              <p><strong>Date:</strong> ${new Date(msg.created_at).toLocaleDateString('fr-FR')} ${new Date(msg.created_at).toLocaleTimeString('fr-FR')}</p>
              <p style="color: #d4af37; font-size: 0.9rem;"><strong>Source:</strong> Visiteur / Modèle</p>
          </div>
      `).join('') || '<p>Aucun message de modèles ou visiteurs.</p>';
      
      console.log('✅ Model messages loaded successfully');
  } catch (error) {
      console.error('❌ Error loading model messages:', error);
      document.getElementById('modelMessagesList').innerHTML = '<p>Erreur lors du chargement des messages</p>';
  }
}

// Client Bookings Management
async function loadClientBookings() {
  console.log('📅 Loading client bookings data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('clientBookingsList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data } = await supabase.from('bookings').select('*, portfolio(title)').order('created_at', { ascending: false });
      
      const container = document.getElementById('clientBookingsList');
      if (!container) return;
      
      container.innerHTML = data.map(booking => `
          <div class="message-card" style="border-left: 4px solid #3498db;">
              <div class="message-header">
                  <h3>📅 ${booking.client_name}</h3>
                  <button class="btn-delete" onclick="deleteBooking('${booking.id}')">🗑️ Supprimer</button>
              </div>
              <p><strong>Modèle:</strong> ${booking.portfolio?.title || 'N/A'}</p>
              <p><strong>Email:</strong> ${booking.client_email}</p>
              <p><strong>Téléphone:</strong> ${booking.client_phone}</p>
              <p><strong>Date de réservation:</strong> ${new Date(booking.booking_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Type de séance:</strong> ${booking.booking_type}</p>
              <p><strong>Mode de paiement:</strong> ${booking.payment_method}</p>
              <p><strong>Statut du paiement:</strong> ${booking.payment_status}</p>
              <p><strong>Prix négocié:</strong> ${booking.negotiated_price || 'Non défini'} DA</p>
              
              ${booking.payment_method === 'online' && booking.client_ccp_number ? `
                  <div class="ccp-payment-details" style="margin-top: 1rem; padding: 1rem; background: rgba(52, 152, 219, 0.1); border-radius: 8px; border: 1px solid #3498db;">
                      <h4 style="color: #3498db; margin-bottom: 0.5rem;">💳 Détails du paiement CCP</h4>
                      <p><strong>CCP du client:</strong> ${booking.client_ccp_number}</p>
                      <p><strong>ID Transaction:</strong> ${booking.transaction_id}</p>
                      ${booking.payment_receipt ? `
                          <p><strong>Reçu de paiement:</strong> 
                              <button onclick="viewPaymentReceipt('${booking.payment_receipt}')" class="btn-view-receipt">📄 Voir le reçu</button>
                          </p>
                      ` : ''}
                  </div>
              ` : ''}
              
              <p><strong>Date de demande:</strong> ${new Date(booking.created_at).toLocaleDateString('fr-FR')} ${new Date(booking.created_at).toLocaleTimeString('fr-FR')}</p>
              <p style="color: #3498db; font-size: 0.9rem;"><strong>Source:</strong> Client</p>
          </div>
      `).join('') || '<p>Aucune réservation de clients.</p>';
      
      console.log('✅ Client bookings loaded successfully');
  } catch (error) {
      console.error('❌ Error loading client bookings:', error);
      document.getElementById('clientBookingsList').innerHTML = '<p>Erreur lors du chargement des réservations</p>';
  }
}

// Prices Management
async function loadPrices() {
  console.log('💰 Loading prices data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('pricesList').innerHTML = '<p>Supabase non initialisé</p>';
      return;
  }
  
  try {
      const { data } = await supabase.from('prices').select('*').order('created_at', { ascending: false });
      
      const container = document.getElementById('pricesList');
      if (!container) return;
      
      container.innerHTML = data.map(price => `
          <div class="item-card">
              <h3>${price.service_type}</h3>
              <p><strong>Prix:</strong> ${price.price} DA</p>
              <p>${price.description || ''}</p>
              <div class="item-actions">
                  <button class="btn-edit" onclick="editPrice('${price.id}')">✏️ Modifier</button>
                  <button class="btn-delete" onclick="deletePrice('${price.id}')">🗑️ Supprimer</button>
              </div>
          </div>
      `).join('');
      
      console.log('✅ Prices loaded successfully');
  } catch (error) {
      console.error('❌ Error loading prices:', error);
      document.getElementById('pricesList').innerHTML = '<p>Erreur lors du chargement des tarifs</p>';
  }
}

// Settings Management
async function loadSettings() {
  console.log('⚙️ Loading settings data...');
  
  if (!supabase) {
      console.warn('⚠️ Supabase not initialized');
      document.getElementById('currentCcpNumber').textContent = 'Supabase non initialisé';
      return;
  }
  
  try {
      const { data: ccpSettings } = await supabase
          .from('admin_settings')
          .select('*')
          .eq('setting_key', 'ccp_number')
          .single();
      
      if (ccpSettings && ccpSettings.setting_value) {
          document.getElementById('ccpNumber').value = ccpSettings.setting_value;
          document.getElementById('ccpSettingsCounter').textContent = `${ccpSettings.setting_value.length}/20`;
          document.getElementById('currentCcpNumber').textContent = ccpSettings.setting_value;
      } else {
          document.getElementById('currentCcpNumber').textContent = 'Non configuré';
      }
      
      initializeCcpForm();
      console.log('✅ Settings loaded successfully');
  } catch (error) {
      console.error('❌ Error loading settings:', error);
      document.getElementById('currentCcpNumber').textContent = 'Erreur de chargement';
  }
}

// Helper functions
function getStatusText(status) {
  const statusMap = {
      'pending': '⏳ En attente',
      'approved': '✅ Approuvé',
      'rejected': '❌ Rejeté'
  };
  return statusMap[status] || status;
}

function initializeCcpForm() {
  const ccpNumberInput = document.getElementById('ccpNumber');
  const ccpCounter = document.getElementById('ccpSettingsCounter');
  
  if (ccpNumberInput) {
      ccpNumberInput.addEventListener('input', (e) => {
          let value = e.target.value.replace(/\D/g, '');
          if (value.length > 20) {
              value = value.substring(0, 20);
          }
          e.target.value = value;
          ccpCounter.textContent = `${value.length}/20`;
      });
  }
  
  // CCP Settings Form
  const ccpForm = document.getElementById('ccpSettingsForm');
  if (ccpForm) {
      ccpForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const ccpNumber = document.getElementById('ccpNumber').value;
          
          if (ccpNumber.length < 10) {
              alert('❌ Le numéro CCP doit contenir au moins 10 chiffres');
              return;
          }
          
          try {
              const { error } = await supabase
                  .from('admin_settings')
                  .upsert({
                      setting_key: 'ccp_number',
                      setting_value: ccpNumber
                  }, { onConflict: 'setting_key' });
              
              if (error) throw error;
              
              document.getElementById('currentCcpNumber').textContent = ccpNumber;
              alert('✅ Numéro CCP enregistré avec succès !');
          } catch (error) {
              console.error('Error saving CCP settings:', error);
              alert('❌ Erreur lors de l\'enregistrement: ' + error.message);
          }
      });
  }
}

// ==================== LIGHTBOX FUNCTIONS ====================

// Fonction pour ouvrir la galerie des photos du candidat
window.openCandidateGallery = function(applicationId, startIndex, name, details) {
  console.log('🖼️ Opening candidate gallery for:', name);
  console.log('Application ID:', applicationId);
  console.log('Start index:', startIndex);
  
  // Méthode directe: Trouver la carte par le nom du candidat (plus fiable)
  let appCard = null;
  const allCards = document.querySelectorAll('.application-card');
  
  for (let card of allCards) {
    // Chercher le nom dans la carte
    const cardTitle = card.querySelector('h3');
    if (cardTitle && cardTitle.textContent.trim() === name) {
      appCard = card;
      console.log('✅ Found card by name:', name);
      break;
    }
  }
  
  // Si on ne trouve pas par nom, essayer par ID
  if (!appCard) {
    console.log('⚠️ Not found by name, trying by ID...');
    // Chercher n'importe quel élément contenant l'ID
    for (let card of allCards) {
      const html = card.innerHTML;
      if (html.includes(applicationId)) {
        appCard = card;
        console.log('✅ Found card by ID:', applicationId);
        break;
      }
    }
  }
  
  // Si toujours pas trouvé, prendre la première carte
  if (!appCard && allCards.length > 0) {
    appCard = allCards[0];
    console.log('⚠️ Using first card as fallback');
  }
  
  if (!appCard) {
    console.error('❌ No application cards found at all');
    alert('Aucune candidature trouvée');
    return;
  }
  
  // Récupérer les photos de cette carte
  const photoElements = appCard.querySelectorAll('.application-photos img');
  currentCandidatePhotos = [];
  
  photoElements.forEach((img, index) => {
    const src = img.getAttribute('src');
    if (src && src !== '') {
      currentCandidatePhotos.push(src);
      console.log(`📸 Photo ${index + 1}:`, src);
    }
  });
  
  // Vérifier si on a des photos
  if (currentCandidatePhotos.length === 0) {
    console.log('⚠️ No photos found in card, checking for data-url attribute...');
    // Essayer avec l'attribut data-src
    photoElements.forEach((img, index) => {
      const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-url');
      if (dataSrc) {
        currentCandidatePhotos.push(dataSrc);
        console.log(`📸 Photo ${index + 1} (data-src):`, dataSrc);
      }
    });
  }
  
  // Ajuster l'index de départ
  if (startIndex >= currentCandidatePhotos.length) {
    startIndex = 0;
  }
  
  currentCandidateIndex = startIndex;
  currentCandidateInfo = { name, details };
  
  console.log('📊 Final photo count:', currentCandidatePhotos.length);
  console.log('Starting index:', currentCandidateIndex);
  
  if (currentCandidatePhotos.length === 0) {
    console.log('⚠️ No photos available');
    alert('Aucune photo disponible pour cette candidature');
    return;
  }
  
  // Mettre à jour et afficher la lightbox
  const lightbox = document.getElementById('candidateLightbox');
  if (!lightbox) {
    console.error('❌ Lightbox element not found in DOM');
    
    // Créer la lightbox dynamiquement si elle n'existe pas
    createDynamicLightbox();
  }
  
  // Mettre à jour le contenu de la lightbox
  updateCandidateLightbox();
  
  // Afficher la lightbox
  lightbox.style.display = 'block';
  document.body.style.overflow = 'hidden';
  
  // Ajouter les événements de clavier
  document.addEventListener('keydown', handleCandidateKeyboardNavigation);
  
  // Initialiser le swipe pour mobile
  initCandidateSwipe();
  
  console.log('✅ Lightbox opened successfully');
};

// Fonction pour créer la lightbox dynamiquement si elle n'existe pas
function createDynamicLightbox() {
  console.log('🛠️ Creating dynamic lightbox...');
  
  const lightboxHTML = `
    <div id="candidateLightbox" class="lightbox" style="display: none;">
      <span class="lightbox-close">&times;</span>
      <div class="lightbox-nav">
        <button class="lightbox-prev">❮</button>
        <button class="lightbox-next">❯</button>
      </div>
      <div class="lightbox-content">
        <img id="lightbox-image" src="" alt="" style="max-width: 90vw; max-height: 70vh; object-fit: contain; opacity: 1; transition: opacity 0.3s ease;">
        <div class="lightbox-counter">
          <span id="current-index">1</span> / <span id="total-images">1</span>
        </div>
        <div class="lightbox-info">
          <p id="lightbox-candidate-name"></p>
          <p id="lightbox-candidate-details"></p>
        </div>
      </div>
    </div>
  `;
  
  // Ajouter au DOM
  document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  
  // Ajouter les événements
  setTimeout(() => {
    const lightbox = document.getElementById('candidateLightbox');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCandidateLightbox);
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', prevCandidateImage);
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', nextCandidateImage);
    }
    
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        closeCandidateLightbox();
      }
    });
    
    console.log('✅ Dynamic lightbox created');
  }, 100);
}

// Fonction pour mettre à jour la lightbox du candidat
function updateCandidateLightbox() {
  if (currentCandidatePhotos.length === 0) {
    console.log('⚠️ No photos to display');
    return;
  }
  
  const image = document.getElementById('lightbox-image');
  const currentIndex = document.getElementById('current-index');
  const totalImages = document.getElementById('total-images');
  const candidateName = document.getElementById('lightbox-candidate-name');
  const candidateDetails = document.getElementById('lightbox-candidate-details');
  
  if (!image || !currentIndex || !totalImages || !candidateName || !candidateDetails) {
    console.error('❌ Lightbox elements not found');
    return;
  }
  
  console.log('🔄 Updating lightbox with image:', currentCandidatePhotos[currentCandidateIndex]);
  
  // Fade out effect
  image.style.opacity = '0';
  
  setTimeout(() => {
    // Charger l'image
    const img = new Image();
    img.onload = () => {
      image.src = currentCandidatePhotos[currentCandidateIndex];
      image.style.opacity = '1';
      console.log('✅ Image loaded successfully');
    };
    
    img.onerror = () => {
      console.error('❌ Failed to load image:', currentCandidatePhotos[currentCandidateIndex]);
      // Fallback image
      image.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=800&h=800&fit=crop';
      image.style.opacity = '1';
    };
    
    img.src = currentCandidatePhotos[currentCandidateIndex];
    
    // Mettre à jour les compteurs et infos
    currentIndex.textContent = currentCandidateIndex + 1;
    totalImages.textContent = currentCandidatePhotos.length;
    candidateName.textContent = currentCandidateInfo.name;
    candidateDetails.textContent = currentCandidateInfo.details;
  }, 200);
  
  // Précharger les images suivantes
  preloadCandidateImages();
}

// Navigation pour la galerie du candidat
function nextCandidateImage() {
  if (currentCandidatePhotos.length === 0) return;
  currentCandidateIndex = (currentCandidateIndex + 1) % currentCandidatePhotos.length;
  console.log('➡️ Next image, index:', currentCandidateIndex);
  updateCandidateLightbox();
}

function prevCandidateImage() {
  if (currentCandidatePhotos.length === 0) return;
  currentCandidateIndex = (currentCandidateIndex - 1 + currentCandidatePhotos.length) % currentCandidatePhotos.length;
  console.log('⬅️ Previous image, index:', currentCandidateIndex);
  updateCandidateLightbox();
}

// Fermer la lightbox du candidat
function closeCandidateLightbox() {
  console.log('🔒 Closing lightbox');
  const lightbox = document.getElementById('candidateLightbox');
  if (lightbox) {
    lightbox.style.display = 'none';
  }
  document.body.style.overflow = 'auto'; // Rétablir le défilement
  document.removeEventListener('keydown', handleCandidateKeyboardNavigation);
  currentCandidatePhotos = [];
  currentCandidateIndex = 0;
  currentCandidateInfo = {};
}

// Gestion des touches clavier pour la galerie
function handleCandidateKeyboardNavigation(e) {
  console.log('⌨️ Key pressed:', e.key);
  switch(e.key) {
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault();
      nextCandidateImage();
      break;
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault();
      prevCandidateImage();
      break;
    case 'Escape':
      e.preventDefault();
      closeCandidateLightbox();
      break;
    case ' ':
      e.preventDefault(); // Empêcher le défilement avec la barre d'espace
      break;
  }
}

// Précharger les images adjacentes
function preloadCandidateImages() {
  if (currentCandidatePhotos.length === 0) return;
  
  const nextIndex = (currentCandidateIndex + 1) % currentCandidatePhotos.length;
  const prevIndex = (currentCandidateIndex - 1 + currentCandidatePhotos.length) % currentCandidatePhotos.length;
  
  [nextIndex, prevIndex].forEach(index => {
    if (currentCandidatePhotos[index]) {
      const img = new Image();
      img.src = currentCandidatePhotos[index];
      console.log('📥 Preloading image:', currentCandidatePhotos[index]);
    }
  });
}



// Initialiser le swipe pour la lightbox
function initCandidateSwipe() {
  const lightbox = document.getElementById('candidateLightbox');
  if (!lightbox) return;
  
  console.log('👆 Initializing swipe for lightbox');
  
  // Reset touch variables
  touchStartX = 0;
  touchEndX = 0;
  
  lightbox.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      console.log('👆 Touch start at:', touchStartX);
    }
  }, { passive: true });
  
  lightbox.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1) {
      touchEndX = e.touches[0].clientX;
    }
  }, { passive: true });
  
  lightbox.addEventListener('touchend', (e) => {
    console.log('👆 Touch end, start:', touchStartX, 'end:', touchEndX);
    handleCandidateSwipe();
  }, { passive: true });
}

// Gérer le swipe
function handleCandidateSwipe() {
  const minSwipeDistance = 50;
  const swipeDistance = touchStartX - touchEndX;
  
  console.log('👆 Swipe distance:', swipeDistance);
  
  if (Math.abs(swipeDistance) < minSwipeDistance) return;
  
  if (swipeDistance > 0) {
    // Swipe vers la gauche = image suivante
    console.log('👆 Swipe left -> next image');
    nextCandidateImage();
  } else {
    // Swipe vers la droite = image précédente
    console.log('👆 Swipe right -> previous image');
    prevCandidateImage();
  }
  
  // Reset touch variables
  touchStartX = 0;
  touchEndX = 0;
}

// Export des fonctions globales
window.nextCandidateImage = nextCandidateImage;
window.prevCandidateImage = prevCandidateImage;
window.closeCandidateLightbox = closeCandidateLightbox;
// ==================== GLOBAL FUNCTIONS ====================

// Global functions for onclick handlers
window.editService = async (id) => {
  if (!supabase) return;
  const { data } = await supabase.from('services').select('*').eq('id', id).single();
  openModal('service', data);
};

window.deleteService = async (id) => {
  if (!supabase) return;
  if (confirm('Supprimer ce service ?')) {
      try {
          const { error } = await supabase.from('services').delete().eq('id', id);
          if (error) throw error;
          loadServices();
          alert('✅ Service supprimé avec succès !');
      } catch (error) {
          console.error('Error deleting service:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

window.editPortfolio = async (id) => {
  if (!supabase) return;
  try {
      const { data } = await supabase.from('portfolio').select('*').eq('id', id).single();
      openModal('portfolio', data);
  } catch (error) {
      console.error('Error loading portfolio item:', error);
      alert('❌ Erreur lors du chargement de l\'élément');
  }
};

window.deletePortfolio = async (id) => {
  if (!supabase) return;
  if (confirm('Êtes-vous sûr de vouloir supprimer cet élément du portfolio ?')) {
      try {
          const { error } = await supabase.from('portfolio').delete().eq('id', id);
          
          if (error) {
              console.error('Supabase delete error:', error);
              throw error;
          }
          
          alert('✅ Élément supprimé avec succès !');
          loadPortfolio();
          loadDashboard();
      } catch (error) {
          console.error('Error deleting portfolio item:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

window.editNews = async (id) => {
  if (!supabase) return;
  const { data } = await supabase.from('news').select('*').eq('id', id).single();
  openModal('news', data);
};

window.deleteNews = async (id) => {
  if (!supabase) return;
  if (confirm('Supprimer cette actualité ?')) {
      try {
          const { error } = await supabase.from('news').delete().eq('id', id);
          if (error) throw error;
          loadNews();
          alert('✅ Actualité supprimée avec succès !');
      } catch (error) {
          console.error('Error deleting news:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

window.archiveEvent = async (id) => {
  if (!supabase) return;
  if (confirm('Archiver cet événement ?')) {
      await supabase.from('news').update({ is_archived: true }).eq('id', id);
      loadNews();
  }
};

window.editFormation = async (id) => {
  if (!supabase) return;
  const { data } = await supabase.from('formations').select('*').eq('id', id).single();
  openModal('formation', data);
};

window.deleteFormation = async (id) => {
  if (!supabase) return;
  if (confirm('Supprimer cette formation ?')) {
      try {
          const { error } = await supabase.from('formations').delete().eq('id', id);
          if (error) throw error;
          loadFormations();
          alert('✅ Formation supprimée avec succès !');
      } catch (error) {
          console.error('Error deleting formation:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

window.viewFormationRegistrations = async (formationId) => {
  if (!supabase) return;
  
  try {
    const { data: formation } = await supabase
      .from('formations')
      .select('*')
      .eq('id', formationId)
      .single();
    
    const { data: registrations } = await supabase
      .from('formation_registrations')
      .select('*')
      .eq('formation_id', formationId)
      .order('created_at', { ascending: false });
    
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalFields = document.getElementById('modalFields');
    
    modalTitle.textContent = `Inscriptions pour: ${formation.title}`;
    
    if (registrations && registrations.length > 0) {
      modalFields.innerHTML = `
        <div style="margin-bottom: 1rem; color: #666; font-size: 0.9rem;">
          Total: ${registrations.length} inscription(s)
        </div>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead style="background: var(--primary-color); color: white;">
              <tr>
                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Nom</th>
                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Âge</th>
                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Ville</th>
                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Email</th>
                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Date</th>
                <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #ddd;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${registrations.map(reg => `
                <tr onclick="showRegistrationDetails('${reg.id}')" 
                    style="cursor: pointer; border-bottom: 1px solid #eee; transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(212, 175, 55, 0.05)'"
                    onmouseout="this.style.background='transparent'">
                  <td style="padding: 0.75rem; border-bottom: 1px solid #eee; color: var(--text-color);">
                    <strong>${reg.full_name}</strong>
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid #eee; color: var(--accent-color);">
                    ${reg.age} ans
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid #eee; color: var(--accent-color);">
                    ${reg.city}
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid #eee; color: var(--accent-color);">
                    ${reg.email}
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid #eee; color: var(--accent-color); font-size: 0.85rem;">
                    ${new Date(reg.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td style="padding: 0.75rem; border-bottom: 1px solid #eee;">
                    <button class="btn-delete" onclick="event.stopPropagation(); deleteFormationRegistration('${reg.id}')" 
                            style="padding: 0.25rem 0.5rem; font-size: 0.8rem;">
                      🗑️
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-color); border-radius: 8px; font-size: 0.85rem; color: var(--accent-color);">
          💡 <strong>Instructions:</strong> Cliquez sur une ligne pour voir les détails complets et les photos de l'inscription.
        </div>
      `;
    } else {
      modalFields.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--accent-color);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📭</div>
          <h3 style="color: var(--secondary-color); margin-bottom: 0.5rem;">Aucune inscription</h3>
          <p>Aucune inscription pour cette formation pour le moment.</p>
        </div>
      `;
    }
    
    modal.style.display = 'block';
    
    // Remove any previous submit handlers
    document.getElementById('modalForm').onsubmit = (e) => {
      e.preventDefault();
      closeModal();
    };
    
  } catch (error) {
    console.error('Error loading formation registrations:', error);
    alert('❌ Erreur lors du chargement des inscriptions');
  }
};

window.showRegistrationDetails = async (registrationId) => {
  if (!supabase) return;
  
  try {
    const { data: registration } = await supabase
      .from('formation_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();
    
    if (registration) {
      // Parse photos from the registration
      let photos = [];
      if (registration.photos) {
        try {
          photos = JSON.parse(registration.photos);
        } catch (e) {
          console.error('Error parsing photos:', e);
          photos = [];
        }
      }
      
      const modal = document.getElementById('modal');
      const modalTitle = document.getElementById('modalTitle');
      const modalFields = document.getElementById('modalFields');
      
      modalTitle.textContent = `Détails de l'inscription: ${registration.full_name}`;
      
      modalFields.innerHTML = `
        <div style="max-width: 800px; margin: 0 auto;">
          <!-- Back button -->
          <button onclick="viewFormationRegistrations('${registration.formation_id}')" 
                  style="background: none; border: none; color: var(--primary-color); cursor: pointer; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem;">
            ← Retour à la liste
          </button>
          
          <!-- Registration Details -->
          <div style="background: var(--white); border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
            <h3 style="color: var(--secondary-color); margin-bottom: 1.5rem; border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem;">
              📋 Informations Personnelles
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Nom Complet</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${registration.full_name}
                </div>
              </div>
              
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Âge</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${registration.age} ans
                </div>
              </div>
              
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Taille</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${registration.height} cm
                </div>
              </div>
              
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Ville</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${registration.city}
                </div>
              </div>
              
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Email</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${registration.email}
                </div>
              </div>
              
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Téléphone</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${registration.phone}
                </div>
              </div>
              
              ${registration.instagram ? `
                <div>
                  <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Instagram</label>
                  <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                    ${registration.instagram}
                  </div>
                </div>
              ` : ''}
              
              <div>
                <label style="display: block; font-size: 0.85rem; color: var(--accent-color); margin-bottom: 0.25rem;">Date d'inscription</label>
                <div style="font-weight: 600; color: var(--text-color); padding: 0.5rem; background: var(--bg-color); border-radius: 6px;">
                  ${new Date(registration.created_at).toLocaleDateString('fr-FR')} à ${new Date(registration.created_at).toLocaleTimeString('fr-FR')}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Photos Section -->
          ${photos.length > 0 ? `
            <div style="background: var(--white); border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <h3 style="color: var(--secondary-color); margin-bottom: 1.5rem; border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem;">
                📸 Photos (${photos.length})
              </h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 1rem;">
                ${photos.map((photo, index) => `
                  <div style="position: relative; border-radius: 8px; overflow: hidden; cursor: pointer; border: 2px solid var(--bg-color); transition: transform 0.2s;"
                       onmouseover="this.style.transform='scale(1.03)'"
                       onmouseout="this.style.transform='scale(1)'"
                       onclick="window.open('${photo}', '_blank')">
                    <img src="${photo}" alt="Photo ${index + 1}" 
                         style="width: 100%; height: 150px; object-fit: cover; display: block;"
                         onerror="this.src='https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop'">
                    <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem;">
                      #${index + 1}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="background: var(--white); border-radius: 10px; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.05); text-align: center; color: var(--accent-color);">
              <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
              <p>Aucune photo ajoutée par le visiteur.</p>
            </div>
          `}
          
          <!-- Actions -->
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-color); border-radius: 8px;">
            <div style="font-size: 0.9rem; color: var(--accent-color);">
              ID: ${registration.id.substring(0, 8)}...
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button onclick="window.location.href='mailto:${registration.email}?subject=Inscription%20formation'"
                      class="btn-edit" style="padding: 0.5rem 1rem;">
                ✉️ Contacter
              </button>
              <button class="btn-delete" onclick="deleteFormationRegistration('${registration.id}')">
                🗑️ Supprimer cette inscription
              </button>
            </div>
          </div>
        </div>
      `;
      
      modal.style.display = 'block';
      
      document.getElementById('modalForm').onsubmit = (e) => {
        e.preventDefault();
        closeModal();
      };
    }
    
  } catch (error) {
    console.error('Error loading registration details:', error);
    alert('❌ Erreur lors du chargement des détails de l\'inscription');
  }
};

window.deleteFormationRegistration = async (registrationId) => {
  if (!supabase) return;
  
  if (confirm('Supprimer cette inscription ?')) {
    try {
      // First get the registration to know which formation it belongs to
      const { data: registration } = await supabase
        .from('formation_registrations')
        .select('formation_id')
        .eq('id', registrationId)
        .single();
      
      if (!registration) {
        alert('❌ Inscription non trouvée');
        return;
      }
      
      const { error } = await supabase
        .from('formation_registrations')
        .delete()
        .eq('id', registrationId);
      
      if (error) throw error;
      
      alert('✅ Inscription supprimée avec succès !');
      
      // Close current modal and reopen the registration list
      const modal = document.getElementById('modal');
      const modalContent = document.querySelector('.modal-content');
      
      // Check if we're in details view or list view
      if (modalContent.querySelector('button[onclick*="viewFormationRegistrations"]')) {
        // We're in details view, go back to list
        viewFormationRegistrations(registration.formation_id);
      } else {
        // We're in list view, refresh the list
        if (modal.style.display === 'block') {
          viewFormationRegistrations(registration.formation_id);
        }
      }
      
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert('❌ Erreur lors de la suppression: ' + error.message);
    }
  }
};

window.deleteApplication = async (id, name) => {
  if (!supabase) return;
  if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement la candidature de ${name} ?`)) {
      try {
          const { error } = await supabase.from('applications').delete().eq('id', id);
          
          if (error) throw error;
          
          alert('✅ Candidature supprimée avec succès !');
          loadApplications();
          loadDashboard();
      } catch (error) {
          console.error('Error deleting application:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

window.approveApplication = async (id, name, email) => {
  if (!supabase) return;
  const price = prompt(`Définir le prix pour ${name} (en DA):`, '5000');
  
  if (price === null) return;
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum) || priceNum <= 0) {
      alert('❌ Veuillez entrer un prix valide');
      return;
  }
  
  if (confirm(`Approuver la candidature de ${name} avec un prix de ${priceNum} DA ?`)) {
      try {
          const { data: app } = await supabase.from('applications').select('*').eq('id', id).single();
          
          await supabase.from('applications').update({ 
              status: 'approved',
              approved_at: new Date().toISOString()
          }).eq('id', id);
          
          const imageUrl = app.photos && app.photos.length > 0 ? app.photos[0] : 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop';
          
          await supabase.from('portfolio').insert([{
              title: name,
              description: `Modèle professionnel - ${app.city}`,
              image_url: imageUrl,
              category: 'fashion',
              status: 'approved',
              price: priceNum,
              applicant_id: id
          }]);
          
          const emailBody = emailTemplates.acceptance(name);
          console.log('Email envoyé à:', email);
          console.log(emailBody);
          alert(`✅ Candidature approuvée avec un prix de ${priceNum} DA ! Un email a été envoyé à ${email}`);
          
          loadApplications();
          loadPortfolio();
      } catch (error) {
          console.error('Error approving application:', error);
          alert('❌ Erreur lors de l\'approbation');
      }
  }
};

window.rejectApplication = async (id, name, email) => {
  if (!supabase) return;
  const reason = prompt(`Raison du rejet de la candidature de ${name} (optionnel) :`);
  
  if (reason !== null) {
      try {
          await supabase.from('applications').update({ 
              status: 'rejected',
              rejection_reason: reason
          }).eq('id', id);
          
          const emailBody = emailTemplates.rejection(name, reason);
          console.log('Email envoyé à:', email);
          console.log(emailBody);
          alert(`✅ Candidature rejetée. Un email a été envoyé à ${email}`);
          
          loadApplications();
      } catch (error) {
          console.error('Error rejecting application:', error);
          alert('❌ Erreur lors du rejet');
      }
  }
};

window.viewPaymentReceipt = function(receiptData) {
  if (receiptData) {
      const newWindow = window.open();
      newWindow.document.write(`
          <html>
              <head><title>Reçu de paiement</title></head>
              <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0;">
                  <img src="${receiptData}" style="max-width: 100%; max-height: 100%; object-fit: contain;" alt="Reçu de paiement">
              </body>
          </html>
      `);
  }
};

window.deleteBooking = async (id) => {
  if (!supabase) return;
  if (confirm('Supprimer cette réservation ?')) {
      try {
          const { error } = await supabase.from('bookings').delete().eq('id', id);
          if (error) throw error;
          loadClientBookings();
          loadDashboard();
          alert('✅ Réservation supprimée avec succès !');
      } catch (error) {
          console.error('Error deleting booking:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

window.editPrice = async (id) => {
  if (!supabase) return;
  const { data } = await supabase.from('prices').select('*').eq('id', id).single();
  openModal('price', data);
};

window.deletePrice = async (id) => {
  if (!supabase) return;
  if (confirm('Supprimer ce tarif ?')) {
      try {
          const { error } = await supabase.from('prices').delete().eq('id', id);
          if (error) throw error;
          loadPrices();
          alert('✅ Tarif supprimé avec succès !');
      } catch (error) {
          console.error('Error deleting price:', error);
          alert('❌ Erreur lors de la suppression: ' + error.message);
      }
  }
};

// Modal Management
function openModal(type, data) {
  const modal = document.getElementById('modal');
  const modalTitle = document.getElementById('modalTitle');
  const modalFields = document.getElementById('modalFields');
  
  currentEditItem = data;
  
  let fields = '';
  let title = '';

  switch(type) {
      case 'service':
          title = data ? 'Modifier le service' : 'Ajouter un service';
          fields = `
              <label>Titre</label>
              <input type="text" id="field-title" value="${data?.title || ''}" required>
              <label>Description</label>
              <textarea id="field-description" required>${data?.description || ''}</textarea>
              <label>Ordre d'affichage</label>
              <input type="number" id="field-order" value="${data?.display_order || 0}" required>
              <label>Ajouter images</label>
              <input type="file" id="field-images" accept="image/*" multiple>
          `;
          break;
      case 'portfolio':
          title = data ? 'Modifier le portfolio' : 'Ajouter au portfolio';
          fields = `
              <label>Nom ou surnom du modèle</label>
              <input type="text" id="field-title" value="${data?.title || ''}" required>
              <label>Description</label>
              <textarea id="field-description" required>${data?.description || ''}</textarea>
              <label>Catégorie</label>
              <select id="field-category" required>
                  <option value="fashion" ${data?.category === 'fashion' ? 'selected' : ''}>Mode</option>
                  <option value="creative" ${data?.category === 'creative' ? 'selected' : ''}>Créatif</option>
                  <option value="ecommerce" ${data?.category === 'ecommerce' ? 'selected' : ''}>E-commerce</option>
              </select>
              <label>Prix (DA)</label>
              <input type="number" id="field-price" value="${data?.price || ''}" min="0" step="100">
              <label>Statut</label>
              <select id="field-status" required>
                  <option value="pending" ${data?.status === 'pending' ? 'selected' : ''}>En attente</option>
                  <option value="approved" ${data?.status === 'approved' ? 'selected' : ''}>Approuvé</option>
              </select>
              <label>Ajouter images</label>
              <input type="file" id="field-images" accept="image/*" multiple>
          `;
          break;
      case 'news':
          title = data ? 'Modifier l\'actualité' : 'Ajouter une actualité';
          fields = `
              <label>Titre</label>
              <input type="text" id="field-title" value="${data?.title || ''}" required>
              <label>Contenu</label>
              <textarea id="field-content" required>${data?.content || ''}</textarea>
              <label>Date</label>
              <input type="date" id="field-date" value="${data?.date || ''}" required>
              <label>Type</label>
              <select id="field-event-type">
                  <option value="news" ${data?.event_type === 'news' ? 'selected' : ''}>Actualité</option>
                  <option value="event" ${data?.event_type === 'event' ? 'selected' : ''}>Événement</option>
              </select>
              <label>Ajouter image</label>
              <input type="file" id="field-image" accept="image/*">
          `;
          break;
      case 'formation':
          title = data ? 'Modifier la formation' : 'Ajouter une formation';
          fields = `
              <label>Titre</label>
              <input type="text" id="field-title" value="${data?.title || ''}" required>
              <label>Description</label>
              <textarea id="field-description" required>${data?.description || ''}</textarea>
              <label>Date de formation</label>
              <input type="date" id="field-formation-date" value="${data?.formation_date || ''}" required>
              <label>Prix (DA)</label>
              <input type="number" id="field-price" value="${data?.price || ''}" required>
              <label>Durée</label>
              <input type="text" id="field-duration" value="${data?.duration || ''}" placeholder="Ex: 3 mois" required>
              <label>Ajouter images</label>
              <input type="file" id="field-images" accept="image/*" multiple>
          `;
          break;
      case 'price':
          title = data ? 'Modifier le tarif' : 'Ajouter un tarif';
          fields = `
              <label>Type de service</label>
              <input type="text" id="field-service-type" value="${data?.service_type || ''}" required>
              <label>Prix (DA)</label>
              <input type="number" id="field-price" value="${data?.price || ''}" required>
              <label>Description</label>
              <textarea id="field-description">${data?.description || ''}</textarea>
          `;
          break;
  }

  modalTitle.textContent = title;
  modalFields.innerHTML = fields;
  modal.style.display = 'block';

  document.getElementById('modalForm').onsubmit = async (e) => {
      e.preventDefault();
      await saveModalData(type);
  };
}

// FIXED: saveModalData function
async function saveModalData(type) {
  if (!supabase) {
      alert('❌ Supabase non initialisé');
      return;
  }
  
  console.log('💾 Saving modal data for type:', type);
  
  let dataToSave = {};
  let table = '';

  try {
      switch(type) {
          case 'service':
              table = 'services';
              dataToSave = {
                  title: document.getElementById('field-title').value,
                  description: document.getElementById('field-description').value,
                  display_order: parseInt(document.getElementById('field-order').value),
                  icon: '⚙️'
              };
              break;
              
          case 'portfolio':
              table = 'portfolio';
              
              const portfolioImagesInput = document.getElementById('field-images');
              let portfolioImageUrl = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop';
              
              if (portfolioImagesInput && portfolioImagesInput.files.length > 0) {
                  console.log('📷 Processing portfolio image...');
                  const firstFile = portfolioImagesInput.files[0];
                  portfolioImageUrl = await fileToBase64(firstFile);
              } else if (currentEditItem && currentEditItem.image_url) {
                  portfolioImageUrl = currentEditItem.image_url;
              }
              
              dataToSave = {
                  title: document.getElementById('field-title').value,
                  description: document.getElementById('field-description').value,
                  image_url: portfolioImageUrl,
                  category: document.getElementById('field-category').value,
                  price: parseFloat(document.getElementById('field-price').value) || null,
                  status: document.getElementById('field-status').value
              };
              
              console.log('📊 Portfolio data to save:', dataToSave);
              break;
              
          case 'news':
              table = 'news';
              
              const newsImageInput = document.getElementById('field-image');
              let newsImageUrl = null;
              
              if (newsImageInput && newsImageInput.files.length > 0) {
                  console.log('📷 Processing news image...');
                  const firstFile = newsImageInput.files[0];
                  newsImageUrl = await fileToBase64(firstFile);
              } else if (currentEditItem && currentEditItem.image_url) {
                  newsImageUrl = currentEditItem.image_url;
              }
              
              dataToSave = {
                  title: document.getElementById('field-title').value,
                  content: document.getElementById('field-content').value,
                  date: document.getElementById('field-date').value,
                  image_url: newsImageUrl,
                  event_type: document.getElementById('field-event-type').value
              };
              break;
              
          case 'formation':
              table = 'formations';
              
              const formationImagesInput = document.getElementById('field-images');
              let formationPhotos = [];
              let formationImageUrl = 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop';
              
              if (formationImagesInput && formationImagesInput.files.length > 0) {
                  console.log('📷 Processing formation images...');
                  for (let file of formationImagesInput.files) {
                      const base64 = await fileToBase64(file);
                      formationPhotos.push(base64);
                  }
                  formationImageUrl = formationPhotos[0];
              } else if (currentEditItem) {
                  if (currentEditItem.photos) {
                      try {
                          formationPhotos = JSON.parse(currentEditItem.photos);
                      } catch (e) {
                          console.error('Error parsing existing photos:', e);
                          formationPhotos = [];
                      }
                  }
                  formationImageUrl = currentEditItem.image_url || (formationPhotos.length > 0 ? formationPhotos[0] : formationImageUrl);
              } else {
                  formationPhotos = [formationImageUrl];
              }
              
              dataToSave = {
                  title: document.getElementById('field-title').value,
                  description: document.getElementById('field-description').value,
                  formation_date: document.getElementById('field-formation-date').value,
                  price: parseFloat(document.getElementById('field-price').value),
                  duration: document.getElementById('field-duration').value,
                  photos: JSON.stringify(formationPhotos),
                  image_url: formationImageUrl
              };
              
              console.log('📊 Formation data to save:', dataToSave);
              break;
              
          case 'price':
              table = 'prices';
              dataToSave = {
                  service_type: document.getElementById('field-service-type').value,
                  price: parseFloat(document.getElementById('field-price').value),
                  description: document.getElementById('field-description').value
              };
              break;
      }

      console.log(`💾 Saving to table: ${table}`, dataToSave);

      let result;
      if (currentEditItem) {
          console.log('✏️ Updating existing item:', currentEditItem.id);
          result = await supabase.from(table).update(dataToSave).eq('id', currentEditItem.id);
      } else {
          console.log('➕ Creating new item');
          result = await supabase.from(table).insert([dataToSave]);
      }

      if (result.error) {
          console.error('❌ Supabase error:', result.error);
          throw result.error;
      }

      console.log('✅ Save successful:', result);
      closeModal();
      
      // Reload the appropriate section
      switch(type) {
          case 'service': 
              loadServices(); 
              break;
          case 'portfolio': 
              loadPortfolio(); 
              break;
          case 'news': 
              loadNews(); 
              break;
          case 'formation': 
              loadFormations(); 
              break;
          case 'price': 
              loadPrices(); 
              break;
      }
      
      loadDashboard();
      alert('✅ Enregistré avec succès !');
      
  } catch (error) {
      console.error('❌ Error saving:', error);
      alert('❌ Erreur lors de l\'enregistrement: ' + error.message);
  }
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  currentEditItem = null;
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

// ==================== EVENT LISTENERS ====================

// Event Listeners Setup
function setupEventListeners() {
  // Content form listeners
  const aboutForm = document.getElementById('aboutForm');
  // About form handler - FIXED VERSION
if (aboutForm) {
  aboutForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('💾 Saving about content...');
    
    if (!supabase) {
      alert('❌ Supabase non initialisé');
      return;
    }
    
    const data = {
      section: 'about',
      story: document.getElementById('aboutStory').value,
      mission: document.getElementById('aboutMission').value,
      values: document.getElementById('aboutValues').value  // Note: 'values' as property name
    };

    console.log('📤 About data to save:', data);

    try {
      const { error } = await supabase
        .from('content')
        .upsert(data, { onConflict: 'section' });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      alert('✅ Contenu "À propos" enregistré avec succès !');
      console.log('✅ About content saved successfully');
      
      // Refresh dashboard
      loadDashboard();
      
    } catch (error) {
      console.error('❌ Error saving about:', error);
      alert(`❌ Erreur lors de l'enregistrement: ${error.message}`);
    }
  });
}

// Contact form handler - FIXED VERSION
if (contactForm) {
  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('💾 Saving contact content...');
    
    if (!supabase) {
      alert('❌ Supabase non initialisé');
      return;
    }
    
    const data = {
      section: 'contact',
      address: document.getElementById('contactAddress').value,
      phone: document.getElementById('contactPhone').value,
      email: document.getElementById('contactEmail').value,
      whatsapp: document.getElementById('contactWhatsapp').value,
      facebook: document.getElementById('contactFacebook').value,
      instagram: document.getElementById('contactInstagram').value,
      tiktok: document.getElementById('contactTiktok').value
    };

    console.log('📤 Contact data to save:', data);

    try {
      const { error } = await supabase
        .from('content')
        .upsert(data, { onConflict: 'section' });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      alert('✅ Contenu "Contact" enregistré avec succès !');
      console.log('✅ Contact content saved successfully');
      
      // Refresh dashboard
      loadDashboard();
      
    } catch (error) {
      console.error('❌ Error saving contact:', error);
      alert(`❌ Erreur lors de l'enregistrement: ${error.message}`);
    }
  });
}

  // Add button listeners
  const addServiceBtn = document.getElementById('addServiceBtn');
  if (addServiceBtn) {
    addServiceBtn.addEventListener('click', () => openModal('service', null));
  }

  const addPortfolioBtn = document.getElementById('addPortfolioBtn');
  if (addPortfolioBtn) {
    addPortfolioBtn.addEventListener('click', () => openModal('portfolio', null));
  }

  const addNewsBtn = document.getElementById('addNewsBtn');
  if (addNewsBtn) {
    addNewsBtn.addEventListener('click', () => openModal('news', null));
  }

  const addFormationBtn = document.getElementById('addFormationBtn');
  if (addFormationBtn) {
    addFormationBtn.addEventListener('click', () => openModal('formation', null));
  }

  const addPriceBtn = document.getElementById('addPriceBtn');
  if (addPriceBtn) {
    addPriceBtn.addEventListener('click', () => openModal('price', null));
  }

  // Modal close listeners
  const modalClose = document.querySelector('.modal-close');
  if (modalClose) {
    modalClose.addEventListener('click', closeModal);
  }

  const cancelBtn = document.getElementById('cancelBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', closeModal);
  }

  // Menu toggle for mobile
  const menuToggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const sidebarBackdrop = document.getElementById('sidebarBackdrop');
  
  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      sidebarBackdrop.classList.toggle('active');
      
      // Changer l'icône
      if (sidebar.classList.contains('active')) {
        menuToggle.innerHTML = '×';
        menuToggle.style.background = 'var(--danger)';
      } else {
        menuToggle.innerHTML = '☰';
        menuToggle.style.background = 'var(--primary-color)';
      }
    });
  }
  
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => {
      sidebar.classList.remove('active');
      sidebarBackdrop.classList.remove('active');
      menuToggle.innerHTML = '☰';
      menuToggle.style.background = 'var(--primary-color)';
    });
  }
  
  // Fermer le menu au clic sur un lien de navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
        sidebarBackdrop.classList.remove('active');
        menuToggle.innerHTML = '☰';
        menuToggle.style.background = 'var(--primary-color)';
      }
    });
  });
  
  // Fermer le menu au clic sur les boutons de navigation
  document.querySelectorAll('.btn-navigate').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        sidebar.classList.remove('active');
        sidebarBackdrop.classList.remove('active');
        menuToggle.innerHTML = '☰';
        menuToggle.style.background = 'var(--primary-color)';
      }
    });
  });
  
  // ==================== LIGHTBOX EVENT LISTENERS ====================
  
  // Fermer la lightbox
  const lightboxClose = document.querySelector('.lightbox-close');
  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeCandidateLightbox);
  }
  
  // Boutons de navigation de la lightbox
  const lightboxPrev = document.querySelector('.lightbox-prev');
  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', prevCandidateImage);
  }
  
  const lightboxNext = document.querySelector('.lightbox-next');
  if (lightboxNext) {
    lightboxNext.addEventListener('click', nextCandidateImage);
  }
  
  // Fermer la lightbox en cliquant sur l'arrière-plan
  const candidateLightbox = document.getElementById('candidateLightbox');
  if (candidateLightbox) {
    candidateLightbox.addEventListener('click', (e) => {
      if (e.target === candidateLightbox) {
        closeCandidateLightbox();
      }
    });
  }
}

// ==================== DARK MODE FUNCTIONS ====================
// ==================== DARK MODE FUNCTIONS ====================

// Version corrigée
function initializeDarkMode() {
  console.log('🌙 Initialisation du dark mode...');
  
  const themeToggle = document.getElementById('themeToggle');
  
  if (!themeToggle) {
    console.error('❌ Bouton themeToggle non trouvé !');
    return;
  }
  
  console.log('✅ Bouton themeToggle trouvé');
  
  // Fonction pour basculer le thème
  const toggleTheme = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark-theme');
    
    if (isDark) {
      html.classList.remove('dark-theme');
      localStorage.setItem('adminTheme', 'light');
      themeToggle.innerHTML = '🌙 Mode Sombre';
      console.log('🔆 Passage en mode clair');
    } else {
      html.classList.add('dark-theme');
      localStorage.setItem('adminTheme', 'dark');
      themeToggle.innerHTML = '☀️ Mode Clair';
      console.log('🌙 Passage en mode sombre');
    }
  };
  
  // Appliquer le thème sauvegardé
  const savedTheme = localStorage.getItem('adminTheme') || 'light';
  console.log('📁 Thème sauvegardé:', savedTheme);
  
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-theme');
    themeToggle.innerHTML = '☀️ Mode Clair';
    console.log('✅ Mode sombre appliqué');
  } else {
    document.documentElement.classList.remove('dark-theme');
    themeToggle.innerHTML = '🌙 Mode Sombre';
    console.log('✅ Mode clair appliqué');
  }
  
  // Ajouter l'événement click
  themeToggle.addEventListener('click', toggleTheme);
  console.log('✅ Écouteur d\'événement ajouté au bouton');
}

// ==================== INITIALIZATION ====================

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Admin panel initializing...');
  setupEventListeners();
  initializeApp();
  initializeDarkMode(); // <-- AJOUTEZ CETTE LIGNE
});

// Export global functions for lightbox
window.nextCandidateImage = nextCandidateImage;
window.prevCandidateImage = prevCandidateImage;
window.closeCandidateLightbox = closeCandidateLightbox;