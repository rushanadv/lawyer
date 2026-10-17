import { spawn } from 'child_process';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9230;

async function calibrate() {
  const p = spawn(CHROME_PATH, ['--headless=new', '--remote-debugging-port=' + PORT, 'about:blank']);
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

  await call('Page.enable');
  await call('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  // Wait for React and STLs to mount
  await new Promise(r => setTimeout(r, 3000));

  // Inspect the 3D scene objects and bounding boxes
  const inspectRes = await call('Runtime.evaluate', {
    expression: `
      (() => {
        const d = window.__LEX_3D__;
        if (!d) return { error: "no __LEX_3D__" };
        const THREE = window.__LEX_3D__.sceneData.scene.constructor;
        
        const info = {
          camPos: [d.camera.position.x, d.camera.position.y, d.camera.position.z],
          camFov: d.camera.fov,
          children: d.sceneData.scene.children.map(c => ({
            type: c.type,
            name: c.name,
            pos: [c.position.x, c.position.y, c.position.z],
            rot: [c.rotation.x, c.rotation.y, c.rotation.z],
            childrenCount: c.children.length
          }))
        };
        return info;
      })()
    `,
    returnByValue: true
  });

  console.log('3D SCENE INSPECT:', JSON.stringify(inspectRes.result.value, null, 2));

  // Try different candidate camera positions:
  const testAngles = [
    { name: 'angle_front_3q', pos: [3.8, 3.2, 5.2], target: [0, 0.9, 0.6], fov: 38 },
    { name: 'angle_wide_front', pos: [2.0, 2.8, 6.0], target: [0, 0.9, 0.6], fov: 36 },
    { name: 'angle_side_high', pos: [4.8, 3.5, 3.5], target: [0, 0.9, 0.6], fov: 38 },
    { name: 'angle_hero_balanced', pos: [3.2, 2.6, 5.5], target: [0, 0.85, 0.6], fov: 36 }
  ];

  for (const a of testAngles) {
    await call('Runtime.evaluate', {
      expression: `
        (() => {
          const d = window.__LEX_3D__;
          if (!d) return;
          d.camera.fov = ${a.fov};
          d.camera.position.set(${a.pos.join(',')});
          d.camera.lookAt(${a.target.join(',')});
          d.camera.updateProjectionMatrix();
        })()
      `
    });
    await new Promise(r => setTimeout(r, 400));
    const screenshot = await call('Page.captureScreenshot', { format: 'png' });
    const outPath = `/Users/rushanadvani/.gemini/antigravity-ide/brain/876273ed-e904-4f17-8c86-ddbabf2ecace/${a.name}.png`;
    fs.writeFileSync(outPath, Buffer.from(screenshot.data, 'base64'));
    console.log(`Saved ${a.name}.png (${(screenshot.data.length / 1024).toFixed(1)} KB)`);
  }

  p.kill();
  process.exit(0);
}

calibrate().catch(err => {
  console.error(err);
  process.exit(1);
});
