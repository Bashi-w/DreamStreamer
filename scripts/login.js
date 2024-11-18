document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const authCode = urlParams.get("code");

  if (authCode) {
    fetchTokens(authCode);
  }

  async function fetchTokens(authCode) {
    const clientId = "6bsrtbnlgldgpdfcr7l9j0ajuc";
    const redirectUri = "https://d3olgxgavi4bx6.cloudfront.net/logged_in.html";
    const cognitoDomain = "dream-streamer.auth.us-east-1.amazoncognito.com";

    const response = await fetch(`https://${cognitoDomain}/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        code: authCode,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await response.json();
    const idToken = tokens.id_token;

    if (idToken) {
      const userDetails = parseJwt(idToken);
      const user_type = userDetails["custom:user_type"];
      const userId = userDetails.sub; // Store user ID

      localStorage.removeItem("userId");
      // Save userId to localStorage
      localStorage.setItem("userId", userId);
      localStorage.setItem("userType", user_type);

      // Redirect based on user_type
      if (user_type === "Admin") {
        window.location.href = `admin_dashboard.html?id_token=${idToken}`;
      } else if (user_type === "Customer") {
        window.location.href = `customer_dashboard.html?id_token=${idToken}`;
      } else {
        alert("Unknown user type");
      }
    } else {
      console.error("Failed to retrieve tokens:", tokens);
    }
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
});
