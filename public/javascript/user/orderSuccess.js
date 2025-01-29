const pathParts = window.location.pathname.split('/'); 
  const orderId = pathParts[pathParts.length - 1];
  console.log(orderId);

  if (orderId) {
    window.onload = async () => {
      try {
        const response = await fetch(`/shoppingcart/checkout/orderplaced/orderdetails/${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const orderDetails = await response.json();
          document.getElementById('ordercodediv').innerHTML = `${orderDetails.order.code}`;
          if (orderDetails.order.paymentMethod.includes('Cash on Delivery')) {
            document.getElementById('orderplaced').classList.add('hidden');
            document.getElementById('paymentdone').innerHTML = `
              Order Placed Successfully <span><i class="bi bi-check2-circle"></i></span>
            `;
          }else{
            document.getElementById('orderplaced').innerHTML=`
            Order Placed Successfully
            `;
            document.getElementById('paymentdone').innerHTML = `
              Payment Successful<span><i class="bi bi-check2-circle"></i></span>
            `;
          }
        } else {
          throw new Error('Failed to fetch order details');
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      }
    };
  }