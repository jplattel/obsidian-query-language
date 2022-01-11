export default function renderError(errorMessage: string): Element {
    let errorElement = document.createElement('div');
    errorElement.addClass('oql-error')
    errorElement.innerText = errorMessage;
    return errorElement
}

