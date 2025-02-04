
const filterButtons = document.querySelectorAll('.filter-btn');
const productTableBody = document.getElementById('productTableBody');

const listProductModal = document.getElementById('listProductModal');
const confirmListButton = document.getElementById('confirmListButton');
let productIdToEdit = '';
const errorSelect =document.getElementById('error-select')
listProductModal.addEventListener('show.bs.modal', (event) => {
  const button = event.relatedTarget;
  const isListed = button.getAttribute("data-isListed");
  productIdToEdit = button.getAttribute('data-user-id'); 
  listingStatus.value = isListed === "true" ? "true" : isListed === "false" ? "false" : "";
});

confirmListButton.addEventListener('click', async () => {
  if (!productIdToEdit) return;

  const listingStatus = document.getElementById('listingStatus').value; // Get selected option
  if (!listingStatus) {
    errorSelect.textContent='Select a valid option'
    return;
  }

  try {
    const fetchResult = await fetch(`/admin/products/listproduct/${productIdToEdit}`, {
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isListed: listingStatus }),
    });

    const fetchResultJSON = await fetchResult.json();
    if (fetchResultJSON.updated) {
      location.reload(); 
    } else {
      alert('Failed to update product listing status.');
    }
  } catch (error) {
    console.error('Error updating product listing status:', error);
  }
});
filterButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const filter = button.getAttribute('data-filter');

    try {
      const response = await fetch(`/admin/products/filter?stockstatus=${filter}`);
      const data = await response.json();

      if (data.products && data.products.length > 0) {
        productTableBody.innerHTML = data.products.map(product => `
          <tr class="hover:bg-gray-100">
            <td class="px-6 py-3">
              <img src="${product.images[0]}" alt="Product Image" class="w-12 h-12 object-cover rounded-lg">
            </td>
            <td class="px-6 py-3 whitespace-nowrap">${product.productname}</td>
            <td class="px-6 py-3 whitespace-nowrap ${product.isListed ? 'text-green-500' : 'text-red-500'}">
              ${product.isListed ? 'Listed' : 'Unlisted'}
            </td>
            <td class="px-6 py-3 whitespace-nowrap">${product.stock}</td>
            <td class="px-6 py-3 whitespace-nowrap">${product.categoryname}</td>
            <td class="px-6 py-3 whitespace-nowrap ${product.stockstatus === 'Available' ? 'text-green-500' : product.stockstatus === 'Out Of Stock' ? 'text-red-600' : 'text-orange-400'}">
              ${product.stockstatus}
            </td>
            <td class="px-6 py-3 whitespace-nowrap">${new Date(product.updatedAt).toLocaleString()}</td>
            <td class="px-6 py-3 text-right whitespace-nowrap">
              <button class="text-gray-600 hover:text-black mx-2" onclick="editProduct('${product._id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="text-gray-600 hover:text-black mx-2" data-bs-toggle="modal" data-bs-target="#listProductModal" 
                data-user-id="${product._id}" data-isListed="${product.isListed}">
                <i class="bi bi-card-checklist"></i>
              </button>
            </td>
          </tr>
        `).join('');
      } else {
        productTableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4">No products found.</td></tr>';
      }
    } catch (error) {
      console.error('Error fetching filtered products:', error);
    }
  });
});


function editProduct(id){
 location.assign(`/admin/products/editproduct/${id}`)
}    