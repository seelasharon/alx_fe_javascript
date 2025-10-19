// Quote storage: an array of { text, category }
const quotes = [
	{ text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspirational" },
	{ text: "Life is what happens when you're busy making other plans.", category: "life" },
	{ text: "If you want to go fast, go alone. If you want to go far, go together.", category: "teamwork" }
];

// Storage keys
const LOCAL_STORAGE_KEY = 'quotes';
const SESSION_LAST_QUOTE_KEY = 'lastViewedQuote';

/**
 * Load quotes from localStorage if available and replace the contents
 * of the in-memory `quotes` array while keeping the same reference.
 */
function loadQuotesFromLocalStorage() {
	try {
		const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (!raw) return;
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return;
		// Replace contents while keeping the same array reference
		quotes.length = 0;
		parsed.forEach((q) => {
			if (q && typeof q.text === 'string') quotes.push({ text: q.text, category: q.category || 'uncategorized' });
		});
	} catch (err) {
		// ignore parse errors
		console.warn('Failed to load quotes from localStorage:', err);
	}
}

/**
 * Save the current quotes array to localStorage.
 */
function saveQuotesToLocalStorage() {
	try {
		localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(quotes));
	} catch (err) {
		console.warn('Failed to save quotes to localStorage:', err);
	}
}

/**
 * Render a quote object into the #quoteDisplay element.
 * If no quotes exist, show a friendly message.
 * @param {{text:string,category:string}|null} quote
 */
function renderQuote(quote) {
	const container = document.getElementById('quoteDisplay');
	container.innerHTML = ''; // clear

	if (!quote) {
		const p = document.createElement('p');
		p.textContent = 'No quotes available. Add one using the form below.';
		p.className = 'no-quotes';
		container.appendChild(p);
		return;
	}

	const block = document.createElement('blockquote');
	block.textContent = quote.text;
	block.className = 'quote-text';

	const footer = document.createElement('footer');
	footer.textContent = `Category: ${quote.category}`;
	footer.className = 'quote-category';

	container.appendChild(block);
	container.appendChild(footer);
		// Store last viewed quote in session storage for this session
		try {
			sessionStorage.setItem(SESSION_LAST_QUOTE_KEY, JSON.stringify(quote));
		} catch (err) {
			// ignore session storage errors
		}
}

/**
 * Show a random quote from the quotes array.
 * If there are no quotes, renders the empty state.
 */
function showRandomQuote() {
	if (quotes.length === 0) {
		renderQuote(null);
		return null;
	}

	const idx = Math.floor(Math.random() * quotes.length);
	const q = quotes[idx];
	renderQuote(q);
	// last viewed saved inside renderQuote; return q
	return q;
}

/**
 * Create and insert a form into the DOM that allows adding new quotes.
 * The form includes text input for quote and category, validates inputs,
 * updates the quotes array, and shows the added quote.
 */
function createAddQuoteForm() {
	// If form already exists, don't create another
	if (document.getElementById('addQuoteForm')) return;

	const container = document.createElement('section');
	container.id = 'addQuoteSection';

	const form = document.createElement('form');
	form.id = 'addQuoteForm';

	const heading = document.createElement('h2');
	heading.textContent = 'Add a new quote';

	const textLabel = document.createElement('label');
	textLabel.htmlFor = 'quoteText';
	textLabel.textContent = 'Quote';
	const textInput = document.createElement('textarea');
	textInput.id = 'quoteText';
	textInput.rows = 3;

	const catLabel = document.createElement('label');
	catLabel.htmlFor = 'quoteCategory';
	catLabel.textContent = 'Category';
	const catInput = document.createElement('input');
	catInput.id = 'quoteCategory';
	catInput.type = 'text';

	const submit = document.createElement('button');
	submit.type = 'submit';
	submit.textContent = 'Add Quote';

	const status = document.createElement('div');
	status.id = 'addQuoteStatus';

	// Basic layout
	form.appendChild(heading);
	form.appendChild(textLabel);
	form.appendChild(textInput);
	form.appendChild(catLabel);
	form.appendChild(catInput);
	form.appendChild(submit);
	form.appendChild(status);

	container.appendChild(form);

	// Insert after the quoteDisplay container
	const quoteDisplay = document.getElementById('quoteDisplay');
	quoteDisplay.insertAdjacentElement('afterend', container);

	form.addEventListener('submit', (e) => {
		e.preventDefault();
		status.textContent = '';
		const text = textInput.value.trim();
		const category = catInput.value.trim() || 'uncategorized';

		if (!text) {
			status.textContent = 'Please enter a quote text.';
			status.style.color = 'red';
			return;
		}

		const newQuote = { text, category };
		quotes.push(newQuote);
			// persist new quotes
			saveQuotesToLocalStorage();
		status.textContent = 'Quote added!';
		status.style.color = 'green';

		// Clear inputs
		textInput.value = '';
		catInput.value = '';

		// Show the newly added quote
		renderQuote(newQuote);
	});
}

