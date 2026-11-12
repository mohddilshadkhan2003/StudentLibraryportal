document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginMsg = document.getElementById('loginMsg');
  const signupMsg = document.getElementById('signupMsg');
  const toggleButtons = document.querySelectorAll('.toggle-pw');

  const safeText = (value) => (value || '').trim();

  const showMessage = (el, message, type = 'success') => {
    if (!el) return;
    el.textContent = message;
    el.className = `msg show ${type}`;
  };

  const showToast = (message, type = 'success') => {
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 260);
    }, 2600);
  };

  const setQueuedToast = (message, type = 'success') => {
    localStorage.setItem('studentLibraryToast', JSON.stringify({ message, type }));
  };

  const showQueuedToast = () => {
    try {
      const queued = JSON.parse(localStorage.getItem('studentLibraryToast') || 'null');
      if (!queued) return;
      showToast(queued.message, queued.type || 'success');
      localStorage.removeItem('studentLibraryToast');
    } catch (error) {
      localStorage.removeItem('studentLibraryToast');
    }
  };

  const getUsers = () => JSON.parse(localStorage.getItem('studentLibraryUsers') || '[]');
  const saveUsers = (users) => localStorage.setItem('studentLibraryUsers', JSON.stringify(users));

  const hashValue = (value) => {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash.toString(16);
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  showQueuedToast();

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const rollNumber = safeText(document.getElementById('rollNumber')?.value);
      const password = safeText(document.getElementById('password')?.value);

      if (!rollNumber || !password) {
        showMessage(loginMsg, 'Please fill in all fields.', 'error');
        showToast('Please fill in all fields.', 'error');
        return;
      }

      const users = getUsers();
      const user = users.find((item) => item.rollNumber.toLowerCase() === rollNumber.toLowerCase());

      if (!user) {
        showMessage(loginMsg, 'No account found for this roll number.', 'error');
        showToast('No account found for this roll number.', 'error');
        return;
      }

      if (hashValue(password) !== user.passwordHash) {
        showMessage(loginMsg, 'Incorrect password.', 'error');
        showToast('Incorrect password.', 'error');
        return;
      }

      localStorage.setItem('studentLibraryCurrentUser', JSON.stringify({
        fullName: user.fullName,
        rollNumber: user.rollNumber,
        email: user.email,
      }));

      setQueuedToast('Login successful. Welcome back!', 'success');
      showMessage(loginMsg, 'Login successful. Redirecting...', 'success');
      showToast('Login successful. Redirecting...', 'success');
      setTimeout(() => window.location.href = 'dashboard.html', 500);
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const fullName = safeText(document.getElementById('fullName')?.value);
      const rollNumber = safeText(document.getElementById('rollNumber')?.value);
      const email = safeText(document.getElementById('email')?.value);
      const password = safeText(document.getElementById('password')?.value);

      if (!fullName || !rollNumber || !email || !password) {
        showMessage(signupMsg, 'Please complete all required fields.', 'error');
        showToast('Please complete all required fields.', 'error');
        return;
      }

      if (fullName.length < 2) {
        showMessage(signupMsg, 'Full name must be at least 2 characters long.', 'error');
        showToast('Full name must be at least 2 characters long.', 'error');
        return;
      }

      if (!validateEmail(email)) {
        showMessage(signupMsg, 'Please enter a valid email address.', 'error');
        showToast('Please enter a valid email address.', 'error');
        return;
      }

      if (password.length < 6) {
        showMessage(signupMsg, 'Password must be at least 6 characters long.', 'error');
        showToast('Password must be at least 6 characters long.', 'error');
        return;
      }

      const users = getUsers();
      const alreadyExists = users.some((item) =>
        item.rollNumber.toLowerCase() === rollNumber.toLowerCase() ||
        item.email.toLowerCase() === email.toLowerCase()
      );

      if (alreadyExists) {
        showMessage(signupMsg, 'An account with this roll number or email already exists.', 'error');
        showToast('An account with this roll number or email already exists.', 'error');
        return;
      }

      users.push({
        fullName,
        rollNumber,
        email,
        passwordHash: hashValue(password),
        createdAt: new Date().toISOString(),
      });

      saveUsers(users);
      setQueuedToast('Account created successfully. Please log in.', 'success');
      showMessage(signupMsg, 'Account created successfully. Redirecting to login...', 'success');
      showToast('Account created successfully. Redirecting to login...', 'success');
      setTimeout(() => window.location.href = 'login.html', 700);
    });
  }

  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      button.textContent = isPassword ? 'Hide' : 'Show';
    });
  });

  if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
    const currentUser = JSON.parse(localStorage.getItem('studentLibraryCurrentUser') || 'null');
    if (currentUser) {
      setQueuedToast('Welcome back! Continue to your library dashboard.', 'success');
      window.location.href = 'dashboard.html';
    }
  }
});
