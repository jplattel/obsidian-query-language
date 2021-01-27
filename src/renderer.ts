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
	fields?: string[];
	limit?: number;
	wrapper?: string;
	debug?: boolean;
	sort?: string;
}

export default class QueryResultRenderer {
	static async postprocessor(el: HTMLElement, ctx: MarkdownPostProcessorContext) {
		// Check if the element matches an oql code block
		const node = el.querySelector('code[class*="language-oql"]')
		if (!node) return // If it's not an oql block, return 

		// Try parsing the block yaml inside for all the required settings
		let oqlConfig: OQLConfig = {badge: true, ...Yaml.parse(node.textContent)};

		// Result & debug placeholder
		let searchResults: IMarkdownFile[] = [];
		let result;
		let debug;

		try {
			// Get the search index instance and search with query provided
			searchResults = await SearchIndex.search(oqlConfig.query)

			// If sorting is configured, apply it
			if (oqlConfig.sort) {
				// Inverse
				if (oqlConfig.sort.charAt(0) === '-') {
					searchResults.sort((a, b) => (a[oqlConfig.sort.slice(1)] > b[oqlConfig.sort.slice(1)]) ? 1 : -1)
				} else {
					searchResults.sort((a, b) => (a[oqlConfig.sort] < b[oqlConfig.sort]) ? 1 : -1)
				}
			}
			
			// Render the template with the type:
			if (!oqlConfig.template) {
				result = QueryResultRenderer.renderError("No template defined in the OQL block");
			} else if (oqlConfig.template === 'list') {
				result = QueryResultRenderer.renderList(searchResults, oqlConfig)
			} else if (oqlConfig.template === 'table') {
				result = QueryResultRenderer.renderTable(searchResults, oqlConfig)
			} else if (typeof oqlConfig.template === 'string') {
				result = QueryResultRenderer.renderString(searchResults, oqlConfig)
			}			

		} catch (error) {
			result = QueryResultRenderer.renderError(error);
		}	
		
		// Replace the node with the result node
		if (result) {
			
			// This renders the OQL badge? Maybe make it optional?
			if (!oqlConfig.badge === false) result.addClass('oql-badge')

			// Finally replace the result
			el.replaceChild(result, node.parentElement)
			
			// Render the debug part if enabled in the config
			if (oqlConfig.debug) {
				el.appendChild(DebugRenderer.render(searchResults, oqlConfig))
			} 
		}
	}

	public static renderError(errorMessage: string): Element {
		let errorElement = document.createElement('div');
		errorElement.addClass('oql-error')
		errorElement.innerText = errorMessage;
		return errorElement
	}

	public static renderLink(searchResult: IMarkdownFile) {
		let listItemLink = document.createElement('a');

		// Example link <a data-href="2021-01-09" href="2021-01-09" class="internal-link" target="_blank" rel="noopener">&lt; Yesterday</a>
		listItemLink.addClass('internal-link');
		listItemLink.setAttribute('a', searchResult.title);
		listItemLink.setAttribute('data-href', searchResult.title);
		listItemLink.innerText = searchResult.title;
		
		return listItemLink
	}

	public static renderRow(searchResult: IMarkdownFile, fields: string[]) {
		let tableRow = document.createElement('tr');

		fields.forEach(field => {
			let tableData = document.createElement('td');
			if (field === 'title') {
				tableData.appendChild(QueryResultRenderer.renderLink(searchResult))
			} else if (field === 'created' || field === 'modified') {
				tableData.innerText = new Date(searchResult[field]).toISOString()
			}else {
				tableData.innerText = searchResult[field]
			}
			tableRow.appendChild(tableData)
		});
		
		return tableRow
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

		searchResults.forEach(searchResult => {
			let listItem = document.createElement('li');
			listItem.appendChild(QueryResultRenderer.renderLink(searchResult));
			result.appendChild(listItem);
		});
		return result
	}

	public static renderTable(searchResults: IMarkdownFile[], oqlConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering table, with ${searchResults.length} results`);
		let result = document.createElement('table');
		
		if (oqlConfig.limit) {
			searchResults = searchResults.slice(0,oqlConfig.limit)
		}

		// if fields are provided in the config, use those, otherwise default to date & date created
		const fields = oqlConfig.fields || ['title', 'created']

		// Create a header in the table
		let tableHeader = document.createElement('tr');
		fields.forEach(field => {
			let tableData = document.createElement('th')
			// Capitalize the field
			tableData.innerText = field.charAt(0).toUpperCase() + field.slice(1);
			tableHeader.appendChild(tableData);
		});

		result.appendChild(tableHeader)

		// Finally, render the table contents
		searchResults.forEach(searchResult => {
			result.appendChild(QueryResultRenderer.renderRow(searchResult, fields));
		});
		
		return result
	}
}
