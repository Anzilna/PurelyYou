const form = document.querySelector('form');
const passwordInput = document.getElementById('login-password');
const confirmPasswordInput = document.getElementById('login-password-confirm');
const buttonText = document.getElementById('button-text');

const errorName = document.getElementById('error-name');
const errorEmail = document.getElementById('error-email');
const errorPassword = document.getElementById('error-password');
const errorConfirmPassword = document.getElementById('error-password-confirm');

const togglePasswordVisibility = document.getElementById('toggle-password-visibility');
const toggleConfirmPasswordVisibility = document.getElementById('toggle-confirm-password-visibility');

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;


togglePasswordVisibility.addEventListener('click', () => {
const isPasswordVisible = passwordInput.type === 'text';
passwordInput.type = isPasswordVisible ? 'password' : 'text';

const icon = togglePasswordVisibility.querySelector('i');
icon.classList.toggle('bi-eye-slash', isPasswordVisible);
icon.classList.toggle('bi-eye', !isPasswordVisible);
});

toggleConfirmPasswordVisibility.addEventListener('click', () => {
const isPasswordVisible = confirmPasswordInput.type === 'text';
confirmPasswordInput.type = isPasswordVisible ? 'password' : 'text';

const icon = toggleConfirmPasswordVisibility.querySelector('i');
icon.classList.toggle('bi-eye-slash', isPasswordVisible);
icon.classList.toggle('bi-eye', !isPasswordVisible);
});


const validatePassword = () => {
  const password = passwordInput.value.trim();
  if (!passwordPattern.test(password)) {
    errorPassword.textContent =
      'Password must be at least 8 characters, include an uppercase letter, a number, and a special character.';
    passwordInput.classList.add('border-red-500');
    return false;
  }
  errorPassword.textContent = '';
  passwordInput.classList.remove('border-red-500');
  return true;
};

const validateConfirmPassword = () => {
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  if (password !== confirmPassword) {
    errorConfirmPassword.textContent = 'Passwords do not match.';
    confirmPasswordInput.classList.add('border-red-500');
    return false;
  }
  errorConfirmPassword.textContent = '';
  confirmPasswordInput.classList.remove('border-red-500');
  return true;
};

// Real-time validation
passwordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validateConfirmPassword);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  if ( isPasswordValid && isConfirmPasswordValid) {
    try {
      const result = await fetch('/newpassword', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: passwordInput.value.trim(),
        }),
      });

      const fetchResult = await result.json();
      console.log(fetchResult);

      if (fetchResult.redirect) {
  
        location.assign('/login');
      
      } else if(fetchResult.message){
        errorEmail.textContent = fetchResult.message || '';
      }
    } catch (error) {
      console.log('An error occurred:', error);
    }
  }
});