document.addEventListener("DOMContentLoaded", function () {
  const artistModal = document.getElementById("addArtistModal");
  const editArtistModal = document.getElementById("editArtistModal");
  const openArtistModalButton = document.getElementById("openAddArtistModal");
  const closeArtistModalButton = document.querySelector(
    "#addArtistModal .close"
  );
  const closeEditArtistModalButton = document.querySelector(
    "#editArtistModal .close"
  );

  // Ensure the modals are hidden initially
  artistModal.style.display = "none";
  editArtistModal.style.display = "none";

  // Show add artist modal
  openArtistModalButton.addEventListener("click", function () {
    artistModal.style.display = "flex";
  });

  // Hide modals
  closeArtistModalButton.addEventListener("click", function () {
    artistModal.style.display = "none";
  });

  closeEditArtistModalButton.addEventListener("click", function () {
    editArtistModal.style.display = "none";
  });

  // Hide modals when clicking outside the modal content
  window.addEventListener("click", function (event) {
    if (event.target === artistModal) {
      artistModal.style.display = "none";
    }
    if (event.target === editArtistModal) {
      editArtistModal.style.display = "none";
    }
  });

  // Function to handle adding an artist
  function addArtist(event) {
    event.preventDefault();

    const artistID = document.getElementById("artistID").value;
    const artistName = document.getElementById("artistName").value;
    const debutYear = document.getElementById("debutYear").value;
    const artistBio = document.getElementById("artistBio").value;
    const artistImageFile = document.getElementById("artistImage").files[0];

    if (!artistImageFile) {
      alert("Please select an artist image.");
      return;
    }

    // Read the image file as base64
    const reader = new FileReader();
    reader.onload = function () {
      const base64Image = reader.result.split(",")[1];

      // Submit artist details to DynamoDB
      fetch(
        "https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ArtistID: artistID,
            Name: artistName,
            DebutYear: parseInt(debutYear),
            Bio: artistBio,
            ArtistImageBase64: base64Image, // Send base64 image data
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.Operation === "SAVE" && data.Message === "SUCCESS") {
            alert("Artist added successfully!");
            // Clear the form
            document.getElementById("artistForm").reset();
            // Hide the modal
            artistModal.style.display = "none";
            fetchArtists(); // Refresh the artist list
          } else {
            console.error("Failed to add artist:", data);
          }
        })
        .catch((error) => console.error("Error:", error));
    };
    reader.readAsDataURL(artistImageFile);
  }

  // Function to handle editing an artist
  window.editArtist = function (artistID) {
    // Fetch artist details and populate the edit form
    fetch(
      `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artist?ArtistID=${artistID}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "GET" && data.Message === "SUCCESS") {
          const artist = data.Item;
          document.getElementById("editArtistID").value = artist.ArtistID;
          document.getElementById("editArtistName").value = artist.Name;
          document.getElementById("editDebutYear").value = artist.DebutYear;
          document.getElementById("editArtistBio").value = artist.Bio;
          // Set current image URL or preview if needed
          // document.getElementById("editArtistImagePreview").src = artist.ArtistImageURL;

          editArtistModal.style.display = "flex";
        } else {
          console.error("Failed to retrieve artist:", data);
        }
      })
      .catch((error) => console.error("Error fetching artist:", error));
  };

  // Function to handle saving changes to an artist
  function saveChanges(event) {
    event.preventDefault();

    const artistID = document.getElementById("editArtistID").value;
    const artistName = document.getElementById("editArtistName").value;
    const debutYear = document.getElementById("editDebutYear").value;
    const artistBio = document.getElementById("editArtistBio").value;
    const artistImageFile = document.getElementById("editArtistImage").files[0];

    const requestBody = {
      ArtistID: artistID,
      Name: artistName,
      DebutYear: parseInt(debutYear),
      Bio: artistBio,
    };

    if (artistImageFile) {
      // Read the image file as base64
      const reader = new FileReader();
      reader.onload = function () {
        requestBody.ArtistImageBase64 = reader.result.split(",")[1];
        updateArtist(requestBody);
      };
      reader.readAsDataURL(artistImageFile);
    } else {
      updateArtist(requestBody);
    }
  }

  function updateArtist(requestBody) {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "UPDATE" && data.Message === "SUCCESS") {
          alert("Artist updated successfully!");
          // Hide the modal
          editArtistModal.style.display = "none";
          fetchArtists(); // Refresh the artist list
        } else {
          console.error("Failed to update artist:", data);
        }
      })
      .catch((error) => console.error("Error updating artist:", error));
  }

  // Expose deleteArtist to global scope
  window.deleteArtist = function (artistID) {
    // Ask for user confirmation
    const confirmed = confirm("Are you sure you want to delete this artist?");

    if (!confirmed) {
      return; // Exit the function if the user cancels
    }

    fetch(
      `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artist?ArtistID=${artistID}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "DELETE" && data.Message === "SUCCESS") {
          alert("Artist deleted successfully!");
          // Refresh the artist list
          fetchArtists();
        } else {
          console.error("Failed to delete artist:", data);
        }
      })
      .catch((error) => console.error("Error deleting artist:", error));
  };

  // Attach the addArtist and saveChanges functions to the respective forms
  document.getElementById("artistForm").addEventListener("submit", addArtist);
  document
    .getElementById("editArtistForm")
    .addEventListener("submit", saveChanges);

  // Function to fetch and display artists
  function fetchArtists() {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artists")
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "GET" && data.Message === "SUCCESS") {
          displayArtists(data.Items);
        } else {
          console.error("Failed to retrieve artists:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function displayArtists(artists) {
    const artistsContainer = document.getElementById("artists");
    artistsContainer.innerHTML = ""; // Clear existing content

    // Create table structure
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Create table headers
    thead.innerHTML = `
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Debut Year</th>
        <th>Bio</th>
        <th>Image</th>
        <th>Actions</th>
      </tr>
    `;

    // Populate table rows with artist data
    artists.forEach((artist) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${artist.ArtistID}</td>
        <td>${artist.Name}</td>
        <td>${artist.DebutYear}</td>
        <td>${artist.Bio}</td>
        <td><img src="${artist.ArtistImageURL}" alt="${artist.Name}" style="width: 100px; height: auto;" /></td>
        <td class="table-actions">
          <button class="edit" onclick="editArtist('${artist.ArtistID}')"><i class="fas fa-edit"></i></button>
          <button class="delete" onclick="deleteArtist('${artist.ArtistID}')"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;

      tbody.appendChild(row);
    });

    // Append thead and tbody to the table
    table.appendChild(thead);
    table.appendChild(tbody);

    // Append table to the artists container
    artistsContainer.appendChild(table);
  }

  // Fetch and display artists when the page loads
  fetchArtists();

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

  // Filtering logic for artists
  document
    .getElementById("applyFilters")
    .addEventListener("click", function () {
      const selectedGenre = document.getElementById("filterGenre").value;
      const selectedArtist = document.getElementById("filterArtist").value;
      const selectedAlbum = document.getElementById("filterAlbum").value; 
      const selectedTrack = document.getElementById("filterTrack").value; 

      // Construct query parameters
      let queryParams = [];

      if (selectedGenre) {
        queryParams.push(`Genre=${encodeURIComponent(selectedGenre)}`);
      }

      if (selectedArtist) {
        queryParams.push(`ArtistID=${encodeURIComponent(selectedArtist)}`);
      }

      if (selectedAlbum) {
        queryParams.push(`AlbumID=${encodeURIComponent(selectedAlbum)}`);
      }

      if (selectedTrack) {
        queryParams.push(`TrackID=${encodeURIComponent(selectedTrack)}`);
      }

      // Join all the query parameters with '&'
      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      // The full API endpoint with query parameters
      const apiUrl = `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/filter-artists${queryString}`;

      // Make the API request
      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          const artistsContainer = document.getElementById("artists");
          artistsContainer.innerHTML = ""; // Clear the current artists display

          if (data.artists && data.artists.length > 0) {
            displayArtists(data.artists);
          } else {
            // If no artists found, display a message
            artistsContainer.innerHTML =
              "<p>No artists found for the selected filters.</p>";
          }
        })
        .catch((error) => {
          console.error("Error fetching filtered artists:", error);
        });
    });

  // Event listener for the Clear Filters button
  document
    .getElementById("clearFilters")
    .addEventListener("click", function () {
      // Reload the page to reset filters
      location.reload();
    });

  function populateAlbums() {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/albums")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched data:", data); // Log the data to inspect

        // Check if 'Items' exists and is an array
        if (data.Items && Array.isArray(data.Items)) {
          const albums = data.Items; // Access the Items array
          const filterAlbum = document.getElementById("filterAlbum");

          // Clear existing options
          filterAlbum.innerHTML =
            '<option value="" disabled selected>Select Album</option>';

          albums.forEach((album) => {
            const option = document.createElement("option");
            option.value = album.AlbumID;
            option.textContent = album.AlbumName;
            filterAlbum.appendChild(option);
          });
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  // Fetch and populate artists
  function populateArtists() {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artists")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched data:", data); // Log the data to inspect

        // Check if 'Operation' and 'Message' are correct and 'Items' exists and is an array
        if (
          data.Operation === "GET" &&
          data.Message === "SUCCESS" &&
          Array.isArray(data.Items)
        ) {
          const artists = data.Items;
          const artistFilter = document.getElementById("filterArtist");

          // Clear existing options
          artistFilter.innerHTML =
            '<option value="" disabled selected>Select Artist</option>';

          artists.forEach((artist) => {
            const option = document.createElement("option");
            option.value = artist.ArtistID; // Use 'ArtistID' from the data
            option.textContent = artist.Name; // Use 'Name' from the data
            artistFilter.appendChild(option);
          });
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function populateTracks() {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/tracks")
      .then((response) => response.json())
      .then((data) => {
        console.log("Fetched data:", data); // Log the data to inspect

        // Check if 'Operation' and 'Message' are correct and 'Items' exists and is an array
        if (
          data.Operation === "GET" &&
          data.Message === "SUCCESS" &&
          Array.isArray(data.Items)
        ) {
          const tracks = data.Items;
          const trackFilter = document.getElementById("filterTrack");

          // Clear existing options
          trackFilter.innerHTML =
            '<option value="" disabled selected>Select Track</option>';

          tracks.forEach((track) => {
            const option = document.createElement("option");
            option.value = track.TrackID;
            option.textContent = track.Name;
            trackFilter.appendChild(option);
          });
        } else {
          console.error("Unexpected data format:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  populateAlbums();
  populateArtists();
  populateTracks();
});
