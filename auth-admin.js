// auth-admin.js
import { supabase } from './supabase-client.js';

window.currentUser = null;

// Auth init
async function initAuth() {
  console.log('🚀 Initialisation auth...');

  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    window.currentUser = session.user;
    console.log('✅ Déjà connecté:', session.user.email);
    return session.user;
  }

  return await showLoginPopup();
}

// Login popup
function showLoginPopup() {
  return new Promise((resolve) => {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="loginPopup" style="
        position:fixed; inset:0; background:rgba(0,0,0,.8);
        display:flex; align-items:center; justify-content:center; z-index:9999;">
        <form id="loginForm" style="background:#fff;padding:2rem;border-radius:10px;width:300px">
          <h3 style="margin-bottom:1rem;color:#2b2d42;">Connexion admin</h3>
          <input id="loginEmail" type="email" placeholder="Email" required style="width:100%;padding:0.75rem;margin-bottom:1rem;border:2px solid #e9ecef;border-radius:8px;"><br>
          <input id="loginPassword" type="password" placeholder="Mot de passe" required style="width:100%;padding:0.75rem;margin-bottom:1rem;border:2px solid #e9ecef;border-radius:8px;"><br>
          <button type="submit" style="width:100%;padding:0.75rem;background:#d4af37;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:600;">Connexion</button>
          <p id="loginErr" style="color:red;margin-top:1rem;text-align:center;"></p>
        </form>
      </div>
    `);

    document.getElementById('loginForm').onsubmit = async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginEmail').value;
      const password = document.getElementById('loginPassword').value;
      const errElement = document.getElementById('loginErr');

      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          errElement.textContent = error.message;
          return;
        }

        window.currentUser = data.user;
        document.getElementById('loginPopup').remove();
        console.log('✅ Connecté:', data.user.email);
        resolve(data.user);
      } catch (err) {
        console.error('❌ Erreur de connexion:', err);
        errElement.textContent = 'Erreur de connexion: ' + err.message;
      }
    };
  });
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  location.reload();
}

window.authAdmin = {
  init: initAuth,
  logout,
};

console.log('✅ Auth module loaded');