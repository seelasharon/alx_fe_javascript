// Quote storage: an array of { text, category }
const quotes = [
	{ text: "The only limit to our realization of tomorrow is our doubts of today.", category: "inspirational" },
	{ text: "Life is what happens when you're busy making other plans.", category: "life" },
	{ text: "If you want to go fast, go alone. If you want to go far, go together.", category: "teamwork" }
];

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
	createAddQuoteForm();
	showRandomQuote();
	// Quick-add inputs (static snippet)
	const quickAddBtn = document.getElementById('quickAddBtn');
	if (quickAddBtn) quickAddBtn.addEventListener('click', addQuote);
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

	// Clear inputs
	textEl.value = '';
	if (catEl) catEl.value = '';

	renderQuote(newQ);
	return newQ;
}
window.addQuote = addQuote;

