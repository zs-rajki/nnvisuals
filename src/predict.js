// Loading weights (preprocess once)
let cachedModelData = null;

async function loadModelData() {
  if (!cachedModelData) {
    const res = await fetch(`${import.meta.env.BASE_URL}model_weights-64x32x16x16.json`);
    const rawWeights = await res.json();

    const transposed = {};
    const biases = {};

    // Identify layer numbers from keys like "model.1.weight"
    const layerNumbers = Object.keys(rawWeights)
      .filter(k => k.endsWith(".weight"))
      .map(k => parseInt(k.split(".")[1]))
      .sort((a, b) => a - b);

    for (const n of layerNumbers) {
      const w = rawWeights[`model.${n}.weight`];
      const b = rawWeights[`model.${n}.bias`];

      // Precompute transpose once
      transposed[n] = w[0].map((_, colIndex) => w.map(row => row[colIndex]));
      biases[n] = b;
    }

    cachedModelData = {
      raw: rawWeights,
      transposed,
      biases,
      layerNumbers,
      numLayers: layerNumbers.length
    };
  }
  return cachedModelData;
}

// Fused matmul + bias with Float32Array
function matmulBias(a, bT, bias) {
  // a: [1 x inDim]
  // bT: [inDim x outDim] (already transposed weight matrix)
  // bias: [outDim]
  const inDim = a[0].length;
  const outDim = bT[0].length;

  const result = new Float32Array(outDim);

  for (let j = 0; j < outDim; j++) {
    let sum = bias[j]; // start with bias
    for (let k = 0; k < inDim; k++) {
      sum += a[0][k] * bT[k][j];
    }
    result[j] = sum;
  }

  return [Array.from(result)]; // keep same return shape as before
}

// ReLU activation
function relu(arr) {
  return arr.map(row => row.map(x => Math.max(0, x)));
}

// Argmax
function argmax(arr) {
  let max = arr[0];
  let idx = 0;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] > max) {
      max = arr[i];
      idx = i;
    }
  }
  return idx;
}

function centerImage28x28(image) {
  // Step 1: Threshold to binary (0 or 1)
  const thresholded = image.map(row => row.map(v => (v > 0.1 ? 1 : 0)));

  // Step 2: Find bounding box
  let top = 28, bottom = 0, left = 28, right = 0;
  for (let y = 0; y < 28; y++) {
    for (let x = 0; x < 28; x++) {
      if (thresholded[y][x]) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (top > bottom || left > right) return image; // nothing drawn

  // Step 3: Crop
  const cropped = [];
  for (let y = top; y <= bottom; y++) {
    cropped.push(image[y].slice(left, right + 1));
  }

  // Step 4: Resize to 20x20 (nearest-neighbor)
  const scale = Math.min(20 / cropped[0].length, 20 / cropped.length);
  const newW = Math.round(cropped[0].length * scale);
  const newH = Math.round(cropped.length * scale);
  const resized = Array(newH).fill(0).map((_, y) => {
    const srcY = Math.floor(y / scale);
    return Array(newW).fill(0).map((_, x) => {
      const srcX = Math.floor(x / scale);
      return cropped[srcY][srcX];
    });
  });

  // Step 5: Pad to 28x28
  const topPad = Math.floor((28 - newH) / 2);
  const bottomPad = 28 - newH - topPad;
  const leftPad = Math.floor((28 - newW) / 2);
  const rightPad = 28 - newW - leftPad;
  const padded = [];

  for (let i = 0; i < topPad; i++) padded.push(Array(28).fill(0));
  for (let y = 0; y < resized.length; y++) {
    padded.push([
      ...Array(leftPad).fill(0),
      ...resized[y],
      ...Array(rightPad).fill(0)
    ]);
  }
  for (let i = 0; i < bottomPad; i++) padded.push(Array(28).fill(0));

  return padded;
}

// Predict dynamically based on preprocessed model
export async function predict(input28x28, center) {
  let input = center
    ? centerImage28x28(input28x28).flat()
    : input28x28.flat();

  const model = await loadModelData();

  let x = [input]; // batch size 1
  const activations = [input.slice()]; // Store input as first activation (flattened)

  for (let i = 0; i < model.numLayers; i++) {
    const n = model.layerNumbers[i];
    const wT = model.transposed[n];
    const b = model.biases[n];

    x = matmulBias(x, wT, b);

    // Apply ReLU after all layers except the last
    if (i < model.numLayers - 1) {
      x = relu(x);
    }
    // Store activations for this layer (flattened)
    activations.push(x[0].slice());
  }

  const logits = x[0];
  const maxLogit = Math.max(...logits);
  const expLogits = logits.map(logit => Math.exp(logit - maxLogit));
  const sumExpLogits = expLogits.reduce((sum, exp) => sum + exp, 0);
  const probabilities = expLogits.map(exp => exp / sumExpLogits);

  return {
    prediction: argmax(logits),
    probabilities,
    activations,
    weights: model.raw
  };
}