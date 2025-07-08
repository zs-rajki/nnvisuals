import CanvasGrid from './CanvasGrid';

function App() {

    return (
        <>
            <div className="grid">
                <div className="title">
                    <h1>Neural Network Visualizer</h1>
                </div>
                <div className="canvas">
                    <CanvasGrid/>
                </div>
                <div className="network">
                </div>
            </div>
        </>
    )
}

export default App
