/*
Language: Solidity
Author: yoonsung.eth (ys.choi@me.com)
Description: Using the Solidity syntax highlighter module https://github.com/highlightjs/highlightjs-solidity that supports up to version 10, I have upgraded it to be compatible with highlight.js version 11.
Website: https://ysnim.ink
Category: config
*/

function isNegativeLookbehindAvailable() {
  try {
    new RegExp('(?<!.)');
    return true;
  } catch (_) {
    return false;
  }
}

const byteSizes = Array.from({length: 32}, (_, i) => i + 1);

const bytesTypes = byteSizes.map(function (bytes) {
  return 'bytes' + bytes;
});

const numSizes = byteSizes.map(function (bytes) {
  return bytes * 8;
});

const uintTypes = numSizes.map(function (size) {
  return 'uint' + size;
});

const intTypes = numSizes.map(function (size) {
  return 'int' + size;
});

const HEX_APOS_STRING_MODE = {
  className: 'string',
  begin: /\bhex'(([0-9a-fA-F]{2}_?)*[0-9a-fA-F]{2})?'/, //please also update HEX_QUOTE_STRING_MODE
};

const HEX_QUOTE_STRING_MODE = {
  className: 'string',
  begin: /\bhex"(([0-9a-fA-F]{2}_?)*[0-9a-fA-F]{2})?"/, //please also update HEX_APOS_STRING_MODE
};

