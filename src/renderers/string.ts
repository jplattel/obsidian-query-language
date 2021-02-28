import { IFuseFile } from '../search';
import { OQLConfig } from '../renderer';

export default function renderString(searchResults: IFuseFile[], oqlConfig: OQLConfig): Element {
    console.debug(`[OQL] Rendering string, with ${searchResults.length} results`);
    
    // If there's no 'format: ""' 
    if (!('format' in oqlConfig)) {
        throw Error("No 'format' key specified in OQL.")
    }

    let output = oqlConfig.format;
    
    // Replace placeholders for the 'name' in the ouput
    if (oqlConfig.name) {
        output = output.replace("{name}", oqlConfig.name)
    }

    // Replace placeholders for the 'count' in the ouput
    if (searchResults) {
        output = output.replace("{count}", searchResults.length.toString())
    }
    // Create the wrapper element (or use a span by default) 
    // and put the result of the query inside
    let result = document.createElement(oqlConfig.wrapper || 'span')
    result.innerHTML = output
    return result
}