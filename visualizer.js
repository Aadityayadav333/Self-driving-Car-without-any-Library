class Visualizer {
    static drawNetwork(ctx, network) {
        const margin = 30;
        const left = margin;
        const top = margin;
        const width = ctx.canvas.width - margin * 2;
        const height = ctx.canvas.height - margin * 2;

        const levelHeight = height / network.levels.length;

        // Draw background
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (let i = network.levels.length - 1; i >= 0; i--) {
            const levelTop = top + lerp(
                height - levelHeight,
                0,
                network.levels.length === 1 ? 0.5 : i / (network.levels.length - 1)
            );

            ctx.setLineDash([7, 3]);
            Visualizer.drawLevel(
                ctx, network.levels[i],
                left, levelTop, width, levelHeight,
                i === network.levels.length - 1 ? ['⬆', '⬅', '➡', '⬇'] : []
            );
        }
    }

    static drawLevel(ctx, level, left, top, width, height, outputLabels) {
        const right = left + width;
        const bottom = top + height;

        const { inputs, outputs, weights, biases } = level;

        // Draw connections
        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < outputs.length; j++) {
                ctx.beginPath();
                ctx.moveTo(Visualizer.#getNodeX(inputs, i, left, right), bottom);
                ctx.lineTo(Visualizer.#getNodeX(outputs, j, left, right), top);
                ctx.lineWidth = Math.abs(weights[i][j]) * 2.5;
                ctx.strokeStyle = getRGBA(weights[i][j]);
                ctx.stroke();
            }
        }

        const nodeRadius = Math.min(18, width / (Math.max(inputs.length, outputs.length) * 1.5 + 1));

        // Draw input nodes
        for (let i = 0; i < inputs.length; i++) {
            const x = Visualizer.#getNodeX(inputs, i, left, right);

            ctx.beginPath();
            ctx.arc(x, bottom, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#111";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, bottom, nodeRadius * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = getRGBA(inputs[i]);
            ctx.fill();
        }

        // Draw output nodes
        for (let i = 0; i < outputs.length; i++) {
            const x = Visualizer.#getNodeX(outputs, i, left, right);

            ctx.beginPath();
            ctx.arc(x, top, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "#111";
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x, top, nodeRadius * 0.75, 0, Math.PI * 2);
            ctx.fillStyle = getRGBA(outputs[i]);
            ctx.fill();

            // Bias ring
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.arc(x, top, nodeRadius * 0.9, 0, Math.PI * 2);
            ctx.strokeStyle = getRGBA(biases[i]);
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Labels
            if (outputLabels[i]) {
                ctx.beginPath();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = outputs[i] > 0.5 ? "#fff" : "#888";
                ctx.font = `bold ${Math.max(10, nodeRadius)}px Arial`;
                ctx.fillText(outputLabels[i], x, top);
            }
        }

        // Layer label
        ctx.fillStyle = "rgba(100,150,255,0.4)";
        ctx.font = "10px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`${inputs.length}→${outputs.length}`, right, top - 4);
    }

    static #getNodeX(nodes, index, left, right) {
        return lerp(
            left,
            right,
            nodes.length === 1 ? 0.5 : index / (nodes.length - 1)
        );
    }
}
