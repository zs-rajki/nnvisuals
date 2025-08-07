// Utility: matrix multiply
function matmul(a, b) {
	const result = Array(a.length).fill(0).map(() => Array(b[0].length).fill(0));
	for (let i = 0; i < a.length; i++) {
		for (let j = 0; j < b[0].length; j++) {
			for (let k = 0; k < b.length; k++) {
				result[i][j] += a[i][k] * b[k][j];
			}
		}
	}
	return result;
}

// Utility: add bias
function addBias(mat, bias) {
	return mat.map((row, i) => row.map((val, j) => val + bias[j]));
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

// Predict dynamically based on weight file
export async function predict(input28x28, center) {
	let input;
	if (center) {
		const centered = centerImage28x28(input28x28);
		input = centered.flat(); // [784]
	} else {
		input = input28x28.flat(); // [784]
	}
	const res = await fetch(`${import.meta.env.BASE_URL}model_weights-64x32x16x16.json`);
	const weights = await res.json();

	// Identify layer numbers from keys like "model.1.weight"
	const layerNumbers = Object.keys(weights)
		.filter(k => k.endsWith('.weight'))
		.map(k => parseInt(k.split('.')[1]))
		.sort((a, b) => a - b); // [1, 3, 5, 7, ...]

	let x = [input]; // batch size 1
	const activations = [input.slice()]; // Store input as first activation (flattened)

	for (let i = 0; i < layerNumbers.length; i++) {
		const n = layerNumbers[i];
		const w = weights[`model.${n}.weight`];
		const b = weights[`model.${n}.bias`];
		const wT = w[0].map((_, colIndex) => w.map(row => row[colIndex])); // transpose

		x = matmul(x, wT);
		x = addBias(x, b);

		// Apply ReLU after all layers except the last
		if (i < layerNumbers.length - 1) {
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
		probabilities: probabilities,
		activations: activations,
		weights: weights
	};
}
