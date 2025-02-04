function renderReturnDetails(returnRequest) {
    const container = document.getElementById('forreturnboxes');
    const isStatusDisabled = returnRequest.status === 'Approved' || returnRequest.status === 'Rejected';
    
    container.innerHTML = `
      <div class="flex flex-col gap-4">
        <div class="flex flex-col">
          <div class="flex justify-between gap-1">
            <div class="text-sm font-medium">Return Status</div>
            <div class="text-sm font-medium">Return Date</div>
          </div>
          <div class="flex justify-between">
            <div class="text-sm">${returnRequest.status}</div>
            <div class="text-xs">${new Date(returnRequest.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
        <div class="flex flex-col text-xs">
          <div class="font-medium text-sm">Reason for Return</div>
          <div>${returnRequest.reason}</div>
        </div>
        <div class="flex flex-col gap-1 text-xs">
          <div class="font-medium text-sm">Pickup Address</div>
          <div class="flex flex-col">
            <div>${returnRequest.pickupAddress.name}</div>
            <div>${returnRequest.pickupAddress.phone}</div>
            <div>${returnRequest.pickupAddress.address}</div>
            <div>${returnRequest.pickupAddress.city}</div>
            <div>${returnRequest.pickupAddress.state}</div>
            <div>${returnRequest.pickupAddress.pincode}</div>
          </div>
        </div>
        <div id="title" class="flex justify-center">
          <h1 class="font-semibold">RETURN SUMMARY</h1>
        </div>
        <div id="itemsdisplay" class="flex flex-col gap">
          <div class="flex flex-row gap-3 m-2">
            <div class="flex-[1]">
              <img src="${returnRequest.productId.images[0]}" class="h-full w-full" alt="Product Image">
            </div>
            <div class="flex-[6]">
              <div class="flex flex-col h-full w-full">
                <div class="flex-[2] flex justify-start flex-col gap-[1px] items-start">
                  <div class="text-sm font-medium">${returnRequest.productId.productname}</div>
                  <div class="text-xs font-normal">Rs.${returnRequest.productId.saleprice}</div>
                </div>
                <div class="flex-[5] flex justify-end flex-col align-bottom">
                  <div class="flex">
                    <div class="flex-[2] flex text-xs font-normal justify-start flex-col">
                      <div>Regular Price</div>
                      <div>Total</div>
                    </div>
                    <div class="flex-[5] text-xs font-normal flex justify-start flex-col">
                      <div>Rs.${returnRequest.productId.regularprice}</div>
                      <div>Rs.${returnRequest.productId.saleprice}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-5">
          <label for="returnStatus" class="block text-sm font-medium text-gray-700">Change Return Status</label>
          <select id="returnStatus" class="mt-1 block w-full pl-3 pr-10 py-2 border-1 text-base border-gray-300 focus:outline-none focus:ringblack focus:border-black sm:text-sm rounded-md" 
                  onchange="updateReturnStatus('${returnRequest._id}', '${returnRequest.orderId}','${returnRequest.userId}','${returnRequest.amount}','${returnRequest.quantity}')"
                  ${isStatusDisabled ? 'disabled' : ''}>
            <option value="Pending" ${returnRequest.status === 'Pending' ? 'selected' : ''}>Pending</option>
            <option value="Approved" ${returnRequest.status === 'Approved' ? 'selected' : ''}>Approved</option>
            <option value="Rejected" ${returnRequest.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
          </select>
        </div>
        <div class="flex justify-end mt-3">
          <a href="/admin/returns">
            <button class="py-2 px-5 bg-black text-white">Back</button>
          </a>
        </div>
      </div>`; 
  }
  
  
      document.addEventListener('DOMContentLoaded', () => {
        const returnData = document.getElementById('forreturnboxes').dataset.return;
        const returnRequest = JSON.parse(returnData);
        renderReturnDetails(returnRequest);
      });
  
      async function updateReturnStatus(returnId, orderId,userId,amount,quantity) {
        const status = document.getElementById('returnStatus').value;
  
        try {
          const response = await fetch('/admin/returns/updatestatus', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status, orderId ,userId, amount,returnId,quantity}),  
          });
  
          const updatedReturn = await response.json(); 

          if (!response.ok) {
            showNotification(updatedReturn.message)

            throw new Error('Failed to update return status.');

          }
  
          showNotification('Return status updated successfully.')
          
          renderReturnDetails(updatedReturn.returnRequest); 
        } catch (error) {
          console.error('Error updating return status:', error);
          alert('An error occurred. Please try again.');
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
      