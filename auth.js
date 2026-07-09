// IMPORTANT: change this to your deployed backend's Railway URL, e.g.
// "https://plant-shop-auth-production.up.railway.app"
const API_BASE_URL = 'http://sunut-auth-sunut-services.up.railway.app';

function showMessage(el, text, type) {
  el.textContent = text;
  el.className = `message ${type}`;
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: 'include', // sends/receives the login cookie
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
