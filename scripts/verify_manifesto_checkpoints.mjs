import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9246;

async function verifyManifesto() {
  console.log('Starting Headless Chrome for Manifesto 9-Checkpoint Visual Verification...');
  const tempProfile = '/tmp/chrome_manifesto_' + Date.now();
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
      name: 'checkpoint_1_gavel_strike_complete',
      title: 'Checkpoint 1: Gavel Strike Completed & Settled',
      scrollFn: `
        const gavelHero = document.getElementById('cinematic-hero-container');
        if (gavelHero) {
          window.scrollTo(0, gavelHero.offsetTop + (gavelHero.offsetHeight - window.innerHeight) * 0.92);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_2_entering_typographic_env',
      title: 'Checkpoint 2: Camera Entering First Typographic Environment',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.04);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_3_justice_readable',
      title: 'Checkpoint 3: JUSTICE Monumental & Fully Readable',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.10);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_4_between_justice_letters',
      title: 'Checkpoint 4: Camera Midway Between JUSTICE Letters',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.25);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_5_access_distance',
      title: 'Checkpoint 5: ACCESS Visible at a Distance',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.36);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_6_passing_through_access',
      title: 'Checkpoint 6: Camera Passing Through ACCESS S-Curve',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.50);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_7_clarity_assembling',
      title: 'Checkpoint 7: CLARITY Assembling Into Alignment',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.63);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_8_final_manifesto_sentence',
      title: 'Checkpoint 8: Final Quiet Manifesto Sentence Revealed',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          window.scrollTo(0, manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.94);
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'checkpoint_9_lawyer_discovery',
      title: 'Checkpoint 9: Transition Into Lawyer Discovery & Decision Desk',
      scrollFn: `
        const desk = document.getElementById('decision-desk');
        if (desk) {
          desk.scrollIntoView({ behavior: 'instant' });
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

  console.log('\nAll 9 checkpoints captured successfully!');
  p.kill();
  process.exit(0);
}

verifyManifesto().catch(err => {
  console.error(err);
  process.exit(1);
});
