import React, { useEffect, useState, useRef } from "react";
import styles from './NeuralNetwork.module.css';
import Node from "./Node/Node.jsx";
import Edge from "./Edge/Edge.jsx";
import { predict } from "../predict.js";

export default function NeuralNetwork({ grid, center }) {
    const [probabilities, setProbabilities] = useState(new Array(10).fill(0));
    const [activations, setActivations] = useState([]);
    const [weights, setWeights] = useState({});
    const [nodesReady, setNodesReady] = useState(false);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

    const nodeRefs = useRef({});
    const containerRef = useRef(null);

    // 🔹 ResizeObserver: track parent container size
    useEffect(() => {
        const observer = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });
            }
        });
        if (containerRef.current) observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // 🔹 Run prediction whenever grid changes
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
    }, [grid, center]);

    // 🔹 Clamp node size between 10px–40px
    const getNodeSize = (count, container) => {
        if (!container.height || !count) return 20;

        const availableHeight = container.height * 0.8; // leave margins
        const ideal = availableHeight / count;

        const min = 4;
        const max = 60;
        return Math.max(min, Math.min(ideal, max));
    };

    // 🔹 Generate edges between nodes
    const generateEdges = () => {
        const edges = [];
        const hiddenActivations = activations.slice(1, -1);
        if (Object.keys(weights).length === 0) return edges;

        const layerNumbers = Object.keys(weights)
            .filter(k => k.endsWith('.weight'))
            .map(k => parseInt(k.split('.')[1]))
            .sort((a, b) => a - b);

        for (let i = 0; i < layerNumbers.length - 1; i++) {
            const nextLayerNum = layerNumbers[i + 1];
            const weightKey = `model.${nextLayerNum}.weight`;

            if (weights[weightKey] && hiddenActivations[i] && hiddenActivations[i + 1]) {
                const weightMatrix = weights[weightKey];
                const currentLayerActivations = hiddenActivations[i];
                const nextLayerActivations = hiddenActivations[i + 1];

                for (let fromNode = 0; fromNode < weightMatrix[0].length; fromNode++) {
                    const sourceActivation = currentLayerActivations[fromNode];

                    for (let toNode = 0; toNode < weightMatrix.length; toNode++) {
                        const targetActivation = nextLayerActivations[toNode];
                        const weight = weightMatrix[toNode][fromNode];

                        if (Math.abs(sourceActivation) > 0.001 &&
                            Math.abs(targetActivation) > 0.001 &&
                            Math.abs(weight) > 0.001) {
                            edges.push({
                                fromLayer: i,
                                fromNode,
                                toLayer: i + 1,
                                toNode,
                                weight,
                                sourceActivation,
                                targetActivation
                            });
                        }
                    }
                }
            }
        }

        // 🔹 Last hidden → output layer
        if (hiddenActivations.length > 0) {
            const lastHiddenLayerIdx = hiddenActivations.length - 1;
            const lastWeightKey = `model.${layerNumbers[layerNumbers.length - 1]}.weight`;

            if (weights[lastWeightKey] && hiddenActivations[lastHiddenLayerIdx]) {
                const finalWeightMatrix = weights[lastWeightKey];
                const lastLayerActivations = hiddenActivations[lastHiddenLayerIdx];

                for (let fromNode = 0; fromNode < finalWeightMatrix[0].length; fromNode++) {
                    const sourceActivation = lastLayerActivations[fromNode];

                    for (let toNode = 0; toNode < finalWeightMatrix.length; toNode++) {
                        const targetActivation = probabilities[toNode];
                        const weight = finalWeightMatrix[toNode][fromNode];

                        if (Math.abs(sourceActivation) > 0.001 &&
                            Math.abs(targetActivation) > 0.001 &&
                            Math.abs(weight) > 0.001) {
                            edges.push({
                                fromLayer: lastHiddenLayerIdx,
                                fromNode,
                                toLayer: 'final',
                                toNode,
                                weight,
                                sourceActivation,
                                targetActivation
                            });
                        }
                    }
                }
            }
        }
        return edges;
    };

    // 🔹 Ensure nodes are ready before drawing edges
    useEffect(() => {
        const checkNodesReady = () => {
            const hiddenActivations = activations.slice(1, -1);
            if (hiddenActivations.length > 0 && Object.keys(weights).length > 0) {
                const hasSomeNodes = hiddenActivations.some((_, layerIdx) =>
                    nodeRefs.current[`${layerIdx}-0`]
                );
                if (hasSomeNodes) {
                    setNodesReady(true);
                }
            }
        };
        const timer = setTimeout(checkNodesReady, 100);
        return () => clearTimeout(timer);
    }, [activations, weights]);

    const hiddenActivations = activations.slice(1, -1);

    return (
        <div className={styles.container} ref={containerRef}>
            {/* Hidden layers */}
            {hiddenActivations.map((layer, layerIdx) => {
                if (layer.length > 64) return null;

                const nodeSize = getNodeSize(layer.length, containerSize);

                return (
                    <div key={layerIdx} className={styles.hiddenLayer}>
                            {layer.map((value, idx) => (
                                <div
                                    key={idx}
                                    className={styles.nodeDiv}
                                    ref={el => nodeRefs.current[`${layerIdx}-${idx}`] = el}
                                >
                                    <Node value={value} size={nodeSize} />
                                </div>
                            ))}
                        <h2 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>Layer {layerIdx + 1}</h2>
                    </div>
                );
            })}

            {/* Output probabilities */}
            <div className={styles.finalLayer}>
                {probabilities.map((value, idx) => {
                    const outputSize = getNodeSize(probabilities.length, containerSize);
                    return (
                        <div
                            key={idx}
                            className={styles.finalNode}
                        >
                            <div 
                                className={styles.nodeDiv}
                                ref={el => nodeRefs.current[`final-${idx}`] = el}
                            >
                                <Node value={value} size={outputSize} />
                            </div>
                            <h1 style={{ color: '#fff', fontSize: `${outputSize * 0.8}px` }}>{idx}</h1>
                        </div>
                    );
                })}
                <h2 style={{ color: '#fff', margin: 0, fontSize: '0.9rem' }}>Final Layer</h2>
            </div>

            {/* Edges */}
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
