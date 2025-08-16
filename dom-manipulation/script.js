let quotes = [
  { id: null, text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { id: null, text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { id: null, text: "Don't let yesterday take up too much of today.", category: "Wisdom" }
];


const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportQuotes");
const importFile = document.getElementById("importFile");
const notificationArea = document.getElementById("notificationArea");
const resolveConflictsBtn = document.getElementById("resolveConflictsBtn");


function loadQuotesFromStorage() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}


function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  populateCategories();
}


function loadLastViewedQuote() {
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    quoteDisplay.textContent = lastQuote;
  } else {
    filterQuotes();
  }
}


function saveLastViewedQuote(quoteText) {
  sessionStorage.setItem("lastQuote", quoteText);
}


function loadLastFilter() {
  const lastFilter = localStorage.getItem("lastCategoryFilter");
  if (lastFilter) {
    categoryFilter.value = lastFilter;
  }
  filterQuotes();
}


function saveLastFilter(category) {
  localStorage.setItem("lastCategoryFilter", category);
}


function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categoryFilter.appendChild(option);
  });
  loadLastFilter();
}


function filterQuotes() {
  let filteredQuotes = quotes;
  const selectedCategory = categoryFilter.value;
  if (selectedCategory !== "all") {
    filteredQuotes = quotes.filter(q => q.category.toLowerCase() === selectedCategory.toLowerCase());
  }
  saveLastFilter(selectedCategory);
  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available for this category.";
    saveLastViewedQuote("No quotes available for this category.");
    return;
  }
  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quoteText = `"${filteredQuotes[randomIndex].text}" — ${filteredQuotes[randomIndex].category}`;
  quoteDisplay.textContent = quoteText;
  saveLastViewedQuote(quoteText);
}


async function createAddQuoteForm() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();
  if (quoteText === "" || quoteCategory === "") {
    alert("Please enter both quote text and category.");
    return;
  }
  const newQuote = { text: quoteText, category: quoteCategory };
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: quoteText, body: quoteCategory })
    });
    const serverQuote = await response.json();
    quotes.push({ id: serverQuote.id, text: quoteText, category: quoteCategory });
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
    saveQuotes();
    showNotification("Quote added and synced with server!");
    filterQuotes();
  } catch (error) {
    console.error("Error posting quote to server:", error);
    alert("Failed to sync quote with server, saved locally.");
    quotes.push({ id: null, text: quoteText, category: quoteCategory });
    saveQuotes();
    filterQuotes();
  }
}


function exportToJsonFile() {
  const dataStr = JSON.stringify(quotes);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


async function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const fileReader = new FileReader();
  fileReader.onload = async function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => q.text && q.category)) {
        alert("Invalid JSON format. Quotes must be an array of objects with 'text' and 'category' properties.");
        return;
      }
      quotes.push(...importedQuotes);
      saveQuotes();
      showNotification("Quotes imported successfully!");
      filterQuotes();
      
      for (const quote of importedQuotes) {
        try {
          const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: quote.text, body: quote.category })
          });
          const serverQuote = await response.json();
          quote.id = serverQuote.id; 
        } catch (error) {
          console.error("Error syncing imported quote:", error);
        }
      }
      saveQuotes();
    } catch (e) {
      alert("Error parsing JSON file. Please ensure it's valid JSON.");
    }
  };
  fileReader.readAsText(file);
}


function showNotification(message) {
  notificationArea.textContent = message;
  notificationArea.style.display = "block";
  setTimeout(() => {
    notificationArea.style.display = "none";
  }, 5000);
}


async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=10");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const serverQuotes = await response.json();
    return serverQuotes.map(q => ({
      id: q.id,
      text: q.title,
      category: q.body
    }));
  } catch (error) {
    console.error("Error fetching quotes from server:", error);
    showNotification("Failed to fetch quotes from server.");
    return [];
  }
}


async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  if (serverQuotes.length === 0) return;
  let conflicts = [];
  serverQuotes.forEach(serverQuote => {
    const localQuoteIndex = quotes.findIndex(q => q.id === serverQuote.id);
    if (localQuoteIndex !== -1) {
      if (quotes[localQuoteIndex].text !== serverQuote.text || quotes[localQuoteIndex].category !== serverQuote.category) {
        conflicts.push({ local: quotes[localQuoteIndex], server: serverQuote });
        quotes[localQuoteIndex] = serverQuote; 

      }
    } else {
      quotes.push(serverQuote);
    }
  });
  saveQuotes();
  if (conflicts.length > 0) {
    showNotification(`Synced with server. ${conflicts.length} conflict(s) resolved (server data used).`);
    resolveConflictsBtn.style.display = "block";
    sessionStorage.setItem("conflicts", JSON.stringify(conflicts));
  } else {
    showNotification("Synced with server successfully!");
  }
}


function resolveConflictsManually() {
  const conflicts = JSON.parse(sessionStorage.getItem("conflicts") || "[]");
  if (conflicts.length === 0) {
    alert("No conflicts to resolve.");
    resolveConflictsBtn.style.display = "none";
    return;
  }
  let message = "Conflicts detected. Choose which to keep:\n";
  conflicts.forEach((conflict, index) => {
    message += `Conflict ${index + 1}:\nLocal: "${conflict.local.text}" (${conflict.local.category})\nServer: "${conflict.server.text}" (${conflict.server.category})\n`;
  });
  const keepLocal = confirm(message + "\nClick OK to keep local versions, Cancel to keep server versions.");
  if (keepLocal) {
    conflicts.forEach(conflict => {
      const index = quotes.findIndex(q => q.id === conflict.server.id);
      if (index !== -1) {
        quotes[index] = conflict.local;
      }
    });
    saveQuotes();
    showNotification("Conflicts resolved: Local versions kept.");
  } else {
    showNotification("Conflicts resolved: Server versions kept.");
  }
  resolveConflictsBtn.style.display = "none";
  sessionStorage.removeItem("conflicts");
}


setInterval(syncQuotes, 30000);


newQuoteBtn.addEventListener("click", filterQuotes);
addQuoteBtn.addEventListener("click", createAddQuoteForm);
exportBtn.addEventListener("click", exportToJsonFile);
importFile.addEventListener("change", importFromJsonFile);
categoryFilter.addEventListener("change", filterQuotes);
resolveConflictsBtn.addEventListener("click", resolveConflictsManually);


loadQuotesFromStorage();
populateCategories();
loadLastViewedQuote();
syncQuotes(); 
