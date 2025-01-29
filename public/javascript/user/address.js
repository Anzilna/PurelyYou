let addressToDelete = null;

function showDeleteModal(id) {
  addressToDelete = id;
  document.getElementById("deleteModal").classList.remove("hidden");
}

function hideDeleteModal() {
  addressToDelete = null;
  document.getElementById("deleteModal").classList.add("hidden");
}

document
  .getElementById("cancelDelete")
  .addEventListener("click", hideDeleteModal);

document
  .getElementById("confirmDelete")
  .addEventListener("click", async function () {
    if (!addressToDelete) return;

    try {
      const response = await fetch(
        `/accountsettings/address/removeaddress/${addressToDelete}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        location.reload();
      } else {
        showNotification("Failed to delete the address. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      showNotification(
        "An error occurred while deleting the address. Please try again."
      );
    } finally {
      hideDeleteModal();
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

function editAddress(id) {
  location.assign(`/accountsettings/address/editaddress/${id}`);
}