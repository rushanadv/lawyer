import * as THREE from 'three';

// Procedural Authentic Legal Document Textures for LEX VERA
// Generates high-resolution canvas textures representing real legal system artifacts:
// - Court Petitions & Briefs
// - Redacted Confidential Settlement Sheets
// - Stamped Affidavits with Notary Seals
// - Trial Evidence Docket Sheets
// - Emergency Injunction Orders

export interface LegalPaperPBR {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  type: string;
}

// Pseudo-noise for paper fibers and organic ink imperfections
function pseudoNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return n - Math.floor(n);
}

// Generate base parchment/linen paper background with fibers and aging
function renderPaperBase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  baseColor: string,
  edgeDarken = true
) {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Subtle paper fibers & grain
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * 4;
      const noise = (pseudoNoise(x * 0.15, y * 0.15) - 0.5) * 14;
      data[idx]     = Math.min(255, Math.max(0, data[idx] + noise));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + noise));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + noise));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  if (edgeDarken) {
    // Subtle antique edge vignette (paper aging)
    const grad = ctx.createRadialGradient(
      width * 0.5, height * 0.5, Math.min(width, height) * 0.35,
      width * 0.5, height * 0.5, Math.max(width, height) * 0.65
    );
    grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(0.7, 'rgba(38, 28, 18, 0.04)');
    grad.addColorStop(1, 'rgba(48, 34, 20, 0.16)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
}

// Draw a realistic slanted ink rubber stamp
function drawRubberStamp(
  ctx: CanvasRenderingContext2D,
  text: string,
  subtext: string,
  x: number,
  y: number,
  angleRad: number,
  color = '#8A1C14'
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angleRad);

  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.strokeRect(-110, -32, 220, 64);

  // Inner double border
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-104, -26, 208, 52);

  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px "Courier New", Courier, monospace';
  ctx.fillText(text, 0, -6);

  if (subtext) {
    ctx.font = 'bold 10px "Courier New", Courier, monospace';
    ctx.fillText(subtext, 0, 14);
  }

  // Stamp ink distress texture
  ctx.fillStyle = 'rgba(245, 240, 230, 0.25)';
  for (let i = 0; i < 40; i++) {
    const rx = (Math.random() - 0.5) * 210;
    const ry = (Math.random() - 0.5) * 60;
    ctx.fillRect(rx, ry, Math.random() * 4 + 1, Math.random() * 3 + 1);
  }

  ctx.restore();
}

// Draw authentic fountain pen signature flourish
function drawSignature(ctx: CanvasRenderingContext2D, x: number, y: number, color = '#1a2436') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.bezierCurveTo(x + 25, y - 28, x + 40, y + 14, x + 65, y - 18);
  ctx.bezierCurveTo(x + 85, y - 32, x + 95, y + 8, x + 125, y - 6);
  ctx.bezierCurveTo(x + 140, y - 12, x + 160, y + 2, x + 185, y - 2);
  ctx.stroke();

  // Signature flourish loop
  ctx.beginPath();
  ctx.lineWidth = 1.2;
  ctx.moveTo(x + 185, y - 2);
  ctx.bezierCurveTo(x + 210, y - 8, x + 230, y + 16, x + 130, y + 14);
  ctx.bezierCurveTo(x + 60, y + 12, x + 40, y - 35, x + 85, y - 40);
  ctx.stroke();

  ctx.restore();
}

// Draw embossed notary gold/wax seal
function drawEmbossedSeal(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  // Outer scalloped gold ring
  ctx.fillStyle = '#C89B53';
  ctx.beginPath();
  ctx.arc(0, 0, 42, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#A37936';
  ctx.beginPath();
  ctx.arc(0, 0, 37, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#C89B53';
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.fill();

  // Central Justice emblem
  ctx.strokeStyle = '#5E441B';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, 26, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#5E441B';
  ctx.font = 'bold 8px "Times New Roman", serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFICIAL SEAL', 0, -8);
  ctx.fillText('NOTARY PUBLIC', 0, 2);
  ctx.fillText('COMMISSION #4819', 0, 12);

  ctx.restore();
}

// Draw black permanent marker redaction bars
function drawRedactionBars(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  lengths: number[],
  lineHeight = 22
) {
  ctx.save();
  ctx.fillStyle = '#141414';
  lengths.forEach((len, i) => {
    const rx = x + (i % 2 === 0 ? 0 : 25);
    const ry = y + i * lineHeight;
    // Slight uneven felt-tip marker edges
    ctx.fillRect(rx, ry - 12, len, 15);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.92)';
    ctx.fillRect(rx - 2, ry - 11, len + 4, 13);
    ctx.fillStyle = '#141414';
  });
  ctx.restore();
}

