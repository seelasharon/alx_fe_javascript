// Quote storage: an array of { text, category }
const quotes = [
	{ text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspirational" },
	{ text: "Life is what happens when you're busy making other plans.", category: "life" },
	{ text: "If you want to go fast, go alone. If you want to go far, go together.", category: "teamwork" }
];

// Storage keys
const LOCAL_STORAGE_KEY = 'quotes';
const SESSION_LAST_QUOTE_KEY = 'lastViewedQuote';
const SELECTED_CATEGORY_KEY = 'selectedCategory';

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
	return showRandomQuoteByCategory(getSelectedCategory());
}

/**
 * Get currently selected category from the UI select.
 */
function getSelectedCategory() {
	const sel = document.getElementById('categoryFilter');
	if (!sel) return 'all';
	return sel.value || 'all';
}

/**
 * Show a random quote from a given category (or all).
 */
function showRandomQuoteByCategory(category = 'all') {
	const pool = category === 'all' ? quotes : quotes.filter((q) => (q.category || 'uncategorized') === category);
	if (!pool || pool.length === 0) {
		renderQuote(null);
		return null;
	}
	const idx = Math.floor(Math.random() * pool.length);
	const q = pool[idx];
	renderQuote(q);
	return q;
}

/**
 * Collect the set of categories from quotes and return them sorted.
 */
function getCategories() {
	const set = new Set();
	quotes.forEach((q) => set.add((q.category || 'uncategorized')));
	return Array.from(set).sort();
}

/**
 * Populate the #categoryFilter select with current categories.
 */
function populateCategoryFilter() {
	// Backwards-compatible wrapper: call populateCategories
	populateCategories();
}

/**
 * Populate the #categoryFilter select with current categories and restore last selection.
 * Saves selection to localStorage when changed.
 */
function populateCategories() {
	const sel = document.getElementById('categoryFilter');
	if (!sel) return;

	// remember current selection to try to restore it after repopulating
	const previous = localStorage.getItem(SELECTED_CATEGORY_KEY) || sel.value || 'all';

	// build options
	sel.innerHTML = '<option value="all">All Categories</option>';
	getCategories().forEach((cat) => {
		const opt = document.createElement('option');
		opt.value = cat;
		opt.textContent = cat;
		sel.appendChild(opt);
	});

	// restore previous selection if available
	if (Array.from(sel.options).some((o) => o.value === previous)) sel.value = previous; else sel.value = 'all';

	// ensure selection change persists and triggers filtering
	sel.removeEventListener('change', onCategoryChangeBound);
	sel.addEventListener('change', onCategoryChangeBound);
}

// small helper bound function so we can remove/add listener reliably
function onCategoryChange(e) {
	const val = e.target.value || 'all';
	try {
		localStorage.setItem(SELECTED_CATEGORY_KEY, val);
	} catch (err) {
		// ignore
	}
	filterQuotes();
}
const onCategoryChangeBound = onCategoryChange.bind(window);

/**
 * Programmatically set the selected category in the UI and persist it.
 * Also triggers filtering so changes are reflected in real-time.
 */
function setSelectedCategory(category) {
	const sel = document.getElementById('categoryFilter');
	if (!sel) return;
	const wanted = category || 'all';
	// if the option exists, set it; otherwise, repopulate then set
	if (Array.from(sel.options).some((o) => o.value === wanted)) {
		sel.value = wanted;
	} else {
		// repopulate categories (this will restore previous selection too)
		populateCategories();
		if (Array.from(sel.options).some((o) => o.value === wanted)) sel.value = wanted;
	}

	try {
		localStorage.setItem(SELECTED_CATEGORY_KEY, sel.value || 'all');
	} catch (err) {
		// ignore
	}

	// Apply filter immediately
	filterQuotes();
}

/**
 * Handler for when the category filter changes.
 */
