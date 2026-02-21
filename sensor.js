class Sensor {
    constructor(car) {
        this.car = car;
        this.rayCount = 9;          // More rays for better obstacle awareness
        this.rayLength = 250;       // Longer look-ahead
        this.raySpread = Math.PI * 0.75; // Wider field of view

        this.rays = [];
        this.readings = [];
    }

    update(roadBorders, traffic) {
        this.#castRays();
        this.readings = [];
        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(
                this.#getReading(this.rays[i], roadBorders, traffic)
            );
        }
    }

    #getReading(ray, roadBorders, traffic) {
        let touches = [];

        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0], ray[1],
                roadBorders[i][0], roadBorders[i][1]
            );
            if (touch) touches.push(touch);
        }

        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;
            for (let j = 0; j < poly.length; j++) {
                const value = getIntersection(
                    ray[0], ray[1],
                    poly[j], poly[(j + 1) % poly.length]
                );
                if (value) touches.push(value);
            }
        }

        if (touches.length === 0) return null;

        const offsets = touches.map(e => e.offset);
        const minOffset = Math.min(...offsets);
        return touches.find(e => e.offset === minOffset);
    }

    #castRays() {
        this.rays = [];
        for (let i = 0; i < this.rayCount; i++) {
            // Fixed ray angle calculation - spread evenly, offset by car angle
            const rayAngle = lerp(
                this.raySpread / 2,
                -this.raySpread / 2,
                this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)
            ) + this.car.angle;

            const start = { x: this.car.x, y: this.car.y };
            const end = {
                x: this.car.x - Math.sin(rayAngle) * this.rayLength,
                y: this.car.y - Math.cos(rayAngle) * this.rayLength
            };
            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.rays.length; i++) {
            let end = this.rays[i][1];
            if (this.readings[i]) end = this.readings[i];

            // Ray to hit point - yellow/green gradient feel
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(255, 230, 0, 0.85)";
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Hit point to ray end - dark red
            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(200, 50, 50, 0.6)";
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            // Draw hit dot
            if (this.readings[i]) {
                ctx.beginPath();
                ctx.arc(end.x, end.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = "orange";
                ctx.fill();
            }
        }
    }
}
