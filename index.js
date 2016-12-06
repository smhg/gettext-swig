var newline = /\r?\n|\r/g,
  escapeRegExp = function (str) {
    // source: https://developer.mozilla.org/en/docs/Web/JavaScript/Guide/Regular_Expressions
    return str.replace(/([.*+?^${}()|\[\]\/\\])/g, "\\$1");
  },
  trim = function (str) {
    return str.replace(/^\s+|\s+$/g, '');
  },
  trimQuotes = function (str) {
    return str.replace(/^['"]|['"]$/g, '');
  },
  isQuote = function (chr) {
    return /['"]/.test(chr);
  },
  groupParams = function (result, part) {
    if (result.length > 0) {
      var last = result[result.length - 1],
        firstChar = last[0],
        lastChar = last[last.length - 1];

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
 * Constructor
 * @param Object keywordSpec An object with keywords as keys and parameter indexes as values
 */
function Parser (keywordSpec) {
  keywordSpec = keywordSpec || {
    _: [0],
    gettext: [0],
    ngettext: [0, 1]
  };

  if (typeof keywordSpec !== 'object') {
    throw 'Invalid keyword spec';
  }

  this.keywordSpec = keywordSpec;
  this.expressionPattern = new RegExp([
    '{{ *',
    '(' + Object.keys(keywordSpec).map(escapeRegExp).join('|') + ')',
    '\\(',
    '([\\s\\S]*?)',
    '\\)',
    ' *}}'
  ].join(''), 'g');
}

/**
 * Given a Swig template string returns the list of i18n strings.
 *
 * @param String template The content of a Swig template.
 * @return Object The list of translatable strings, the line(s) on which each appears and an optional plural form.
 */
Parser.prototype.parse = function (template) {
  var results = [],
    match,
    keyword,
    params,
    msgid;

  while ((match = this.expressionPattern.exec(template)) !== null) {
    keyword = match[1];
    params = match[2].split(',').reduce(groupParams, []).map(trim).map(trimQuotes);

    // Parse message.
    const msgidIndex = this.keywordSpec[keyword].msgid;
    msgid = params[msgidIndex];

    // Prepare the result object.
    var result = {
      msgid: msgid,
      line: []
    }
    
    // Parse message lines.
    result.line.push(template.substr(0, match.index).split(newline).length);

    // Parse plural form.
    if(this.keywordSpec[keyword].msgid_plural != undefined) {
      const pluralIndex = this.keywordSpec[keyword].msgid_plural;
      result.plural = result.plural || params[pluralIndex];
    }

    // Parse context.
    if(this.keywordSpec[keyword].msgctxt != undefined) {
      const contextIndex = this.keywordSpec[keyword].msgctxt;
      result.msgctxt = result.msgctxt || params[contextIndex];
    }

    // Add result to results.
    results.push(result);
  }

  // Find duplicates and join them to one item.
  var itemsMarkedForRemoval = [];
  for(var i in results) {
    var itemLeft = results[i];

    for(var j in results) {
      if(i===j) continue;
      var itemRight = results[j];

      // Items are the same if the message and the context are identical.
      if(itemLeft.msgid === itemRight.msgid && itemLeft.msgctxt === itemRight.msgctxt) {
        itemLeft.line.push(itemRight.line[0]);
        itemsMarkedForRemoval = j;
      }
    }
  }

  // Remove duplicates.
  var resultsOutput = [];
  for(var i in results) {
    if(itemsMarkedForRemoval.indexOf(i) === -1) {
      results[i].line = results[i].line.sort();
      resultsOutput.push(results[i]);
    }
  }

  return resultsOutput;
};

module.exports = Parser;
