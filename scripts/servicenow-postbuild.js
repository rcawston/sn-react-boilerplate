const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.html');

function injectJellyWrappers(html) {
    const jellyStart = `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">`;
    const jellyEnd = `</j:jelly>`;
    return `${jellyStart}\n${html}\n${jellyEnd}`;
}

function injectAuthLogic(html) {
    const authLogic = `
<!-- handle security token for API requests -->
<div style="display:none">
  <g:evaluate object="true">
    var session = gs.getSession(); var token = session.getSessionToken(); if (token=='' || token==undefined) token = gs.getSessionToken();
  </g:evaluate>
</div>
<script>
  window.servicenowUserToken = '$[token]'
</script>
<!-- END handle security token for API requests -->
`;
    const headEndIndex = html.indexOf('</head>');
    return html.slice(0, headEndIndex) + authLogic + html.slice(headEndIndex);
}

function modifyIndexHtml() {
    let html = fs.readFileSync(indexPath, 'utf-8');
    html = html.replace('<!DOCTYPE html>', '');
    html = html.replace(/<html.*?>/, '').replace('</html>', '');
    html = injectJellyWrappers(html);
    html = injectAuthLogic(html);
    fs.writeFileSync(indexPath, html);
}

modifyIndexHtml();
console.log('Index.html modified for ServiceNow compatibility');

