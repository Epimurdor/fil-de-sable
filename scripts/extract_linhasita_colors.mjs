import fs from 'fs';
import zlib from 'zlib';
import jpeg from 'jpeg-js';

const buf = fs.readFileSync('cartela_pe.pdf');
const content = buf.toString('latin1');

// Build XREF table properly
const xrefOffsets = {};
let startxrefIdx = content.lastIndexOf('startxref');
let currXrefPos = parseInt(content.substring(startxrefIdx + 9).trim());

while (currXrefPos) {
  const xrefChunk = content.substring(currXrefPos, currXrefPos + 25000);
  if (xrefChunk.startsWith('xref')) {
    const lines = xrefChunk.split(/\r?\n/);
    let lIdx = 1;
    while (lIdx < lines.length && !lines[lIdx].startsWith('trailer')) {
      const header = lines[lIdx].trim().split(/\s+/);
      if (header.length === 2 && !isNaN(parseInt(header[0]))) {
        let startObj = parseInt(header[0]);
        let numObjs = parseInt(header[1]);
        lIdx++;
        for (let i = 0; i < numObjs; i++, lIdx++) {
          const entry = lines[lIdx].trim().split(/\s+/);
          const offset = parseInt(entry[0]);
          const gen = parseInt(entry[1]);
          const status = entry[2];
          if (status === 'n' && !xrefOffsets[startObj + i]) {
            xrefOffsets[startObj + i] = offset;
          }
        }
      } else {
        lIdx++;
      }
    }
    const trailerIdx = xrefChunk.indexOf('trailer');
    const prevMatch = xrefChunk.substring(trailerIdx).match(/\/Prev\s+(\d+)/);
    currXrefPos = prevMatch ? parseInt(prevMatch[1]) : null;
  } else {
    break;
  }
}

function getObjectString(objId) {
  const offset = xrefOffsets[objId];
  if (offset === undefined) return null;
  const endObjIdx = content.indexOf('endobj', offset);
  return content.substring(offset, endObjIdx + 6);
}

function getStreamBytes(objId) {
  const offset = xrefOffsets[objId];
  if (offset === undefined) return null;
  
  const streamIdx = content.indexOf('stream', offset);
  if (streamIdx === -1) return null;

  let dataStart = streamIdx + 6;
  if (buf[dataStart] === 0x0d && buf[dataStart+1] === 0x0a) dataStart += 2;
  else if (buf[dataStart] === 0x0a || buf[dataStart] === 0x0d) dataStart += 1;

  const endStreamIdx = content.indexOf('endstream', dataStart);
  if (endStreamIdx === -1) return null;

  let chunk = buf.subarray(dataStart, endStreamIdx);
  if (chunk[chunk.length-2] === 0x0d && chunk[chunk.length-1] === 0x0a) {
    chunk = chunk.subarray(0, chunk.length - 2);
  } else if (chunk[chunk.length-1] === 0x0a || chunk[chunk.length-1] === 0x0d) {
    chunk = chunk.subarray(0, chunk.length - 1);
  }
  return chunk;
}

function getDecompressedStream(objId) {
  const b = getStreamBytes(objId);
  return b ? zlib.inflateSync(b).toString('latin1') : null;
}

const colorMap = {
  1: {
    A: 'Natural', B: 'Branco', C: 'Preto', D: '208', E: '206', F: '544', G: '336',
    H: '665', I: '583', J: '207', K: '664', L: '209', M: '691', N: '210'
  },
  2: {
    A: '474', B: '287', C: '211', D: '392', E: '04', F: '397', G: '90',
    H: '224', I: '1019', J: 'M01', K: '352', L: '1045', M: '87', N: '88'
  },
  3: {
    A: '367', B: '386', C: '64', D: '666', E: '21', F: '604', G: '222',
    H: '204', I: '844', J: '221', K: '389', L: '205', M: '202', N: '220'
  },
  4: {
    A: '230', B: '231', C: '605', D: '398', E: '549', F: '229', G: '228',
    H: '226', I: '227', J: '384', K: '606', L: '721', M: '1037', N: '275'
  },
  5: {
    A: '119', B: '298', C: '70', D: '73', E: '225', F: '361', G: '37',
    H: '274', I: '218', J: '38', K: '387', L: '30', M: '217', N: '216'
  },
  6: {
    A: '238', B: '239', C: '324', D: '237', E: '629', F: '962', G: '323',
    H: '915', I: '903', J: '899', K: '545', L: '235', M: '640', N: '35'
  },
  7: {
    A: '234', B: '236', C: '232', D: '360', E: '368', F: '359', G: '69',
    H: '630', I: '632', J: '677', K: '233', L: '44', M: '50', N: '60'
  },
  8: {
    A: '548', B: '924', C: '1046', D: '531', E: '483', F: '315', G: '382',
    H: '762', I: '18', J: '285', K: 'Palha', L: '219', M: '582', N: '01'
  },
  9: {
    A: '1310', B: '05', C: '317', D: '223', E: '213', F: '293', G: '612',
    H: '511', I: '26', J: '215', K: '65', L: '214', M: '366', N: '362'
  },
  10: {
    A: '879', B: '567', C: '354', D: '790', E: '364', F: '602', G: '314',
    H: '641', I: '498', J: '334', K: '388', L: '203', M: '25', N: '212'
  },
  11: {
    A: '788', B: '631', C: '201', D: '28', E: '273', F: '259', G: '593',
    H: '667', I: '488', J: '649', K: '29', L: '515', M: '496', N: '286'
  },
  12: {
    A: '452', B: '555', C: '365', D: '516', E: '326', F: '329', G: '393',
    H: '327', I: '394', J: '328', K: '707', L: '692', M: '369', N: '332'
  },
  13: {
    A: 'Ouro', B: 'Cobre', C: 'Luz Negra', D: 'Púrpura', E: 'Salmão', F: 'Flamingo'
  },
  14: {
    A: 'Prata', B: 'M19', C: 'Pink', D: 'Multicolor', E: 'Fresh Mint'
  }
};

