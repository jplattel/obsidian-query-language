import { MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Notice} from 'obsidian';
import * as Yaml from 'yaml';
import { SearchIndex, IMarkdownFile } from 'search';
import Fuse from 'fuse.js';
import DebugRenderer from 'debug';
export interface OQLConfig {
	readonly name: string;
	readonly query: string;
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
		const nodeConfig: OQLConfig = Yaml.parse(node.textContent);

		// Get the search index instance and Search with query provided
		let searchResults: IMarkdownFile[] = SearchIndex.search(nodeConfig.query)
		console.log(searchResults[0])

		let result: Element; 

		if (!nodeConfig.template) {
			// TODO: (render a warning no output is configured)
		} else if (nodeConfig.template === 'list') {
			result = QueryResultRenderer.renderList(searchResults, nodeConfig)
		} else if (nodeConfig.template === 'table') {
			result = QueryResultRenderer.renderTable(searchResults, nodeConfig)
		} else if (typeof nodeConfig.template === 'string') {
			result = QueryResultRenderer.renderString(searchResults, nodeConfig)
		} else {
			// TODO: (render a warning div instead?)
		}

		
		let debug: Element | void = DebugRenderer.render(searchResults, nodeConfig)
		
		// Replace the node with the result node
		if (result) {
			 // This renders the OQL badge? Maybe make it optional?
			result.addClass('oql-render')

			// Render debug
			if (debug) result.prepend(debug);
				
			el.replaceChild(result, node)
		}
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

	public static renderString(searchResults: IMarkdownFile[], nodeConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering string, with ${searchResults.length} results`);

		let output = nodeConfig.template;

		// Replace placeholders for the 'name' in the ouput
		if (nodeConfig.name) {
			output = output.replace("{name}", nodeConfig.name)
		}

		// Replace placeholders for the 'count' in the ouput
		if (searchResults) {
			output = output.replace("{count}", searchResults.length.toString())
		}
		// Create the wrapper element (or use a span by default) 
		// and put the result of the query inside
		let result = document.createElement(nodeConfig.wrapper || 'span')
		result.innerHTML = output
		return result
	}

	public static renderList(searchResults: IMarkdownFile[], nodeConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering list, with ${searchResults.length} results`);
		let output = nodeConfig.template;
		
		let result = document.createElement('ul');

		if (nodeConfig.limit) {
			searchResults = searchResults.slice(0,nodeConfig.limit)
		}

		searchResults.forEach(markdownFileResult => {
			let listItem = document.createElement('li');
			listItem.appendChild(QueryResultRenderer.renderLink(markdownFileResult));
			result.appendChild(listItem);
		});		
		return result
	}

	public static renderTable(searchResults: IMarkdownFile[], nodeConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering table, with ${searchResults.length} results`);
		
		let result = document.createElement('table');

		return result
	}
}
