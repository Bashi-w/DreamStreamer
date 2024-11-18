document.addEventListener("DOMContentLoaded", function () {
  fetchAlbums();
  fetchArtists();

  document
    .getElementById("albumForm")
    .addEventListener("submit", handleFormSubmit);

  // Event listeners for edit modal
  document
    .getElementById("editAlbumForm")
    .addEventListener("submit", handleEditFormSubmit);
  document
    .querySelector("#editAlbumModal .close")
    .addEventListener("click", function () {
      document.getElementById("editAlbumModal").style.display = "none";
    });

  // Get the ID token from the query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const idToken = urlParams.get("id_token");

  if (idToken) {
    // Decode the ID token and display user details
    const userDetails = parseJwt(idToken);
    displayUserDetails(userDetails);
  } else {
    console.error("ID token not found in URL");
  }

  const addModal = document.getElementById("addAlbumModal");
  const openAddModalButton = document.getElementById("openAddAlbumModal");
  const closeAddModalButton = document.querySelector("#addAlbumModal .close");

  // Ensure the modals are hidden initially
  addModal.style.display = "none";
  document.getElementById("editAlbumModal").style.display = "none";

  // Show add album modal
  openAddModalButton.addEventListener("click", function () {
    addModal.style.display = "flex";
  });

  // Hide add album modal
  closeAddModalButton.addEventListener("click", function () {
    addModal.style.display = "none";
  });

  // // Hide modals when clicking outside the modal content
  // window.addEventListener("click", function (event) {
  //   if (
  //     event.target === addModal ||
  //     event.target === document.getElementById("editAlbumModal")
  //   ) {
  //     addModal.style.display = "none";
  //     document.getElementById("editAlbumModal").style.display = "none";
  //   }
  // });

  // Handle user dropdown visibility
  const userIcon = document.querySelector(".topbar .user");
  const dropdown = document.querySelector(".topbar .dropdown");

  userIcon.addEventListener("click", function () {
    dropdown.classList.toggle("visible");
  });

  // Optional: Click outside to close the dropdown
  document.addEventListener("click", function (e) {
    if (!userIcon.contains(e.target)) {
      dropdown.classList.remove("visible");
    }
  });
});

// Handle navigation
document.getElementById("menuHome").addEventListener("click", function () {
  window.location.href = "admin_dashboard.html";
});
document.getElementById("menuArtists").addEventListener("click", function () {
  window.location.href = "admin_artists.html";
});
document.getElementById("menuTracks").addEventListener("click", function () {
  window.location.href = "admin_tracks.html";
});
document.getElementById("menuAlbums").addEventListener("click", function () {
  window.location.href = "admin_albums.html";
});

function removeTrackEntry(button) {
  const trackEntry = button.parentNode;
  trackEntry.parentNode.removeChild(trackEntry);
}

document.getElementById("addBandMember").addEventListener("click", function () {
  const bandCompositionContainer = document.getElementById(
    "bandCompositionContainer"
  );

  // Create a div to wrap the input and remove button
  const bandMemberDiv = document.createElement("div");
  bandMemberDiv.className = "band-member-div";

  const newInput = document.createElement("input");
  newInput.type = "text";
  newInput.className = "band-composition";
  newInput.placeholder = "Band Member Name";
  bandMemberDiv.appendChild(newInput);

  // Create the remove button
  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.innerText = "Remove";
  removeButton.className = "remove-band-member";

  // Add event listener to remove the input when the button is clicked
  removeButton.addEventListener("click", function () {
    bandCompositionContainer.removeChild(bandMemberDiv);
  });

  bandMemberDiv.appendChild(removeButton);
  bandCompositionContainer.appendChild(bandMemberDiv);
});

