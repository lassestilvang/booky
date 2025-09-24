// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSelectedText") {
    const selectedText = window.getSelection().toString();
    sendResponse({ selectedText });
  }
  return true;
});

// Optional: Add highlighting functionality
// For example, on mouseup, if text selected, show a save button
document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && !selection.isCollapsed) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // Create a floating button to save highlight
    let saveBtn = document.getElementById("booky-save-highlight");
    if (!saveBtn) {
      saveBtn = document.createElement("button");
      saveBtn.id = "booky-save-highlight";
      saveBtn.textContent = "Save Highlight";
      saveBtn.style.position = "absolute";
      saveBtn.style.zIndex = "10000";
      saveBtn.style.background = "yellow";
      saveBtn.style.border = "1px solid black";
      document.body.appendChild(saveBtn);
    }
    saveBtn.style.left = `${rect.left + window.scrollX}px`;
    saveBtn.style.top = `${rect.top + window.scrollY - 30}px`;
    saveBtn.style.display = "block";

    saveBtn.onclick = async () => {
      const text = selection.toString();
      // Send to background to save
      const result = await chrome.runtime.sendMessage({
        action: "saveHighlight",
        data: {
          url: window.location.href,
          text,
          notes: "",
          collectionId: null,
        },
      });
      if (result.success) {
        // Highlight the text
        const span = document.createElement("span");
        span.style.backgroundColor = "yellow";
        range.surroundContents(span);
        saveBtn.style.display = "none";
        selection.removeAllRanges();
      } else {
        alert("Failed to save highlight");
      }
    };
  } else {
    const saveBtn = document.getElementById("booky-save-highlight");
    if (saveBtn) saveBtn.style.display = "none";
  }
});