// 1. SUPREME COURT BRIEF / PETITION FOR WRIT
export function createPetitionBriefTexture(): LegalPaperPBR {
  const width = 1024;
  const height = 1448; // Classic US Legal / A4 ratio ~1:1.414

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  renderPaperBase(ctx, width, height, '#F6F2E9');

  // Blue Legal Margin Line on left
  ctx.strokeStyle = 'rgba(180, 50, 50, 0.28)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(110, 0);
  ctx.lineTo(110, height);
  ctx.stroke();

  // Document Header
  ctx.fillStyle = '#181614';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
  ctx.fillText('IN THE SUPREME COURT OF THE UNITED STATES', width * 0.5 + 30, 130);

  ctx.font = 'italic 16px "Times New Roman", Georgia, serif';
  ctx.fillText('OCTOBER TERM, 2026', width * 0.5 + 30, 160);

  ctx.font = 'bold 15px "Times New Roman", Georgia, serif';
  ctx.fillText('No. 26-11849', width * 0.5 + 30, 195);

  ctx.strokeStyle = '#181614';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(width * 0.35, 215);
  ctx.lineTo(width * 0.65, 215);
  ctx.stroke();

  ctx.font = 'bold 20px "Times New Roman", Georgia, serif';
  ctx.fillText('PETITION FOR A WRIT OF CERTIORARI', width * 0.5 + 30, 255);

  // Paragraph Text simulation (neat typographical blocks)
  ctx.textAlign = 'left';
  ctx.font = '14px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#262420';

  const paragraphs = [
    'QUESTION PRESENTED: Whether commercial arbitration clauses preclude interlocutory appeal when systemic judicial misconduct is documented under 28 U.S.C. § 1292(b).',
    'TABLE OF AUTHORITIES: The petitioner respectfully submits this brief in furtherance of constitutional jurisprudence governing equal access to specialized trial counsel.',
    'STATEMENT OF THE CASE: On October 4, 2025, the Appellate Division entered final summary judgment without oral argument or consideration of submitted expert testimony.',
    'ARGUMENT: Exceptional circumstances demand review where lower courts systematically misapply precedent regarding adversarial discovery rights in high-stakes dispute resolution.',
    'CONCLUSION: For the foregoing reasons, the petition for a writ of certiorari should be granted by this Honorable Court.'
  ];

  let currentY = 320;
  paragraphs.forEach((p) => {
    ctx.font = 'bold 13px "Times New Roman", Georgia, serif';
    ctx.fillText(p.slice(0, 24), 160, currentY);
    ctx.font = '13.5px "Times New Roman", Georgia, serif';
    
    // Simulating full justified lines of legal prose
    for (let l = 0; l < 4; l++) {
      currentY += 24;
      const fakeLine = 'The integrity of judicial determination necessitates rigorous scrutiny of evidentiary records and procedural safeguards established by sovereign decree.';
      ctx.fillText(fakeLine, 160, currentY);
    }
    currentY += 45;
  });

  // Rubber stamp: FILED
  drawRubberStamp(ctx, 'FILED', 'OCTOBER 18, 2026', width - 240, 160, -0.14, '#94221A');

  // Signatures at bottom
  ctx.font = '12px "Times New Roman", Georgia, serif';
  ctx.fillText('Respectfully submitted,', 160, height - 240);
  drawSignature(ctx, 160, height - 190, '#1B2333');
  ctx.fillText('Counsel of Record for Petitioner', 160, height - 130);
  ctx.fillText('LEX VERA LITIGATION PARTNERS LLP', 160, height - 110);

  // Embossed Seal
  drawEmbossedSeal(ctx, width - 200, height - 160);

  return buildMaps(canvas, 'PETITION_BRIEF');
}

