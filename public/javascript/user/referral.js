const copyButton = document.getElementById('copyButton');
const referralLink = document.getElementById('referralLink');

const token = referralLink.dataset.token;

if (token) {
  referralLink.value = `${referralLink.value}?ref=${token}`;
}

copyButton.addEventListener('click', () => {
  referralLink.select();
  referralLink.setSelectionRange(0, 99999); 
  document.execCommand('copy');
  showNotification("Referral code copied")
});



function showNotification(message) {
    const notification = document.getElementById("notification");
  
    notification.className = "";
  
    notification.classList.add(
      "p-4",
      "mb-4",
      "text-sm",
      "rounded-lg",
      "fixed",
      "bottom-10",
      "right-4",
      "z-50",
      "min-w-[150px]",
      "text-white",
      "bg-black",
      "dark:bg-gray-800",
      "dark:text-green-400",
      "role",
      "alert"
    );
  
    notification.innerHTML = ` ${message}`;
  
    notification.classList.remove("hidden");
  
    setTimeout(() => {
      hideNotification();
    }, 5000);
  }
  
  function hideNotification() {
    const notification = document.getElementById("notification");
    notification.className = "hidden";
  }
  