import React, { useRef, useState } from 'react';
import { predict } from './predict.js';

const GRID_SIZE = 28;
const CELL_SIZE = 15; // px, adjust as needed
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

export default function CanvasGrid() {
	const canvasRef = useRef(null);
	const [drawing, setDrawing] = useState(false);
	const [grid, setGrid] = useState(
		Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))
	);

	// Draw the grid on the canvas
	const drawGrid = (ctx, gridData) => {
		ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		for (let y = 0; y < GRID_SIZE; y++) {
			for (let x = 0; x < GRID_SIZE; x++) {
				ctx.fillStyle = gridData[y][x] ? '#FFFFFF' : '#000000';
				ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
			}
		}
		ctx.strokeStyle = '#ccc';
		for (let i = 0; i <= GRID_SIZE; i++) {
			ctx.beginPath();
			ctx.moveTo(i * CELL_SIZE, 0);
			ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
			ctx.stroke();
			ctx.beginPath();
			ctx.moveTo(0, i * CELL_SIZE);
			ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
			ctx.stroke();
		}
	};

	// Redraw on grid change
	React.useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		drawGrid(ctx, grid);
	}, [grid]);

	const getCell = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
		const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);
		return { x, y };
	};

	const handlePointerDown = (e) => {
		setDrawing(true);
		handleDraw(e);
	};

	const handlePointerUp = () => {
		setDrawing(false);
	};

	const handlePointerMove = (e) => {
		if (drawing) {
			handleDraw(e);
		}
	};

	const handleDraw = (e) => {
		const { x, y } = getCell(e);
		if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
			setGrid(prev => {
				if (prev[y][x] === 1) return prev;
				const newGrid = prev.map(row => [...row]);
				newGrid[y][x] = 1;
				return newGrid;
			});
		}
	};

	const handlePredict = async () => {
		const result = await predict(grid);
		console.log('Predicted digit:', result.prediction, 'Probabilities:', result.probabilities);
	};

	const handleClear = () => {
		setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
			<canvas
				ref={canvasRef}
				width={CANVAS_SIZE}
				height={CANVAS_SIZE}
				style={{ border: '1px solid #888', touchAction: 'none', marginBottom: 12 }}
				onMouseDown={handlePointerDown}
				onMouseUp={handlePointerUp}
				onMouseLeave={handlePointerUp}
				onMouseMove={handlePointerMove}
			/>
			<div style={{ marginBottom: 8 }}>
				<button onClick={handlePredict} style={{ marginRight: 8 }}>Predict</button>
				<button onClick={handleClear}>Clear</button>
			</div>
		</div>
	);
} 