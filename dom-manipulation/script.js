let quotes = [
  { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
  { text: "Life is what happens when you're busy making other plans.", category: "Life" },
  { text: "Don't let yesterday take up too much of today.", category: "Wisdom" }
];


const quoteDisplay = document.getElementById("quoteDisplay");
const categorySelect = document.getElementById("categorySelect");
const newQuoteBtn = document.getElementById("newQuote");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportQuotes"); 

const importFile = document.getElementById("importFile"); 

function loadQuotesFromStorage() {
  const storedQuotes = localStorage.getItem("quotes");
  if (storedQuotes) {
    quotes = JSON.parse(storedQuotes);
  }
}


function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
  loadCategories(); 
}


function loadLastViewedQuote() {
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    quoteDisplay.textContent = lastQuote;
  } else {
    showRandomQuote(); 
  }
}


function saveLastViewedQuote(quoteText) {
  sessionStorage.setItem("lastQuote", quoteText);
}


function loadCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];
  categorySelect.innerHTML = "";
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    categorySelect.appendChild(option);
  });
}


function showRandomQuote() {
  let filteredQuotes = quotes;
  if (categorySelect.value !== "all") {
    filteredQuotes = quotes.filter(q => q.category.toLowerCase() === categorySelect.value.toLowerCase());
  }
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


function createAddQuoteForm() {
  const quoteText = document.getElementById("newQuoteText").value.trim();
  const quoteCategory = document.getElementById("newQuoteCategory").value.trim();
  if (quoteText === "" || quoteCategory === "") {
    alert("Please enter both quote text and category.");
    return;
  }
  quotes.push({ text: quoteText, category: quoteCategory });
  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
  saveQuotes(); 
  alert("Quote added successfully!");
}

// Export quotes to JSON file
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

// Import quotes from JSON file
function importFromJsonFile(event) {
  const file = event.target.files[0];
  if (!file) {
    alert("No file selected.");
    return;
  }
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
     
      if (!Array.isArray(importedQuotes) || !importedQuotes.every(q => q.text && q.category)) {
        alert("Invalid JSON format. Quotes must be an array of objects with 'text' and 'category' properties.");
        return;
      }
      quotes.push(...importedQuotes);
      saveQuotes();
      alert("Quotes imported successfully!");
      showRandomQuote(); 
    } catch (e) {
      alert("Error parsing JSON file. Please ensure it's valid JSON.");
    }
  };
  fileReader.readAsText(file);
}


newQuoteBtn.addEventListener("click", showRandomQuote);
addQuoteBtn.addEventListener("click", createAddQuoteForm);
exportBtn.addEventListener("click", exportToJsonFile);
importFile.addEventListener("change", importFromJsonFile);


loadQuotesFromStorage();
loadCategories();
loadLastViewedQuote();