// 2. REDACTED SETTLEMENT AGREEMENT
export function createRedactedSettlementTexture(): LegalPaperPBR {
  const width = 1024;
  const height = 1448;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  renderPaperBase(ctx, width, height, '#ECE6D8');

  // Header
  ctx.fillStyle = '#141412';
  ctx.textAlign = 'center';
  ctx.font = 'bold 24px "Times New Roman", Georgia, serif';
  ctx.fillText('CONFIDENTIAL SETTLEMENT AGREEMENT', width * 0.5, 120);
  ctx.font = 'bold 15px "Times New Roman", Georgia, serif';
  ctx.fillText('AND GENERAL MUTUAL RELEASE OF ALL CLAIMS', width * 0.5, 150);

  ctx.strokeStyle = '#282420';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(180, 175);
  ctx.lineTo(width - 180, 175);
  ctx.stroke();

  // Redaction Stamp
  drawRubberStamp(ctx, 'CONFIDENTIAL', 'SUBJECT TO PROTECTIVE ORDER', 240, 140, 0.12, '#8E1810');

  // Body text with redaction bars
  ctx.textAlign = 'left';
  ctx.font = '13.5px "Times New Roman", Georgia, serif';
  ctx.fillStyle = '#22201C';

  let y = 240;
  ctx.fillText('1. RECITALS & IDENTIFICATION OF PARTIES:', 140, y);
  y += 30;
  ctx.fillText('This Confidential Agreement is entered into by and between the undersigned claimant,', 140, y);
  y += 24;
  ctx.fillText('represented by legal counsel, and the respondent entities identified below:', 140, y);
  
  // Redacted entities
  y += 20;
  drawRedactionBars(ctx, 160, y, [380, 440, 310]);
  y += 85;

  ctx.fillText('2. SETTLEMENT CONSIDERATION & ESCROW PAYMENT:', 140, y);
  y += 30;
  ctx.fillText('In complete resolution of all disputed civil causes of action, respondent agrees to pay:', 140, y);
  y += 20;
  // Big redacted settlement amount
  drawRedactionBars(ctx, 160, y, [520, 260]);
  y += 75;

  ctx.fillText('3. NON-DISCLOSURE & ADMISSION OF LIABILITY:', 140, y);
  y += 30;
  ctx.fillText('Neither this agreement nor any payments made hereunder shall constitute an admission of', 140, y);
  y += 24;
  ctx.fillText('fault, liability, or wrongdoing. The terms of Section 4 shall remain permanently sealed.', 140, y);
  y += 20;
  drawRedactionBars(ctx, 160, y, [460, 380, 500, 290]);
  y += 120;

  ctx.fillText('IN WITNESS WHEREOF, the authorized representatives execute this covenant:', 140, y);
  y += 45;

  // Signatures
  drawSignature(ctx, 150, y + 30, '#101622');
  drawSignature(ctx, width - 360, y + 30, '#221510');

  ctx.font = '12px "Times New Roman", Georgia, serif';
  ctx.fillText('CLAIMANT REPRESENTATIVE', 150, y + 80);
  ctx.fillText('MANAGING PARTNER, COUNSEL', width - 360, y + 80);

  // Red rubber seal: EXHIBIT A
  drawRubberStamp(ctx, 'EXHIBIT A-1', 'ADMITTED IN CHANCE', width - 220, height - 180, -0.08, '#1A3F7A');

  return buildMaps(canvas, 'REDACTED_SETTLEMENT');
}

