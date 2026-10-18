import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9248;

async function verifyLegalPapers() {
  console.log('Starting Headless Chrome for Legal Papers Sequence Verification...');
  const tempProfile = '/tmp/chrome_papers_' + Date.now();
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
  
  // Wait for 3D shaders, textures, and geometry
  await new Promise(r => setTimeout(r, 4500));
  await call('Runtime.evaluate', { expression: 'sessionStorage.clear();' });

  const checkpoints = [
    {
      name: 'paper_cp1_gavel_macro',
      title: '1. Elevated Gavel Macro (36 deg anamorphic, seamless desk)',
      scrollFn: `
        window.scrollTo({ top: 0, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      `
    },
    {
      name: 'paper_cp2_gavel_impact',
      title: '2. Gavel Flush Impact on Sound Block',
      scrollFn: `
        const hero = document.getElementById('cinematic-hero-container');
        if (hero) {
          const target = hero.offsetTop + (hero.offsetHeight - window.innerHeight) * 0.76;
          window.scrollTo({ top: target, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        }
      `
    },
    {
      name: 'paper_cp3_first_paper_emergence',
      title: '3. Emergence of Floating Legal Papers from Darkness',
      scrollFn: `
        const paperSec = document.getElementById('legal-papers-section');
        if (paperSec) {
          const target = paperSec.offsetTop + (paperSec.offsetHeight - window.innerHeight) * 0.22;
          window.scrollTo({ top: target, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
          if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.22);
        }
      `
    },
    {
      name: 'paper_cp4_field_flight',
      title: '4. Camera Flying Through Document Field',
      scrollFn: `
        const paperSec = document.getElementById('legal-papers-section');
        if (paperSec) {
          const target = paperSec.offsetTop + (paperSec.offsetHeight - window.innerHeight) * 0.45;
          window.scrollTo({ top: target, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
          if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.45);
        }
      `
    },
    {
      name: 'paper_cp5_hero_redacted_evidence',
      title: '5. Redacted Settlement & Stamped Evidence in Flight',
      scrollFn: `
        const paperSec = document.getElementById('legal-papers-section');
        if (paperSec) {
          const target = paperSec.offsetTop + (paperSec.offsetHeight - window.innerHeight) * 0.62;
          window.scrollTo({ top: target, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
          if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.62);
        }
      `
    },
    {
      name: 'paper_cp6_typographic_climax',
      title: '6. Climax Typographic Reveal: Find Counsel. Not Chaos.',
      scrollFn: `
        const paperSec = document.getElementById('legal-papers-section');
        if (paperSec) {
          const target = paperSec.offsetTop + (paperSec.offsetHeight - window.innerHeight) * 0.88;
          window.scrollTo({ top: target, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
          if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.88);
        }
      `
    },
    {
      name: 'paper_cp7_manifesto_transition',
      title: '7. Transition into 3D Typographic Manifesto (JUSTICE)',
      scrollFn: `
        const manifesto = document.getElementById('manifesto-section');
        if (manifesto) {
          const target = manifesto.offsetTop + (manifesto.offsetHeight - window.innerHeight) * 0.12;
          window.scrollTo({ top: target, behavior: 'instant' });
          window.dispatchEvent(new Event('scroll'));
        }
      `
    }
  ];

  for (const cp of checkpoints) {
    console.log(`Setting ${cp.title}...`);
    const evalRes = await call('Runtime.evaluate', {
      expression: `(() => {
        try {
          ${cp.scrollFn}
          return {
            scrollY: window.scrollY,
            camZ: window.__LEX_PAPERS_3D__?.camera?.position?.z?.toFixed(1),
            hud: document.querySelector('#legal-papers-section span.font-mono')?.innerText
          };
        } catch (e) {
          return { error: e.message };
        }
      })()`,
      returnByValue: true
    });
    console.log(`  State:`, evalRes.result?.value);

    // Wait for frame rendering and fluid animations
    await new Promise(r => setTimeout(r, 1200));

    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, `${cp.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    const sizeKb = (Buffer.from(screenshot.data, 'base64').length / 1024).toFixed(1);
    console.log(`  ✓ Captured ${cp.name}.png (${sizeKb} KB)`);
  }

  console.log('\nAll legal papers sequence checkpoints captured successfully!');
  p.kill();
  process.exit(0);
}

verifyLegalPapers().catch(err => {
  console.error(err);
  process.exit(1);
});
