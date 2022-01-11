export default function renderTag(tag: string) {
    // Example link  <a href="#friesland" class="tag" target="_blank" rel="noopener">#friesland</a>
    let tagItemLink = document.createElement('a');
    tagItemLink.addClass('tag');
    tagItemLink.setAttribute('href', tag);
    tagItemLink.setAttribute('target', '_blank');
    tagItemLink.setAttribute('rel', 'noopener');
    tagItemLink.innerText = tag;
    return tagItemLink
}