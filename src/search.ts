import Fuse from 'fuse.js';
import type FuseResult from 'fuse.js';
import { TFile } from 'obsidian';

// The search index behaves as a singleton, thus
// we should only call it with getInstance() to get
// the current instance
export default class SearchIndex {
    
    // Single instance for the singleton
    private static instance: SearchIndex;
    
    // This contains the actual Fuse search object
    private searchIndex: any;

    // Get the singleton for use:
    public static getInstance(): SearchIndex {
        // If the class has no instance yet, create 
        // an empty search index
        if (!SearchIndex.instance) {
            SearchIndex.instance = new SearchIndex();
        }
        return SearchIndex.instance;
    }
    
    // Provide a set of markdown files to build a index
    // with for example this.app.vault.getMarkdownFiles()
    buildIndex(markdownFiles: TFile[]){
        console.log(`[OQL] Indexing ${markdownFiles.length} files..`)
		this.searchIndex = new Fuse(markdownFiles, {
			keys: ['path', 'cachedData', 'name'],
            useExtendedSearch: true,
            includeScore: true,
        });
    }
    
    // Search method, accepts only strings, but support 
    // different searching methods as described in the Fuse 
    // docs: https://fusejs.io/api/query.html
    
    // TODO, throw an error if the index is empty!
    search(query: String): FuseResult[] {
        console.log(`[OQL] Searching for: ${query}`)
        return this.searchIndex.search(query)
    }
}