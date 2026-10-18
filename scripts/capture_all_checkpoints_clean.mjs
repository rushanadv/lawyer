import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9267;

async function run() {
  console.log('Launching headless Chrome on port ' + PORT + '...');
  const p = spawn(CHROME_PATH, [
    '--headless',
    '--remote-debugging-port=' + PORT,
    '--window-size=1440,900',
    '--user-data-dir=/tmp/cap_' + Date.now(),
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

  await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await new Promise(r => setTimeout(r, 5000));

  const checkpoints = [
    {
      name: 'paper_cp1_gavel_macro',
      desc: '1. Gavel Macro Reveal (36 deg anamorphic, seamless desk blotter)',
      action: () => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      }
    },
    {
      name: 'paper_cp2_gavel_impact',
      desc: '2. Gavel Flush Strike on Sound Block',
      action: () => {
        const hero = document.getElementById('cinematic-hero-container');
        const target = hero ? hero.offsetTop + (hero.offsetHeight - window.innerHeight) * 0.76 : 1710;
        window.scrollTo({ top: target, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
      }
    },
    {
      name: 'paper_cp3_first_paper_emergence',
      desc: '3. Emergence of Floating Legal Papers from Darkness',
      action: () => {
        const pSec = document.getElementById('legal-papers-section');
        const target = pSec ? pSec.offsetTop + (pSec.offsetHeight - window.innerHeight) * 0.15 : 3528;
        window.scrollTo({ top: target, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
        if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.15);
      }
    },
    {
      name: 'paper_cp4_field_flight',
      desc: '4. Camera Flying Through 3D Document Field',
      action: () => {
        const pSec = document.getElementById('legal-papers-section');
        const target = pSec ? pSec.offsetTop + (pSec.offsetHeight - window.innerHeight) * 0.45 : 4284;
        window.scrollTo({ top: target, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
        if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.45);
      }
    },
    {
      name: 'paper_cp5_hero_redacted_evidence',
      desc: '5. Hero Redacted Settlement & Stamped Evidence in Flight',
      action: () => {
        const pSec = document.getElementById('legal-papers-section');
        const target = pSec ? pSec.offsetTop + (pSec.offsetHeight - window.innerHeight) * 0.65 : 4788;
        window.scrollTo({ top: target, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
        if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.65);
      }
    },
    {
      name: 'paper_cp6_typographic_climax',
      desc: '6. Climax Typographic Reveal: Find Counsel. Not Chaos.',
      action: () => {
        const pSec = document.getElementById('legal-papers-section');
        const target = pSec ? pSec.offsetTop + (pSec.offsetHeight - window.innerHeight) * 0.88 : 5367;
        window.scrollTo({ top: target, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
        if (window.__LEX_PAPERS_3D__) window.__LEX_PAPERS_3D__.setProgress(0.88);
      }
    },
    {
      name: 'paper_cp7_manifesto_transition',
      desc: '7. Transition into 3D Typographic Manifesto (JUSTICE)',
      action: () => {
        const man = document.getElementById('manifesto-section');
        const target = man ? man.offsetTop + (man.offsetHeight - window.innerHeight) * 0.12 : 6948;
        window.scrollTo({ top: target, behavior: 'instant' });
        window.dispatchEvent(new Event('scroll'));
        if (window.__TYPO_MANIFESTO_3D__) window.__TYPO_MANIFESTO_3D__.setProgress(0.12);
      }
    }
  ];

  for (const cp of checkpoints) {
    console.log(`\nEvaluating: ${cp.desc}...`);
    const actStr = cp.action.toString();
    const evalRes = await call('Runtime.evaluate', {
      expression: `(() => {
        (${actStr})();
        return {
          scrollY: window.scrollY,
          hud: document.querySelector('#legal-papers-section span.font-mono')?.innerText,
          manifestoWord: document.querySelector('#manifesto-section span.font-mono')?.innerText
        };
      })()`,
      returnByValue: true
    });
    console.log('  State immediately after eval:', evalRes.result?.value);

    // Wait 1.5 seconds for fluid Three.js render loop and React reconciliation
    await new Promise(r => setTimeout(r, 1500));

    const checkDom = await call('Runtime.evaluate', {
      expression: `(() => ({
        scrollY: window.scrollY,
        hud: document.querySelector('#legal-papers-section span.font-mono')?.innerText,
        hasClimaxTitle: Array.from(document.querySelectorAll('h2')).some(h => h.innerText.includes('Find counsel')),
        manifestoWord: document.querySelector('#manifesto-section span.font-mono')?.innerText
      }))()`,
      returnByValue: true
    });
    console.log('  State after 1.5s delay:', checkDom.result?.value);

    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, `${cp.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    const size = (Buffer.from(screenshot.data, 'base64').length / 1024).toFixed(1);
    console.log(`  ✓ Saved ${cp.name}.png (${size} KB)`);
  }

  console.log('\nAll 7 checkpoints captured with clean state!');
  p.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
