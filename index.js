var newline      = /\r?\n|\r/g,
  escapeRegExp = function (str) {
    // source: https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
    return str.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
  },
  trim         = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  },
  trimQuotes   = function (str) {
    return str.replace(/^['"]|['"]$/g, '');
  },
  isQuote      = function (chr) {
    return /['"]/.test(chr);
  },
  groupParams  = function (result, part) {
    if (result.length > 0) {
      var last      = result[result.length - 1],
        firstChar = last[0],
        lastChar  = last[last.length - 1];

      if (isQuote(firstChar) && (!isQuote(lastChar) || last[last.length - 2] === '\\')) {
        // merge with previous
        result[result.length - 1] += ',' + part;
      } else {
        result.push(part);
      }
    } else {
      result.push(part);
    }

    return result;
  };

/**
 * @class Parser
 * @constructor
 * @param {Object} keywordSpec An object with keywords as keys and parameter indexes as values
 */
function Parser(keywordSpec) {
  keywordSpec = keywordSpec || {
      _: [0],
      gettext: [0],
      ngettext: [0, 1]
    };

  if (typeof keywordSpec !== 'object') {
    throw 'Invalid keyword spec';
  }

  this.keywordSpec           = keywordSpec;
  this.expressionPattern     = new RegExp([
    '(?:(.)?(' + Object.keys(keywordSpec).map(escapeRegExp).join('|') + ')',
    '\\(((?:(["\'])(.|\\t|\\n|\\r)*?\\4(?:,\\s?)*(?:[\\w\\.[\\],\\s+-/()]+)*)*)\\))'
  ].join(''), 'g');
  this.swigExpressionPattern = /{{((?:(?!{{)(?!}})(?:.|\t|\n|\r))*)(?:}}|\|)|{%((?:(?!{%)(?:.|\t|\n|\r))*)%}/g;
  this.keyWordExist          = new RegExp(Object.keys(keywordSpec).map(escapeRegExp).join('|'));
}

/**
 * Given a Swig template string returns the list of i18n strings.
 *
 * @param {String} template The content of a HBS template.
 * @return {Object} The list of translatable strings, the line(s) on which each appears and an optional plural form.
 */
Parser.prototype.parse = function (template) {
  var result = {},
    match,
    keyword,
    params,
    expMatch,
    msgid;
  if (template.indexOf('billing_balance_offert') != -1) {
    console.log(template);
  }
  while ((expMatch = this.swigExpressionPattern.exec(template)) !== null) {
    var expResult = expMatch[1] || expMatch[2];

    if (!this.keyWordExist.test(expResult)) {
      continue;
    }
    while ((match = this.expressionPattern.exec(expResult)) !== null) {
      if (match[1] !== ' ' && match[1] !== '.' && match[1] !== undefined) {
        continue;
      }
      keyword       = match[2];
      params        = match[3].split(',').reduce(groupParams, []).map(trim).map(trimQuotes);
      msgid         = params[this.keywordSpec[keyword][0]];
      result[msgid] = result[msgid] || {line: []};
      result[msgid].line.push(template.substr(0, match.index).split(newline).length);

      if (this.keywordSpec[keyword].length > 1) {
        result[msgid].plural = result[msgid].plural || params[this.keywordSpec[keyword][1]];
      }
    }

  }

  return result;
};

module.exports = Parser;
