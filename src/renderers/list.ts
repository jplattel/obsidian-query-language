
import { IFuseFile } from '../search';
import { OQLConfig } from '../renderer';
import renderTag from './tag'
import renderLink from './link'
import renderString from './string';

function renderListItem(searchResult: IFuseFile, oqlConfig: OQLConfig, index: number) {
    let listItem = document.createElement('li');

    oqlConfig.fields.forEach(field => {
        let listItemField = document.createElement('span');
        if (field === 'title') {
            listItemField.appendChild(renderLink(searchResult))
        } else if (field === 'index') {
            listItemField.innerText = (index + 1).toString()
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
            
            listItemField.innerText = output
        } else if (field === 'created' || field === 'modified') {
            listItemField.innerText = new Date(searchResult[field]).toISOString()
        } else if (field === 'tags') {
            try {
                searchResult[field].map(tag => {
                    listItemField.appendChild(renderTag(tag))
                    let spacing = document.createElement('span')
                    spacing.innerText = ' '
                    listItemField.appendChild(spacing);
                });
            } catch (e) {
                console.error("Error rendering in list item: ", searchResult)
            }
        } else {
            listItem.innerText = searchResult[field]
        }

        // Render a space between each field
        let spacing = document.createElement('span')
        spacing.innerText = ' '
        listItemField.appendChild(spacing);

        listItem.appendChild(listItemField)
    });
    return listItem
}

export default function renderList(searchResults: IFuseFile[], oqlConfig: OQLConfig): Element {
    console.debug(`[OQL] Rendering list, with ${searchResults.length} results`);
    let output = oqlConfig.template;
    
    let result = document.createElement('ul');

    if (oqlConfig.limit) {
        searchResults = searchResults.slice(0, oqlConfig.limit)
    }
    
    // if fields are provided in the config, use those, otherwise default to title
    oqlConfig.fields = oqlConfig.fields || ['title']

    searchResults.forEach((searchResult, index) => {
        result.appendChild(renderListItem(searchResult, oqlConfig, index));
    });
    return result
}