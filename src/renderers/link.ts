import { IFuseFile } from '../search';

export default function renderLink(searchResult: IFuseFile) {
    // Example link <a data-href="2021-01-09" href="2021-01-09" class="internal-link" target="_blank" rel="noopener">&lt; Yesterday</a>
    let listItemLink = document.createElement('a');
    listItemLink.addClass('internal-link');
    listItemLink.setAttribute('a', searchResult.title);
    listItemLink.setAttribute('target', '_blank');
    listItemLink.setAttribute('rel', 'noopener');
    listItemLink.setAttribute('data-href', searchResult.title);
    listItemLink.innerText = searchResult.title;
    return listItemLink
}