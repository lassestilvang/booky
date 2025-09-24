// popup.js

document.addEventListener("DOMContentLoaded", async () => {
  const titleInput = document.getElementById("title");
  const notesInput = document.getElementById("notes");
  const collectionSelect = document.getElementById("collection");
  const saveBookmarkBtn = document.getElementById("saveBookmark");
  const saveHighlightBtn = document.getElementById("saveHighlight");
  const loginBtn = document.getElementById("login");

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  titleInput.value = tab.title;

  // Load collections
  loadCollections();

  // Load auth status
  checkAuth();

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

  loginBtn.addEventListener("click", async () => {
    const result = await chrome.runtime.sendMessage({ action: "login" });
    if (result.success) {
      checkAuth();
    } else {
      alert("Login failed");
    }
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
        option.textContent = col.title;
        collectionSelect.appendChild(option);
      });
    }
  }

  async function checkAuth() {
    const result = await chrome.runtime.sendMessage({ action: "checkAuth" });
    if (result.authenticated) {
      loginBtn.style.display = "none";
      saveBookmarkBtn.disabled = false;
      saveHighlightBtn.disabled = false;
    } else {
      loginBtn.style.display = "block";
      saveBookmarkBtn.disabled = true;
      saveHighlightBtn.disabled = true;
    }
  }
});
