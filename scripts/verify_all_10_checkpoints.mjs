import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9247;

async function verifyAll10() {
  console.log('Starting Headless Chrome for 10 Mandatory Visual Checkpoints...');
  const tempProfile = '/tmp/chrome_10_' + Date.now();
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
  
  // Wait for 3D fonts, geometries, shaders and assets to compile
  await new Promise(r => setTimeout(r, 4000));

  // Clear sessionStorage
  await call('Runtime.evaluate', { expression: 'sessionStorage.clear();' });

  const checkpoints = [
    {
      name: 'checkpoint_1_gavel_macro',
      title: '1. Gavel Macro Close-up',
      scrollFn: `
        window.scrollTo(0, 0);
        window.dispatchEvent(new Event('scroll'));
      `
    },
    {
      name: 'checkpoint_2_gavel_raised',
      title: '2. Gavel Raised',
      scrollFn: `
        const gavelHero = document.getElementById('cinematic-hero-container');
        if (gavelHero) {
          window.scrollTo(0, gavelHero.offsetTop + (gavelHero.offsetHeight - window.innerHeight) * 0.44);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_3_gavel_contact',
      title: '3. Gavel Contact with Sound Block',
      scrollFn: `
        const gavelHero = document.getElementById('cinematic-hero-container');
        if (gavelHero) {
          window.scrollTo(0, gavelHero.offsetTop + (gavelHero.offsetHeight - window.innerHeight) * 0.76);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_4_transition_to_typography',
      title: '4. Transition Into Typography',
      scrollFn: `
        const gavelHero = document.getElementById('cinematic-hero-container');
        if (gavelHero) {
          window.scrollTo(0, gavelHero.offsetTop + (gavelHero.offsetHeight - window.innerHeight) * 0.98);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_5_justice_readable',
      title: '5. JUSTICE Fully Readable',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.12);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_6_passing_justice',
      title: '6. Camera Passing Between JUSTICE Letters',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.20);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_7_access_readable',
      title: '7. ACCESS Fully Readable',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.38);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_8_passing_access',
      title: '8. Camera Passing Between ACCESS Letters',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.49);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_9_clarity_readable',
      title: '9. CLARITY Fully Readable',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.72);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_10_marketplace_transition',
      title: '10. Final Marketplace Transition',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.95);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    }
  ];

  for (const cp of checkpoints) {
    console.log(`Setting ${cp.title}...`);
    await call('Runtime.evaluate', { expression: `(() => { ${cp.scrollFn} })()` });

    // Wait for frame updates
    await new Promise(r => setTimeout(r, 1200));

    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, `${cp.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    const sizeKb = (Buffer.from(screenshot.data, 'base64').length / 1024).toFixed(1);
    console.log(`  ✓ Captured ${cp.name}.png (${sizeKb} KB)`);
  }

  console.log('\nAll 10 checkpoints captured successfully!');
  p.kill();
  process.exit(0);
}

verifyAll10().catch(err => {
  console.error(err);
  process.exit(1);
});
