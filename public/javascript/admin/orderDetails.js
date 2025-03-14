document.addEventListener('DOMContentLoaded', () => {
    const orderData = document.getElementById('fororderboxes').dataset.order;
    const order = JSON.parse(orderData);
    console.log(order);
    
    renderOrderDetails(order);
  });


function renderOrderDetails(order) {
const container = document.getElementById('fororderboxes');
const isStatusDisabled = order.orderstatus === 'Delivered' || order.orderstatus === 'Cancelled';

container.innerHTML = `
<div class="flex flex-col gap-4">
  <div class="flex flex-col">
    <div class="flex justify-between gap-1">
      <div class="text-sm font-medium">Order code</div>
      <div class="text-sm font-medium">Order date</div>
    </div>
    <div class="flex justify-between">
      <div class="text-sm">${order.code}</div>
      <div class="text-xs">${new Date(order.createdAt).toLocaleDateString()}</div>
    </div>
  </div>
  
  <div class="flex flex-col text-xs">
    <div class="font-medium text-sm">Mode of Payment</div>
    <div>${order.paymentMethod}</div>
  </div>

  <div class="flex flex-col gap-1 text-xs">
    <div class="font-medium text-sm">Delivery Address</div>
    <div class="flex flex-col">
      <div>${order.selectedAddress.name}</div>
      <div>${order.selectedAddress.phone}</div>
      <div>${order.selectedAddress.address}</div>
      <div>${order.selectedAddress.city}</div>
      <div>${order.selectedAddress.state}</div>
      <div>${order.selectedAddress.pincode}</div>
    </div>
  </div>

  <div id="title" class="flex justify-center">
    <h1 class="font-semibold">ORDER SUMMARY</h1>
  </div>

  ${order.items.map(item => `
    <div id="itemsdisplay" class="flex flex-col gap">
      <div class="flex flex-row gap-3 m-2">
        <div class="flex-[1]">
          <img src="${item.productId.images[0]}" class="h-full w-full" alt="">
        </div>
        <div class="flex-[6]">
          <div class="flex flex-col h-full w-full">
            <div class="flex-[2] flex justify-start flex-col gap-[1px] items-start">
              <div class="text-sm font-medium">${item.productId.productname}</div>
              <div class="text-xs font-normal">Rs.${item.productId.saleprice}</div>
            </div>
            <div class="flex-[5] flex justify-end flex-col align-bottom">
              <div class="flex">
                <div class="flex-[2] flex text-xs font-normal justify-start flex-col">
                  <div>Quantity</div>
                  <div>Regular Price</div>
                  <div>Sale Price</div>
                  <div>Total</div>
                </div>
                <div class="flex-[5] text-xs font-normal flex justify-start flex-col">
                  <div>${item.quantity}</div>
                  <div>Rs.${item.regularprice}</div>
                  <div>Rs.${item.saleprice}</div>
                  <div>Rs.${item.quantity * item.saleprice}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`).join('')}

  <div class="mt-4 p-3 border-t">
    <div class="text-sm font-medium">Amount</div>
    <div class="flex justify-between text-xs">
      <span>Total Regular Price:</span>
      <span>Rs.${order.totalRegularprice}</span>
    </div>
    <div class="flex justify-between text-xs">
      <span>Discount:</span>
      <span>- Rs.${order.totalDiscount}</span>
    </div>
    <div class="flex justify-between text-xs">
      <span>Delivery Charge:</span>
      <span>+ Rs.${order.deliveryCharge}</span>
    </div>
    ${order.coupponUsed ? `
      <div class="flex justify-between text-xs">
        <span>Coupon (${order.coupponCode}):</span>
        <span>- Rs.${order.coupponDiscount}</span>
      </div>
    ` : ""}
    <div class="flex justify-between text-sm font-medium mt-2">
      <span>Final Amount:</span>
      <span>Rs.${order.totalAmount}</span>
    </div>
  </div>

  <div class="mt-5">
    <label for="deliveryStatus" class="block text-sm font-medium text-gray-700">Change Delivery Status</label>
    <select id="deliveryStatus" class="mt-1 block w-full pl-3 pr-10 py-2 border-1 text-base border-gray-300 focus:outline-none focus:ring-black focus:border-black sm:text-sm rounded-md" 
            onchange="updateDeliveryStatus('${order._id}')"
            ${isStatusDisabled ? 'disabled' : ''}>
      <option value="Processing" ${order.orderstatus === 'Processing' ? 'selected' : ''}>Processing</option>
      <option value="Dispatched" ${order.orderstatus === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
      <option value="Delivered" ${order.orderstatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
      <option value="Cancelled" ${order.orderstatus === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
    </select>
  </div>

  <div class="flex justify-end mt-3">
    <a href="/admin/orders">
      <button class="py-2 px-5 bg-black text-white">Back</button>
    </a>
  </div>
</div>`;

}


  

  async function updateDeliveryStatus(orderId) {
const status = document.getElementById('deliveryStatus').value;

try {
  const response = await fetch(`/admin/orders/updatestatus/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update delivery status.');
  }

  const updatedOrder = await response.json(); 
  console.log(updatedOrder);
  
  renderOrderDetails(updatedOrder.order); 
  alert('Delivery status updated successfully.');
} catch (error) {
  console.error('Error updating delivery status:', error);
  alert('An error occurred. Please try again.');
}
}
