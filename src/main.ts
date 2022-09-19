import { MarkdownPreviewRenderer, MarkdownPreviewView, App, Notice, Plugin, Vault, MetadataCache, TFile, TAbstractFile, parseFrontMatterTags, CachedMetadata } from 'obsidian';
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
				this.refreshFile(file, oldPath)
			})
		);

		this.registerMarkdownCodeBlockProcessor("oql", (source, el, ctx) => {
			return QueryResultRenderer.postprocessor(source, el, ctx)
		})

		// Register the renderer as postprocessor
		// MarkdownPreviewRenderer.registerPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Remove the postprocessor on unload
	onunload() {
		// MarkdownPreviewRenderer.unregisterPostProcessor(QueryResultRenderer.postprocessor);
	}

	// Rebuild the search index 
	async buildIndex() {
		console.debug('[OQL] Initial building of search index..');
		SearchIndex.buildIndex(await Promise.all(this.app.vault.getMarkdownFiles().map(f => this.parseFile(f))))
	}

	// Rebuilding the entire index is costly, refreshing the single edited file is more useful
	async refreshFile(file: TAbstractFile, oldPath?: string): Promise<void> {
		// Remove the old document from the index (matching on path, is this the correct way?)
		if (oldPath && file instanceof TFile) {
			let parsedFile = await this.parseFile(file)
			SearchIndex.removeFile(oldPath)
			SearchIndex.addFile(parsedFile)
		// If we are just updating, parse the file again and refresh it
		} else if (file instanceof TFile) {
			let parsedFile = await this.parseFile(file)
			SearchIndex.removeFile(parsedFile.path)
			SearchIndex.addFile(parsedFile)
		}
	}

	// Go from a TFile object to a TFuseFile, useful for indexing
	async parseFile(file: TFile): Promise<IFuseFile> {
		// Parse the metadata, tags & content of the file
		let metadata = this.app.metadataCache.getFileCache(file)
		let tags = await this.parseTags(metadata)
		let content = await this.app.vault.read(file)
		
		// Return a better formatted file for indexing
		return <IFuseFile> {
			title: file.basename,
			path: file.path,
			content: content,
			created: file.stat.ctime,
			modified: file.stat.mtime,
			tags: tags,
		}
	}

	async parseTags(metadata: CachedMetadata) {
		let tags: string[] = []
		if (metadata) {
			// Get the tags from the frontmatter
			if (metadata?.frontmatter?.tags) {
				tags = parseFrontMatterTags(metadata.frontmatter) ?? []
			} 
			// Also add the tags from the metadata object (these are present in document itself)
			if (metadata?.tags) {
				tags = tags.concat(metadata.tags.map(tag => tag.tag))
			}
		}
		return tags
	}
	
	async search(query: string | Object) {
		if (SearchIndex.state === 'ready') {
			return SearchIndex.search(query);
		} else {
			throw Error("OQL SearchIndex is not ready yet...")
		}
	}
}

