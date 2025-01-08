const fs = require('fs');
const path = require('path');

const distPath = path.join(__dirname, '..', 'dist');

function updateFileNamesRecursively(dir) {
  const renamedFiles = {};

  function processDirectory(currentPath) {
    const files = fs.readdirSync(currentPath);

    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        processDirectory(filePath);
      } else if (file.endsWith('.js')) {
        const relativePath = path.relative(distPath, filePath);
        const newName = file.replace('.js', '-js');
        const newPath = path.join(currentPath, newName);
        fs.renameSync(filePath, newPath);
        renamedFiles[relativePath] = path.relative(distPath, newPath);
      }
    });
  }

  processDirectory(dir);
  return renamedFiles;
}

function updateIndexHtml(renamedFiles) {
  const indexPath = path.join(distPath, 'index.html');
  let indexContent = fs.readFileSync(indexPath, 'utf-8');

  Object.entries(renamedFiles).forEach(([oldPath, newPath]) => {
    const oldPathRegex = new RegExp(oldPath.replace(/\\/g, '/'), 'g');
    indexContent = indexContent.replace(oldPathRegex, newPath.replace(/\\/g, '/'));
  });

  fs.writeFileSync(indexPath, indexContent);
}

function postprocess() {
  const renamedFiles = updateFileNamesRecursively(distPath);
  updateIndexHtml(renamedFiles);
  console.log('Post-processing complete. Files renamed and index.html updated recursively.');
}

postprocess();