// 3. TRIAL EVIDENCE DOCKET SHEET
export function createEvidenceDocketTexture(): LegalPaperPBR {
  const width = 1024;
  const height = 1448;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  renderPaperBase(ctx, width, height, '#F2ECE0');

  // Barcode Header
  ctx.fillStyle = '#141412';
  for (let x = 140; x < 380; x += Math.random() * 6 + 2) {
    ctx.fillRect(x, 90, Math.random() * 3 + 1, 38);
  }
  ctx.font = '10px "Courier New", Courier, monospace';
  ctx.fillText('*DOC-88219-LX*', 180, 142);

  ctx.textAlign = 'right';
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillText('CASE NO: 2026-CV-09418', width - 140, 105);
  ctx.font = '12px "Courier New", Courier, monospace';
  ctx.fillText('CHAMBERS DOCKET CLERK', width - 140, 125);
  ctx.fillText('FILED IN OPEN COURT', width - 140, 142);

  ctx.strokeStyle = '#222018';
  ctx.lineWidth = 2.0;
  ctx.beginPath();
  ctx.moveTo(140, 165);
  ctx.lineTo(width - 140, 165);
  ctx.stroke();

  // Evidence Table
  ctx.textAlign = 'left';
  ctx.font = 'bold 16px "Times New Roman", Georgia, serif';
  ctx.fillText('SCHEDULE OF OFFERED DOCUMENTARY EVIDENCE', 140, 205);

  ctx.lineWidth = 1.0;
  ctx.strokeRect(140, 225, width - 280, 480);

  // Column Headers
  ctx.fillStyle = 'rgba(40, 30, 20, 0.08)';
  ctx.fillRect(140, 225, width - 280, 34);

  ctx.fillStyle = '#181614';
  ctx.font = 'bold 12px "Times New Roman", Georgia, serif';
  ctx.fillText('EXHIBIT', 155, 248);
  ctx.fillText('DATE', 245, 248);
  ctx.fillText('DESCRIPTION OF RECORD / DEPOSITION', 345, 248);
  ctx.fillText('STATUS', width - 235, 248);

  const rows = [
    ['P-01', '10/02/26', 'Forensic Audit Ledger of Transferred Assets', 'ADMITTED'],
    ['P-02', '10/05/26', 'Encrypted Advisory Correspondence Archive', 'UNDER SEAL'],
    ['P-03', '10/09/26', 'Deposition Transcript: Senior Managing Director', 'ADMITTED'],
    ['P-04', '10/12/26', 'Joint Defense Privilege Waiver Declaration', 'SUSTAINED'],
    ['P-05', '10/14/26', 'Retained Expert Rebuttal Report & Modeling', 'ADMITTED'],
    ['D-01', '10/15/26', 'Corporate Board Minutes of September 18, 2025', 'REDACTED'],
    ['D-02', '10/17/26', 'Motion in Limine to Preclude Statistical Sampling', 'DENIED']
  ];

  ctx.font = '12px "Times New Roman", Georgia, serif';
  rows.forEach((r, idx) => {
    const ry = 285 + idx * 56;
    ctx.strokeStyle = 'rgba(30, 24, 18, 0.18)';
    ctx.beginPath();
    ctx.moveTo(140, ry - 18);
    ctx.lineTo(width - 140, ry - 18);
    ctx.stroke();

    ctx.fillStyle = '#181614';
    ctx.fillText(r[0], 155, ry);
    ctx.fillText(r[1], 245, ry);
    ctx.fillText(r[2], 345, ry);

    if (r[3] === 'ADMITTED') ctx.fillStyle = '#185C28';
    else if (r[3] === 'UNDER SEAL' || r[3] === 'REDACTED') ctx.fillStyle = '#8E1810';
    else ctx.fillStyle = '#22201C';
    ctx.fillText(r[3], width - 235, ry);
  });

  // Big Stamped Seal: ADMITTED IN EVIDENCE
  drawRubberStamp(ctx, 'ADMITTED IN EVIDENCE', 'HON. DISTRICT JUDGE', width * 0.5, height - 380, -0.06, '#185C28');

  // Certification
  ctx.fillStyle = '#24201A';
  ctx.font = 'italic 12px "Times New Roman", Georgia, serif';
  ctx.fillText('I hereby certify that the foregoing documentary items were officially registered upon the trial record.', 140, height - 210);

  drawSignature(ctx, 140, height - 150, '#121A28');
  ctx.font = '11px "Times New Roman", Georgia, serif';
  ctx.fillText('CLERK OF THE DISTRICT COURT', 140, height - 90);

  return buildMaps(canvas, 'EVIDENCE_DOCKET');
}

