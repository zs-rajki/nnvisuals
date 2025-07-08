// Utility to load weights from public/model_weights.json and perform inference on a 28x28 input

// Helper: matrix multiply
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

// Helper: add bias
function addBias(mat, bias) {
	return mat.map((row, i) => row.map((val, j) => val + bias[j]));
}

// Helper: ReLU
function relu(arr) {
	return arr.map(row => row.map(x => Math.max(0, x)));
}

// Helper: argmax
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

// Main predict function
export async function predict(input28x28) {
	// Flatten input
	const input = input28x28.flat(); // [784]

	// Load weights
	const res = await fetch('/model_weights-32x16.json');
	const weights = await res.json();

	// Layer 1: Linear(784, 32) + ReLU
	// PyTorch: weight shape [32, 784], bias [32]
	// JSON: 'model.1.weight', 'model.1.bias'
	const w1 = weights['model.1.weight']; // [32][784]
	const b1 = weights['model.1.bias'];   // [32]
	// JS: input [784], w1 [32][784] => need [1x784] x [784x32] = [1x32]
	// So, transpose w1 to [784][32]
	const w1T = w1[0].map((_, colIndex) => w1.map(row => row[colIndex]));
	let x = [input]; // [1][784]
	x = matmul(x, w1T); // [1][32]
	x = addBias(x, b1); // [1][32]
	x = relu(x);        // [1][32]

	// Layer 2: Linear(32, 16) + ReLU
	const w2 = weights['model.3.weight']; // [16][32]
	const b2 = weights['model.3.bias'];   // [16]
	const w2T = w2[0].map((_, colIndex) => w2.map(row => row[colIndex]));
	x = matmul(x, w2T); // [1][16]
	x = addBias(x, b2); // [1][16]
	x = relu(x);        // [1][16]

	// Layer 3: Linear(16, 10)
	const w3 = weights['model.5.weight']; // [10][16]
	const b3 = weights['model.5.bias'];   // [10]
	const w3T = w3[0].map((_, colIndex) => w3.map(row => row[colIndex]));
	x = matmul(x, w3T); // [1][10]
	x = addBias(x, b3); // [1][10]

	// Output: logits [1][10]
	// Return the index of the max logit (predicted digit)
	// Apply softmax to get probabilities
	const logits = x[0];
	const maxLogit = Math.max(...logits);
	const expLogits = logits.map(logit => Math.exp(logit - maxLogit)); // Subtract max for numerical stability
	const sumExpLogits = expLogits.reduce((sum, exp) => sum + exp, 0);
	const probabilities = expLogits.map(exp => exp / sumExpLogits);
	
	return {
		prediction: argmax(x[0]),
		probabilities: probabilities
	};
}
