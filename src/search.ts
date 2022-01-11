import Fuse from 'fuse.js';
import { TFile } from 'obsidian';
export interface IFuseFile {
    [index:string]: any; 
    title: string;
    path: string;
    content: string;
    created: any;
    modified: any;
    tags?: string[];
    frontmatter?: any;
}


// The search index behaves as a singleton, thus
// we should only call it with getInstance() to get
// the current instance
class FuseSearchIndex{    
    // This contains the actual Fuse search object
    private searchIndex: Fuse<IFuseFile>;
    public state = 'starting';

    // Provide a set of markdown files to build a index
    // with for example this.app.vault.getMarkdownFiles()
    public buildIndex(files: IFuseFile[]){
        // Log the amount of files in debug
        console.debug(`[OQL] Indexing ${files.length} files..`)
        const indexKeys = ['title', 'path', 'content', 'created', 'modified', 'tags']
        const index = Fuse.createIndex(indexKeys, files)

        // Store the search index within this singleton
		this.searchIndex = new Fuse(files, {
			keys: indexKeys,
            useExtendedSearch: true,
            includeScore: true,
        }, index);
        this.state = 'ready'
    }

    // Search method, accepts only strings, but support 
    // different searching methods as described in the Fuse 
    // docs: https://fusejs.io/api/query.html
    public async search(query: string | Object): Promise<IFuseFile[]> {
        console.debug(`[OQL] Searching for: ${JSON.stringify(query)}`)

        // We map the results to only return the items
        return await this.searchIndex.search(query).map(searchResult => {
            return searchResult.item
        })
    }

    public removeFile(path: string) {
        // We can only remove files if the index is available
        try {
            return this.searchIndex.remove(doc => {
                return doc.path === path
            })
        } catch (error) {
            console.error(error)
        }
    }

    public addFile(file: IFuseFile) {
        return this.searchIndex.add(file)
    }

}

export const SearchIndex = new FuseSearchIndex()
