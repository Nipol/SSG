export default function (hljs) {
  const LITERALS = [
    'true',
    'false',
  ];
  const BUILT_INS = [
    'length',
    'new',
  ];
  const TYPES = [
    'bool',
    'byte',
    'complex64',
    'complex128',
    'error',
    'float32',
    'float64',
    'int8',
    'int16',
    'int32',
    'int64',
    'string',
    'uint8',
    'uint16',
    'uint32',
    'uint64',
    'int',
    'uint',
    'uintptr',
    'rune',
  ];
  const KWS = [
    'break',
    'case',
    'chan',
    'const',
    'continue',
    'default',
    'defer',
    'else',
    'fallthrough',
    'for',
    'func',
    'go',
    'goto',
    'if',
    'import',
    'interface',
    'map',
    'package',
    'range',
    'return',
    'select',
    'struct',
    'switch',
    'type',
    'var',
  ];
  const KEYWORDS = {
    keyword: KWS,
    type: TYPES,
    literal: LITERALS,
    built_in: BUILT_INS,
  };
  return {
    name: 'solidity',
    aliases: ['solidity'],
    keywords: KEYWORDS,
    illegal: '</',
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      {
        className: 'string',
        variants: [
          hljs.QUOTE_STRING_MODE,
          hljs.APOS_STRING_MODE,
          {
            begin: '`',
            end: '`',
          },
        ],
      },
      {
        className: 'number',
        variants: [
          {
            begin: hljs.C_NUMBER_RE + '[i]',
            relevance: 1,
          },
          hljs.C_NUMBER_MODE,
        ],
      },
      {
        begin: /:=/, // relevance booster
      },
      {
        className: 'function',
        beginKeywords: 'func',
        end: '\\s*(\\{|$)',
        excludeEnd: true,
        contains: [
          hljs.TITLE_MODE,
          {
            className: 'params',
            begin: /\(/,
            end: /\)/,
            endsParent: true,
            keywords: KEYWORDS,
            illegal: /["']/,
          },
        ],
      },
    ],
  };
}
