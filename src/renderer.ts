import { MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Notice} from 'obsidian';
import * as Yaml from 'yaml';
import { SearchIndex, IMarkdownFile } from 'search';
import Fuse from 'fuse.js';
import DebugRenderer from 'debug';
export interface OQLConfig {
	readonly name: string;
	readonly query: string;
	badge: boolean
	template: string;
	limit?: number;
	wrapper?: string;
	debug?: boolean;
}

export default class QueryResultRenderer {
	static postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Check if the element matches an oql code block
		const node = el.querySelector('pre[class*="language-oql"]')
		if (!node) return // If it's not an oql block, return 
		
		// Try parsing the block yaml inside for all the required settings
		let oqlConfig: OQLConfig = {badge: true, ...Yaml.parse(node.textContent)};

		// Get the search index instance and Search with query provided
		let searchResults: IMarkdownFile[] = SearchIndex.search(oqlConfig.query)

		let result = document.createElement('span');
	
		if (!oqlConfig.template) {
			let result = QueryResultRenderer.renderError("No template defined in the OQL block");
		} else if (oqlConfig.template === 'list') {
			let result = QueryResultRenderer.renderList(searchResults, oqlConfig)
		} else if (oqlConfig.template === 'table') {
			let result = QueryResultRenderer.renderTable(searchResults, oqlConfig)
		} else if (typeof oqlConfig.template === 'string') {
			let result = QueryResultRenderer.renderString(searchResults, oqlConfig)
		}

		let debug: Element | void = DebugRenderer.render(searchResults, oqlConfig)
		
		// Replace the node with the result node
		if (result) {
			 // This renders the OQL badge? Maybe make it optional?
			if (!oqlConfig.badge === false) result.addClass('oql-badge')

			// Render debug
			if (debug) result.prepend(debug);
			
			// Finally replace the result
			el.replaceChild(result, node)
		}
	}

	public static renderError(errorMessage: string): Element {
		let errorElement = document.createElement('div');
		errorElement.addClass('oql-error')
		errorElement.innerText = errorMessage;
		return errorElement
	}

	public static renderLink(markdownFileResult: IMarkdownFile) {
		let listItemLink = document.createElement('a');

		// <a data-href="2021-01-09" href="2021-01-09" class="internal-link" target="_blank" rel="noopener">&lt; Yesterday</a>
		listItemLink.addClass('internal-link');
		listItemLink.setAttribute('a', markdownFileResult.title);
		listItemLink.setAttribute('data-href', markdownFileResult.title);
		listItemLink.innerText = markdownFileResult.title;
		
		return listItemLink
	}

	public static renderString(searchResults: IMarkdownFile[], oqlConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering string, with ${searchResults.length} results`);

		let output = oqlConfig.template;

		// Replace placeholders for the 'name' in the ouput
		if (oqlConfig.name) {
			output = output.replace("{name}", oqlConfig.name)
		}

		// Replace placeholders for the 'count' in the ouput
		if (searchResults) {
			output = output.replace("{count}", searchResults.length.toString())
		}
		// Create the wrapper element (or use a span by default) 
		// and put the result of the query inside
		let result = document.createElement(oqlConfig.wrapper || 'span')
		result.innerHTML = output
		return result
	}

	public static renderList(searchResults: IMarkdownFile[], oqlConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering list, with ${searchResults.length} results`);
		let output = oqlConfig.template;
		
		let result = document.createElement('ul');

		if (oqlConfig.limit) {
			searchResults = searchResults.slice(0,oqlConfig.limit)
		}

		searchResults.forEach(markdownFileResult => {
			let listItem = document.createElement('li');
			listItem.appendChild(QueryResultRenderer.renderLink(markdownFileResult));
			result.appendChild(listItem);
		});		
		return result
	}

	public static renderTable(searchResults: IMarkdownFile[], oqlConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering table, with ${searchResults.length} results`);
		
		let result = document.createElement('table');

		return result
	}
}
