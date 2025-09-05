import React, { useState } from 'react';
import Canvas from './Canvas/Canvas.jsx';
import NeuralNetwork from './NeuralNetwork/NeuralNetwork.jsx';

function App() {
    const emptyGrid = Array(28).fill(0).map(() => Array(28).fill(0));
    const [grid, setGrid] = useState(emptyGrid);

    return (
        <>
            <div className="grid">
                <div className="title">
                    <h1>Neural Network Visualizer</h1>
                </div>
                <div className="canvas">
                    <Canvas onGridChange={setGrid} />
                </div>
                <div className="network">
                    {/* <NeuralNetwork grid={grid} center={true}/> */}
                </div>
                <div className="footer">
                    <span>&copy; <span>{new Date().getFullYear()}</span> Zsombor Rajki. All Rights Reserved.</span>
                </div>
            </div>
        </>
    )
}

export default App
