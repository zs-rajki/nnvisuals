import React, { useEffect, useState } from "react";
import styles from './NeuralNetwork.module.css';
import Node from "./Node/Node.jsx";
import { predict } from "../predict.js";

export default function NeuralNetwork({ grid, center}) {
    const [probabilities, setProbabilities] = useState([0,0,0,0,0,0,0,0,0,0]);

    useEffect(() => {
        let isMounted = true;
        predict(grid, center).then(result => {
            if (isMounted) setProbabilities(result.probabilities);
        });
        return () => { isMounted = false; };
    }, [grid]);

    return (
        <div className={styles.finalLayer}>
            {probabilities.map((value, idx) => (
                <div key={idx} className={styles.finalNode}>
                    <Node value={value} />
                    <h1>{idx}</h1>
                </div>
            ))}
        </div>
    );
}