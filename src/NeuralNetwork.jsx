import React, { useEffect, useState } from "react";
import Node from "./Node";
import { predict } from "./predict.js";

export default function NeuralNetwork({ grid }) {
    const [probabilities, setProbabilities] = useState([0,0,0,0,0,0,0,0,0,0]);

    useEffect(() => {
        let isMounted = true;
        predict(grid).then(result => {
            if (isMounted) setProbabilities(result.probabilities);
        });
        return () => { isMounted = false; };
    }, [grid]);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            {probabilities.map((value, idx) => (
                <div key={idx} style={{ marginBottom: "10px", display: "flex", alignItems: "center", gap: "15px" }}>
                    <Node value={value} />
                    <h1 style={{ color: "#ffffff" }}>{idx}</h1>
                </div>
            ))}
        </div>
    );
}