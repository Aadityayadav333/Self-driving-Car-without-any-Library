class Car {
    constructor(x, y, width, height, controlType, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;
        this.fitness = 0;

        this.useBrain = controlType === "AI";

        if (controlType !== "DUMMY") {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 12, 8, 4]);
        }

        this.controls = new Controls(controlType);

        // Visual type: "AI" cars are sporty, "DUMMY" are sedans
        this.controlType = controlType;
    }

    update(roadBorders, traffic) {
        if (!this.damaged) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBorders, traffic);
            if (!this.damaged) {
                this.fitness = -this.y;
            }
        }

        if (this.sensor) {
            this.sensor.update(roadBorders, traffic);
            const offsets = this.sensor.readings.map(
                s => s == null ? 0 : 1 - s.offset
            );
            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left    = outputs[1];
                this.controls.right   = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    #assessDamage(roadBorders, traffic) {
        for (let i = 0; i < roadBorders.length; i++) {
            if (polyIntersect(this.polygon, roadBorders[i])) return true;
        }
        for (let i = 0; i < traffic.length; i++) {
            if (polyIntersect(this.polygon, traffic[i].polygon)) return true;
        }
        return false;
    }

    #createPolygon() {
        const points = [];
        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    #move() {
        if (this.controls.forward) this.speed += this.acceleration;
        if (this.controls.reverse) this.speed -= this.acceleration;

        if (this.speed > this.maxSpeed) this.speed = this.maxSpeed;
        if (this.speed < -this.maxSpeed / 2) this.speed = -this.maxSpeed / 2;

        if (this.speed > 0) this.speed -= this.friction;
        if (this.speed < 0) this.speed += this.friction;
        if (Math.abs(this.speed) < this.friction) this.speed = 0;

        if (this.speed !== 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if (this.controls.left)  this.angle += 0.03 * flip;
            if (this.controls.right) this.angle -= 0.03 * flip;
        }

        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    // ─── Draw ────────────────────────────────────────────────────────────────
    draw(ctx, color, drawSensor = false) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        if (this.damaged) {
            this.#drawDamagedCar(ctx);
        } else if (this.controlType === "DUMMY") {
            this.#drawDummyCar(ctx, color);
        } else {
            this.#drawAICar(ctx, color);
        }

        ctx.restore();

        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }
    }

    // ── Damaged wreck ────────────────────────────────────────────────────────
    #drawDamagedCar(ctx) {
        const w = this.width, h = this.height;

        // Crumpled body
        ctx.fillStyle = "#555";
        this.#roundRect(ctx, -w / 2, -h / 2, w, h, 4);
        ctx.fill();

        // X marks
        ctx.strokeStyle = "rgba(255,80,80,0.7)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-w * 0.3, -h * 0.3); ctx.lineTo(w * 0.3, h * 0.3);
        ctx.moveTo(w * 0.3, -h * 0.3);  ctx.lineTo(-w * 0.3, h * 0.3);
        ctx.stroke();

        // Smoke puff
        ctx.fillStyle = "rgba(180,180,180,0.4)";
        ctx.beginPath();
        ctx.arc(0, -h * 0.1, w * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    // ── Dummy / traffic car — top-down sedan ─────────────────────────────────
    #drawDummyCar(ctx, color) {
        const w = this.width, h = this.height;
        const r = 5; // corner radius

        // === Body shadow ===
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        this.#roundRect(ctx, -w / 2 + 3, -h / 2 + 3, w, h, r);
        ctx.fill();

        // === Main body ===
        ctx.fillStyle = color;
        this.#roundRect(ctx, -w / 2, -h / 2, w, h, r);
        ctx.fill();

        // === Roof / cabin (darker inset) ===
        const roofW = w * 0.72, roofH = h * 0.44;
        const roofX = -roofW / 2, roofY = -h * 0.1;
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        this.#roundRect(ctx, roofX, roofY, roofW, roofH, 3);
        ctx.fill();

        // Roof glass tint
        ctx.fillStyle = "rgba(100,180,255,0.18)";
        this.#roundRect(ctx, roofX + 2, roofY + 2, roofW - 4, roofH - 4, 2);
        ctx.fill();

        // === Windshield (front) ===
        ctx.fillStyle = "rgba(120,200,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.3, -h * 0.12);
        ctx.lineTo( w * 0.3, -h * 0.12);
        ctx.lineTo( w * 0.25, -h * 0.35);
        ctx.lineTo(-w * 0.25, -h * 0.35);
        ctx.closePath();
        ctx.fill();
        // windshield glare
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, -h * 0.14);
        ctx.lineTo(-w * 0.05, -h * 0.14);
        ctx.lineTo(-w * 0.08, -h * 0.33);
        ctx.lineTo(-w * 0.2,  -h * 0.33);
        ctx.closePath();
        ctx.fill();

        // === Rear windshield ===
        ctx.fillStyle = "rgba(120,200,255,0.4)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.28, h * 0.12);
        ctx.lineTo( w * 0.28, h * 0.12);
        ctx.lineTo( w * 0.22, h * 0.32);
        ctx.lineTo(-w * 0.22, h * 0.32);
        ctx.closePath();
        ctx.fill();

        // === Headlights (front) ===
        // Left
        ctx.fillStyle = "#fffde7";
        ctx.beginPath(); ctx.ellipse(-w * 0.28, -h * 0.43, w * 0.1, h * 0.045, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,240,100,0.5)";
        ctx.beginPath(); ctx.ellipse(-w * 0.28, -h * 0.43, w * 0.06, h * 0.028, 0, 0, Math.PI * 2); ctx.fill();
        // Right
        ctx.fillStyle = "#fffde7";
        ctx.beginPath(); ctx.ellipse( w * 0.28, -h * 0.43, w * 0.1, h * 0.045, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,240,100,0.5)";
        ctx.beginPath(); ctx.ellipse( w * 0.28, -h * 0.43, w * 0.06, h * 0.028, 0, 0, Math.PI * 2); ctx.fill();

        // === Tail lights (rear) ===
        ctx.fillStyle = "#ff1a1a";
        ctx.beginPath(); ctx.ellipse(-w * 0.28, h * 0.43, w * 0.1, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse( w * 0.28, h * 0.43, w * 0.1, h * 0.04, 0, 0, Math.PI * 2); ctx.fill();

        // === Wheels ===
        this.#drawWheel(ctx, -w * 0.5, -h * 0.3, w * 0.14, h * 0.18);
        this.#drawWheel(ctx,  w * 0.5 - w * 0.14, -h * 0.3, w * 0.14, h * 0.18);
        this.#drawWheel(ctx, -w * 0.5,  h * 0.16, w * 0.14, h * 0.18);
        this.#drawWheel(ctx,  w * 0.5 - w * 0.14,  h * 0.16, w * 0.14, h * 0.18);

        // === Body outline ===
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.lineWidth = 1;
        this.#roundRect(ctx, -w / 2, -h / 2, w, h, r);
        ctx.stroke();

        // === Hood line ===
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-w * 0.42, -h * 0.37);
        ctx.lineTo( w * 0.42, -h * 0.37);
        ctx.stroke();
    }

    // ── AI car — sporty top-down coupe ───────────────────────────────────────
    #drawAICar(ctx, color) {
        const w = this.width, h = this.height;

        // === Body shadow ===
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        this.#roundRect(ctx, -w / 2 + 3, -h / 2 + 3, w, h, 6);
        ctx.fill();

        // === Main body — sleeker shape ===
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);                       // nose tip
        ctx.bezierCurveTo( w * 0.45, -h * 0.4,  w / 2,  -h * 0.2,  w / 2,   h * 0.1);
        ctx.bezierCurveTo( w / 2,     h * 0.35,  w * 0.4, h / 2,    w * 0.2, h / 2);
        ctx.lineTo(-w * 0.2, h / 2);
        ctx.bezierCurveTo(-w * 0.4, h / 2,   -w / 2,  h * 0.35, -w / 2,  h * 0.1);
        ctx.bezierCurveTo(-w / 2,  -h * 0.2, -w * 0.45, -h * 0.4, 0, -h / 2);
        ctx.closePath();
        ctx.fill();

        // Body gloss highlight
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.1, -h * 0.45);
        ctx.bezierCurveTo( w * 0.2, -h * 0.4, w * 0.25, -h * 0.1, w * 0.15, h * 0.05);
        ctx.bezierCurveTo( w * 0.05, h * 0.15, -w * 0.1, h * 0.1, -w * 0.15, -h * 0.05);
        ctx.bezierCurveTo(-w * 0.2, -h * 0.2, -w * 0.15, -h * 0.4, -w * 0.1, -h * 0.45);
        ctx.closePath();
        ctx.fill();

        // === Roof / cockpit ===
        ctx.fillStyle = "rgba(0,0,0,0.32)";
        ctx.beginPath();
        ctx.ellipse(0, h * 0.05, w * 0.32, h * 0.26, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit glass
        ctx.fillStyle = "rgba(100,210,255,0.3)";
        ctx.beginPath();
        ctx.ellipse(0, h * 0.04, w * 0.26, h * 0.21, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit glare
        ctx.fillStyle = "rgba(255,255,255,0.22)";
        ctx.beginPath();
        ctx.ellipse(-w * 0.05, h * 0.0, w * 0.1, h * 0.09, -0.3, 0, Math.PI * 2);
        ctx.fill();

        // === Windshield ===
        ctx.fillStyle = "rgba(140,220,255,0.55)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.26, -h * 0.14);
        ctx.lineTo( w * 0.26, -h * 0.14);
        ctx.lineTo( w * 0.2,  -h * 0.32);
        ctx.lineTo(-w * 0.2,  -h * 0.32);
        ctx.closePath();
        ctx.fill();

        // Windshield glare
        ctx.fillStyle = "rgba(255,255,255,0.3)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.18, -h * 0.16);
        ctx.lineTo(-w * 0.04, -h * 0.16);
        ctx.lineTo(-w * 0.07, -h * 0.30);
        ctx.lineTo(-w * 0.16, -h * 0.30);
        ctx.closePath();
        ctx.fill();

        // === Rear window ===
        ctx.fillStyle = "rgba(100,190,255,0.35)";
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, h * 0.15);
        ctx.lineTo( w * 0.22, h * 0.15);
        ctx.lineTo( w * 0.18, h * 0.3);
        ctx.lineTo(-w * 0.18, h * 0.3);
        ctx.closePath();
        ctx.fill();

        // === LED Headlights (thin aggressive strip) ===
        const grad = ctx.createLinearGradient(-w * 0.3, 0, w * 0.3, 0);
        grad.addColorStop(0,   "rgba(255,255,220,0)");
        grad.addColorStop(0.3, "#ffffcc");
        grad.addColorStop(0.5, "#ffffff");
        grad.addColorStop(0.7, "#ffffcc");
        grad.addColorStop(1,   "rgba(255,255,220,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(-w * 0.28, -h * 0.46);
        ctx.lineTo( w * 0.28, -h * 0.46);
        ctx.lineTo( w * 0.22, -h * 0.41);
        ctx.lineTo(-w * 0.22, -h * 0.41);
        ctx.closePath();
        ctx.fill();

        // Corner headlight pods
        ctx.fillStyle = "#fff8dc";
        ctx.beginPath(); ctx.ellipse(-w * 0.32, -h * 0.42, w * 0.08, h * 0.035, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse( w * 0.32, -h * 0.42, w * 0.08, h * 0.035, -0.3, 0, Math.PI * 2); ctx.fill();

        // === Tail lights — LED strip ===
        ctx.fillStyle = "#ff2222";
        ctx.beginPath();
        ctx.moveTo(-w * 0.22, h * 0.43);
        ctx.lineTo( w * 0.22, h * 0.43);
        ctx.lineTo( w * 0.16, h * 0.47);
        ctx.lineTo(-w * 0.16, h * 0.47);
        ctx.closePath();
        ctx.fill();

        // Brake glow when reversing
        if (this.controls && this.controls.reverse) {
            ctx.fillStyle = "rgba(255,60,60,0.6)";
            ctx.beginPath();
            ctx.ellipse(0, h * 0.47, w * 0.18, h * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === Side skirts / accent line ===
        ctx.strokeStyle = "rgba(255,255,255,0.15)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-w * 0.5, -h * 0.05);
        ctx.lineTo(-w * 0.5,  h * 0.2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo( w * 0.5, -h * 0.05);
        ctx.lineTo( w * 0.5,  h * 0.2);
        ctx.stroke();

        // === Wheels ===
        this.#drawSportWheel(ctx, -w * 0.5,      -h * 0.28, w * 0.15, h * 0.19);
        this.#drawSportWheel(ctx,  w * 0.5 - w * 0.15, -h * 0.28, w * 0.15, h * 0.19);
        this.#drawSportWheel(ctx, -w * 0.5,       h * 0.14, w * 0.15, h * 0.19);
        this.#drawSportWheel(ctx,  w * 0.5 - w * 0.15,  h * 0.14, w * 0.15, h * 0.19);

        // === Body outline ===
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -h / 2);
        ctx.bezierCurveTo( w * 0.45, -h * 0.4,  w / 2,  -h * 0.2,  w / 2,   h * 0.1);
        ctx.bezierCurveTo( w / 2,     h * 0.35,  w * 0.4, h / 2,    w * 0.2, h / 2);
        ctx.lineTo(-w * 0.2, h / 2);
        ctx.bezierCurveTo(-w * 0.4, h / 2,   -w / 2,  h * 0.35, -w / 2,  h * 0.1);
        ctx.bezierCurveTo(-w / 2,  -h * 0.2, -w * 0.45, -h * 0.4, 0, -h / 2);
        ctx.closePath();
        ctx.stroke();
    }

    // ── Standard wheel (sedan) ────────────────────────────────────────────────
    #drawWheel(ctx, x, y, w, h) {
        // Tyre
        ctx.fillStyle = "#1a1a1a";
        this.#roundRect(ctx, x, y, w, h, 3);
        ctx.fill();

        // Rim
        const cx = x + w / 2, cy = y + h / 2;
        const r = Math.min(w, h) * 0.34;
        ctx.fillStyle = "#c8c8c8";
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

        // Hub
        ctx.fillStyle = "#888";
        ctx.beginPath(); ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2); ctx.fill();

        // Spokes
        ctx.strokeStyle = "#aaa";
        ctx.lineWidth = 1;
        for (let s = 0; s < 4; s++) {
            const a = (s / 4) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * r * 0.4, cy + Math.sin(a) * r * 0.4);
            ctx.lineTo(cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9);
            ctx.stroke();
        }
    }

    // ── Sport alloy wheel (AI car) ────────────────────────────────────────────
    #drawSportWheel(ctx, x, y, w, h) {
        const cx = x + w / 2, cy = y + h / 2;
        const outerR = Math.min(w, h) * 0.48;
        const innerR = outerR * 0.32;
        const spokeCount = 5;

        // Tyre
        ctx.fillStyle = "#111";
        this.#roundRect(ctx, x, y, w, h, 3);
        ctx.fill();

        // Rim face
        ctx.fillStyle = "#d0d0d0";
        ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2); ctx.fill();

        // Spokes (Y-spoke / star design)
        ctx.fillStyle = "#b0b0b0";
        for (let s = 0; s < spokeCount; s++) {
            const a = (s / spokeCount) * Math.PI * 2 - Math.PI / 2;
            const a1 = a - 0.2, a2 = a + 0.2;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a1) * innerR, cy + Math.sin(a1) * innerR);
            ctx.lineTo(cx + Math.cos(a)  * outerR * 0.92, cy + Math.sin(a) * outerR * 0.92);
            ctx.lineTo(cx + Math.cos(a2) * innerR, cy + Math.sin(a2) * innerR);
            ctx.closePath();
            ctx.fill();
        }

        // Brake disc peek (dark circle between spokes)
        ctx.fillStyle = "#777";
        ctx.beginPath(); ctx.arc(cx, cy, outerR * 0.55, 0, Math.PI * 2); ctx.fill();

        // Centre hub
        ctx.fillStyle = "#ccc";
        ctx.beginPath(); ctx.arc(cx, cy, innerR * 0.6, 0, Math.PI * 2); ctx.fill();

        // Rim edge
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, outerR, 0, Math.PI * 2); ctx.stroke();
    }

    // ── Utility: rounded rectangle path ──────────────────────────────────────
    #roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
}
