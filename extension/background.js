// background.js

const API_BASE = "http://localhost:3000/v1"; // Adjust as needed

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkAuth") {
    checkAuth(sendResponse);
  } else if (request.action === "login") {
    login(sendResponse);
  } else if (request.action === "getCollections") {
    getCollections(sendResponse);
  } else if (request.action === "saveBookmark") {
    saveBookmark(request.data, sendResponse);
  } else if (request.action === "saveHighlight") {
    saveHighlight(request.data, sendResponse);
  }
  return true; // Keep message channel open for async response
});

async function checkAuth(sendResponse) {
  const token = await getStoredToken();
  sendResponse({ authenticated: !!token });
}

async function login(sendResponse) {
  try {
    const token = await chrome.identity.getAuthToken({ interactive: true });
    await storeToken(token);
    sendResponse({ success: true });
  } catch (error) {
    console.error("Login failed:", error);
    sendResponse({ success: false, error: error.message });
  }
}

async function getCollections(sendResponse) {
  try {
    const token = await getStoredToken();
    if (!token) {
      sendResponse({ success: false, error: "Not authenticated" });
      return;
    }
    const response = await fetch(`${API_BASE}/collections`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error("Failed to fetch collections");
    const collections = await response.json();
    sendResponse({ success: true, collections });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function saveBookmark(data, sendResponse) {
  try {
    const token = await getStoredToken();
    if (!token) {
      sendResponse({ success: false, error: "Not authenticated" });
      return;
    }
    const response = await fetch(`${API_BASE}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: data.url,
        collectionId: data.collectionId,
        notes: data.notes,
      }),
    });
    if (!response.ok) throw new Error("Failed to save bookmark");
    const result = await response.json();
    sendResponse({ success: true, id: result.id });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function saveHighlight(data, sendResponse) {
  try {
    const token = await getStoredToken();
    if (!token) {
      sendResponse({ success: false, error: "Not authenticated" });
      return;
    }
    // First, save bookmark if not exists
    const bookmarkResponse = await fetch(`${API_BASE}/bookmarks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        url: data.url,
        collectionId: data.collectionId,
        notes: data.notes,
      }),
    });
    if (!bookmarkResponse.ok) throw new Error("Failed to save bookmark");
    const bookmark = await bookmarkResponse.json();

    // Then save highlight
    const highlightResponse = await fetch(`${API_BASE}/highlights`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bookmarkId: bookmark.id,
        text: data.text,
      }),
    });
    if (!highlightResponse.ok) throw new Error("Failed to save highlight");
    const highlight = await highlightResponse.json();
    sendResponse({ success: true, highlightId: highlight.id });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

async function getStoredToken() {
  const result = await chrome.storage.local.get(["authToken"]);
  return result.authToken;
}

async function storeToken(token) {
  await chrome.storage.local.set({ authToken: token });
}
