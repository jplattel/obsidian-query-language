import renderError from './error';
import renderList from './list';
import renderTable from './table';
import renderString from './string';
import renderLink from './link';
import renderDebug from './debug';
import renderWarning from './warning'; 

const renderers: { [key: string]: any } = {
    'list': renderList,
    'table': renderTable,
    'string': renderString,
}

export default renderers