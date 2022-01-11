import { MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Notice} from 'obsidian';
import * as Yaml from 'yaml';
import * as _ from "lodash";
import { SearchIndex, IFuseFile } from 'search';
import DebugRenderer from 'utils';
import Fuse from 'fuse.js';


export interface OQLConfig {
	readonly name: string;
	readonly query: string;
	badge: boolean;
	includeCurrentNote: boolean;
	template: string;
	fields?: string[];
	limit?: number;
	wrapper?: string;
	debug?: boolean;
	sort?: string;
}


export default class QueryResultRenderer {
	static async postprocessor(source: any, el: HTMLElement, ctx: MarkdownPostProcessorContext) {

		// console.log(source, el, ctx)

		// Try parsing the block yaml inside for all the required settings
		let oqlConfig: OQLConfig = {
			includeCurrentNote: false,
			badge: true, 
			...Yaml.parse(source)
		};

		// Result & debug placeholder
		let searchResults: IFuseFile[] = [];
		let result;
		let debug;

		try {
			// Get the search index instance and search with query provided
			searchResults = await SearchIndex.search(oqlConfig.query)

			// Filter out the currentNote based on path of the current note
			if (!oqlConfig.includeCurrentNote) {
				searchResults = searchResults.filter(note => note.path !== ctx.sourcePath)
			}

			// If sorting is configured, apply it on the search results
			if (oqlConfig.sort) {
				searchResults = QueryResultRenderer.sortSearchResults(searchResults, oqlConfig)
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

		// If any error shows up when rendering, catch it and render an error instead.
		} catch (error) {
			result = QueryResultRenderer.renderError(error);
		}	
		console.log(result)

		if (result) { // If we have a result
			if (oqlConfig.badge) result.addClass('oql-badge') // Render the badge (or not)
			el.appendChild(result) // Finally replace node with the result

			// And render the debug if toggled
			if (oqlConfig.debug) el.appendChild(DebugRenderer.render(searchResults, oqlConfig))
			return el
		}
	}

	private static sortSearchResults(searchResults: IFuseFile[], oqlConfig: OQLConfig) {
		let sortedSearchResults = []
		if (oqlConfig.sort.charAt(0) === '-') {
			sortedSearchResults = _.orderBy(searchResults, [oqlConfig.sort.slice(1)], ['asc']);
		} else if (oqlConfig.sort === 'random') {
			sortedSearchResults = _.shuffle(searchResults)
		} else {
			sortedSearchResults = _.orderBy(searchResults, [oqlConfig.sort], ['desc']);
		}
		return sortedSearchResults
	}

	public static renderError(errorMessage: string): Element {
		let errorElement = document.createElement('div');
		errorElement.addClass('oql-error')
		errorElement.innerText = errorMessage;
		return errorElement
	}

	private static renderLink(searchResult: IFuseFile) {
		// Example link <a data-href="2021-01-09" href="2021-01-09" class="internal-link" target="_blank" rel="noopener">&lt; Yesterday</a>
		let listItemLink = document.createElement('a');
		listItemLink.addClass('internal-link');
		listItemLink.setAttribute('a', searchResult.title);
		listItemLink.setAttribute('target', '_blank');
		listItemLink.setAttribute('rel', 'noopener');
		listItemLink.setAttribute('data-href', searchResult.title);
		listItemLink.innerText = searchResult.title;
		return listItemLink
	}

	private static renderTag(tag: string) {
		// Example link  <a href="#friesland" class="tag" target="_blank" rel="noopener">#friesland</a>
		let tagItemLink = document.createElement('a');
		tagItemLink.addClass('tag');
		tagItemLink.setAttribute('href', tag);
		tagItemLink.setAttribute('target', '_blank');
		tagItemLink.setAttribute('rel', 'noopener');
		tagItemLink.innerText = tag;
		return tagItemLink
	}

	private static renderRow(searchResult: IFuseFile, fields: string[]) {
		let tableRow = document.createElement('tr');

		fields.forEach(field => {
			let tableData = document.createElement('td');
			if (field === 'title') {
				tableData.appendChild(QueryResultRenderer.renderLink(searchResult))
			} else if (field === 'created' || field === 'modified') {
				tableData.innerText = new Date(searchResult[field]).toISOString()
			} else if (field === 'tags') {
				try {
					searchResult[field].map(tag => {
						tableData.appendChild(this.renderTag(tag))
						let spacing = document.createElement('span')
						spacing.innerText = ' '
						tableData.appendChild(spacing);
					});
				} catch (e) {
					console.error("Error rendering in row: ", searchResult)
				}
			} else {
				tableData.innerText = searchResult[field]
			}
			tableRow.appendChild(tableData)
		});
		
		return tableRow
	}

	private static renderListItem(searchResult: IFuseFile, fields: string[]) {
		let listItem = document.createElement('li');

		fields.forEach(field => {
			let listItemField = document.createElement('span');
			
			if (field === 'title') {
				listItemField.appendChild(QueryResultRenderer.renderLink(searchResult))
			} else if (field === 'created' || field === 'modified') {
				listItemField.innerText = new Date(searchResult[field]).toISOString()
			} else if (field === 'tags') {
				try {
					searchResult[field].map(tag => {
						listItemField.appendChild(this.renderTag(tag))
						let spacing = document.createElement('span')
						spacing.innerText = ' '
						listItemField.appendChild(spacing);
					});
				} catch (e) {
					console.error("Error rendering in list item: ", searchResult)
				}
			} else {
				listItem.innerText = searchResult[field]
			}

			// Render a space between each field
			let spacing = document.createElement('span')
			spacing.innerText = ' '
			listItemField.appendChild(spacing);

			listItem.appendChild(listItemField)
		});
		return listItem
	}

	private static renderString(searchResults: IFuseFile[], oqlConfig: OQLConfig): Element {
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

	private static renderList(searchResults: IFuseFile[], oqlConfig: OQLConfig): Element {
		console.debug(`[OQL] Rendering list, with ${searchResults.length} results`);
		let output = oqlConfig.template;
		
		let result = document.createElement('ul');

		if (oqlConfig.limit) {
			searchResults = searchResults.slice(0,oqlConfig.limit)
		}

		// if fields are provided in the config, use those, otherwise default to title
		const fields = oqlConfig.fields || ['title']

		searchResults.forEach(searchResult => {
			result.appendChild(QueryResultRenderer.renderListItem(searchResult, fields));
		});
		return result
	}

	private static renderTable(searchResults: IFuseFile[], oqlConfig: OQLConfig): Element {
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
