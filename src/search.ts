import Fuse from 'fuse.js';
import { TFile } from 'obsidian';
export interface IFuseFile {
    [index:string]: any; 
    title: string;
    path: string;
    content: string;
    created: number;
    modified: number;
    tags?: string[];
    frontmatter?: any;
}


// The search index behaves as a singleton, thus
// we should only call it with getInstance() to get
// the current instance
class FuseSearchIndex{    
    // This contains the actual Fuse search object
    private searchIndex: Fuse<IFuseFile>;

    // Provide a set of markdown files to build a index
    // with for example this.app.vault.getMarkdownFiles()
    public buildIndex(files: IFuseFile[]){
        // Log the amount of files in debug
        console.debug(`[OQL] Indexing ${files.length} files..`)
        
        const index = Fuse.createIndex(['title', 'path', 'content', 'created', 'modified', 'tags'], files)

        // Store the search index within this singleton
		this.searchIndex = new Fuse(files, {
			keys: ['title', 'path', 'content', 'created', 'modified', 'tags'],
            useExtendedSearch: true,
            includeScore: true,
        }, index);
    }
    
    // Search method, accepts only strings, but support 
    // different searching methods as described in the Fuse 
    // docs: https://fusejs.io/api/query.html
    public async search(query: string): Promise<IFuseFile[]> {
        console.debug(`[OQL] Searching for: ${query}`)

        // We map the results to only return the items
        return await this.searchIndex.search(query).map(searchResult => {
            return searchResult.item
        })
    }

    public removeFile(file: IFuseFile) {   
        return this.searchIndex.remove(doc => {
			return doc.created === file.created
        })
    }

    public addFile(file: IFuseFile) {
        return this.searchIndex.add(file)
    }

}

export const SearchIndex = new FuseSearchIndex()