function filterQuotes() {
	const cat = getSelectedCategory();
	// show a random quote within the selected category
	showRandomQuoteByCategory(cat);
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

	const heading = document
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
			// refresh category filter and select the new category
			populateCategories();
			setSelectedCategory(category);
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

	// Populate category filter based on loaded quotes and restore selection
	populateCategories();

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

		// refresh category filter and select the new category
		populateCategories();
		setSelectedCategory(category);

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
				// refresh category filter and select the first imported category (if available)
				populateCategories();
				if (valid && valid.length > 0) setSelectedCategory(valid[0].category || 'uncategorized');
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
	populateCategories();
	try { setSelectedCategory(newQ.category); } catch (e) {}
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
	if (added > 0) {
		saveQuotesToLocalStorage();
		populateCategories();
		if (valid && valid.length > 0) setSelectedCategory(valid[0].category || 'uncategorized');
	}
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

/**
 * Run filter-specific checks:
 * - populateCategories populates options
 * - selection is persisted to localStorage
 * - showRandomQuote respects the selection after reload simulation
 */
async function runFilterTests() {
	const results = { ok: true, steps: [] };
	try {
		// backup
		const storeBackup = localStorage.getItem(LOCAL_STORAGE_KEY);
		const selBackup = localStorage.getItem(SELECTED_CATEGORY_KEY);

		// prepare
		localStorage.removeItem(LOCAL_STORAGE_KEY);
		localStorage.removeItem(SELECTED_CATEGORY_KEY);
		quotes.length = 0;

		// add quotes with two categories
		addQuoteDirect('FilterTest A1', 'catA');
		addQuoteDirect('FilterTest B1', 'catB');

		// repopulate the select
		populateCategories();
		const sel = document.getElementById('categoryFilter');
		if (!sel) throw new Error('category select missing');
		const options = Array.from(sel.options).map((o) => o.value);
		if (!options.includes('catA') || !options.includes('catB')) throw new Error('categories not populated');
		results.steps.push({ name: 'populate-categories', ok: true, options });

		// select catA and persist
		setSelectedCategory('catA');
		if (localStorage.getItem(SELECTED_CATEGORY_KEY) !== 'catA') throw new Error('selected category not persisted');
		results.steps.push({ name: 'persist-selection', ok: true });

		// simulate reload: clear in-memory but reload from storage
		quotes.length = 0;
		loadQuotesFromLocalStorage();
		populateCategories();
		// ensure selection restored from storage
		const restored = localStorage.getItem(SELECTED_CATEGORY_KEY);
		if (restored !== 'catA') throw new Error('selection not restored after reload');
		results.steps.push({ name: 'restore-selection', ok: true, restored });

		// ensure showRandomQuote respects filter (should pick from catA only)
		const shown = showRandomQuote();
		if (!shown || shown.category !== 'catA') throw new Error('showRandomQuote did not respect selected category');
		results.steps.push({ name: 'filter-respected', ok: true, shown });

		// restore backups
		if (storeBackup === null) localStorage.removeItem(LOCAL_STORAGE_KEY); else localStorage.setItem(LOCAL_STORAGE_KEY, storeBackup);
		if (selBackup === null) localStorage.removeItem(SELECTED_CATEGORY_KEY); else localStorage.setItem(SELECTED_CATEGORY_KEY, selBackup);

		return results;
	} catch (err) {
		return { ok: false, error: err.message };
	}
}

window.runFilterTests = runFilterTests;

// --- Sync simulation and conflict handling ---
const SYNC_INTERVAL_MS = 30 * 1000; // 30s for demo; adjust as needed
const MOCK_SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // placeholder; we'll adapt shape
let syncTimer = null;
let pendingConflicts = [];

/**
 * Start periodic syncing with the mock server.
 */
function startSync() {
	if (syncTimer) clearInterval(syncTimer);
	// initial sync
	performSync();
	syncTimer = setInterval(performSync, SYNC_INTERVAL_MS);
	showSyncNotification('Sync started');
}

/**
 * Perform a sync: fetch server quotes and merge with local storage (server wins on conflict).
 */
async function performSync() {
	showSyncNotification('Checking server for updates...', true);
	try {
		const serverQuotes = await fetchServerQuotes();
		const conflicts = mergeServerQuotes(serverQuotes);
		if (conflicts && conflicts.length) {
			pendingConflicts = pendingConflicts.concat(conflicts);
			showSyncNotification(`Server provided ${serverQuotes.length} items; ${conflicts.length} conflicts detected`, false);
			// show conflict UI button
			document.getElementById('syncStatus').style.display = 'block';
			document.getElementById('reviewConflictsBtn').style.display = 'inline-block';
		} else {
			showSyncNotification(`Server sync complete — ${serverQuotes.length} items processed`, false);
		}
		document.getElementById('lastSync').textContent = new Date().toLocaleTimeString();
	} catch (err) {
		showSyncNotification('Sync failed: ' + err.message, false);
	}
}

/**
 * Fetch server quotes from the mock endpoint. Adapt shape to {text, category}.
 * This example maps posts -> quotes for demo purposes.
 */
async function fetchServerQuotes() {
	// Using JSONPlaceholder posts as demo data; map title -> text and body -> category (not realistic)
	const res = await fetch(MOCK_SERVER_URL + '?_limit=5');
	if (!res.ok) throw new Error('failed to fetch server data');
	const data = await res.json();
	// Map to our quote shape. Titles become text, body word count defines category as demo.
	return data.map((p) => ({ text: p.title, category: (p.body || '').split(' ')[0] || 'server' }));
}

/**
 * Merge server-provided quotes into local `quotes` array. Server takes precedence.
 * Returns a list of conflict objects when an item with same text exists but different category.
 */
function mergeServerQuotes(serverQuotes) {
	const conflicts = [];
	const localIndex = new Map(quotes.map((q) => [q.text, q]));
	serverQuotes.forEach((sq) => {
		const existing = localIndex.get(sq.text);
		if (existing) {
			if ((existing.category || '') !== (sq.category || '')) {
				// conflict: server wins; record for review
				conflicts.push({ text: sq.text, local: existing, server: sq });
				// apply server change
				existing.category = sq.category || 'uncategorized';
			} else {
				// identical — no action
			}
		} else {
			// new item from server — add to local
			quotes.push({ text: sq.text, category: sq.category || 'uncategorized' });
		}
	});

	if (serverQuotes.length > 0) saveQuotesToLocalStorage();
	if (conflicts.length) populateCategories();
	return conflicts;
}

function showSyncNotification(message, busy = false) {
	const box = document.getElementById('syncStatus');
	if (!box) return;
	box.style.display = 'block';
	document.getElementById('syncMessage').textContent = message;
	if (busy) box.style.background = '#fff8c4'; else box.style.background = '#e8ffd8';
}

function showConflictPanel() {
	const panel = document.getElementById('conflictPanel');
	const list = document.getElementById('conflictList');
	if (!panel || !list) return;
	list.innerHTML = '';
	if (!pendingConflicts || pendingConflicts.length === 0) {
		list.textContent = 'No conflicts.';
	} else {
		pendingConflicts.forEach((c, idx) => {
			const row = document.createElement('div');
			row.style.borderBottom = '1px solid #eee';
			row.style.padding = '6px 0';
			const t = document.createElement('div');
			t.textContent = `"${c.text}"`;
			const local = document.createElement('div');
			local.textContent = `Local: ${c.local.category}`;
			const server = document.createElement('div');
			server.textContent = `Server: ${c.server.category}`;
			const btnServer = document.createElement('button');
			btnServer.textContent = 'Accept Server';
			btnServer.addEventListener('click', () => {
				c.local.category = c.server.category;
				saveQuotesToLocalStorage();
				populateCategories();
				row.style.opacity = '0.5';
			});
			const btnLocal = document.createElement('button');
			btnLocal.textContent = 'Keep Local';
			btnLocal.style.marginLeft = '8px';
			btnLocal.addEventListener('click', () => {
				// keep local: overwrite server by doing nothing locally but remove conflict
				row.style.opacity = '0.5';
			});
			row.appendChild(t);
			row.appendChild(local);
			row.appendChild(server);
			row.appendChild(btnServer);
			row.appendChild(btnLocal);
			list.appendChild(row);
		});
	}
	panel.style.display = 'block';
}

function closeConflictPanel() {
	const panel = document.getElementById('conflictPanel');
	if (panel) panel.style.display = 'none';
	// clear pending as we've shown them (user may have acted)
	pendingConflicts = [];
}

// Wire conflict UI buttons
document.addEventListener('DOMContentLoaded', () => {
	const reviewBtn = document.getElementById('reviewConflictsBtn');
	if (reviewBtn) reviewBtn.addEventListener('click', showConflictPanel);
	const closeBtn = document.getElementById('closeConflictsBtn');
	if (closeBtn) closeBtn.addEventListener('click', closeConflictPanel);
	// start automatic sync
	startSync();
});


