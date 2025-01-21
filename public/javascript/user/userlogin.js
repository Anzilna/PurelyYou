const form = document.querySelector('form');
const emailError = document.getElementById('error-email');
const passwordError = document.getElementById('error-password');
const queryString = location.search;
const urlSearchDecode = new URLSearchParams(queryString);
const urlSearchDecodeGet = urlSearchDecode.get('errorDuplicate');
const signupDiv = document.getElementById('signupdiv');

if (urlSearchDecodeGet) {
  emailError.textContent = urlSearchDecodeGet || "";
}
console.log(queryString);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  // Input values
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  // Clear previous errors
  passwordError.textContent = "";
  emailError.textContent = "";

  // Front-end Validation
  let isValid = true;

  // Validate Email
  if (!email) {
    emailError.textContent = "Email is required.";
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Please enter a valid email address.";
    isValid = false;
  }

  // Validate Password
  if (!password) {
    passwordError.textContent = "Password is required.";
    isValid = false;
  } else if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters long.";
    isValid = false;
  }

  // Stop submission if validation fails
  if (!isValid) return;

  try {
    const fetchResult = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const jsonFetchResult = await fetchResult.json();

    // Handle Backend Errors
    if (jsonFetchResult.message) {
      emailError.textContent = jsonFetchResult.message || "";
    }
    if (jsonFetchResult.messagePassword) {
      passwordError.textContent = jsonFetchResult.messagePassword || "";
      signupDiv.innerHTML=` <p class="whitespace-nowrap text-gray-600">
            Forgot your pasword?
            <a href="/forgotpassword" class="underline-offset-4 font-semibold text-gray-900 underline">Change password.</a>
          </p>`
    
    }
    if (jsonFetchResult.redirect) {
      location.assign(jsonFetchResult.redirect);
    }
  } catch (error) {
    console.log("Error in fetching from frontend:", error);
  }
});

if (urlSearchDecodeGet) {
  emailError.textContent = urlSearchDecodeGet || "";
}