// Wire up the button and initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
	const newQuoteBtn = document.getElementById('newQuote');
	if (newQuoteBtn) newQuoteBtn.addEventListener('click', showRandomQuote);

	// Create the add-quote form and show an initial quote
	// Load persisted quotes from localStorage (if any)
	loadQuotesFromLocalStorage();

	createAddQuoteForm();

	// Restore last viewed quote from sessionStorage if available
	try {
		const raw = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
		if (raw) {
			const last = JSON.parse(raw);
			if (last && last.text) {
				renderQuote(last);
			} else {
				showRandomQuote();
			}
		} else {
			showRandomQuote();
		}
	} catch (err) {
		showRandomQuote();
	}
	// Quick-add inputs (static snippet)
	const quickAddBtn = document.getElementById('quickAddBtn');
	if (quickAddBtn) quickAddBtn.addEventListener('click', addQuote);

		// Export / Import wiring
		const exportBtn = document.getElementById('exportBtn');
		if (exportBtn) exportBtn.addEventListener('click', exportQuotesToJson);

		const importFile = document.getElementById('importFile');
		if (importFile) importFile.addEventListener('change', importFromJsonFile);
});

// Export functions to window for interactive usage/tests
window.showRandomQuote = showRandomQuote;
window.createAddQuoteForm = createAddQuoteForm;
/**
 * Simple addQuote function wired to the static inputs in index.html.
 * Reads inputs, validates, updates quotes array and renders the new quote.
 */
function addQuote() {
	const textEl = document.getElementById('newQuoteText');
	const catEl = document.getElementById('newQuoteCategory');
	if (!textEl) return;

	const text = textEl.value.trim();
	const category = (catEl && catEl.value.trim()) || 'uncategorized';
	if (!text) {
		// small inline feedback
		textEl.placeholder = 'Quote cannot be empty';
		textEl.focus();
		return null;
	}

	const newQ = { text, category };
	quotes.push(newQ);

		// persist updated quotes list
		saveQuotesToLocalStorage();

	// Clear inputs
	textEl.value = '';
	if (catEl) catEl.value = '';

	renderQuote(newQ);
	return newQ;
}
window.addQuote = addQuote;

/**
 * Export the current quotes array as a downloadable JSON file.
 */
function exportQuotesToJson() {
	try {
		const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'quotes.json';
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	} catch (err) {
		alert('Failed to export quotes: ' + err.message);
	}
}

/**
 * Import quotes from a selected JSON file. Merges valid quotes into the existing array.
 * @param {Event} event
 */
function importFromJsonFile(event) {
	const file = event.target.files && event.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = function (ev) {
		try {
			const imported = JSON.parse(ev.target.result);
			if (!Array.isArray(imported)) throw new Error('Imported JSON is not an array');

			const valid = imported.filter((q) => q && typeof q.text === 'string');
			if (valid.length === 0) {
				alert('No valid quotes found in the file.');
				return;
			}

			// Merge while avoiding duplicates based on exact text+category
			const seen = new Set(quotes.map((q) => q.text + '||' + (q.category || '')));
			let added = 0;
			valid.forEach((q) => {
				const key = q.text + '||' + (q.category || '');
				if (!seen.has(key)) {
					quotes.push({ text: q.text, category: q.category || 'uncategorized' });
					seen.add(key);
					added++;
				}
			});

			if (added > 0) {
				saveQuotesToLocalStorage();
				alert(`Imported ${added} new quote(s).`);
				// Show the first added quote
				renderQuote(quotes[quotes.length - 1]);
			} else {
				alert('No new quotes were added (all were duplicates).');
			}
		} catch (err) {
			alert('Failed to import quotes: ' + err.message);
		} finally {
			// reset the input so the same file can be selected again if needed
			event.target.value = '';
		}
	};
	reader.readAsText(file);
}