function handleFormSubmit(e) {
  e.preventDefault();

  const albumID = document.getElementById("albumID").value;
  const albumName = document.getElementById("albumName").value;
  const artist = document.getElementById("artistDropdown").value;
  const albumYear = document.getElementById("albumYear").value;
  const genre = document.getElementById("genre").value;
  const price = document.getElementById("albumPrice").value;

  // Collect all band member names
  const bandMembers = Array.from(
    document.getElementsByClassName("band-composition")
  )
    .map((input) => input.value)
    .filter((name) => name); // Filter out any empty values

  const albumArtFile = document.getElementById("albumArt").files[0];

  if (!albumArtFile) {
    alert("Please select an album art image.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function () {
    const base64Image = reader.result.split(",")[1];

    const newAlbum = {
      AlbumID: albumID,
      AlbumName: albumName,
      Artist: artist,
      AlbumYear: parseInt(albumYear),
      Genre: genre,
      BandComposition: bandMembers, // Store as an array of names
      AlbumArtBase64: base64Image,
      AlbumPrice: price,
    };

    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/album", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAlbum),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "SAVE" && data.Message === "SUCCESS") {
          alert("Album added successfully!");
          
          document.getElementById("addAlbumModal").style.display = "none";
          fetchAlbums();
          document.getElementById("albumForm").reset();

          // Notify about the new album
          return fetch(
            "https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/notify",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ albumName: albumName }),
            }
          );
        } else {
          console.error("Failed to add album:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  };
  reader.readAsDataURL(albumArtFile);
}

function handleEditFormSubmit(e) {
  e.preventDefault();

  const albumID = document.getElementById("editAlbumID").value;
  const albumName = document.getElementById("editAlbumName").value;
  const artist = document.getElementById("editArtistDropdown").value;
  const albumYear = document.getElementById("editAlbumYear").value;
  const genre = document.getElementById("editGenre").value;
  const price = document.getElementById("editAlbumPrice").value;

  // Collect all band member names and store them as an array
  const bandMemberInputs = document.querySelectorAll(
    "#editBandMembersContainer input"
  );
  const bandComposition = Array.from(bandMemberInputs)
    .map((input) => input.value)
    .filter((name) => name); // Filter out any empty values

  const albumArtFile = document.getElementById("editAlbumArt").files[0];
  let albumArtURL = document.getElementById("currentAlbumArtURL").value;

  function updateAlbumWithImage(base64Image = null) {
    const updatedAlbum = {
      AlbumID: albumID,
      AlbumName: albumName,
      Artist: artist,
      AlbumYear: parseInt(albumYear),
      Genre: genre,
      BandComposition: bandComposition, // Store as an array
      AlbumPrice: price,
    };

    if (base64Image) {
      updatedAlbum.AlbumArtBase64 = base64Image;
    }

    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/album", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedAlbum),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "UPDATE" && data.Message === "SUCCESS") {
          alert("Album updated successfully!");
          document.getElementById("editAlbumModal").style.display = "none";
          fetchAlbums();
        } else {
          console.error("Failed to update album:", data);
        }
      })
      .catch((error) => console.error("Error updating album:", error));
  }

  if (albumArtFile) {
    const reader = new FileReader();
    reader.onload = function () {
      const base64Image = reader.result.split(",")[1];
      updateAlbumWithImage(base64Image);
    };
    reader.readAsDataURL(albumArtFile);
  } else {
    updateAlbumWithImage();
  }
}

function fetchAlbums() {
  fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/albums")
    .then((response) => {
      // Check if the response is OK (status code 200)
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const albumsContainer = document.getElementById("albums");
      const albums = data.Items || []; // Adjusted for the new response structure

      if (albums.length > 0) {
        // Use the generateAlbumsTable function to create the table HTML
        const tableHTML = generateAlbumsTable(albums, artistsData);

        // Insert the generated table into the container
        albumsContainer.innerHTML = tableHTML;

        // Add event listeners for edit and delete buttons
        document.querySelectorAll(".edit-button").forEach((button) => {
          button.addEventListener("click", function () {
            const albumID = this.getAttribute("data-id");
            openEditModal(albumID);
          });
        });

        document.querySelectorAll(".delete-button").forEach((button) => {
          button.addEventListener("click", function () {
            const albumID = this.getAttribute("data-id");
            deleteAlbum(albumID);
          });
        });

        // Fetch tracks for each album and display them in the table
        albums.forEach((album) => {
          fetchTracksForAlbum(album.AlbumID);
        });
      } else {
        albumsContainer.innerHTML = "<p>No albums available.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching albums:", error);
      const albumsContainer = document.getElementById("albums");
      albumsContainer.innerHTML =
        "<p>Error fetching albums. Please try again later.</p>";
    });
}