const pageObjIds = [42, 100, 158, 216, 274, 332, 390];
const results = [];

pageObjIds.forEach((pageId, pageIdx) => {
  const pStr = getObjectString(pageId);
  const mContents = pStr.match(/\/Contents\s+(\d+)\s+0\s+R/);
  const contentsId = parseInt(mContents[1]);

  const imMap = {};
  const imRegex = /\/(Im\d+)\s+(\d+)\s+0\s+R/g;
  let imm;
  while ((imm = imRegex.exec(pStr)) !== null) {
    imMap[imm[1]] = parseInt(imm[2]);
  }

  const streamStr = getDecompressedStream(contentsId);
  const matches = [];
  const regex = /([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+([0-9.-]+)\s+cm\s*(\/(Im\d+)\s+Do)/g;
  let m;
  while ((m = regex.exec(streamStr)) !== null) {
    matches.push({
      im: m[8],
      objId: imMap[m[8]],
      x: parseFloat(m[5]),
      y: parseFloat(m[6])
    });
  }

  const left = matches.filter(item => item.x < 500).sort((a,b) => b.y - a.y);
  const right = matches.filter(item => item.x >= 500).sort((a,b) => b.y - a.y);

  const colLeft = pageIdx * 2 + 1;
  const colRight = pageIdx * 2 + 2;

  function processColumn(items, colNum) {
    const colDefs = colorMap[colNum];
    const rowKeys = Object.keys(colDefs);
    for (let rIdx = 0; rIdx < rowKeys.length; rIdx++) {
      const rowLetter = rowKeys[rIdx];
      const item = items[rIdx];
      if (!item) {
        console.warn(`Missing item for col ${colNum}, row ${rowLetter}`);
        continue;
      }
      const code = colDefs[rowLetter];
      const imgBytes = getStreamBytes(item.objId);
      if (!imgBytes) {
        console.warn(`No imgBytes for col ${colNum}, row ${rowLetter}, objId ${item.objId}`);
        continue;
      }

      let raw;
      try {
        raw = jpeg.decode(imgBytes);
      } catch (e) {
        console.error(`Error decoding objId ${item.objId} (${code}):`, e.message);
        continue;
      }

      // Sample core strand
      const samples = [];
      const startY = Math.floor(raw.height * 0.25);
      const endY = Math.floor(raw.height * 0.75);
      const startX = Math.floor(raw.width * 0.20);
      const endX = Math.floor(raw.width * 0.80);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * raw.width + x) * 4;
          const r = raw.data[idx];
          const g = raw.data[idx + 1];
          const b = raw.data[idx + 2];
          const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
          samples.push({ r, g, b, brightness });
        }
      }

      samples.sort((a, b) => a.brightness - b.brightness);
      // Discard outer 15% shadows and glare
      const trimStart = Math.floor(samples.length * 0.15);
      const trimEnd = Math.floor(samples.length * 0.85);
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      for (let i = trimStart; i < trimEnd; i++) {
        rSum += samples[i].r;
        gSum += samples[i].g;
        bSum += samples[i].b;
        count++;
      }

      const rAvg = Math.round(rSum / count);
      const gAvg = Math.round(gSum / count);
      const bAvg = Math.round(bSum / count);
      const hex = '#' + [rAvg, gAvg, bAvg].map(v => v.toString(16).padStart(2, '0').toUpperCase()).join('');

      results.push({
        code,
        col: colNum,
        row: rowLetter,
        page: pageIdx + 7,
        r: rAvg,
        g: gAvg,
        b: bAvg,
        hex
      });
    }
  }

  processColumn(left, colLeft);
  processColumn(right, colRight);
});

console.log('Successfully processed total colors:', results.length);
fs.writeFileSync('extracted_colors.json', JSON.stringify(results, null, 2));
