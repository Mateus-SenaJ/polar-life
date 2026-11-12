import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(RAIZ, 'site', 'assets', 'vendor');

const ARQUIVOS = [
  ['node_modules/pdf-lib/dist/pdf-lib.min.js', 'pdf-lib.min.js'],
  ['node_modules/@pdf-lib/fontkit/dist/fontkit.umd.min.js', 'fontkit.umd.min.js'],
];

async function copiarSemMapa(origem, destino) {
  const texto = await readFile(join(RAIZ, origem), 'utf8');
  const limpo = texto.replace(/\/\/# sourceMappingURL=.*$/gm, '').replace(/\n+$/g, '') + '\n';
  await writeFile(join(DEST, destino), limpo);
  return limpo.length;
}

async function main() {
  await mkdir(DEST, { recursive: true });
  for (const [origem, destino] of ARQUIVOS) {
    const tamanho = await copiarSemMapa(origem, destino);
    console.log(`✔ ${destino} (${Math.round(tamanho / 1024)} KB)`);
  }

  const pdfLib = await readFile(join(RAIZ, 'node_modules/pdf-lib/LICENSE.md'), 'utf8');
  const fontkitPkg = JSON.parse(await readFile(join(RAIZ, 'node_modules/@pdf-lib/fontkit/package.json'), 'utf8'));
  const licencas = [
    'Bibliotecas de terceiros usadas apenas localmente pelo PolarLive.',
    '',
    'pdf-lib',
    'https://pdf-lib.js.org/',
    'Licença MIT:',
    '',
    pdfLib.trim(),
    '',
    '@pdf-lib/fontkit',
    `Licença declarada no pacote: ${fontkitPkg.license}`,
    '',
    'O fontkit é usado por meio do pacote @pdf-lib/fontkit.',
    '',
  ].join('\n');
  await writeFile(join(DEST, 'LICENCAS.txt'), licencas);
  console.log('✔ LICENCAS.txt');
}

main().catch((erro) => {
  console.error('✘', erro.message);
  process.exit(1);
});