function fetchTracksForAlbum(albumID) {
  console.log("Fetching tracks for album with ID: ", albumID);

  fetch(
    `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/album-tracks?AlbumID=${albumID}`
  )
    .then((response) => response.json())
    .then((data) => {
      console.log("Track data received for AlbumID:", albumID, data);
      const tracks = data.Items || []; // Default to empty array if no tracks
      const tracksContainer = document.getElementById(`tracks-${albumID}`);

      if (tracksContainer) {
        // Populate the bullet list with tracks
        if (tracks.length > 0) {
          tracksContainer.innerHTML = tracks
            .map((track) => `<li>${track.Name}</li>`)
            .join("");
        } else {
          tracksContainer.innerHTML = "<li>No tracks available.</li>";
        }
      } else {
        console.error(`Element #tracks-${albumID} not found in DOM.`);
      }
    })
    .catch((error) => {
      console.error("Error fetching tracks for AlbumID:", albumID, error);
      const tracksContainer = document.getElementById(`tracks-${albumID}`);
      if (tracksContainer) {
        tracksContainer.innerHTML = "<li>Error fetching tracks.</li>";
      }
    });
}

function generateAlbumsTable(albums, artistsData) {
  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>Album Art</th>
          <th>Album Name</th>
          <th>Artist</th>
          <th>Year</th>
          <th>Genre</th>
          <th>Band Composition</th>
          <th>Tracks</th>
          <th>Price ($)</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  albums.forEach((album) => {
    const albumArtURL = album.AlbumArtURL || "default-placeholder.webp";
    const artistName = artistsData[album.Artist] || "Unknown";

    const bandComposition = Array.isArray(album.BandComposition)
      ? album.BandComposition.join("<br>")
      : "N/A";

    tableHTML += `
      <tr>
        <td><img src="${albumArtURL}" alt="${album.AlbumName}" width="100"></td>
        <td>${album.AlbumName}</td>
        <td>${album.Artist}</td>
        <td>${album.AlbumYear}</td>
        <td>${album.Genre}</td>
        <td>${bandComposition}</td>
        <td>
          <ul id="tracks-${album.AlbumID}">
            <li>Loading tracks...</li>
          </ul>
        </td>
        <td>${album.AlbumPrice}</td>
        <td class="table-actions">
          <button class="edit-button" data-id="${album.AlbumID}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-button" data-id="${album.AlbumID}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  return tableHTML;
}

function addEditBandMember(memberName = "") {
  const bandMembersContainer = document.getElementById(
    "editBandMembersContainer"
  );

  const bandMemberDiv = document.createElement("div");
  bandMemberDiv.className = "band-member-div";

  const newInput = document.createElement("input");
  newInput.type = "text";
  newInput.className = "band-composition";
  newInput.placeholder = "Band Member Name";
  newInput.value = memberName; // Pre-fill with existing member name
  bandMemberDiv.appendChild(newInput);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.innerText = "Remove";
  removeButton.className = "remove-band-member";

  removeButton.addEventListener("click", function () {
    bandMembersContainer.removeChild(bandMemberDiv);
  });

  bandMemberDiv.appendChild(removeButton);
  bandMembersContainer.appendChild(bandMemberDiv);
}

// Add event listener for adding new band member
document
  .getElementById("addEditBandMember")
  .addEventListener("click", function (e) {
    e.preventDefault(); // Prevent form submission
    addEditBandMember(); // Add a new empty member field
  });

function openEditModal(albumID) {
  fetch(
    `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/album?AlbumID=${albumID}`
  )
    .then((response) => response.json())
    .then((data) => {
      const album = data.Item; // Access the album data from the response

      // Set current album art URL
      document.getElementById("currentAlbumArtURL").value = album.AlbumArtURL;

      // Set other album details
      document.getElementById("editAlbumID").value = album.AlbumID;
      document.getElementById("editAlbumName").value = album.AlbumName;
      document.getElementById("editAlbumYear").value = album.AlbumYear;
      document.getElementById("editGenre").value = album.Genre;
      document.getElementById("editAlbumPrice").value = album.AlbumPrice;

      // Set the artist in the dropdown
      const artistDropdown = document.getElementById("editArtistDropdown");
      artistDropdown.value = album.Artist; // Assuming Artist is the value you set in options

      // Clear previous band members
      const bandMembersContainer = document.getElementById(
        "editBandMembersContainer"
      );
      bandMembersContainer.innerHTML = ""; // Clear existing members

      // Populate band members as an array
      if (Array.isArray(album.BandComposition)) {
        album.BandComposition.forEach((member) => {
          addEditBandMember(member); // Function to add member input fields
        });
      }

      document.getElementById("editAlbumModal").style.display = "flex";
    })
    .catch((error) => console.error("Error fetching album details:", error));
}

function deleteAlbum(albumID) {
  // Ask for user confirmation
  const confirmed = confirm("Are you sure you want to delete this album?");

  if (!confirmed) {
    return; // Exit the function if the user cancels
  }
  fetch(
    `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/album?albumid=${albumID}`,
    {
      method: "DELETE",
    }
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.Operation === "DELETE" && data.Message === "SUCCESS") {
        alert("Album deleted successfully!");
        // Refresh the album list
        fetchAlbums();
      } else {
        console.error("Failed to delete album:", data);
      }
    })
    .catch((error) => console.error("Error deleting album:", error));
}

function parseJwt(token) {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );

  return JSON.parse(jsonPayload);
}

let artistsData = {}; // Global variable to store artists data

function fetchArtists() {
  fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artists")
    .then((response) => response.json())
    .then((data) => {
      if (data.Operation === "GET" && data.Message === "SUCCESS") {
        artistsData = data.Items.reduce((acc, artist) => {
          acc[artist.ArtistID] = artist.Name; // Map ArtistID to Name
          return acc;
        }, {});

        populateArtistDropdowns();
      } else {
        console.error("Failed to fetch artists:", data);
      }
    })
    .catch((error) => console.error("Error fetching artists:", error));
}

function populateArtistDropdowns() {
  const artistDropdown = document.getElementById("artistDropdown");
  const editArtistDropdown = document.getElementById("editArtistDropdown");
  const artistDropdownFilter = document.getElementById("filterArtist");

  artistDropdown.innerHTML = '<option value="">Select Artist</option>';
  editArtistDropdown.innerHTML = '<option value="">Select Artist</option>';
  artistDropdownFilter.innerHTML = '<option value="">All Artists</option>';

  Object.entries(artistsData).forEach(([artistID, artistName]) => {
    const option = document.createElement("option");
    option.value = artistID;
    option.textContent = `${artistID}: ${artistName}`; // Format as "artist ID: artist name"
    artistDropdown.appendChild(option);

    const editOption = option.cloneNode(true);
    editArtistDropdown.appendChild(editOption);

    const filterOption = option.cloneNode(true);
    artistDropdownFilter.appendChild(filterOption);
  });
}

function displayUserDetails(userDetails) {
  const userDetailsDiv = document.getElementById("userDetails");
  userDetailsDiv.innerHTML = `
        <p><strong>Username:</strong> ${userDetails["cognito:preferred_username"]}</p>
        <p><strong>Email:</strong> ${userDetails.email}</p>
        <p><strong>User Type:</strong> ${userDetails["custom:user_type"]}</p>
        <a href="https://dream-streamer.auth.us-east-1.amazoncognito.com/logout?client_id=6bsrtbnlgldgpdfcr7l9j0ajuc&logout_uri=https://d3olgxgavi4bx6.cloudfront.net/index.html
        ">Logout</a>
      `;
}

document.getElementById("applyFilters").addEventListener("click", function () {
  const selectedGenre = document.getElementById("filterGenre").value;
  const selectedArtist = document.getElementById("filterArtist").value;
  const albumName = document.getElementById("filterAlbum").value;
  const trackName = document.getElementById("filterTrack").value;

  // Construct query parameters
  let queryParams = [];

  if (selectedGenre) {
    queryParams.push(`Genre=${encodeURIComponent(selectedGenre)}`);
  }

  if (selectedArtist) {
    queryParams.push(`Artist=${encodeURIComponent(selectedArtist)}`);
  }

  if (albumName) {
    queryParams.push(`AlbumName=${encodeURIComponent(albumName)}`);
  }

  if (trackName) {
    queryParams.push(`TrackName=${encodeURIComponent(trackName)}`);
  }

  // Join all the query parameters with '&'
  const queryString = queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

  // The full API endpoint with query parameters
  const apiUrl = `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/filter-albums${queryString}`;

  console.log("API URL: ", apiUrl);

  // Make the API request
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      console.log("Filtered Albums:", data);

      const albumsContainer = document.getElementById("albums");
      albumsContainer.innerHTML = ""; // Clear the current album display

      if (data.albums && data.albums.length > 0) {
        let tableHTML = `
          <table>
            <thead>
              <tr>
                <th>Album Art</th>
                <th>Album Name</th>
                <th>Artist</th>
                <th>Year</th>
                <th>Genre</th>
                <th>Band Composition</th>
                <th>Tracks</th>
                <th>Price ($)</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
        `;

        data.albums.forEach((album) => {
          const albumArtURL = album.AlbumArtURL || "default-placeholder.webp";
          const artistName = artistsData[album.Artist] || "Unknown";
          const bandComposition = Array.isArray(album.BandComposition)
            ? album.BandComposition.join("<br>")
            : "N/A";

          tableHTML += `
            <tr>
              <td><img src="${albumArtURL}" alt="${album.AlbumName}" width="100"></td>
              <td>${album.AlbumName}</td>
              <td>${artistName}</td>
              <td>${album.AlbumYear}</td>
              <td>${album.Genre}</td>
              <td>${bandComposition}</td>
              <td>
                <ul id="tracks-${album.AlbumID}">
                  <li>Loading tracks...</li>
                </ul>
              </td>
              <td>${album.AlbumPrice}</td>
               <td class="table-actions">
          <button class="edit-button" data-id="${album.AlbumID}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-button" data-id="${album.AlbumID}">
            <i class="fas fa-trash-alt"></i>
          </button>
        </td>
            </tr>
          `;
        });

        tableHTML += `
            </tbody>
          </table>
        `;

        albumsContainer.innerHTML = tableHTML;

        // Add event listeners for edit and delete buttons
        document.querySelectorAll(".edit-button").forEach((button) => {
          button.addEventListener("click", function () {
            const albumID = this.getAttribute("data-id");
            openEditModal(albumID);
          });
        });

        document.querySelectorAll(".delete-button").forEach((button) => {
          button.addEventListener("click", function () {
            const albumID = this.getAttribute("data-id");
            deleteAlbum(albumID);
          });
        });

        // Fetch tracks for each album and display them in the table
        data.albums.forEach((album) => {
          fetchTracksForAlbum(album.AlbumID);
        });
      } else {
        // If no albums found, display a message
        albumsContainer.innerHTML =
          "<p>No albums found for the selected filters.</p>";
      }
    })
    .catch((error) => {
      console.error("Error fetching filtered albums:", error);
    });
});

// Event listener for the Clear Filters button
document.getElementById("clearFilters").addEventListener("click", function () {
  // Reload the page to reset filters
  location.reload();
});
