const mainImage = document.getElementById("mainImage");
const zoomLens = document.getElementById("zoomLens");
const imageContainer = document.getElementById("imageContainer");
const subImages = document.querySelectorAll(".sub-image");
const notification = document.getElementById("notification");
const userDataDiv = document.getElementById("localsUserData");
const userDataDivNew = document.getElementById("localsUserDataNew");


let quantity = 1; 

function incrementQuantity() {
  quantity++;
  updateQuantity();
  hideNotification(); 
}



function UpdateCartCount(Cart) {  
  document.getElementById("cart-count").textContent = Cart;
}

function UpdateFavCount(Fav) {
  document.getElementById("favourites-count").textContent = Fav;
}


async function addtocart(id, stock) {
  const quantityToSend = quantity;

  if (quantityToSend > stock) {
    showNotification(
      `Sorry, we only have ${stock} items in stock.`
    ); 
  } else {
    try {
      const fetchResult = await fetch('/productdetails/addtocart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId: id,
          quantity: quantityToSend
        })
      });

      const result = await fetchResult.json();
      if (fetchResult.ok) {
        
        UpdateCartCount(result.cartLength)

        showNotification(
          "Product successfully added to cart!"
        ); 
      } else if (result.message) {
        showNotification(result.message);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      showNotification(
        "An error occurred while adding the product to the cart. Please try again."
      );
    }
  }
}



async function addToFavorites(id) {
  try {

    const fetchResult = await fetch('/productdetails/addfavourites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (!fetchResult.ok) {
      throw new Error(`Error: ${fetchResult.status} - ${fetchResult.statusText}`);
    }

    const data = await fetchResult.json();

    if (data.success) {
      UpdateFavCount(data.favLength)
      showNotification("Product successfully added to favorites!");
    } else {
     
        showNotification(data.message || "An unknown error occurred.");
      
    }
  } catch (error) {
    console.error('An error occurred while adding to favorites:', error);
    showNotification("An error occurred while adding the product to favorites. Please try again.");
  }
}



function decrementQuantity() {
  if (quantity > 1) {
    quantity--;
    hideNotification(); 
  } else {
    showNotification("Quantity must be a positive number!"); 
  }
  updateQuantity();
}

function updateQuantity() {
  document.getElementById("quantity").textContent = quantity;
}

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

function updateMainImage(imageSrc) {
  mainImage.src = imageSrc;
}

function getProduct(id) {
  location.assign(`/productdetails/${id}`);
}

window.onload = () => {
  subImages.forEach((img) => (img.style.opacity = "0.5"));
};
subImages.forEach((subImage) => {
  subImage.addEventListener("mouseover", () => {
    subImages.forEach((img) => img.style.opacity = "0.5"); 
    subImage.style.opacity = "1"; 
  });

  subImage.addEventListener("mouseout", () => {
    subImages.forEach((img) => img.style.opacity = "0.5"); 
  });
});

imageContainer.addEventListener("mousemove", (e) => {
  zoomLens.style.display = "block";

  const rect = imageContainer.getBoundingClientRect();
  const lensSize = zoomLens.offsetWidth / 2;

  let lensX = e.clientX - rect.left - lensSize;
  let lensY = e.clientY - rect.top - lensSize;

  lensX = Math.max(0, Math.min(lensX, rect.width - zoomLens.offsetWidth));
  lensY = Math.max(0, Math.min(lensY, rect.height - zoomLens.offsetHeight));

  zoomLens.style.left = lensX + "px";
  zoomLens.style.top = lensY + "px";

  const zoomLevel = 2; 
  mainImage.style.transformOrigin = `${(lensX / rect.width) * 100}% ${(lensY / rect.height) * 100}%`;
  mainImage.style.transform = `scale(${zoomLevel})`;
});

imageContainer.addEventListener("mouseleave", () => {
  zoomLens.style.display = "none";
  mainImage.style.transform = "scale(1)";
});