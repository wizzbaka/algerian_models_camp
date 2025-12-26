// auth-admin.js - Fixed version without variable conflicts
// Admin authentication management with Supabase Auth

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://rzitbfwptcmdlwxemluk.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6aXRiZndwdGNtZGx3eGVtbHVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NTMzMTIsImV4cCI6MjA3ODQyOTMxMn0.oCNi8pCb-3rpwc3dyKwoNkcM5Vjkys1J8eO2eoaRT9Y'
};

// Global variables - using window object to avoid conflicts
window.currentUser = null;

// Get Supabase client
function getSupabaseClient() {
  return window.supabase;
}

// Initialize Supabase
async function initSupabase() {
  console.log('🔧 Initialisation de Supabase Auth...');
  
  // Check if already initialized
  if (window.supabase && window.supabase.auth) {
    console.log('✅ Supabase déjà initialisé');
    return window.supabase;
  }
  
  // Wait for Supabase library to load
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      console.log('✅ Supabase library loaded');
      window.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
      return window.supabase;
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
    attempts++;
  }
  
  throw new Error('Impossible de charger Supabase. Vérifiez votre connexion internet.');
}

// Check authentication
async function checkAuth() {
  console.log('🔐 Vérification de l\'authentification...');
  
  try {
    const client = getSupabaseClient();
    if (!client) {
      console.log('❌ Client Supabase non disponible');
      return false;
    }
    
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
      console.log('❌ Erreur session:', error.message);
      return false;
    }
    
    if (session && session.user) {
      window.currentUser = session.user;
      console.log('✅ Session valide pour:', window.currentUser.email);
      return true;
    }
    
    console.log('ℹ️ Aucune session active');
    return false;
    
  } catch (error) {
    console.error('❌ Erreur checkAuth:', error);
    return false;
  }
}

// Show login popup
function showLoginPopup() {
  return new Promise((resolve) => {
    console.log('🔐 Affichage du formulaire de login...');
    
    // Remove existing popup if any
    const existingPopup = document.getElementById('loginPopup');
    if (existingPopup) {
      existingPopup.remove();
    }
    
    // Create popup HTML
    const popupHTML = `
      <div id="loginPopup" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(10px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      ">
        <div style="
          background: white;
          padding: 2.5rem;
          border-radius: 15px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          border: 2px solid #d4af37;
        ">
          <h2 style="color: #2b2d42; margin-bottom: 1rem; text-align: center;">
            🔐 Connexion Admin
          </h2>
          
          <p style="color: #666; text-align: center; margin-bottom: 2rem; font-size: 0.95rem;">
            Accès réservé aux administrateurs
          </p>
          
          <form id="loginForm" style="display: flex; flex-direction: column; gap: 1.5rem;">
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #2b2d42; font-weight: 500;">
                Email
              </label>
              <input 
                type="email" 
                id="loginEmail" 
                placeholder="admin@example.com"
                required
                autocomplete="email"
                style="
                  width: 100%;
                  padding: 0.85rem;
                  border: 2px solid #e9ecef;
                  border-radius: 8px;
                  font-size: 1rem;
                  box-sizing: border-box;
                "
              >
            </div>
            
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #2b2d42; font-weight: 500;">
                Mot de passe
              </label>
              <input 
                type="password" 
                id="loginPassword" 
                placeholder="••••••••"
                required
                autocomplete="current-password"
                style="
                  width: 100%;
                  padding: 0.85rem;
                  border: 2px solid #e9ecef;
                  border-radius: 8px;
                  font-size: 1rem;
                  box-sizing: border-box;
                "
              >
            </div>
            
            <button 
              type="submit"
              id="loginSubmitBtn"
              style="
                background: #d4af37;
                color: white;
                border: none;
                padding: 0.85rem;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                margin-top: 0.5rem;
              "
            >
              Se connecter
            </button>
            
            <div id="loginError" style="
              color: #e74c3c;
              font-size: 0.9rem;
              text-align: center;
              padding: 0.75rem;
              background: rgba(231, 76, 60, 0.1);
              border-radius: 6px;
              border-left: 3px solid #e74c3c;
              display: none;
            "></div>
          </form>
        </div>
      </div>
      
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        #loginPopup input:focus {
          outline: none;
          border-color: #d4af37 !important;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
        }
        
        #loginSubmitBtn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4);
        }
      </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Handle form submission
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const submitBtn = document.getElementById('loginSubmitBtn');
    
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      
      if (!email || !password) {
        loginError.textContent = 'Veuillez remplir tous les champs';
        loginError.style.display = 'block';
        return;
      }
      
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '⏳ Connexion...';
      submitBtn.disabled = true;
      loginError.style.display = 'none';
      
      try {
        console.log('🔐 Tentative de connexion:', email);
        
        const client = getSupabaseClient();
        const { data, error } = await client.auth.signInWithPassword({
          email: email,
          password: password
        });
        
        if (error) {
          console.error('❌ Erreur:', error);
          
          let errorMessage = 'Erreur de connexion';
          if (error.message.includes('Invalid login credentials')) {
            errorMessage = '❌ Email ou mot de passe incorrect';
          } else if (error.message.includes('Email not confirmed')) {
            errorMessage = '❌ Veuillez confirmer votre email';
          }
          
          throw new Error(errorMessage);
        }
        
        if (!data || !data.user) {
          throw new Error('❌ Aucune donnée utilisateur');
        }
        
        window.currentUser = data.user;
        console.log('✅ Connexion réussie:', data.user.email);
        
        const popup = document.getElementById('loginPopup');
        if (popup) {
          popup.style.opacity = '0';
          popup.style.transition = 'opacity 0.3s ease';
          setTimeout(() => popup.remove(), 300);
        }
        
        resolve(data.user);
        
      } catch (error) {
        console.error('❌ Erreur:', error);
        loginError.textContent = error.message || 'Erreur de connexion';
        loginError.style.display = 'block';
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
    
    setTimeout(() => {
      const emailInput = document.getElementById('loginEmail');
      if (emailInput) emailInput.focus();
    }, 100);
  });
}

// Logout
async function logout() {
  console.log('🚪 Déconnexion...');
  
  try {
    const client = getSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
  } catch (error) {
    console.error('Erreur déconnexion:', error);
  }
  
  window.currentUser = null;
  window.location.reload();
}

// Get current user
function getCurrentUser() {
  return window.currentUser;
}

// Check if authenticated
function isAuthenticated() {
  return !!window.currentUser;
}

// Main init function
async function initAuth() {
  try {
    console.log('🚀 Initialisation auth...');
    
    await initSupabase();
    console.log('✅ Supabase initialisé');
    
    const isLoggedIn = await checkAuth();
    
    if (!isLoggedIn) {
      console.log('👤 Affichage login...');
      await showLoginPopup();
      console.log('✅ Connecté');
    } else {
      console.log('✅ Déjà connecté:', window.currentUser.email);
    }
    
    return window.currentUser;
    
  } catch (error) {
    console.error('❌ Erreur init auth:', error);
    throw error;
  }
}

// Export
window.authAdmin = {
  init: initAuth,
  logout: logout,
  getUser: getCurrentUser,
  isAuthenticated: isAuthenticated,
  checkAuth: checkAuth
};

console.log('✅ Auth module loaded');