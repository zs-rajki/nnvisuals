import React, { useEffect, useState, useRef } from "react";
import styles from './NeuralNetwork.module.css';
import Node from "./Node/Node.jsx";
import Edge from "./Edge/Edge.jsx";
import { predict } from "../predict.js";

export default function NeuralNetwork({ grid, center}) {
    const [probabilities, setProbabilities] = useState(new Array(10).fill(0));
    const [activations, setActivations] = useState([]);
    const [weights, setWeights] = useState({});
    const [nodesReady, setNodesReady] = useState(false);
    const nodeRefs = useRef({});
    const containerRef = useRef(null);

    useEffect(() => {
        let isMounted = true;
        predict(grid, center).then(result => {
            if (isMounted) {
                setProbabilities(result.probabilities);
                setActivations(result.activations);
                setWeights(result.weights);
            }
        });
        return () => { isMounted = false; };
    }, [grid]);

    // Generate edges based on active nodes and non-zero weights
    const generateEdges = () => {
        const edges = [];
        const hiddenActivations = activations.slice(1, -1);
        
        if (Object.keys(weights).length === 0) return edges;
        
        // Get layer numbers from weight keys
        const layerNumbers = Object.keys(weights)
            .filter(k => k.endsWith('.weight'))
            .map(k => parseInt(k.split('.')[1]))
            .sort((a, b) => a - b);
        
        // Create edges between consecutive layers
        for (let i = 0; i < layerNumbers.length - 1; i++) {
            const currentLayerNum = layerNumbers[i];
            const nextLayerNum = layerNumbers[i + 1];
            const weightKey = `model.${nextLayerNum}.weight`;
            
            if (weights[weightKey] && hiddenActivations[i] && hiddenActivations[i + 1]) {
                const weightMatrix = weights[weightKey];
                const currentLayerActivations = hiddenActivations[i];
                const nextLayerActivations = hiddenActivations[i + 1];
                
                // For each node in the current layer
                for (let fromNode = 0; fromNode < weightMatrix[0].length; fromNode++) {
                    const sourceActivation = currentLayerActivations[fromNode];
                    
                    // For each node in the next layer
                    for (let toNode = 0; toNode < weightMatrix.length; toNode++) {
                        const targetActivation = nextLayerActivations[toNode];
                        const weight = weightMatrix[toNode][fromNode];
                        
                        // Create edge if:
                        // 1. Source node is active AND
                        // 2. Target node is active AND  
                        // 3. Weight is non-zero
                        if (Math.abs(sourceActivation) > 0.001 && 
                            Math.abs(targetActivation) > 0.001 && 
                            Math.abs(weight) > 0.001) {
                            edges.push({
                                fromLayer: i,
                                fromNode: fromNode,
                                toLayer: i + 1,
                                toNode: toNode,
                                weight: weight,
                                sourceActivation: sourceActivation,
                                targetActivation: targetActivation
                            });
                        }
                    }
                }
            }
        }
        
        // Add edges from last hidden layer to final layer (output layer)
        if (hiddenActivations.length > 0) {
            const lastHiddenLayerIdx = hiddenActivations.length - 1;
            const lastWeightKey = `model.${layerNumbers[layerNumbers.length - 1]}.weight`;
            
            if (weights[lastWeightKey] && hiddenActivations[lastHiddenLayerIdx]) {
                const finalWeightMatrix = weights[lastWeightKey];
                const lastLayerActivations = hiddenActivations[lastHiddenLayerIdx];
                
                // For each node in the last hidden layer
                for (let fromNode = 0; fromNode < finalWeightMatrix[0].length; fromNode++) {
                    const sourceActivation = lastLayerActivations[fromNode];
                    
                    // For each node in the final layer (output layer)
                    for (let toNode = 0; toNode < finalWeightMatrix.length; toNode++) {
                        const targetActivation = probabilities[toNode];
                        const weight = finalWeightMatrix[toNode][fromNode];
                        
                        // Create edge if:
                        // 1. Source node is active AND
                        // 2. Target node has non-zero probability AND
                        // 3. Weight is non-zero
                        if (Math.abs(sourceActivation) > 0.001 && 
                            Math.abs(targetActivation) > 0.001 && 
                            Math.abs(weight) > 0.001) {
                            edges.push({
                                fromLayer: lastHiddenLayerIdx,
                                fromNode: fromNode,
                                toLayer: 'final',
                                toNode: toNode,
                                weight: weight,
                                sourceActivation: sourceActivation,
                                targetActivation: targetActivation
                            });
                        }
                    }
                }
            }
        }
        
        return edges;
    };

    // Check if nodes are ready for edge rendering
    useEffect(() => {
        const checkNodesReady = () => {
            const hiddenActivations = activations.slice(1, -1);
            console.log('Checking nodes ready:', {
                hiddenActivationsLength: hiddenActivations.length,
                nodeRefs: Object.keys(nodeRefs.current),
                weightsKeys: Object.keys(weights)
            });
            
            // Check if we have at least some nodes and weights
            if (hiddenActivations.length > 0 && Object.keys(weights).length > 0) {
                // Check if we have at least one node from each layer
                const hasSomeNodes = hiddenActivations.some((_, layerIdx) => 
                    nodeRefs.current[`${layerIdx}-0`]
                );
                
                if (hasSomeNodes) {
                    console.log('Nodes and weights ready, setting nodesReady to true');
                    setNodesReady(true);
                }
            }
        };

        // Check after a short delay to allow DOM to render
        const timer = setTimeout(checkNodesReady, 100);
        return () => clearTimeout(timer);
    }, [activations, weights]);

    // Exclude input layer (0) and final layer (last)
    const hiddenActivations = activations.slice(1, -1);

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Visualize hidden layers */}
            {hiddenActivations.map((layer, layerIdx) => {
                if (layer.length > 64) return null;
                const nodeSize = 500 / layer.length;
                return (
                    <div key={layerIdx} className={styles.finalLayer}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {layer.map((value, idx) => (
                                <div 
                                    key={idx} 
                                    className={styles.finalNode} 
                                    style={{ marginBottom: nodeSize / 3 }}
                                    ref={el => nodeRefs.current[`${layerIdx}-${idx}`] = el}
                                >
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
                    <div 
                        key={idx} 
                        className={styles.finalNode}
                        ref={el => nodeRefs.current[`final-${idx}`] = el}
                    >
                        <Node value={value} size={50} />
                        <h1>{idx}</h1>
                    </div>
                ))}
                {/* <h2 style={{ color: '#fff', margin: 0 }}>Final layer</h2> */}
            </div>
            {nodesReady && (
                <svg 
                    style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: -1
                    }}
                >
                    {generateEdges().map((edge, index) => {
                        const fromNodeKey = `${edge.fromLayer}-${edge.fromNode}`;
                        const toNodeKey = `${edge.toLayer}-${edge.toNode}`;
                        
                        // Only render edge if both nodes exist
                        if (nodeRefs.current[fromNodeKey] && nodeRefs.current[toNodeKey]) {
                            return (
                                <Edge 
                                    key={`edge-${index}`}
                                    node1Ref={{ current: nodeRefs.current[fromNodeKey] }}
                                    node2Ref={{ current: nodeRefs.current[toNodeKey] }}
                                    containerRef={containerRef}
                                    weight={edge.weight}
                                    sourceActivation={edge.sourceActivation}
                                    targetActivation={edge.targetActivation}
                                />
                            );
                        }
                        return null;
                    })}
                </svg>
            )}
        </div>
    );
}