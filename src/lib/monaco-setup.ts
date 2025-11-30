import * as monaco from 'monaco-editor';

export function setupMonaco() {
  // Configure SQL language
  monaco.languages.register({ id: 'sql' });
  
  monaco.languages.setMonarchTokensProvider('sql', {
    tokenizer: {
      root: [
        [/[ \t\r\n]+/, 'white'],
        [/--.*$/, 'comment'],
        [/\/\*[\s\S]*?\*\//, 'comment'],
        [/SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|TABLE|INDEX|VIEW|DATABASE|SCHEMA|JOIN|INNER|LEFT|RIGHT|FULL|OUTER|ON|AS|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|ORDER|BY|GROUP|HAVING|LIMIT|OFFSET|DISTINCT|COUNT|SUM|AVG|MAX|MIN|CASE|WHEN|THEN|ELSE|END|UNION|ALL|EXISTS/i, 'keyword'],
        [/[0-9]+/, 'number'],
        [/["'][^"']*["']/, 'string'],
        [/[a-zA-Z_][a-zA-Z0-9_]*/, 'identifier'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('sql', {
    comments: {
      lineComment: '--',
      blockComment: ['/*', '*/'],
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}
