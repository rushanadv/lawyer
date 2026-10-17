import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9223;

async function run() {
  console.log('Starting Headless Chrome for visual verification...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--disable-gpu=false',
    '--window-size=1440,900',
    '--hide-scrollbars',
    'http://127.0.0.1:5173/'
  ]);

  // Wait for CDP to be available
  await new Promise(r => setTimeout(r, 2000));

  // Get WebSocket URL from http://127.0.0.1:9223/json/list
  const targets = await fetch(`http://127.0.0.1:${PORT}/json/list`).then(res => res.json());
  const pageTarget = targets.find(t => t.url && t.url.includes('5173'));
  if (!pageTarget) {
    console.error('No page target found matching 5173! Available targets:', targets.map(t => t.url));
    chromeProcess.kill();
    process.exit(1);
  }

  console.log('Connected to target:', pageTarget.title, pageTarget.webSocketDebuggerUrl);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg);
      callbacks.delete(msg.id);
    }
  };

  await new Promise((resolve) => ws.onopen = resolve);

  function sendCommand(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      callbacks.set(id, (msg) => resolve(msg.result));
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  // Enable Page and Runtime
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  // Wait for assets to fully load (STL + textures)
  console.log('Waiting for 3D scene and STLs to initialize...');
  await new Promise(r => setTimeout(r, 3000));

  // Define the 5 mandatory states to capture:
  const states = [
    { name: 'state_1_suspended', scrollProgress: 0.00, label: '1. Gavel Suspended' },
    { name: 'state_2_raised', scrollProgress: 0.38, label: '2. Gavel Fully Raised' },
    { name: 'state_3_halfway_strike', scrollProgress: 0.52, label: '3. Gavel Halfway Through Downward Swing' },
    { name: 'state_4_contact_impact', scrollProgress: 0.59, label: '4. Gavel Making Contact with Sound Block' },
    { name: 'state_5_settled_headline', scrollProgress: 0.76, label: '5. Gavel Settled with Headline Visible' }
  ];

  for (const st of states) {
    console.log(`Setting up ${st.label} (scrollProgress = ${st.scrollProgress})...`);
    
    // Evaluate scroll position
    await sendCommand('Runtime.evaluate', {
      expression: `
        (() => {
          const container = document.getElementById('cinematic-hero-container');
          if (container) {
            const totalScrollable = container.offsetHeight - window.innerHeight;
            const targetY = container.offsetTop + totalScrollable * ${st.scrollProgress};
            window.scrollTo(0, targetY);
            window.dispatchEvent(new Event('scroll'));
          }
        })()
      `
    });

    // Allow render loop to process 5 frames
    await new Promise(r => setTimeout(r, 600));

    // Capture screenshot
    const res = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const outPath = path.join(ARTIFACT_DIR, `${st.name}.png`);
    fs.writeFileSync(outPath, Buffer.from(res.data, 'base64'));
    console.log(`  ✓ Saved ${st.name}.png (${(res.data.length * 0.75 / 1024).toFixed(1)} KB)`);
  }

  console.log('All 5 states captured successfully.');
  ws.close();
  chromeProcess.kill();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
