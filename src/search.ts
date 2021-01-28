import Fuse from 'fuse.js';
import { TFile } from 'obsidian';

export interface IMarkdownFile {
    [index:string]: any; 
    title: string;
    path: string;
    content: string;
    created: number;
    modified: number;
}
// The search index behaves as a singleton, thus
// we should only call it with getInstance() to get
// the current instance
class FuseSearchIndex{    
    // This contains the actual Fuse search object
    private searchIndex: Fuse<IMarkdownFile>;

    // Provide a set of markdown files to build a index
    // with for example this.app.vault.getMarkdownFiles()
    public buildIndex(files: TFile[]){
        // Log the amount of files in debug
        console.debug(`[OQL] Indexing ${files.length} files..`)

        // Remap the fields of each markdown file
        let markdownFiles = files.map((markdownFile) => {
            return <IMarkdownFile> {
                title: markdownFile.basename,
                path: markdownFile.path,
                content: markdownFile.cachedData,
                created: markdownFile.stat.ctime,
                modified: markdownFile.stat.mtime,
            }
        })

        const index = Fuse.createIndex(['title', 'path', 'content', 'created', 'modified'], markdownFiles)

        // Store the search index within this singleton
		this.searchIndex = new Fuse(markdownFiles, {
			keys: ['title', 'path', 'content', 'created', 'modified'],
            useExtendedSearch: true,
            includeScore: true,
        }, index);
    }
    
    // Search method, accepts only strings, but support 
    // different searching methods as described in the Fuse 
    // docs: https://fusejs.io/api/query.html
    
    // TODO, throw an error if the index is empty!
    public async search(query: string): Promise<IMarkdownFile[]> {
        console.debug(`[OQL] Searching for: ${query}`)
        // We map the results to only return the items
        return await this.searchIndex.search(query).map(searchResult => {
            return searchResult.item
        })
    }
}

export const SearchIndex = new FuseSearchIndex()
