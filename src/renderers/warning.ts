export default function renderWarning(warningMessage: string): Element {
    let warningElement = document.createElement('div');
    warningElement.addClass('oql-warning')
    warningElement.innerText = warningMessage;
    return warningElement
}