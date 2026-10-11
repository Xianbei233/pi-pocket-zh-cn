// Tests the actual language pack with a throwaway app; never touches the live data.
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
if (!process.argv[2]) throw new Error('Explicit Pi Pocket source directory required');
const source = resolve(process.argv[2]);
if (!existsSync(join(source, 'web/i18n.js'))) {
    throw new Error('Target Pocket source has no web/i18n.js; uiLocales host support is required. The dictionary cannot add the host framework.');
}
const { root, cleanUp, openApp, owner, scriptedModel } = await import(pathToFileURL(join(source, 'test/helpers.ts')));
const { setUiLocales, t, currentLocale } = await import(pathToFileURL(join(source, 'web/i18n.js')));
const data = join(root, 'ui-pack');
mkdirSync(join(data, 'extensions'), { recursive: true });
copyFileSync(fileURLToPath(new URL('./zh-cn-ui.ts', import.meta.url)), join(data, 'extensions/zh-cn-ui.ts'));
let app;
try {
    app = await openApp(scriptedModel(), data);
    assert.deepEqual(app.loader.uiLocales(), []);
    await app.setExtensionEnabled(owner(app), 'zh-cn-ui.ts', true);
    const packs = (await app.hello(owner(app))).server.uiLocales;
    setUiLocales(packs);
    assert.equal(currentLocale(), 'zh-CN');
    assert.equal(t('Menu'), '菜单');
    assert.equal(t('Extensions'), '扩展');
    assert.equal(t('Listening…'), '正在聆听…');
    assert.equal(t('Ask Pi anything…'), '向 Pi 提问…');
    assert.equal(t('Queue a message for after this run…'), '排队发送消息，待本次运行结束后处理…');
    assert.equal(t('A future UI label not in this pack'), 'A future UI label not in this pack');
    assert.equal(t('switched the model to {{model}}', { model: 'Menu {{name}} / custom-model' }), '切换了模型：Menu {{name}} / custom-model');
    assert.equal(t('Back to sessions, {{count}} waiting for you', { count: 3 }), '返回会话列表，3 项待你处理');
    assert.equal(t('No model matches “{{query}}”.', { query: 'Menu' }), '没有匹配的模型：“Menu”。');
    await app.setExtensionEnabled(owner(app), 'zh-cn-ui.ts', false);
    setUiLocales((await app.hello(owner(app))).server.uiLocales);
    assert.equal(t('Menu'), 'Menu');
    assert.equal(t('Ask Pi anything…'), 'Ask Pi anything…');
    assert.equal(t('Listening…'), 'Listening…');
    assert.equal(t('Queue a message for after this run…'), 'Queue a message for after this run…');
    assert.equal(currentLocale(), 'en');
    console.log(`PASS: actual zh-cn-ui pack (${Object.keys(packs[0].strings).length} strings), default off, enable, plain parameters, disable to English`);
} finally {
    await app?.close();
    cleanUp();
}