// 4. STAMPED AFFIDAVIT & NOTARIAL DECLARATION
export function createStampedAffidavitTexture(): LegalPaperPBR {
  const width = 1024;
  const height = 1448;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  renderPaperBase(ctx, width, height, '#F7F4EC');

  // Court Caption
  ctx.fillStyle = '#161412';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px "Times New Roman", Georgia, serif';
  ctx.fillText('AFFIDAVIT OF SWORN TESTIMONY', width * 0.5, 120);

  ctx.textAlign = 'left';
  ctx.font = 'bold 14px "Times New Roman", Georgia, serif';
  ctx.fillText('STATE OF NEW YORK       )', 140, 180);
  ctx.fillText('                          )  SS.:', 140, 204);
  ctx.fillText('COUNTY OF NEW YORK      )', 140, 228);

  ctx.strokeStyle = '#221E18';
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(140, 255);
  ctx.lineTo(width - 140, 255);
  ctx.stroke();

  ctx.font = '14px "Times New Roman", Georgia, serif';
  ctx.fillText('BE IT KNOWN, that on this 18th day of October, 2026, before me personally came', 140, 290);
  ctx.fillText('the affiant, who being first duly sworn according to law, deposes and states under oath:', 140, 314);

  const points = [
    '1. I am an admitted attorney and retained partner at LEX VERA Counsel Chambers, duly qualified.',
    '2. I possess direct personal knowledge of the facts set forth herein concerning trial counsel selection.',
    '3. Clients facing multi-jurisdictional liability require vetted advocacy rather than automated directory listings.',
    '4. The qualitative evaluation protocols implemented herein adhere to rigorous ethical standards of the Bar.'
  ];

  let y = 370;
  points.forEach((p) => {
    ctx.fillText(p, 140, y);
    y += 38;
  });

  // Stamp: VERIFIED & SEALED
  drawRubberStamp(ctx, 'SWORN & SUBSCRIBED', 'COMMISSION EXPIRES 2028', width - 260, 560, 0.08, '#8E1810');

  // Notary seal and signature
  drawEmbossedSeal(ctx, 240, height - 220);
  drawSignature(ctx, width - 380, height - 240, '#121D2C');

  ctx.font = '12px "Times New Roman", Georgia, serif';
  ctx.fillText('AFFIANT / TRIAL COUNSEL', width - 380, height - 170);
  ctx.fillText('NOTARY PUBLIC OF NEW YORK', 180, height - 130);

  return buildMaps(canvas, 'STAMPED_AFFIDAVIT');
}

// Convert canvas to Three.js PBR maps
function buildMaps(colorCanvas: HTMLCanvasElement, type: string): LegalPaperPBR {
  const width = colorCanvas.width;
  const height = colorCanvas.height;

  const map = new THREE.CanvasTexture(colorCanvas);
  map.wrapS = THREE.ClampToEdgeWrapping;
  map.wrapT = THREE.ClampToEdgeWrapping;
  map.colorSpace = THREE.SRGBColorSpace;

  // Roughness Map (Matte paper with slight wax on seals/stamps)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#d0d0d0'; // ~0.82 paper matte
  rCtx.fillRect(0, 0, width, height);

  // Subtle fiber roughness noise
  rCtx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 2000; i++) {
    rCtx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
  }

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);

  // Bump Map (Debossed stamps, embossed notary seals, and folds)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080'; // neutral height
  bCtx.fillRect(0, 0, width, height);

  // Faint page fold diagonal crease
  bCtx.strokeStyle = '#707070';
  bCtx.lineWidth = 3.0;
  bCtx.beginPath();
  bCtx.moveTo(0, height * 0.7);
  bCtx.lineTo(width, height * 0.72);
  bCtx.stroke();

  bCtx.strokeStyle = '#909090';
  bCtx.lineWidth = 2.0;
  bCtx.beginPath();
  bCtx.moveTo(0, height * 0.7 - 2);
  bCtx.lineTo(width, height * 0.72 - 2);
  bCtx.stroke();

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);

  return { map, roughnessMap, bumpMap, type };
}
