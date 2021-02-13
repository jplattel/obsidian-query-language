import { IFuseFile } from './search';
import { OQLConfig } from 'renderer';


export default class DebugRenderer {
    public static render(searchResults: IFuseFile[], nodeConfig: OQLConfig) {
        if (nodeConfig.debug === true) {
            let debugWindow = document.createElement('pre');
            debugWindow.addClass("oql-debug")
            debugWindow.addClass("language-js")
            let debugText = `// Debugging OQL, total results: ${searchResults.length}\n// Query: \n`
            let debugQuery = `${JSON.stringify(nodeConfig.query, null, 2)}\n// Results: \n\n`
            let noteTitles = searchResults.map((r) => `${r.title}`).join("\n")
            debugWindow.innerText = debugText + debugQuery + noteTitles
            return debugWindow
        }
    }
}