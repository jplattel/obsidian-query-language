import { MarkdownPreviewRenderer, App, Notice, Plugin, Vault, PluginManifest, fuzzySearch } from 'obsidian';
import { SearchIndex } from './search';
import QueryResultRenderer from './renderer';
import * as Yaml from 'yaml';
export default class ObsidianQueryLanguagePlugin extends Plugin {
	async onload() {
		// Starting
		console.debug("[OQL] Starting OQL");
		
		// Register a command that lets you update the search index manually
		this.addCommand({
			id: 'oql-rebuild-search-index',
			name: 'Rebuild the OQL search index',
			callback: () => this.rebuildIndex()
		})
	
		// Rebuild the index on modifying of a file:
		this.registerEvent(
			this.app.vault.on("modify", this.rebuildIndex.bind(this))
		);

		// Rebuild the index on layout-ready, for the initial render
		this.app.workspace.on("layout-ready", () => {
			this.rebuildIndex.bind(this)()
		})

		// Register the renderer as postprocessor
		MarkdownPreviewRenderer.registerPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Remove the postprocessor for OQL
	onunload() {
		MarkdownPreviewRenderer.unregisterPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Rebuild the search index from the plugin since that 
	// has access to the markdown files
	rebuildIndex() {
		console.debug('[OQL] Rebuilding search index..');
		SearchIndex.buildIndex(this.app.vault.getMarkdownFiles())
	}
}

