// Get userType and userId from localStorage
const userType = localStorage.getItem("userType");
const userId = localStorage.getItem("userId");

// If userType is not "Admin" or userId is null, redirect to the unauthorized page
if (userType !== "Admin" || !userId) {
  window.location.href = "unauthorized.html";
}
 else {
  // Proceed with DOMContentLoaded event only if userType is "Admin"
  document.addEventListener("DOMContentLoaded", function () {
    const currentLocation = window.location.href;

    const menuItems = {
      home: document.getElementById("menuHome"),
      albums: document.getElementById("menuAlbums"),
      tracks: document.getElementById("menuTracks"),
      artists: document.getElementById("menuArtists"),
    };

    // Remove active class from all menu items
    function removeActiveClass() {
      Object.values(menuItems).forEach((menuItem) => {
        menuItem.classList.remove("active");
      });
    }

    // Determine which menu item to highlight based on the URL
    removeActiveClass(); // Reset all menu items
    if (currentLocation.includes("admin_dashboard.html")) {
      menuItems.home.classList.add("active");
    } else if (currentLocation.includes("admin_albums.html")) {
      menuItems.albums.classList.add("active");
    } else if (currentLocation.includes("admin_tracks.html")) {
      menuItems.tracks.classList.add("active");
    } else if (currentLocation.includes("admin_artists.html")) {
      menuItems.artists.classList.add("active");
    }

    // Set up request inventory report button click event
    document
      .getElementById("requestInventoryReport")
      .addEventListener("click", async function () {
        try {
          const response = await fetch(
            "https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/request-report",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            alert("Inventory report requested successfully. Check your email!");
          } else {
            alert("Failed to request inventory report.");
          }
        } catch (error) {
          console.error("Error requesting inventory report:", error);
          alert("An error occurred while requesting the report.");
        }
      });
  });
}
