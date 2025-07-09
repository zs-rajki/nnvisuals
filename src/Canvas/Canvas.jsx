import React, { useRef, useState } from 'react';
import styles from './Canvas.module.css';

const GRID_SIZE = 28;
const CELL_SIZE = 15; // px, adjust as needed
const CANVAS_SIZE = GRID_SIZE * CELL_SIZE;

export default function Canvas({ onGridChange }) {
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
				const v = gridData[y][x];
				const shade = Math.round(v * 255);
				ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
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

	// Notify parent on grid change
	React.useEffect(() => {
		if (onGridChange) onGridChange(grid);
	}, [grid, onGridChange]);

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
		const deltas = [
			{ dx: 0, dy: 0, value: 0.5 }, // center
			{ dx: -1, dy: 0, value: 0.25 }, // left
			{ dx: 1, dy: 0, value: 0.25 }, // right
			{ dx: 0, dy: -1, value: 0.25 }, // up
			{ dx: 0, dy: 1, value: 0.25 }, // down
			{ dx: -1, dy: -1, value: 0.1 }, // up-left
			{ dx: 1, dy: -1, value: 0.1 }, // up-right
			{ dx: -1, dy: 1, value: 0.1 }, // down-left
			{ dx: 1, dy: 1, value: 0.1 }, // down-right
		];
		setGrid(prev => {
			const newGrid = prev.map(row => [...row]);
			deltas.forEach(({ dx, dy, value }) => {
				const nx = x + dx;
				const ny = y + dy;
				if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
					newGrid[ny][nx] = Math.min(1, newGrid[ny][nx] + value);
				}
			});
			return newGrid;
		});
	};

	const handleClear = () => {
		setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
	};

	return (
		<div className={styles.canvasContainer}>
			<canvas
				ref={canvasRef}
				width={CANVAS_SIZE}
				height={CANVAS_SIZE}
				className={styles.canvas}
				onMouseDown={handlePointerDown}
				onMouseUp={handlePointerUp}
				onMouseLeave={handlePointerUp}
				onMouseMove={handlePointerMove}
			/>
			<div style={{ marginBottom: 8 }}>
				<button onClick={handleClear}>Clear</button>
			</div>
		</div>
	);
} 