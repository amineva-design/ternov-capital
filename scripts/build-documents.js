// Собирает data/documents.json из файлов в папке files/.
// Название документа = имя файла (подчёркивания и дефисы заменяются пробелами).
// Запускается автоматически при каждой публикации (см. .github/workflows/deploy.yml).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'files');
const allowed = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'odt', 'rtf', 'txt', 'zip'];

const docs = fs.readdirSync(dir)
  .filter((name) => !name.startsWith('.'))
  .map((name) => {
    const ext = path.extname(name).slice(1).toLowerCase();
    return { name, ext, stat: fs.statSync(path.join(dir, name)) };
  })
  .filter((f) => f.stat.isFile() && allowed.includes(f.ext))
  .sort((a, b) => a.name.localeCompare(b.name, 'ru', { numeric: true }))
  .map(({ name, ext, stat }) => ({
    title: path.basename(name, path.extname(name)).replace(/^\d+[._\s-]+/, '').replace(/[_-]+/g, ' ').trim(),
    ext,
    size: stat.size,
    url: 'files/' + encodeURIComponent(name),
  }));

fs.writeFileSync(path.join(root, 'data', 'documents.json'), JSON.stringify(docs, null, 2) + '\n');
console.log(`documents.json: ${docs.length} файл(ов)`);
