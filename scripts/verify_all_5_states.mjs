import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9245;

async function verify() {
  console.log('Starting Headless Chrome for 5-state visual verification...');
  // Clean temp profile if exists
  const tempProfile = '/tmp/chrome_verif_' + Date.now();
  const p = spawn(CHROME_PATH, [
    '--headless',
    '--remote-debugging-port=' + PORT,
    '--window-size=1440,900',
    '--user-data-dir=' + tempProfile,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(r => r.json());
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  function call(method, params = {}) {
    return new Promise(res => {
      const id = Math.floor(Math.random() * 1000000);
      const listener = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === id) {
          ws.removeEventListener('message', listener);
          res(msg.result);
        }
      };
      ws.addEventListener('message', listener);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await call('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await call('Page.enable');
  console.log('Navigating to http://127.0.0.1:5173/ ...');
  await call('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  
  // Wait for 3D scene, models, and textures to initialize
  await new Promise(r => setTimeout(r, 3500));

  // Clear sessionStorage to guarantee fresh session
  await call('Runtime.evaluate', {
    expression: 'sessionStorage.clear();'
  });

  const states = [
    { name: 'state_1_suspended', progress: 0.00, title: 'State 1: Gavel Suspended' },
    { name: 'state_2_raised', progress: 0.38, title: 'State 2: Gavel Fully Raised' },
    { name: 'state_3_halfway_strike', progress: 0.52, title: 'State 3: Gavel Halfway Through Downward Swing' },
    { name: 'state_4_contact_impact', progress: 0.58, title: 'State 4: Gavel Making Contact with Sound Block' },
    { name: 'state_5_settled_headline', progress: 0.72, title: 'State 5: Gavel Settled with Headline Visible' }
  ];

  for (const st of states) {
    console.log(`Setting ${st.title} (progress = ${st.progress})...`);
    await call('Runtime.evaluate', {
      expression: `
        (() => {
          const container = document.getElementById('cinematic-hero-container');
          if (container) {
            const total = container.offsetHeight - window.innerHeight;
            window.scrollTo(0, container.offsetTop + total * ${st.progress});
            window.dispatchEvent(new Event('scroll'));
          }
        })()
      `
    });

    // Wait for frame rendering
    await new Promise(r => setTimeout(r, 800));

    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, `${st.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    const sizeKb = (Buffer.from(screenshot.data, 'base64').length / 1024).toFixed(1);
    console.log(`  ✓ Captured ${st.name}.png (${sizeKb} KB)`);
  }

  console.log('All 5 states captured successfully!');
  p.kill();
  process.exit(0);
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
