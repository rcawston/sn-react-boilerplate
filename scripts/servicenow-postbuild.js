const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');
const indexPath = path.join(distPath, 'index.html');

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

function injectLinkTags(linkTags) {
    const escapedLinkTags = linkTags.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `    <g:evaluate>
      var linkTags = '${escapedLinkTags}';
    </g:evaluate>
    <g2:no_escape>
      $[linkTags]
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

function updateFileNamesRecursively(dir) {
    const renamedFiles = {};

    function processDirectory(currentPath) {
        const files = fs.readdirSync(currentPath);

        files.forEach(file => {
            const filePath = path.join(currentPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                processDirectory(filePath);
            } else if (file.endsWith('.js') || file.endsWith('.css')) {
                const relativePath = path.relative(distPath, filePath);
                const newName = file.replace(/\.(js|css)$/, '-$1');
                const newPath = path.join(currentPath, newName);
                fs.renameSync(filePath, newPath);
                renamedFiles[relativePath] = path.relative(distPath, newPath);
            }
        });
    }

    processDirectory(dir);
    return renamedFiles;
}

function updateHtmlReferences(html, renamedFiles) {
    Object.entries(renamedFiles).forEach(([oldPath, newPath]) => {
        const oldPathRegex = new RegExp(oldPath.replace(/\\/g, '/'), 'g');
        html = html.replace(oldPathRegex, newPath.replace(/\\/g, '/'));
    });
    return html;
}

function modifyIndexHtml() {
    let html = fs.readFileSync(indexPath, 'utf-8');

    // Rename files and update references
    const renamedFiles = updateFileNamesRecursively(distPath);
    html = updateHtmlReferences(html, renamedFiles);

    // Extract head, body content, and script tags
    const headContent = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i)[1];
    const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)[1];

    // Extract all script tags
    const allScriptTags = html.match(/<script[\s\S]*?<\/script>/gi) || [];

    // Separate security token script from other scripts
    const securityTokenScript = allScriptTags.find(script => script.includes('window.servicenowUserToken'));
    const otherScriptTags = allScriptTags.filter(script => !script.includes('window.servicenowUserToken'))
      .map(tag => tag.replace('<script', '<script type="text/javascript"'));

    // Extract meta tags and link tags
    const metaTags = headContent.match(/<meta[^>]*>/gi) || [];
    const linkTags = headContent.match(/<link[^>]*>/gi) || [];
    const metaTagsString = metaTags.join('');
    const linkTagsString = linkTags.join('');

    // Remove meta tags, link tags, and script tags from head content
    let headContentCleaned = headContent
      .replace(/<meta[^>]*>/gi, '')
      .replace(/<link[^>]*>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .trim();

    // Construct new HTML structure
    let newHtml = injectDocTypeHandling();
    newHtml += '\n  <head>\n';
    newHtml += injectMetaTags(metaTagsString);
    newHtml += '\n' + injectLinkTags(linkTagsString);
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
console.log('Post-build processing complete. Files renamed and index.html modified for ServiceNow compatibility.');

