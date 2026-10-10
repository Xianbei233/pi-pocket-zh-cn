// Run smokeTest()'s body with the Browser tool's evaluate on the ISOLATED test server only.
// No API mutations: renders detached content and briefly opens local UI sheets.
export async function smokeTest() {
  const { html } = await import("/ui.js");
  const { render } = await import("preact");
  const { store, openSheet, closeSheet } = await import("/store.js");
  const assert = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const results = [];
  const host = document.createElement("div");
  const collisions = [
    "Menu",
    "Files",
    "Copy",
    "Today",
    "4m",
    "owner",
    "toString",
  ];
  for (const value of collisions) {
    render(
      html`<div title=${value} aria-label=${value}>
        <span>${value}</span><code>${value}</code>
      </div>`,
      host,
    );
    assert(host.textContent === value + value, `Content changed: ${value}`);
    assert(host.firstChild.title === value, `Title changed: ${value}`);
    assert(
      host.firstChild.getAttribute("aria-label") === value,
      `Attribute changed: ${value}`,
    );
  }
  render(null, host);
  results.push(
    "PASS: exact-label collisions remain unchanged in dynamic children and attributes",
  );
  assert(
    document.documentElement.lang === "zh-CN",
    "Document lang is not zh-CN",
  );
  results.push("PASS: document language is zh-CN");
  const tick = () => new Promise((resolve) => setTimeout(resolve, 250));
  const previous = store.state.sheet;
  try {
    openSheet({ type: "menu" });
    await tick();
    const menu = document.querySelector('[role="dialog"]')?.textContent ?? "";
    for (const text of ["外观", "扩展", "模型提供方", "退出登录", "重命名"]) {
      assert(menu.includes(text), `Missing translated menu label: ${text}`);
    }
    results.push("PASS: main menu Chinese labels");
    openSheet({ type: "appearance" });
    await tick();
    const appearance =
      document.querySelector('[role="dialog"]')?.textContent ?? "";
    for (const text of ["外观", "主题", "布局与动效", "字号"]) {
      assert(appearance.includes(text), `Missing appearance label: ${text}`);
    }
    results.push("PASS: appearance Chinese labels");
    assert(
      document.documentElement.scrollWidth <= innerWidth,
      "Page overflows viewport horizontally",
    );
    results.push(
      `PASS: no page horizontal overflow at ${innerWidth}×${innerHeight}`,
    );
  } finally {
    if (previous) openSheet(previous);
    else closeSheet();
  }
  return results;
}
