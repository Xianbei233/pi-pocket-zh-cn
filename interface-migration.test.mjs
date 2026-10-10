import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

test('legacy installer refuses the new locale runtime before writing anything', async () => {
    const root = await mkdtemp(join(tmpdir(), 'zh-interface-'));
    try {
        await mkdir(join(root, 'web'));
        await writeFile(join(root, 'web/i18n.js'), 'export function setUiLocales() {}\n');
        for (const action of ['check', 'install', 'uninstall']) {
            assert.throws(() => execFileSync(process.execPath, [fileURLToPath(new URL('./install-ui.mjs', import.meta.url)), action, root], { stdio: 'pipe' }), (error) => {
                assert.match(error.stderr.toString(), /extension UI locale API/);
                return true;
            });
        }
    } finally {
        await rm(root, { recursive: true, force: true });
    }
});
