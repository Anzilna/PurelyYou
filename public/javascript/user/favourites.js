document.addEventListener("DOMContentLoaded", function () {
    favouritesFetch();
  });

  const totalBox = document.getElementById("totalBox");
  const shoppingCartTable = document.getElementById("soppingCartTable");
  const cartTableBody = document.getElementById("cartTableBody");
  async function favouritesFetch() {
    try {
      const fetchResult = await fetch("/favouritesfetch", {
        method: "get",
      });

      const result = await fetchResult.json();

      if (result.favourites && result.favourites.items.length > 0) {
        cartTableBody.innerHTML = result.favourites.items
          .map(
            (item) => `
  <tr class="border-t border-gray-200">
    <td class="py-4 px-6 flex items-center cursor-pointer" onclick="ProductDetail('${item.productId}')">
      <img src="${item.productimage}" alt="Product Image" class="w-[60px] h-[60px] mr-4 object-contain" />
      <div class="flex flex-col gap-1">
        <p class="text-md font-medium text-black">${item.productname}</p>
        <p class="text-md font-medium text-black">Rs. ${item.productsaleprice}</p>
      <p class="text-sm text-gray-600 line-through">Rs. ${item.productregularprice}</p>
      </div>
    </td>
    <td class="py-4 px-6 text-start">
      <button class="text-sm text-red-600 hover:underline" onclick="removeProduct('${item.productId}')">Remove</button>
    </td>
   <td class="py-4 px-6 pr-2 text-right">
<button 
  class="px-4 py-2  bg-black text-white text-sm font-medium rounded hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-white" 
  onclick="addtocart('${item.productId}','${item.productId.stock}')">
  Add to Cart
</button>
</td>

  </tr>
`
          )
          .join("");
      } else {
        shoppingCartTable.innerHTML = `
<div class="col-span-12 h-[300px] flex items-center justify-center">
  <div class="flex"><h1>Your Favourites is empty</h1></div>
</div>
`;
      }
      if (result.errormessage) {
        totalBox.style.display = "none";
        shoppingCartTable.innerHTML = `
<div class="col-span-12 h-[300px] flex items-center justify-center">
  <div class="flex"><h1>Your cart is empty</h1></div>
</div>
`;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function addtocart(id, stock) {
    const quantityToSend = 1;
    if (quantityToSend > stock) {
      showNotification(`Sorry, we only have ${stock} items in stock.`);
    } else {
      try {
        const fetchResult = await fetch("/productdetails/addtocart", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            productId: id,
            quantity: quantityToSend,
          }),
        });

        const result = await fetchResult.json();
        if (result.success) {
          showNotification("Product successfully added to cart!");
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

  function ProductDetail(productId) {
    location.assign(`/productdetails/${productId}`);
  }

  async function removeProduct(productId) {
    try {
      const response = await fetch("/favourites/remove", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId }),
      });

      const result = await response.json();

      if (response.ok) {
        favouritesFetch();
        showNotification("Product successfully deleted from favourites!");
        cartItems();
      } else {
        showNotification(
          "An error occurred while deleting the product from the cart. Please try again."
        );
      }
    } catch (error) {
      console.error("Error removing product:", error);
    }
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