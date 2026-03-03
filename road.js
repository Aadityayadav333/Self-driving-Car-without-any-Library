class Road {
    constructor(x, width, laneCount = 3) {
        this.x = x;
        this.width = width;
        this.laneCount = laneCount;

        this.left = x - width / 2;
        this.right = x + width / 2;

        const infinity = 1000000;
        this.top = -infinity;
        this.bottom = infinity;

        const topLeft     = { x: this.left,  y: this.top    };
        const topRight    = { x: this.right, y: this.top    };
        const bottomLeft  = { x: this.left,  y: this.bottom };
        const bottomRight = { x: this.right, y: this.bottom };

        this.borders = [
            [topLeft, bottomLeft],
            [topRight, bottomRight]
        ];
    }

    getLaneCenter(laneIndex) {
        const laneWidth = this.width / this.laneCount;
        return this.left + laneWidth / 2 +
            Math.min(laneIndex, this.laneCount - 1) * laneWidth;
    }

    draw(ctx) {
        const left  = this.left;
        const right = this.right;

        // ── Tarmac surface ───────────────────────────────────────────────────
        ctx.fillStyle = "#2e2e2e";
        ctx.fillRect(left, this.top, this.width, this.bottom - this.top);

        // Subtle tarmac texture (noise-like horizontal bands)
        ctx.fillStyle = "rgba(255,255,255,0.015)";
        for (let y = this.top; y < this.bottom; y += 60) {
            ctx.fillRect(left, y, this.width, 2);
        }

        // ── Lane dividers (dashed white) ─────────────────────────────────────
        ctx.setLineDash([28, 22]);
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#e8e8e8";

        for (let i = 1; i < this.laneCount; i++) {
            const x = lerp(left, right, i / this.laneCount);
            ctx.beginPath();
            ctx.moveTo(x, this.top);
            ctx.lineTo(x, this.bottom);
            ctx.stroke();
        }

        ctx.setLineDash([]);

        // ── Kerb / road edges — double solid white ───────────────────────────
        [left, right].forEach((bx, idx) => {
            // Outer kerb stripe (yellow)
            ctx.lineWidth = 5;
            ctx.strokeStyle = "#f0c040";
            ctx.beginPath();
            ctx.moveTo(bx, this.top);
            ctx.lineTo(bx, this.bottom);
            ctx.stroke();

            // Inner white edge line
            const inset = idx === 0 ? 4 : -4;
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255,255,255,0.7)";
            ctx.beginPath();
            ctx.moveTo(bx + inset, this.top);
            ctx.lineTo(bx + inset, this.bottom);
            ctx.stroke();
        });

        // ── Tarmac edge shadow (depth) ────────────────────────────────────────
        const shadowW = 10;
        const leftGrad = ctx.createLinearGradient(left, 0, left + shadowW, 0);
        leftGrad.addColorStop(0, "rgba(0,0,0,0.35)");
        leftGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = leftGrad;
        ctx.fillRect(left, this.top, shadowW, this.bottom - this.top);

        const rightGrad = ctx.createLinearGradient(right, 0, right - shadowW, 0);
        rightGrad.addColorStop(0, "rgba(0,0,0,0.35)");
        rightGrad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = rightGrad;
        ctx.fillRect(right - shadowW, this.top, shadowW, this.bottom - this.top);
    }
}
