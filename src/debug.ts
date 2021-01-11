import { IMarkdownFile } from 'search';
import { OQLConfig } from 'renderer';


export default class DebugRenderer {
    public static render(searchResults: IMarkdownFile[], nodeConfig: OQLConfig) {
        if (nodeConfig.debug === true) {
            let debugWindow = document.createElement('pre');
            debugWindow.addClass("oql-debug")
            let debugText = `// Debugging OQL, total results: ${searchResults.length}\n`
            let debugQuery = `// Query: ${nodeConfig.query}\n// Results: \n\n`
            let noteTitles = searchResults.map((r) => `- ${r.title}`).join("\n")
            debugWindow.innerText = debugText + debugQuery + noteTitles
            console.log(searchResults);
            return debugWindow
        }
    }
}