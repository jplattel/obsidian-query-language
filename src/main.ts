import { MarkdownPreviewRenderer, App, Notice, Plugin, Vault, PluginManifest, fuzzySearch } from 'obsidian';
import QueryResultRenderer from './renderer';
import SearchIndex from './search';
import * as Yaml from 'yaml';

export default class ObsidianQueryLanguagePlugin extends Plugin {
	public searchIndex: SearchIndex; // Fuse<T> doesn't seem to work?!

	async onload() {
		// Starting
		console.log("[OQL] Starting OQL");

		this.addCommand({
			id: 'oql-rebuild-search-index',
			name: 'Rebuild the OQL search index',
			callback: () => this.rebuildIndex()
		})
	
		// Register the result renderer as a postprocessor
		MarkdownPreviewRenderer.registerPostProcessor(QueryResultRenderer.postprocessor);

		// Rebuild the index every minute:
		if (this.app.workspace.layoutReady) {
			this.rebuildIndex()
		} else {
			this.registerEvent(
				this.app.workspace.on("layout-ready", this.rebuildIndex.bind(this))
			);
		}

		this.registerInterval(
			window.setInterval(this.rebuildIndex.bind(this), 60000)
		);
	}

	onunload() {
		MarkdownPreviewRenderer.unregisterPostProcessor(QueryResultRenderer.postprocessor);
	}

	rebuildIndex(){
		console.log('[OQL] Rebuilding search index..');
		const searchIndex = SearchIndex.getInstance()
		searchIndex.buildIndex(this.app.vault.getMarkdownFiles())
	}
	
	// runQueries() {
	// 	// If no search index is available, start creating one:
		
	
	// 	// Find all nodes containing a query
	// 	const nodes = document.querySelectorAll('pre[class*="language-oql"]');

	// 	console.log(`Running queries for ${nodes.length}`);

	// 	nodes.forEach(node => {
	// 		const nodeParams = Yaml.parse(node.textContent);
	// 		if (nodeParams.search) {
	// 			let results = this.searchIndex.search(nodeParams.search)
	// 			console.log(`${results.length} results found..`)
	// 			node.setAttr('data-oql-results-length', results.length)
	// 		}
	// 	});
	// }
}

