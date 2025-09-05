import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './Canvas.module.css';

const GRID_SIZE = 28;

export default function Canvas({ onGridChange }) {
	const containerRef = useRef(null);
	const canvasRef = useRef(null);
	const [grid, setGrid] = useState(
		Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0))
	);
	const [drawing, setDrawing] = useState(false);
	const [cellSize, setCellSize] = useState(10);

	// Resize canvas on window/container resize
	const resizeCanvas = useCallback(() => {
		const container = containerRef.current;
		if (!container) return;

		// Take min(width, height) so canvas is always square
		const sizeAvailable = Math.min(container.clientWidth, container.clientHeight);
		const size = Math.floor(sizeAvailable / GRID_SIZE);
		setCellSize(size);

		const canvas = canvasRef.current;
		const ctx = canvas.getContext('2d');
		const dpr = window.devicePixelRatio || 1;

		canvas.width = GRID_SIZE * size * dpr;
		canvas.height = GRID_SIZE * size * dpr;
		canvas.style.width = `${GRID_SIZE * size}px`;
		canvas.style.height = `${GRID_SIZE * size}px`;

		ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // ensure crisp rendering
		drawGrid(ctx, grid, size);
	}, [grid]);

	// Initial + resize effect
	useEffect(() => {
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		return () => window.removeEventListener('resize', resizeCanvas);
	}, [resizeCanvas]);

	// Redraw when grid changes
	useEffect(() => {
		const ctx = canvasRef.current.getContext('2d');
		drawGrid(ctx, grid, cellSize);
	}, [grid, cellSize]);

	// Notify parent
	useEffect(() => {
		if (onGridChange) onGridChange(grid);
	}, [grid, onGridChange]);

	const drawGrid = (ctx, gridData, size) => {
		ctx.clearRect(0, 0, GRID_SIZE * size, GRID_SIZE * size);

		// Fill each cell with grayscale color
		for (let y = 0; y < GRID_SIZE; y++) {
			for (let x = 0; x < GRID_SIZE; x++) {
				const val = gridData[y][x];
				const shade = Math.round(val * 255);
				ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
				ctx.fillRect(x * size, y * size, size, size);
			}
		}

		// Draw grid lines
		ctx.strokeStyle = 'rgba(200, 200, 200, 0.7)'; // light gray
		ctx.lineWidth = 0.5;

		for (let i = 0; i <= GRID_SIZE; i++) {
			// vertical line
			ctx.beginPath();
			ctx.moveTo(i * size, 0);
			ctx.lineTo(i * size, GRID_SIZE * size);
			ctx.stroke();

			// horizontal line
			ctx.beginPath();
			ctx.moveTo(0, i * size);
			ctx.lineTo(GRID_SIZE * size, i * size);
			ctx.stroke();
		}
	};

	const getCellFromEvent = (e) => {
		const rect = canvasRef.current.getBoundingClientRect();
		const x = Math.floor((e.clientX - rect.left) / cellSize);
		const y = Math.floor((e.clientY - rect.top) / cellSize);
		return { x, y };
	};

	const applyStroke = (x, y) => {
		const deltas = [
			{ dx: 0, dy: 0, value: 0.5 },
			{ dx: -1, dy: 0, value: 0.25 },
			{ dx: 1, dy: 0, value: 0.25 },
			{ dx: 0, dy: -1, value: 0.25 },
			{ dx: 0, dy: 1, value: 0.25 },
			{ dx: -1, dy: -1, value: 0.1 },
			{ dx: 1, dy: -1, value: 0.1 },
			{ dx: -1, dy: 1, value: 0.1 },
			{ dx: 1, dy: 1, value: 0.1 },
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

	const handlePointerDown = (e) => {
		setDrawing(true);
		const { x, y } = getCellFromEvent(e);
		applyStroke(x, y);
	};

	const handlePointerMove = (e) => {
		if (!drawing) return;
		const { x, y } = getCellFromEvent(e);
		applyStroke(x, y);
	};

	const handlePointerUp = () => setDrawing(false);

	const handleClear = () => {
		setGrid(Array(GRID_SIZE).fill(0).map(() => Array(GRID_SIZE).fill(0)));
	};

	return (
		<div className={styles.canvasGrid}>
			<div className={styles.text}>
				Draw a digit from 0-9 and then see how this simple neural network predicts it!
			</div>
			<div ref={containerRef} className={styles.canvasContainer}>
				<canvas
					ref={canvasRef}
					className={styles.canvas}
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerLeave={handlePointerUp}
				/>
			</div>
			<div className={styles.buttonContainer}>
				<button className={styles.clearButton} onClick={handleClear}>Clear</button>
			</div>
		</div>
	);
}
