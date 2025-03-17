class AuthManager {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.showLoginBtn = document.getElementById('showLogin');
        this.showRegisterBtn = document.getElementById('showRegister');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form switching
        this.showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForms('login');
        });

        this.showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForms('register');
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    toggleForms(form) {
        if (form === 'login') {
            this.loginForm.classList.add('active');
            this.registerForm.classList.remove('active');
        } else {
            this.loginForm.classList.remove('active');
            this.registerForm.classList.add('active');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.location.href = `dashboard.html?role=${user.role}`;
        } else {
            this.showError(this.loginForm, 'Invalid email or password');
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const name = e.target.querySelector('input[type="text"]').value;
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        const role = e.target.querySelector('select').value;

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.some(u => u.email === email)) {
            this.showError(this.registerForm, 'Email already exists');
            return;
        }

        const newUser = { name, email, password, role };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        
        window.location.href = `dashboard.html?role=${role}`;
    }

    showError(form, message) {
        const errorDiv = form.querySelector('.error-message') || document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        if (!form.querySelector('.error-message')) {
            form.appendChild(errorDiv);
        }
    }
}

// Initialize auth manager
new AuthManager(); 