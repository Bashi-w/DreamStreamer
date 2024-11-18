document.addEventListener("DOMContentLoaded", function () {
  const trackModal = document.getElementById("addTrackModal");
  const editTrackModal = document.getElementById("editTrackModal");
  const openTrackModalButton = document.getElementById("openAddTrackModal");
  const closeTrackModalButton = document.querySelector("#addTrackModal .close");
  const closeEditTrackModalButton = document.querySelector(
    "#editTrackModal .close"
  );

  // Ensure the modals are hidden initially
  trackModal.style.display = "none";
  editTrackModal.style.display = "none";

  // Show add track modal
  openTrackModalButton.addEventListener("click", function () {
    trackModal.style.display = "flex";
  });

  // Hide modals
  closeTrackModalButton.addEventListener("click", function () {
    trackModal.style.display = "none";
  });

  closeEditTrackModalButton.addEventListener("click", function () {
    editTrackModal.style.display = "none";
  });

  // Hide modals when clicking outside the modal content
  window.addEventListener("click", function (event) {
    if (event.target === trackModal) {
      trackModal.style.display = "none";
    }
    if (event.target === editTrackModal) {
      editTrackModal.style.display = "none";
    }
  });

  // Fetch and populate albums
  function populateAlbums(albumSelectElementId) {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/albums") 
      .then((response) => response.json())
      .then((data) => {
        const albums = data.Items; // Accessing the Items array from the response
        const albumSelect = document.getElementById(albumSelectElementId);

        albumSelect.innerHTML =
          '<option value="" disabled selected>Select Album</option>';
        albums.forEach((album) => {
          const option = document.createElement("option");
          option.value = album.AlbumID; // Use AlbumID as value
          option.textContent = album.AlbumName; // Display AlbumName
          albumSelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Error fetching albums:", error));
  }

  // Fetch and populate artists
  function populateArtists() {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/artists")
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "GET" && data.Message === "SUCCESS") {
          const artists = data.Items;
          const artistDropdownFilter = document.getElementById("filterArtist");
  
          // Clear existing options in the filter
          artistDropdownFilter.innerHTML = '<option value="">All Artists</option>';
  
          artists.forEach((artist) => {
            const option = document.createElement("option");
            option.value = artist.ArtistID;
            option.textContent = artist.Name;
            artistDropdownFilter.appendChild(option);
          });
        } else {
          console.error("Failed to retrieve artists:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }
  

  // Populate albums and artists on page load
  populateAlbums("trackAlbumID"); // Populate albums in Add Track modal
  populateArtists();

  // Function to handle adding a track
  function addTrack(event) {
    event.preventDefault();

    const trackID = document.getElementById("trackID").value;
    const trackName = document.getElementById("trackName").value;
    const trackAlbumID = document.getElementById("trackAlbumID").value;
    const trackReleaseDate = document.getElementById("trackReleaseDate").value;
    const trackLabel = document.getElementById("trackLabel").value;
    const trackImage = document.getElementById("trackImage").files[0];
    const trackMusic = document.getElementById("trackMusic").files[0];

    let trackImageBase64 = "";
    let trackMusicBase64 = "";

    // Helper function to encode files to Base64
    const encodeFileToBase64 = (file, callback) => {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    };

    // Prepare and submit track data
    const submitTrack = () => {
      fetch(
        "https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/track",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TrackID: trackID,
            Name: trackName,
            AlbumID: trackAlbumID,
            ReleaseDate: trackReleaseDate,
            Label: trackLabel,
            TrackImageBase64: trackImageBase64,
            TrackMusicBase64: trackMusicBase64,
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.Operation === "SAVE" && data.Message === "SUCCESS") {
            alert("Track added successfully!");
            // Clear the form
            document.getElementById("trackForm").reset();
            // Hide the modal
            trackModal.style.display = "none";
            fetchTracks(); // Refresh the track list
          } else {
            console.error("Failed to add track:", data);
          }
        })
        .catch((error) => console.error("Error:", error));
    };

    if (trackImage) {
      encodeFileToBase64(trackImage, (base64) => {
        trackImageBase64 = base64;
        if (trackMusic) {
          encodeFileToBase64(trackMusic, (base64) => {
            trackMusicBase64 = base64;
            submitTrack();
          });
        } else {
          submitTrack();
        }
      });
    } else if (trackMusic) {
      encodeFileToBase64(trackMusic, (base64) => {
        trackMusicBase64 = base64;
        submitTrack();
      });
    } else {
      submitTrack();
    }
  }

  // Function to handle editing a track
  window.editTrack = function (trackID) {
    fetch(
      `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/track?TrackID=${trackID}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "GET" && data.Message === "SUCCESS") {
          const track = data.Item;

          document.getElementById("editTrackID").value = track.TrackID;
          document.getElementById("editTrackName").value = track.Name;
          document.getElementById("editTrackReleaseDate").value =
            track.ReleaseDate;
          document.getElementById("editTrackLabel").value = track.Label;

          // Populate albums in the edit modal and set the selected album
          populateAlbums("editTrackAlbumID");

          // Delay setting the selected album to ensure the dropdown is populated
          setTimeout(() => {
            document.getElementById("editTrackAlbumID").value = track.AlbumID;
          }, 500);

          editTrackModal.style.display = "flex";
        } else {
          console.error("Failed to retrieve track:", data);
        }
      })
      .catch((error) => console.error("Error fetching track:", error));
  };

  function saveChanges(event) {
    event.preventDefault();

    const trackID = document.getElementById("editTrackID").value;
    const trackName = document.getElementById("editTrackName").value;
    const trackAlbumID = document.getElementById("editTrackAlbumID").value;
    const trackReleaseDate = document.getElementById(
      "editTrackReleaseDate"
    ).value;
    const trackLabel = document.getElementById("editTrackLabel").value;
    const trackImage = document.getElementById("editTrackImage").files[0];
    const trackMusic = document.getElementById("editTrackMusic").files[0];

    let trackImageBase64 = "";
    let trackMusicBase64 = "";

    // Helper function to encode files to Base64
    const encodeFileToBase64 = (file, callback) => {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result.split(",")[1]);
      reader.readAsDataURL(file);
    };

    // Prepare and submit track updates
    const submitTrackChanges = () => {
      fetch(
        "https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/track",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            TrackID: trackID,
            Name: trackName,
            AlbumID: trackAlbumID,
            ReleaseDate: trackReleaseDate,
            Label: trackLabel,
            TrackImageBase64: trackImageBase64,
            TrackMusicBase64: trackMusicBase64,
          }),
        }
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.Operation === "UPDATE" && data.Message === "SUCCESS") {
            alert("Track updated successfully!");
            editTrackModal.style.display = "none";
            fetchTracks(); // Refresh the track list
          } else {
            console.error("Failed to update track:", data);
          }
        })
        .catch((error) => console.error("Error updating track:", error));
    };

    if (trackImage) {
      encodeFileToBase64(trackImage, (base64) => {
        trackImageBase64 = base64;
        if (trackMusic) {
          encodeFileToBase64(trackMusic, (base64) => {
            trackMusicBase64 = base64;
            submitTrackChanges();
          });
        } else {
          submitTrackChanges();
        }
      });
    } else if (trackMusic) {
      encodeFileToBase64(trackMusic, (base64) => {
        trackMusicBase64 = base64;
        submitTrackChanges();
      });
    } else {
      submitTrackChanges();
    }
  }

  // Attach the addTrack and saveChanges functions to the respective forms
  document.getElementById("trackForm").addEventListener("submit", addTrack);
  document
    .getElementById("editTrackForm")
    .addEventListener("submit", saveChanges);

  window.deleteTrack = function (trackID) {
    // Ask for user confirmation
    const confirmed = confirm("Are you sure you want to delete this track?");

    if (!confirmed) {
      return; // Exit the function if the user cancels
    }

    fetch(
      `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/track?TrackID=${trackID}`,
      {
        method: "DELETE",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "DELETE" && data.Message === "SUCCESS") {
          alert("Track deleted successfully!");
          // Refresh the track list
          fetchTracks();
        } else {
          console.error("Failed to delete track:", data);
        }
      })
      .catch((error) => console.error("Error deleting track:", error));
  };

  // Function to fetch and display tracks
  function fetchTracks() {
    fetch("https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/tracks")
      .then((response) => response.json())
      .then((data) => {
        if (data.Operation === "GET" && data.Message === "SUCCESS") {
          displayTracks(data.Items);
        } else {
          console.error("Failed to retrieve tracks:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  function displayTracks(tracks) {
    const tracksContainer = document.getElementById("tracks");
    tracksContainer.innerHTML = ""; // Clear existing content

    // Create table structure
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");

    // Create table headers
    thead.innerHTML = `
      <tr>
        <th>Track ID</th>
        <th>Name</th>
        <th>Album</th>
        <th>Release Date</th>
        <th>Label</th>
        <th>Image</th>
        <th>Audio</th>
        <th>Actions</th>
      </tr>
    `;

    // Populate table rows with track data
    tracks.forEach((track) => {
      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${track.TrackID}</td>
        <td>${track.Name}</td>
        <td>${track.AlbumID}</td>
        <td>${track.ReleaseDate}</td>
        <td>${track.Label}</td>
        <td><img src="${track.TrackImageURL}" alt="${track.Name}" style="width: 50px; height: auto;" /></td>
        <td>
          <audio controls>
            <source src="${track.TrackURL}" type="audio/mpeg">
            Your browser does not support the audio element.
          </audio>
        </td>
        <td class="table-actions">
          <button class="edit-button" onclick="editTrack('${track.TrackID}')"><i class="fas fa-edit"></i></button>
          <button class="delete-button" onclick="deleteTrack('${track.TrackID}')"><i class="fas fa-trash-alt"></i></button>
        </td>
      `;

      tbody.appendChild(row);
    });

    // Append thead and tbody to the table
    table.appendChild(thead);
    table.appendChild(tbody);

    // Append table to the tracks container
    tracksContainer.appendChild(table);
  }

  // Fetch and display tracks when the page loads
  fetchTracks();

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

  // Filtering logic for tracks
  document
    .getElementById("applyFilters")
    .addEventListener("click", function () {
      const selectedGenre = document.getElementById("filterGenre").value;
      const selectedArtist = document.getElementById("filterArtist").value;
      const selectedAlbum = document.getElementById("filterAlbum").value; 
      const trackName = document.getElementById("filterTrack").value;

      // Construct query parameters
      let queryParams = [];

      if (selectedGenre) {
        queryParams.push(`Genre=${encodeURIComponent(selectedGenre)}`);
      }

      if (selectedArtist) {
        queryParams.push(`ArtistID=${encodeURIComponent(selectedArtist)}`);
      }

      if (selectedAlbum) {
        queryParams.push(`AlbumID=${encodeURIComponent(selectedAlbum)}`); // Use AlbumID here
      }

      if (trackName) {
        queryParams.push(`Name=${encodeURIComponent(trackName)}`);
      }

      // Join all the query parameters with '&'
      const queryString =
        queryParams.length > 0 ? `?${queryParams.join("&")}` : "";

      // The full API endpoint with query parameters
      const apiUrl = `https://nnvieofzae.execute-api.us-east-1.amazonaws.com/dev/filter-tracks${queryString}`;

      // Make the API request
      fetch(apiUrl)
        .then((response) => response.json())
        .then((data) => {
          const tracksContainer = document.getElementById("tracks");
          tracksContainer.innerHTML = ""; // Clear the current tracks display

          if (data.tracks && data.tracks.length > 0) {
            displayTracks(data.tracks);
          } else {
            // If no tracks found, display a message
            tracksContainer.innerHTML =
              "<p>No tracks found for the selected filters.</p>";
          }
        })
        .catch((error) =>
          console.error("Error fetching filtered tracks:", error)
        );
    });

  // Event listener for the Clear Filters button
  document
    .getElementById("clearFilters")
    .addEventListener("click", function () {
      // Reload the page to reset filters
      location.reload();
    });
});
