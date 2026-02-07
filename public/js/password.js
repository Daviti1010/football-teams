const icon = document.getElementById('icon');
const confirmIcon = document.getElementById('confirm-icon');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirm-password');
const form = document.querySelector('.login-form');

icon.addEventListener('click', function() {
    togglePassword(passwordInput, icon);
});


function togglePassword(input, iconElement) {
    if (input.type === 'password') {
        input.type = 'text';
        iconElement.classList.remove('fa-eye');
        iconElement.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        iconElement.classList.remove('fa-eye-slash');
        iconElement.classList.add('fa-eye');
    }
}

form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    document.querySelectorAll('.error-text').forEach(e => e.remove());
    document.querySelectorAll('input').forEach(i => i.style.borderColor = '#e0e0e0');
    
    const newPassword = passwordInput.value.trim();
    const confirmPassword = confirmPasswordInput.value.trim();
    
    let isValid = true;
    
    if (newPassword.length < 8) {
        showError(passwordInput, 'Password must be at least 8 characters');
        isValid = false;
    }
    
    if (newPassword !== confirmPassword) {
        showError(confirmPasswordInput, 'Passwords do not match!');
        isValid = false;
    }
    
    if (isValid) {
        console.log('Form valid, submitting...');
        this.submit();
    
        showSuccessModal();
    }
});

function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.classList.remove('show');
    
    document.querySelector('.login-form').submit();

    window.location.href = '/login';
}

function showError(input, message) {
    const parent = input.closest('.form-group');
    const errorP = document.createElement('p');
    errorP.className = 'error-text';
    errorP.textContent = message;
    errorP.style.color = '#e74c3c';
    errorP.style.fontSize = '13px';
    errorP.style.marginTop = '5px';
    
    parent.appendChild(errorP);
    input.style.borderColor = '#e74c3c';
};

