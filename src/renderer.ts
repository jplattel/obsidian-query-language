import { MarkdownPostProcessor, MarkdownPostProcessorContext, MarkdownPreviewRenderer, MarkdownRenderer, Notice} from 'obsidian';
import { SearchIndex, IFuseFile } from 'search';
import * as Yaml from 'yaml';
import * as _ from "lodash";
import Fuse from 'fuse.js';

// TODO import from renderers.ts file...
import renderError from './renderers/error';
import renderList from './renderers/list';
import renderTable from './renderers/table';
import renderString from './renderers/string';
import renderLink from './renderers/link';
import renderDebug from './renderers/debug';
import renderWarning from './renderers/warning'; 
import renderers from './renderers/renderers'

export interface OQLConfig {
	readonly name: string;
	readonly query: string;
	badge: boolean;
	includeCurrentNote: boolean;
	template: string;
	format?: string;
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

			if (SearchIndex.state === 'ready') {
				// Filter out the currentNote based on path of the current note
				if (!oqlConfig.includeCurrentNote) {
					searchResults = searchResults.filter(note => note.path !== ctx.sourcePath)
				}
				
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

				// Render the output
				result = renderers[oqlConfig.template](searchResults, oqlConfig)
			} else {
				result = renderWarning('Index not build yet... (check back after opening another note!)');
			}
			// If any error shows up when rendering, catch it and render an error instead.
		} catch (error) {
			result = renderError(error);
		}	

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
}
