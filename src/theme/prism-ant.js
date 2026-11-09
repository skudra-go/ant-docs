// Code sits on one dark stage in both colour modes, so the spotlight reads the
// same everywhere. Syntax colours stay quiet and purple-leaning: the spotlight is
// the loudest thing in a block, not the keywords.
const ink = '#e6eaf2';
const faint = '#8590a3';
const keyword = '#c4b5fd';
const string = '#a7dcc6';
const type = '#a5c4f7';
const func = '#e7deff';
const number = '#f3b0cb';

module.exports = {
  plain: {
    color: ink,
    backgroundColor: 'var(--ant-stage)',
  },
  styles: [
    {types: ['comment', 'prolog', 'doctype', 'cdata'], style: {color: faint, fontStyle: 'italic'}},
    {types: ['keyword', 'selector', 'atrule', 'important'], style: {color: keyword}},
    {types: ['string', 'char', 'attr-value', 'inserted'], style: {color: string}},
    {types: ['number', 'boolean', 'constant', 'symbol'], style: {color: number}},
    {types: ['class-name', 'builtin', 'tag'], style: {color: type}},
    {types: ['function', 'attr-name'], style: {color: func}},
    {types: ['operator', 'entity', 'url'], style: {color: '#cdd4e0'}},
    {types: ['punctuation'], style: {color: '#9aa5b8'}},
    {types: ['deleted'], style: {color: '#f28ba8'}},
    {types: ['variable', 'parameter'], style: {color: ink}},
  ],
};
