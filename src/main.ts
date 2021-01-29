import { MarkdownPreviewRenderer, App, Notice, Plugin, Vault, MetadataCache, TFile } from 'obsidian';
import { SearchIndex, IFuseFile } from './search';
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
			callback: () => this.buildIndex()
		})
	
		// Rebuild the index on modifying of a file:
		this.registerEvent(
			this.app.vault.on("modify", () => {
				this.buildIndex()
			})
		);

		// Rebuild the index on layout-ready, for the initial render
		this.app.workspace.on("layout-ready", () => {
			this.buildIndex()
		})

		// Register the renderer as postprocessor
		MarkdownPreviewRenderer.registerPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Remove the postprocessor for OQL
	onunload() {
		MarkdownPreviewRenderer.unregisterPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Rebuild the search index 
	buildIndex() {
		console.debug('[OQL] Initial building of search index..');
		SearchIndex.buildIndex(this.app.vault.getMarkdownFiles().map(f => this.parseFile(f)))
	}

	// WIP, rebuilding the entire index is costly, refreshing the single edited file is more useful
	refreshFile(file: TFile) {
		// Remove the old document from the index (matching on path, is this the correct way? What if it changes?)
		SearchIndex.removeFile(this.parseFile(file))
		// Add the file to the index
		SearchIndex.addFile(this.parseFile(file))
	}

	// Go from a TFile object to a TFuseFile, adding more metadata to query
	parseFile(file: TFile) {
		// Parse the metadata of the file
		let metadata = this.app.metadataCache.getFileCache(file)
		let tags = metadata.frontmatter?.tags

		if (tags) {
			tags = tags.split(',').map(tag => tag.trim())
		} else {
			tags = []
		}
		
		// Return a better formatted file for indexing
		return <IFuseFile> {
			title: file.basename,
			path: file.path,
			content: file.cachedData,
			created: file.stat.ctime,
			modified: file.stat.mtime,
			tags: tags, // Empty by default
			frontmatter: metadata.frontmatter,
		}
	}
}