// --- Testing helpers (exposed on window) ---
/**
 * Programmatically add a quote (bypasses DOM inputs). Returns the added quote.
 */
function addQuoteDirect(text, category = 'uncategorized') {
	if (!text || typeof text !== 'string') throw new Error('text required');
	const newQ = { text: text.trim(), category: category || 'uncategorized' };
	quotes.push(newQ);
	saveQuotesToLocalStorage();
	return newQ;
}

/**
 * Import quotes from a JSON string (useful for tests).
 * Merges valid quotes into existing array and returns number added.
 */
function importFromJsonText(jsonText) {
	const imported = JSON.parse(jsonText);
	if (!Array.isArray(imported)) throw new Error('Imported JSON is not an array');
	const valid = imported.filter((q) => q && typeof q.text === 'string');
	const seen = new Set(quotes.map((q) => q.text + '||' + (q.category || '')));
	let added = 0;
	valid.forEach((q) => {
		const key = q.text + '||' + (q.category || '');
		if (!seen.has(key)) {
			quotes.push({ text: q.text, category: q.category || 'uncategorized' });
			seen.add(key);
			added++;
		}
	});
	if (added > 0) saveQuotesToLocalStorage();
	return added;
}

/**
 * Return the JSON string that would be exported (useful for assertions).
 */
function getExportJsonString() {
	return JSON.stringify(quotes, null, 2);
}

/**
 * Run a suite of quick checks for persistence and import/export.
 * Returns an object with results and errors (do this in browser console).
 */
async function runQuoteTests() {
	const results = { ok: true, steps: [] };

	try {
		// Backup current localStorage
		const backup = localStorage.getItem(LOCAL_STORAGE_KEY);

		// Clear and start fresh
		localStorage.removeItem(LOCAL_STORAGE_KEY);
		quotes.length = 0;

		// 1) Add and persist
		const q1 = addQuoteDirect('Test quote A', 'test');
		if (!localStorage.getItem(LOCAL_STORAGE_KEY)) throw new Error('localStorage not set after add');
		results.steps.push({ name: 'add-and-persist', ok: true });

		// 2) Reload from storage (simulate new page load)
		quotes.length = 0;
		loadQuotesFromLocalStorage();
		if (!quotes.find((q) => q.text === 'Test quote A')) throw new Error('quote not loaded from storage');
		results.steps.push({ name: 'load-from-storage', ok: true });

		// 3) Export string contains our quote
		const exported = getExportJsonString();
		if (!exported.includes('Test quote A')) throw new Error('exported JSON missing quote');
		results.steps.push({ name: 'export-contains-quote', ok: true });

		// 4) Import via text
		const importJson = JSON.stringify([{ text: 'Imported Q1', category: 'imp' }, { text: 'Test quote A', category: 'test' }]);
		const added = importFromJsonText(importJson);
		if (added !== 1) throw new Error('import did not add expected number of new quotes');
		results.steps.push({ name: 'import-and-merge', ok: true, added });

		// 5) Session storage: render a quote and check session saved
		renderQuote(quotes[0]);
		const raw = sessionStorage.getItem(SESSION_LAST_QUOTE_KEY);
		if (!raw) throw new Error('session last quote not saved');
		const last = JSON.parse(raw);
		if (!last || !last.text) throw new Error('session last quote invalid');
		results.steps.push({ name: 'session-last-quote', ok: true });

		// Restore backup
		if (backup === null) localStorage.removeItem(LOCAL_STORAGE_KEY); else localStorage.setItem(LOCAL_STORAGE_KEY, backup);

		return results;
	} catch (err) {
		return { ok: false, error: err.message };
	}
}

// Expose testing helpers
window.addQuoteDirect = addQuoteDirect;
window.importFromJsonText = importFromJsonText;
window.getExportJsonString = getExportJsonString;
window.runQuoteTests = runQuoteTests;


