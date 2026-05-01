// public/js/auth.js
// Authentication page logic

// Check if already logged in
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}

// Tab switching
const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.dataset.tab;
    
    // Update active tab
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding form
    if (tabName === 'login') {
      loginForm.classList.add('active');
      signupForm.classList.remove('active');
    } else {
      signupForm.classList.add('active');
      loginForm.classList.remove('active');
    }
    
    // Clear errors
    document.getElementById('loginError').textContent = '';
    document.getElementById('signupError').textContent = '';
  });
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(loginForm);
  const email = formData.get('email');
  const password = formData.get('password');
  
  const errorEl = document.getElementById('loginError');
  errorEl.textContent = '';
  
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Store token and user info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      errorEl.textContent = data.error || 'Login failed';
    }
  } catch (err) {
    errorEl.textContent = 'Network error. Please try again.';
  }
});

// Signup form submission
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData(signupForm);
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');
  const role = formData.get('role');
  
  const errorEl = document.getElementById('signupError');
  errorEl.textContent = '';
  
  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      // Auto-login after signup
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const loginData = await loginRes.json();
      
      if (loginRes.ok) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        window.location.href = 'dashboard.html';
      }
    } else {
      errorEl.textContent = data.error || 'Signup failed';
    }
  } catch (err) {
    errorEl.textContent = 'Network error. Please try again.';
  }
});
