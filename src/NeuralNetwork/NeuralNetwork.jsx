import React, { useEffect, useState } from "react";
import styles from './NeuralNetwork.module.css';
import Node from "./Node/Node.jsx";
import { predict } from "../predict.js";

export default function NeuralNetwork({ grid, center}) {
    const [probabilities, setProbabilities] = useState([0,0,0,0,0,0,0,0,0,0]);
    const [activations, setActivations] = useState([]);

    useEffect(() => {
        let isMounted = true;
        predict(grid, center).then(result => {
            if (isMounted) {
                setProbabilities(result.probabilities);
                setActivations(result.activations);
            }
        });
        return () => { isMounted = false; };
    }, [grid]);

    // Exclude input layer (0) and final layer (last)
    const hiddenActivations = activations.slice(1, -1);

    return (
        <div className={styles.container}>
            {/* Visualize hidden layers */}
            {hiddenActivations.map((layer, layerIdx) => {
                if (layer.length > 64) return null;
                const nodeSize = 500 / layer.length;
                return (
                    <div key={layerIdx} className={styles.finalLayer}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {layer.map((value, idx) => (
                                <div key={idx} className={styles.finalNode} style={{ marginBottom: nodeSize / 3 }}>
                                    <Node value={value} size={nodeSize} />
                                </div>
                            ))}
                        </div>
                        <h2 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>Layer {layerIdx + 1}</h2>
                    </div>
                );
            })}
            {/* Visualize final probabilities */}
            <div className={styles.finalLayer}>
                {probabilities.map((value, idx) => (
                    <div key={idx} className={styles.finalNode}>
                        <Node value={value} size={50} />
                        <h1>{idx}</h1>
                    </div>
                ))}
                {/* <h2 style={{ color: '#fff', margin: 0 }}>Final layer</h2> */}
            </div>
        </div>
    );
}