export default function (hljs) {
  const TYPES = [
    'bool',
    'address',
  ].concat(bytesTypes).concat(uintTypes).concat(intTypes);

  const KEYWORDS = [
    'var',
    'bool',
    'string',
    'int',
    'uint',
    'byte',
    'bytes',
    'fixed',
    'ufixed',
    'enum',
    'struct',
    'mapping',
    'address',
    'new',
    'delete',
    'if',
    'else',
    'for',
    'while',
    'continue',
    'break',
    'return',
    'throw',
    'emit',
    'try',
    'catch',
    'revert',
    'unchecked',
    '_',
    'function',
    'modifier',
    'event',
    'constructor',
    'fallback',
    'receive',
    'error ',
    'virtual',
    'override',
    'constant',
    'immutable',
    'anonymous',
    'indexed',
    'storage',
    'memory',
    'calldata',
    'external',
    'public',
    'internal',
    'payable',
    'pure',
    'view',
    'private',
    'returns',
    'import',
    'from',
    'as',
    'using',
    'global',
    'pragma',
    'contract',
    'interface',
    'library',
    'is',
    'abstract',
    'type',
    'assembly',
  ];

  const LITERAL = 'true false wei gwei szabo finney ether seconds minutes hours days weeks years';

  const BUILT_IT =
    'self this super selfdestruct suicide now msg block tx abi blockhash gasleft assert require Error Panic sha3 sha256 keccak256 ripemd160 ecrecover addmod mulmod log0 log1 log2 log3 log4';

  const SOL_SPECIAL_PARAMETERS_LIST = ['gas', 'value', 'salt'];
  const SOL_SPECIAL_PARAMETERS_PARTIAL_RE = '(' + SOL_SPECIAL_PARAMETERS_LIST.join('|') + ')(?=:)';
  const SOL_SPECIAL_PARAMETERS = {
    className: 'built_in',
    begin: (isNegativeLookbehindAvailable() ? '(?<!\\$)\\b' : '\\b') + SOL_SPECIAL_PARAMETERS_PARTIAL_RE,
  };

  const SOL_OPERATORS = {
    className: 'operator',
    begin: /[+\-!~*\/%<>&^|=]/ //excluding ?: because having : as operator causes problems
};

  const SOL_KEYWORDS = {
    type: TYPES,
    keyword: KEYWORDS,
    literal: LITERAL,
    built_in: BUILT_IT,
  };

  const SOL_NUMBER = {
    className: 'number',
    begin:
      (isNegativeLookbehindAvailable()
        ? '/-?((?<!\\$)\\b0[xX]([a-fA-F0-9]_?)*[a-fA-F0-9]|((?<!\\$)\\b[1-9](_?\\d)*(\\.((\\d_?)*\\d)?)?|\\.\\d(_?\\d)*)([eE][-+]?\\d(_?\\d)*)?|(?<!\\$)\\b0)(?!\\w|\\$)/'
        : '/-?(\b0[xX]([a-fA-F0-9]_?)*[a-fA-F0-9]|(\b[1-9](_?\d)*(\.((\d_?)*\d)?)?|\.\d(_?\d)*)([eE][-+]?\d(_?\d)*)?|\b0)(?!\w|\$)/'),
    relevance: 0,
  };

  const SOL_TITLE_MODE = hljs.inherit(hljs.TITLE_MODE, {
    begin: /[A-Za-z$_][0-9A-Za-z$_]*/,
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    keywords: SOL_KEYWORDS,
  });

  const SOL_RESERVED_MEMBERS = {
    begin: /\.\s*/, // match any property access up to start of prop
    end: /[^A-Za-z0-9$_\.]/,
    excludeBegin: true,
    excludeEnd: true,
    keywords: {
      built_in: 'gas value selector address length push pop ' + //members of external functions; members of arrays
        'send transfer call callcode delegatecall staticcall ' + //members of addresses
        'balance code codehash ' + //more members of addresses
        'wrap unwrap ' + //members of UDVTs (the types not the values)
        'name creationCode runtimeCode interfaceId min max', //members of type(...)
    },

    relevance: 2,
  };

  const SOL_FUNC_PARAMS = {
    className: 'params',
    begin: /\(/,
    end: /\)/,
    excludeBegin: true,
    excludeEnd: true,
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    keywords: SOL_KEYWORDS,
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      solAposStringMode(hljs),
      solQuoteStringMode(hljs),
      SOL_NUMBER,
      'self', //to account for mappings and fn variables
    ],
  };

  const SOL_FUNCTIONS = { // functions
    className: 'function',
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    beginKeywords: 'function modifier event constructor fallback receive error',
    end: /[{;]/,
    excludeEnd: true,
    contains: [
      SOL_TITLE_MODE,
      SOL_FUNC_PARAMS,
      SOL_SPECIAL_PARAMETERS,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
    ],
    illegal: /%/,
  };

  const SOL_CLASS = {
    className: 'class',
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    beginKeywords: 'contract interface library',
    end: '{',
    excludeEnd: true,
    illegal: /[:"\[\]]/,
    contains: [
      { beginKeywords: 'is', lexemes: /[A-Za-z_$][A-Za-z_$0-9]*/ },
      SOL_TITLE_MODE,
      SOL_FUNC_PARAMS,
      SOL_SPECIAL_PARAMETERS,
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
    ],
  };

  const SOL_STRUCT = {
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    beginKeywords: 'struct enum', end: '{', excludeEnd: true,
    illegal: /[:"\[\]]/,
    contains: [
        SOL_TITLE_MODE,
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE
    ]
  };

  const SOL_IMPORT = { // imports
    beginKeywords: 'import', end: ';',
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    keywords: 'import from as',
    contains: [
        SOL_TITLE_MODE,
        solAposStringMode(hljs),
        solQuoteStringMode(hljs),
        HEX_APOS_STRING_MODE,
        HEX_QUOTE_STRING_MODE,
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        SOL_OPERATORS
    ]
  };

  const SOL_USING = { // using
    beginKeywords: 'using', end: ';',
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    keywords: 'using for global',
    contains: [
        SOL_TITLE_MODE,
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        SOL_OPERATORS
    ]
  };

  const SOL_PRAGMA = { // pragmas
    className: 'meta',
    beginKeywords: 'pragma', end: ';',
    $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
    keywords: {
        keyword: 'pragma solidity experimental abicoder',
        built_in: 'ABIEncoderV2 SMTChecker v1 v2'
    },
    contains: [
        hljs.C_LINE_COMMENT_MODE,
        hljs.C_BLOCK_COMMENT_MODE,
        hljs.inherit(solAposStringMode(hljs), { className: 'meta-string' }),
        hljs.inherit(solQuoteStringMode(hljs), { className: 'meta-string' })
    ]
  };

  const DOC_COMMENT = hljs.COMMENT(
    /\/\*\*(?!\/)/,
    '\\*/',
    {
      relevance: 0,
      contains: [
        {
          begin: '(?=@[A-Za-z]+)',
          relevance: 0,
          contains: [
            {
              className: 'doctag',
              begin: '@[A-Za-z]+'
            },
            {
              className: 'type',
              begin: '\\{',
              end: '\\}',
              excludeEnd: true,
              excludeBegin: true,
              relevance: 0
            },
            {
              className: 'variable',
              begin: '[A-Za-z$_][0-9A-Za-z$_]*' + '(?=\\s*(-)|$)',
              endsParent: true,
              relevance: 0
            },
            // eat spaces (not newlines) so we can find
            // types or variables
            {
              begin: /(?=[^\n])\s/,
              relevance: 0
            }
          ]
        }
      ]
    }
  );

  const SOL_COMMENT = {
    className: "comment",
    variants: [
      DOC_COMMENT,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.C_LINE_COMMENT_MODE
    ]
  };

  // const SOL_ASSEMBLY = { //assembly section
  //   beginKeywords: 'assembly',
  //   end: /\b\B/, //unsatisfiable regex; ended by endsParent instead
  //   contains: [
  //       hljs.C_LINE_COMMENT_MODE,
  //       hljs.C_BLOCK_COMMENT_MODE,
  //       hljs.inherit(solAposStringMode(hljs), { className: 'meta-string' }), //going to count "memory-safe" etc as meta-strings
  //       hljs.inherit(solQuoteStringMode(hljs), { className: 'meta-string' }),
  //       hljs.inherit(SOL_ASSEMBLY_ENVIRONMENT, { //the actual *block* in the assembly section
  //           begin: '{', end: '}',
  //           endsParent: true,
  //           contains: SOL_ASSEMBLY_ENVIRONMENT.contains.concat([
  //               hljs.inherit(SOL_ASSEMBLY_ENVIRONMENT, { //block within assembly
  //                   begin: '{', end: '}',
  //                   contains: SOL_ASSEMBLY_ENVIRONMENT.contains.concat(['self'])
  //               })
  //           ])
  //       })
  //   ]
  // };

  //I've set these up exactly like hljs's builtin STRING_MODEs,
  //except with the optional initial "unicode" text
  function solAposStringMode(hljs) {
    return hljs.inherit(
      hljs.APOS_STRING_MODE, //please also update solQuoteStringMode
      { begin: /(\bunicode)?'/ },
    );
  }

  function solQuoteStringMode(hljs) {
    return hljs.inherit(
      hljs.QUOTE_STRING_MODE, //please also update solAposStringMode
      { begin: /(\bunicode)?"/ },
    );
  }

  function makeBuiltinProps(obj, props) {
    return {
      begin: (isNegativeLookbehindAvailable() ? '(?<!\\$)\\b' : '\\b') + obj + '\\.\\s*',
      end: /[^A-Za-z0-9$_\.]/,
      excludeBegin: false,
      excludeEnd: true,
      $pattern: /[A-Za-z_$][A-Za-z_$0-9]*/,
      keywords: {
        built_in: obj + ' ' + props,
      },
      contains: [
        SOL_RESERVED_MEMBERS,
      ],
      relevance: 10,
    };
  }

  return {
    name: 'Solidity',
    aliases: ['solidity', 'sol'],
    case_insensitive: true,
    keywords: SOL_KEYWORDS,
    contains: [
      SOL_COMMENT,
      SOL_FUNCTIONS,
      makeBuiltinProps('msg', 'gas value data sender sig'),
      makeBuiltinProps('block', 'blockhash coinbase difficulty prevrandao gaslimit basefee number timestamp chainid'),
      makeBuiltinProps('tx', 'gasprice origin'),
      makeBuiltinProps('abi', 'decode encode encodePacked encodeWithSelector encodeWithSignature encodeCall'),
      makeBuiltinProps('bytes', 'concat'),
      makeBuiltinProps('string', 'concat'),
      SOL_RESERVED_MEMBERS,
      SOL_CLASS,
      SOL_STRUCT,
      SOL_IMPORT,
      SOL_USING,
      SOL_PRAGMA,
    ],
    illegal: /#/
  };
}
