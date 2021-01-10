import { MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Notice} from 'obsidian';
import * as Yaml from 'yaml';
import SearchIndex from 'search';

export default class QueryResultRenderer {
	static postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Check if the element matches an oql code block
		const node = el.querySelector('pre[class*="language-oql"]')
		if (!node) return // If it's not an oql block, return 

		// Try parsing the block yaml inside for all the required settings
		const nodeConfig = Yaml.parse(node.textContent);

		// Get the search index instance and Search with query provided
		const searchIndex = SearchIndex.getInstance()
		const searchResults = searchIndex.search(nodeConfig.query)

		let result; 

		if (!nodeConfig.output) {
			// TODO: (render a warning no output is configured)
		} else if (nodeConfig.output === 'list') {
			result = QueryResultRenderer.renderList(searchResults, nodeConfig)
		} else if (nodeConfig.output === 'table') {
			result = QueryResultRenderer.renderTable(searchResults, nodeConfig)
		} else if (typeof nodeConfig.output === 'string') {
			result = QueryResultRenderer.renderString(searchResults, nodeConfig)
		} else {
			// TODO: (render a warning div instead?)
		}

		// Replace the node with the result node
		if (result) {
			result.addClass('oql-render')
			el.replaceChild(result, node)
		}
	}

	public static renderNoteLink(note) {
		let listItemLink = document.createElement('a');

		// <a data-href="2021-01-09" href="2021-01-09" class="internal-link" target="_blank" rel="noopener">&lt; Yesterday</a>
		listItemLink.addClass('internal-link');
		listItemLink.setAttribute('a', note.item.basename);
		listItemLink.setAttribute('data-href', note.item.basename);
		listItemLink.innerText = note.item.basename;
		
		return listItemLink
	}

	public static renderString(searchResults, nodeConfig): Element {
		console.log(`[OQL] Rendering string, with ${searchResults.length} results`);
		let output = nodeConfig.output;

		// Replace placeholders for the 'name' in the ouput
		if (nodeConfig.name) {
			output = output.replace("{name}", nodeConfig.name)
		}

		// Replace placeholders for the 'count' in the ouput
		if (searchResults) {
			output = output.replace("{count}", searchResults.length)
		}
		// Create the wrapper element (or use a span by default) 
		// and put the result of the query inside
		let result = document.createElement(nodeConfig.wrapper || 'span')
		result.innerHTML = output
		return result
	}

	public static renderList(searchResults, nodeConfig) {
		console.log(`[OQL] Rendering list, with ${searchResults.length} results`);
		let output = nodeConfig.output;
		
		let result = document.createElement('ul');

		if (nodeConfig.limit) {
			searchResults = searchResults.slice(0,nodeConfig.limit)
		}

		searchResults.forEach(note => {
			let listItem = document.createElement('li');
			listItem.appendChild(QueryResultRenderer.renderNoteLink(note));
			result.appendChild(listItem);
		});		
		return result
	}

	public static renderTable(searchResults, nodeConfig) {
		console.log(`[OQL] Rendering table, with ${searchResults.length} results`);
		// TODO:
	}
}
