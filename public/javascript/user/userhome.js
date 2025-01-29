const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const productContainer = document.getElementById("productContainer");
    const productCard = productContainer.querySelector("div");
    const productCardWidth = productCard.offsetWidth + 24;
    const scrollAmount = productCardWidth * 5;

    nextBtn.addEventListener("click", () => {
      productContainer.scrollBy({
        left: scrollAmount,
        behavior: "smooth",
      });
    });

    prevBtn.addEventListener("click", () => {
      productContainer.scrollBy({
        left: -scrollAmount,
        behavior: "smooth",
      });
    });

    function categoryview(id) {
      location.assign(`/products/viewallproducts/?filterbycategory=${id}`);
    }
    function getProduct(id) {
      location.assign(`/productdetails/${id}`);
    }
    function viewall() {
      location.assign(`/products/viewallproducts`);
    }

    const form = document.getElementById("newsletter-form");
  const emailInput = document.getElementById("email-input");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); 

    const email = emailInput.value; 

    if (!email) {
      showNotification("Please enter a valid email.")
      return;
    }

    try {
      const response = await fetch("/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (response.ok) {
        showNotification(data.message)

      } else {
        showNotification(data.message)

      }
    } catch (error) {
      console.error("Error:", error);
      alert("There was an error. Please try again later.");
    }
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
