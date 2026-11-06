/**
 * C++ 範例程式檢查
 * ------------------------------------------------------------------
 * 從文章抽出「完整程式」的 ```cpp 區塊（含 int main 的），用 g++ 編譯並執行，
 * 再把實際輸出和緊接在後面的 ```text 區塊（預期輸出）逐字比對。
 *
 *   - 不含 int main 的 cpp 區塊視為片段，不檢查
 *   - 完整程式後面沒有 ```text 區塊時，只檢查能否編譯、執行（exit code 0）
 *
 * g++ 來源：PATH 上有 g++ 就直接用；在 Windows 上沒有時改用 WSL 的 g++。
 * 編譯參數：-std=c++17 -Wall -Wextra -Werror（有任何警告都算失敗）
 *
 * 用法：
 *   npm run check:cpp            檢查全部文章
 *   npm run check:cpp -- array   只檢查 array.md
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ARTICLES = 'src/content/articles';
const WORK = resolve('.cache/cpp');
const only = process.argv[2];

function hasCommand(cmd, args) {
  return spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
}

const nativeGpp = hasCommand('g++', ['--version']);
const useWsl = !nativeGpp && process.platform === 'win32' && hasCommand('wsl', ['-e', 'g++', '--version']);
if (!nativeGpp && !useWsl) {
  console.error('[check-cpp] 找不到 g++（PATH 或 WSL 都沒有），無法檢查');
  process.exit(1);
}

/** Windows 路徑 → WSL 路徑：C:\Projects\x → /mnt/c/Projects/x */
const toWsl = (p) => p.replace(/^([A-Za-z]):/, (_, d) => `/mnt/${d.toLowerCase()}`).replaceAll('\\', '/');

function run(cmd, args) {
  const [c, a] = useWsl ? ['wsl', ['-e', cmd.startsWith('/') || cmd === 'g++' ? cmd : toWsl(cmd), ...args]] : [cmd, args];
  return spawnSync(c, a, { encoding: 'utf8' });
}

/** 依出現順序抽出所有 fenced code block */
function codeBlocks(markdown) {
  return [...markdown.matchAll(/^```(\w*)[^\n]*\n([\s\S]*?)^```\s*$/gm)].map((m) => ({
    lang: m[1],
    code: m[2],
  }));
}

const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trimEnd();

rmSync(WORK, { recursive: true, force: true });
mkdirSync(WORK, { recursive: true });

const files = readdirSync(ARTICLES).filter((f) => f.endsWith('.md') && (!only || f === `${only}.md`));
let total = 0;
const failures = [];

for (const file of files) {
  const blocks = codeBlocks(readFileSync(join(ARTICLES, file), 'utf8'));
  blocks.forEach((block, i) => {
    if (block.lang !== 'cpp' || !/\bint\s+main\s*\(/.test(block.code)) return;
    total++;
    const name = `${file.replace(/\.md$/, '')}-${i}`;
    const label = `${file} 第 ${i + 1} 個程式碼區塊`;
    const src = join(WORK, `${name}.cpp`);
    const bin = join(WORK, name);
    writeFileSync(src, block.code);

    const srcArg = useWsl ? toWsl(src) : src;
    const binArg = useWsl ? toWsl(bin) : bin;
    const compile = run('g++', ['-std=c++17', '-Wall', '-Wextra', '-Werror', '-O2', srcArg, '-o', binArg]);
    if (compile.status !== 0) {
      failures.push(`${label}：編譯失敗\n${compile.stderr}`);
      return;
    }

    const exec = run(useWsl ? binArg : bin, []);
    if (exec.status !== 0) {
      failures.push(`${label}：執行失敗（exit code ${exec.status}）\n${exec.stderr}`);
      return;
    }

    const next = blocks[i + 1];
    if (next && next.lang === 'text') {
      const expected = normalize(next.code);
      const actual = normalize(exec.stdout);
      if (expected !== actual) {
        failures.push(`${label}：輸出與文章中的預期輸出不同\n--- 文章寫的 ---\n${expected}\n--- 實際輸出 ---\n${actual}`);
        return;
      }
      console.log(`  ✓ ${label}（編譯、執行、輸出比對）`);
    } else {
      console.log(`  ✓ ${label}（編譯、執行；無預期輸出可比對）`);
    }
  });
}

if (failures.length > 0) {
  console.error(`\n[check-cpp] ${failures.length} 個失敗：\n`);
  for (const f of failures) console.error(`✗ ${f}\n`);
  process.exit(1);
}
console.log(`[check-cpp] OK：${total} 個完整程式全部通過（g++ via ${useWsl ? 'WSL' : 'PATH'}）`);
