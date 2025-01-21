const sortSelect = document.getElementById("sortSelect");
const categoryList = document.getElementById("categoryList");
const productsContainer = document.getElementById("productsContainer");
const searchInput = document.getElementById("searchInput");
const prevPageBtn = document.getElementById("prevPageBtn");
const nextPageBtn = document.getElementById("nextPageBtn");
const pageNumbers = document.getElementById("pageNumbers");

let currentPage = 1;
const itemsPerPage = 8;
let totalPages = 0;

// Debounce function to limit search API calls

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

async function fetchFilteredProducts() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get("filterbycategory");

  const selectedSort = sortSelect.value.trim();
  const selectedCategories = Array.from(
    categoryList.querySelectorAll("input:checked")
  ).map((checkbox) => checkbox.value);
  const searchQuery = searchInput.value.trim();

  if (categoryId) {
    selectedCategories.push(categoryId.toString());
  }

  try {
    console.log("Fetching products...");
    const response = await fetch("/products/viewallproducts/filter", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sortBy: selectedSort,
        categories: selectedCategories,
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const { categories, products, Pages } = await response.json();
    totalPages = Pages;

    // Update UI
    updateCategoryList(categories, selectedCategories);
    updateProductList(products);
    updatePagination();
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function updateCategoryList(categories, selectedCategories) {
  categoryList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  for (const cat of categories) {
    const listItem = document.createElement("li");
    listItem.innerHTML = `
      <label class="flex items-center" for="${cat._id}">
        <input
          type="checkbox"
          id="${cat._id}"
          class="mr-2 p-5 category-checkbox"
          value="${cat._id}"
          ${selectedCategories.includes(cat._id) ? "checked" : ""}
        />
        ${cat.categoryname}
      </label>`;
    fragment.appendChild(listItem);
  }
  categoryList.appendChild(fragment);

  const newCategoryCheckboxes = categoryList.querySelectorAll("input");
  for (const checkbox of newCategoryCheckboxes) {
    checkbox.addEventListener("change", fetchFilteredProducts);
  }
}

function updateProductList(products) {
  productsContainer.innerHTML = "";
  const fragment = document.createDocumentFragment();

  for (const product of products) {
    const productCard = document.createElement("div");
    productCard.classList.add(
      "flex",
      "flex-col",
      "bg-white",
      "rounded-md",
      "relative",
      "group",
      "h-full",
      "p-4",
      
    );
    productCard.setAttribute("onclick", `redirectToProductPage('${product._id}')`);
    productCard.innerHTML = `
      ${
        product.discountpercentage
          ? `
        <div class="absolute top-2 left-3 bg-black text-white text-sm font-bold px-2 py-1 rounded z-10">
          -${product.discountpercentage}%
        </div>`
          : ""
      }
      <div class="overflow-hidden h-[300px] w-full flex justify-center">
        <img src="${product.images[0]}" alt="${
      product.productname
    }" class="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-110" />
      </div>
      <div class="flex flex-col flex-grow justify-start items-start mt-4 text-left">
        <h3 class="text-lg font-semibold relative">
          ${product.productname}
          <div class="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-500 group-hover:w-full"></div>
        </h3>
        <p class="text-gray-500 text-sm mt-2">
          ${
            Array.isArray(product.ingredients)
              ? product.ingredients.join(", ")
              : ""
          }
        </p>
        <div class="flex justify-start space-x-1 text-black text-sm mt-2">★★★★☆</div>
        <div class="mt-2 mb-2">
          <span class="text-black font-bold text-lg">₹${
            product.saleprice
          }</span>
          ${
            product.discountpercentage
              ? `<span class="line-through text-gray-500 text-sm ml-2">₹${product.regularprice}</span>`
              : ""
          }
        </div>
      </div>
      <button 
        class="mt-auto bg-black text-white px-4 py-2 w-full hover:bg-gray-800 transition-all"
      >
       View Product
      </button>`;
    fragment.appendChild(productCard);
  }

  productsContainer.appendChild(fragment);
}

function updatePagination() {
  pageNumbers.innerHTML = "";

  // Generate page number buttons
  for (let i = 1; i <= totalPages; i++) {
    const pageButton = document.createElement("button");
    pageButton.textContent = i;

    // Add active class for current page
    pageButton.classList.add(
      "w-8",
      "h-8",
      "flex",
      "items-center",
      "justify-center",
      "rounded-full",
      ...(i === currentPage
        ? ["bg-gray-800","px-4","py-2","rounded-full" ,"text-white"]
        : ["hover:text-gray-400", "text-black"])
    );
    
    pageButton.addEventListener("click", () => {
      if (currentPage !== i) {
        currentPage = i;
        fetchFilteredProducts(); 
      }
    });

    pageNumbers.appendChild(pageButton);
  }

  // Update previous button state
  prevPageBtn.disabled = currentPage === 1;
  prevPageBtn.classList.toggle("opacity-50", currentPage === 1);

  prevPageBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      fetchFilteredProducts();
    }
  };

  // Update next button state
  nextPageBtn.disabled = currentPage === totalPages;
  nextPageBtn.classList.toggle("opacity-50", currentPage === totalPages);

  nextPageBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchFilteredProducts();
    }
  };
}


function redirectToProductPage(productId) {
  window.location.assign(`/productdetails/${productId}`);
}

// Debounced search and event listeners
const debouncedSearch = debounce(fetchFilteredProducts, 300);
searchInput.addEventListener("input", debouncedSearch);
sortSelect.addEventListener("change", fetchFilteredProducts);

// Initial fetch
(async () => {
  await fetchFilteredProducts();
})();
