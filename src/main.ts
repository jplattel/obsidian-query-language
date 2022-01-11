import { MarkdownPreviewRenderer, MarkdownPreviewView, App, Notice, Plugin, Vault, MetadataCache, TFile, TAbstractFile, parseFrontMatterTags } from 'obsidian';
import { SearchIndex, IFuseFile } from './search';
import QueryResultRenderer from './renderer';
import * as Yaml from 'yaml';
import { parse } from 'path';


export default class ObsidianQueryLanguagePlugin extends Plugin {
	async onload() {
		// Starting
		console.debug("[OQL] Starting OQL");
		
		// Register a command that lets you update the search index manually
		this.addCommand({
			id: 'oql-rebuild-search-index',
			name: 'Rebuild the OQL search index',
			callback: () => {
				this.buildIndex()
			}
		})

		// Rebuild the index on layout-ready, for the initial render
		this.app.workspace.on("layout-ready", () => {
			this.buildIndex()
		})

		// Refresh the single file in the index when modifying
		this.registerEvent(
			this.app.vault.on("modify", (file) => {
				this.refreshFile(file)
			})
		);
		
		// Refresh the single file in the index when renaming
		this.registerEvent(
			this.app.vault.on("rename", (file, oldPath) => {
				this.refreshFile(file)
			})
		);

		this.registerMarkdownCodeBlockProcessor("oql", (source, el, ctx) => {
			return QueryResultRenderer.postprocessor(source, el, ctx)
		})

		// Register the renderer as postprocessor
		// MarkdownPreviewRenderer.registerPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Remove the postprocessor for OQL
	onunload() {
		// MarkdownPreviewRenderer.unregisterPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Rebuild the search index 
	buildIndex() {
		console.debug('[OQL] Initial building of search index..');
		SearchIndex.buildIndex(this.app.vault.getMarkdownFiles().map(f => this.parseFile(f)))
	}

	// WIP, rebuilding the entire index is costly, refreshing the single edited file is more useful
	refreshFile(file: TAbstractFile): void {
		if (file instanceof TFile) {
			// Remove the old document from the index (matching on path, is this the correct way? What if it changes?)
			SearchIndex.removeFile(this.parseFile(file))
			// Add the file to the index
			SearchIndex.addFile(this.parseFile(file))
		}
	}

	// Go from a TFile object to a TFuseFile, adding more metadata
	parseFile(file: TFile): IFuseFile {
		// Parse the metadata of the file
		let metadata = this.app.metadataCache.getFileCache(file)
		
		let tags: string[] = []
		if (metadata) {
			// Get the tags from the frontmatter
			if (metadata?.frontmatter?.tags) {
				tags = parseFrontMatterTags(metadata.frontmatter)
			} 

			// Also add the tags from the metadata object (these are present in document itself)
			if (metadata?.tags) {
				tags = tags.concat(metadata.tags.map(tag => tag.tag))
			}
		}
		
		// Return a better formatted file for indexing
		return <IFuseFile> {
			title: file.basename,
			path: file.path,
			content: file.cachedData,
			created: file.stat.ctime,
			modified: file.stat.mtime,
			tags: tags,
		}
	
	}
}

