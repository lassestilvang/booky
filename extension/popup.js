// popup.js

document.addEventListener("DOMContentLoaded", async () => {
  const loginForm = document.getElementById("loginForm");
  const bookmarkForm = document.getElementById("bookmarkForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const loginError = document.getElementById("loginError");
  const titleInput = document.getElementById("title");
  const notesInput = document.getElementById("notes");
  const collectionSelect = document.getElementById("collection");
  const saveBookmarkBtn = document.getElementById("saveBookmark");
  const saveHighlightBtn = document.getElementById("saveHighlight");
  const logoutBtn = document.getElementById("logoutBtn");

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Load auth status
  checkAuth();

  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showLoginError("Please enter both email and password");
      return;
    }

    const result = await chrome.runtime.sendMessage({
      action: "login",
      data: { email, password },
    });

    if (result.success) {
      checkAuth();
    } else {
      showLoginError(result.error || "Login failed");
    }
  });

  saveBookmarkBtn.addEventListener("click", async () => {
    const data = {
      url: tab.url,
      title: titleInput.value,
      notes: notesInput.value,
      collectionId: collectionSelect.value || null,
    };
    const result = await chrome.runtime.sendMessage({
      action: "saveBookmark",
      data,
    });
    if (result.success) {
      alert("Bookmark saved!");
      window.close();
    } else {
      alert("Error: " + result.error);
    }
  });

  saveHighlightBtn.addEventListener("click", async () => {
    // Get selected text from content script
    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "getSelectedText",
    });
    if (response.selectedText) {
      const data = {
        url: tab.url,
        text: response.selectedText,
        notes: notesInput.value,
        collectionId: collectionSelect.value || null,
      };
      const result = await chrome.runtime.sendMessage({
        action: "saveHighlight",
        data,
      });
      if (result.success) {
        alert("Highlight saved!");
        window.close();
      } else {
        alert("Error: " + result.error);
      }
    } else {
      alert("No text selected");
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await chrome.runtime.sendMessage({ action: "logout" });
    checkAuth();
  });

  async function loadCollections() {
    const result = await chrome.runtime.sendMessage({
      action: "getCollections",
    });
    if (result.success) {
      collectionSelect.innerHTML =
        '<option value="">Select Collection</option>';
      result.collections.forEach((col) => {
        const option = document.createElement("option");
        option.value = col.id;
        option.textContent = col.name || col.title;
        collectionSelect.appendChild(option);
      });
    }
  }

  async function checkAuth() {
    const result = await chrome.runtime.sendMessage({ action: "checkAuth" });
    if (result.authenticated) {
      loginForm.style.display = "none";
      bookmarkForm.style.display = "block";
      titleInput.value = tab.title;
      loadCollections();
    } else {
      loginForm.style.display = "block";
      bookmarkForm.style.display = "none";
      emailInput.value = "";
      passwordInput.value = "";
      hideLoginError();
    }
  }

  function showLoginError(message) {
    loginError.textContent = message;
    loginError.style.display = "block";
  }

  function hideLoginError() {
    loginError.style.display = "none";
  }
});
