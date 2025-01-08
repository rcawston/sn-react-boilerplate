const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

function injectJellyWrappers(html) {
    const jellyStart = `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly
  trim="false"
  xmlns:j="jelly:core"
  xmlns:g="glide"
  xmlns:j2="null"
  xmlns:g2="null"
>`;
    const jellyEnd = `</j:jelly>`;
    return `${jellyStart}\n${html}\n${jellyEnd}`;
}

function injectDocTypeHandling() {
    return `  <g:evaluate>
    var docType = '&lt;!doctype html&gt;&lt;html lang=&quot;en&quot;&gt;';
  </g:evaluate>
  <g2:no_escape>
    $[docType]
  </g2:no_escape>`;
}

function injectMetaTags(metaTags) {
    const escapedMetaTags = metaTags.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `    <g:evaluate>
      var metaTags = '${escapedMetaTags}';
    </g:evaluate>
    <g2:no_escape>
      $[metaTags]
    </g2:no_escape>`;
}

function injectCloseTagHandling() {
    return `  <g:evaluate>
    var closeTag = '&lt;/html&gt;';
  </g:evaluate>
  <g2:no_escape>
    $[closeTag]
  </g2:no_escape>`;
}

function injectAuthLogic() {
    return `    <!-- handle security token for API requests -->
      <g:evaluate object="true">
        var session = gs.getSession(); var token = session.getSessionToken(); if
        (token=='' || token==undefined) token = gs.getSessionToken();
      </g:evaluate>
    <!-- handle security token for API requests -->`;
}

function modifyIndexHtml() {
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Extract head, body content, and script tags
    const headContent = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
    const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

    // Extract all script tags
    const allScriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

    // Separate security token script from other scripts
    const securityTokenScript = allScriptTags.find(script => script.includes('window.servicenowUserToken'));
    const otherScriptTags = allScriptTags.filter(script => !script.includes('window.servicenowUserToken'))
      .map(tag => tag.replace('<script', '<script type="text/javascript"'));

    // Extract meta tags
    const metaTags = headContent.match(/<meta[^>]*>/gi) || [];
    const metaTagsString = metaTags.join('');

    // Remove meta tags and script tags from head content
    let headContentCleaned = headContent.replace(/<meta[^>]*>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').trim();

    // Construct new HTML structure
    let newHtml = injectDocTypeHandling();
    newHtml += '\n  <head>\n';
    newHtml += injectMetaTags(metaTagsString);
    newHtml += '\n' + headContentCleaned;
    newHtml += '\n' + injectAuthLogic();
    if (securityTokenScript) {
        newHtml += '\n    ' + securityTokenScript;
    }
    newHtml += '\n  </head>\n';
    newHtml += '  <body>\n';
    newHtml += bodyContent.trim() + '\n';
    newHtml += '  ' + otherScriptTags.join('\n  ') + '\n';
    newHtml += '  </body>\n';
    newHtml += injectCloseTagHandling();

    // Wrap with Jelly tags
    newHtml = injectJellyWrappers(newHtml);

    fs.writeFileSync(indexPath, newHtml);
}

modifyIndexHtml();
console.log('Index.html modified for ServiceNow compatibility');

