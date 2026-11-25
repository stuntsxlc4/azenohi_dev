import { chromium } from '../../../web/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';

const [origin, output] = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal'] });
const result = { browser: browser.version(), matrix: [], memory: [] };
const metrics = async (cdp) =>
  Object.fromEntries(
    (await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]),
  );
const wait = (page, ms) => page.waitForTimeout(ms);

async function setup(viewport, deviceScaleFactor) {
  const page = await browser.newPage({ viewport, deviceScaleFactor });
  await page.addInitScript(() => {
    const data = (window.stage06 = {
      draws: 0,
      contexts: 0,
      lost: 0,
      resources: {},
      tasks: [],
      renders: [],
      lastDraw: -1,
    });
    const contexts = new WeakSet();
    const context = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      const gl = context.call(this, type, ...args);
      if (gl && /^webgl/.test(type) && !contexts.has(gl)) {
        contexts.add(gl);
        data.contexts++;
        const debug = gl.getExtension('WEBGL_debug_renderer_info');
        if (debug) data.renderer = gl.getParameter(debug.UNMASKED_RENDERER_WEBGL);
        this.addEventListener('webglcontextlost', (event) => {
          if (event.isTrusted) data.lost++;
        });
      }
      return gl;
    };
    const raf = window.requestAnimationFrame;
    let frame = -1;
    window.requestAnimationFrame = (callback) =>
      raf.call(window, (timestamp) => {
        frame = timestamp;
        callback(timestamp);
      });
    for (const name of [
      'drawElements',
      'drawArrays',
      'drawElementsInstanced',
      'drawArraysInstanced',
    ]) {
      const draw = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        if (data.sample) {
          data.draws++;
          if (frame !== data.lastDraw && frame > 0) {
            data.renders.push(frame);
            data.lastDraw = frame;
          }
        }
        return draw.apply(this, args);
      };
    }
    for (const resource of [
      'Texture',
      'Buffer',
      'Program',
      'Framebuffer',
      'Renderbuffer',
      'VertexArray',
    ]) {
      data.resources[resource] = { allocated: 0, deleted: 0 };
      for (const [method, key] of [
        ['create', 'allocated'],
        ['delete', 'deleted'],
      ]) {
        const name = method + resource;
        const native = WebGL2RenderingContext.prototype[name];
        WebGL2RenderingContext.prototype[name] = function (...args) {
          const value = native.apply(this, args);
          if (value || (method === 'delete' && args[0])) data.resources[resource][key]++;
          return value;
        };
      }
    }
    new PerformanceObserver((list) =>
      data.tasks.push(
        ...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })),
      ),
    ).observe({ entryTypes: ['longtask'] });
  });
  await page.goto(origin);
  await page.locator('[data-rendered=true]').waitFor({ timeout: 15000 });
  result.renderer = await page.evaluate(() => window.stage06.renderer);
  return page;
}
const nav = (page, name) => page.getByRole('navigation').getByRole('link', { name, exact: true });
const click = (locator) => locator.evaluate((el) => el.click());
const tick = async (page, ms, action) => {
  await page.evaluate((ms) => {
    const data = window.stage06;
    const callbacks = [];
    data.draws = 0;
    data.renders = [];
    data.lastDraw = -1;
    data.sample = true;
    const start = performance.now();
    data.result = new Promise((resolve) => {
      function sample(t) {
        callbacks.push(t);
        if (performance.now() - start < ms) requestAnimationFrame(sample);
        else {
          data.sample = false;
          const intervals = (timestamps) => {
            const values = timestamps
              .slice(1)
              .map((v, i) => v - timestamps[i])
              .sort((a, b) => a - b);
            if (!values.length) return null;
            const quantile = (p) => values[Math.ceil(values.length * p) - 1];
            return {
              fps: (1000 * values.length) / values.reduce((a, b) => a + b, 0),
              median: quantile(0.5),
              p95: quantile(0.95),
              p99: quantile(0.99),
              longest: values.at(-1),
              over33: values.filter((v) => v > 33.3).length,
              intervals: values.length,
            };
          };
          resolve({
            raf: intervals(callbacks),
            webgl: intervals(data.renders),
            drawFrames: data.renders.length,
            drawCalls: data.draws,
            drawsPerFrame: data.renders.length ? data.draws / data.renders.length : 0,
            longTasks: data.tasks.filter((task) => task.startTime >= start),
            heap: performance.memory?.usedJSHeapSize,
            canvasWidth: document.querySelector('canvas')?.width,
            dpr: devicePixelRatio,
          });
        }
      }
      requestAnimationFrame(sample);
    });
  }, ms);
  const start = Date.now();
  if (action) await action();
  const actionMs = action ? Date.now() - start : null;
  return { ...(await page.evaluate(() => window.stage06.result)), actionMs };
};

try {
  for (const [width, height, dpr] of [
    [2560, 1440, 1],
    [1920, 1080, 1],
    [1440, 900, 1],
    [1440, 900, 2],
    [768, 1024, 1],
    [390, 844, 2],
  ]) {
    const page = await setup({ width, height }, dpr);
    const entry = { width, height, dpr, samples: {} };
    await wait(page, 8000);
    const collect = async (name) => {
      await wait(page, 300);
      entry.samples[name] = [];
      for (let i = 0; i < 3; i++) entry.samples[name].push(await tick(page, 1400));
    };
    await collect('home');
    await click(nav(page, 'Team'));
    await collect('team');
    await click(nav(page, 'Projects'));
    await collect('projects');
    await click(page.getByRole('link', { name: /CapTrace/ }));
    await collect('captrace');
    entry.samples.spaceToMountain = [];
    entry.samples.mountainToSpace = [];
    for (let i = 0; i < 3; i++) {
      entry.samples.spaceToMountain.push(await tick(page, 1450, () => click(nav(page, 'Journey'))));
      if (!i) await collect('journey');
      entry.samples.mountainToSpace.push(await tick(page, 1450, () => click(nav(page, 'Home'))));
      await page.locator('[data-rendered=true]').waitFor({ timeout: 15000 });
    }
    result.matrix.push(entry);
    await writeFile(output, JSON.stringify(result, null, 2));
    console.log('matrix', width, height, dpr);
    await page.close();
  }
  const page = await setup({ width: 1920, height: 1080 }, 1);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  async function sample(cycle) {
    await cdp.send('HeapProfiler.collectGarbage');
    const { JSHeapUsedSize, JSEventListeners, Nodes } = await metrics(cdp);
    return {
      cycle,
      JSHeapUsedSize,
      JSEventListeners,
      Nodes,
      ...(await page.evaluate(() => ({
        resources: window.stage06.resources,
        canvas: document.querySelectorAll('canvas').length,
        contexts: window.stage06.contexts,
        lost: window.stage06.lost,
      }))),
    };
  }
  result.memory.push(await sample(0));
  const canvasCounts = [];
  for (let i = 1; i <= 20; i++) {
    await click(nav(page, 'Team'));
    await click(nav(page, 'Projects'));
    await click(page.getByRole('link', { name: /CapTrace/ }));
    await click(page.getByRole('link', { name: /Back to projects/i }).first());
    await click(page.getByRole('link', { name: /Risk Miner/ }));
    await click(nav(page, 'Journey'));
    await wait(page, 1000);
    canvasCounts.push(await page.locator('canvas').count());
    await click(nav(page, 'Home'));
    await page.locator('[data-rendered=true]').waitFor({ timeout: 15000 });
    if (i % 5 === 0) result.memory.push(await sample(i));
  }
  result.journeyCanvasCounts = canvasCounts;
  await writeFile(output, JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
