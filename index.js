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
}

/**
 * Given a Handlebars template string returns the list of i18n strings.
 *
 * @param String template The content of a HBS template.
 * @return Object The list of translatable strings, the line(s) on which each appears and an optional plural form.
 */
Parser.prototype.parse = function (template) {
  var keywordSpec = this.keywordSpec,
    keywords = Object.keys(keywordSpec);

  return {};
};

module.exports = Parser;
