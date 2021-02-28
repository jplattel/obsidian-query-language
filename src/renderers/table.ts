import { IFuseFile } from '../search';
import { OQLConfig } from '../renderer';
import renderTag from './tag'
import renderLink from './link'


function renderRow(searchResult: IFuseFile,  oqlConfig: OQLConfig, index: number) {
    let tableRow = document.createElement('tr');

    oqlConfig.fields.forEach(field => {
        let tableData = document.createElement('td');
        if (field === 'title') {
            tableData.appendChild(renderLink(searchResult))
        } else if (field === 'index') {
            tableData.innerText = (index + 1).toString()
        } else if (field === 'format') {
            if (!('format' in oqlConfig)) {
                throw Error("No 'format' key specified in OQL.")
            }
            let output = oqlConfig.format;
            
            // Replace placeholders according to the format
            output = output.replace("{title}", searchResult.title)
            output = output.replace("{path}", searchResult.path)
            output = output.replace("{modified}", new Date(searchResult.modified).toISOString())
            output = output.replace("{created}", new Date(searchResult.modified).toISOString())
            output = output.replace("{index}", (index + 1).toString())

            tableData.innerText = output
        } else if (field === 'created' || field === 'modified') {
            tableData.innerText = new Date(searchResult[field]).toISOString()
        } else if (field === 'tags') {
            try {
                searchResult[field].map(tag => {
                    tableData.appendChild(renderTag(tag))
                    let spacing = document.createElement('span')
                    spacing.innerText = ' '
                    tableData.appendChild(spacing);
                });
            } catch (e) {
                console.error("Error rendering in row: ", searchResult)
            }
        } else {
            tableData.innerText = searchResult[field]
        }
        tableRow.appendChild(tableData)
    });
    
    return tableRow
}

export default function renderTable(searchResults: IFuseFile[], oqlConfig: OQLConfig): Element {
    console.debug(`[OQL] Rendering table, with ${searchResults.length} results`);
    let result = document.createElement('table');
    
    if (oqlConfig.limit) {
        searchResults = searchResults.slice(0, oqlConfig.limit)
    }

    // if fields are provided in the config, use those, otherwise default to date & date created
    const fields = oqlConfig.fields || ['title', 'created']

    // Create a header in the table
    let tableHeader = document.createElement('tr');
    fields.forEach(field => {
        let tableData = document.createElement('th')
        // Capitalize the field
        tableData.innerText = field.charAt(0).toUpperCase() + field.slice(1);
        tableHeader.appendChild(tableData);
    });

    result.appendChild(tableHeader)

    // Finally, render the table contents
    searchResults.forEach((searchResult, index) => {
        result.appendChild(renderRow(searchResult, oqlConfig, index));
    });
    
    return result
}