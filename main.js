// ─── Canvas Setup ───────────────────────────────────────────────────────────
const carCanvas     = document.getElementById("carCanvas");
const networkCanvas = document.getElementById("networkCanvas");
const carCtx        = carCanvas.getContext("2d");
const networkCtx    = networkCanvas.getContext("2d");

// ─── Responsive sizing ──────────────────────────────────────────────────────
function resizeCanvases() {
    const isMobile = window.innerWidth <= 600;
    const isLandscapeMobile = window.innerWidth <= 900 && window.innerWidth > window.innerHeight;

    if (isMobile) {
        // Portrait mobile: car on top 60vh, network on bottom 40vh
        carCanvas.width  = window.innerWidth;
        carCanvas.height = window.innerHeight * 0.6 - 70; // minus controls/stats height
        networkCanvas.width  = window.innerWidth;
        networkCanvas.height = window.innerHeight * 0.4 - 30;
    } else {
        // Desktop / landscape: car on left ~250px, network fills rest
        const carPanelW = Math.min(280, window.innerWidth * 0.35);
        carCanvas.width  = carPanelW;
        carCanvas.height = window.innerHeight - 70;
        networkCanvas.width  = window.innerWidth - carPanelW;
        networkCanvas.height = window.innerHeight - 30;
    }
}

resizeCanvases();
window.addEventListener("resize", resizeCanvases);

// ─── Road ───────────────────────────────────────────────────────────────────
let road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

// ─── Traffic (dummy cars) ───────────────────────────────────────────────────
function generateTraffic() {
    return [
        new Car(road.getLaneCenter(1), -100,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(0), -300,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(2), -300,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(0), -500,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(1), -500,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(1), -700,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(2), -700,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(0), -900,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(1), -900,  30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(2), -1100, 30, 50, "DUMMY", 2),
        new Car(road.getLaneCenter(0), -1100, 30, 50, "DUMMY", 2),
    ];
}

// ─── AI Population ──────────────────────────────────────────────────────────
const N = 500; // Large population for robust evolution
let generation = 1;
let cars, traffic, bestCar;
let showVisualizer = true;

function generateCars(N) {
    const arr = [];
    for (let i = 0; i < N; i++) {
        arr.push(new Car(road.getLaneCenter(1), 100, 30, 50, "AI", 3.5));
    }
    return arr;
}

function init() {
    road  = new Road(carCanvas.width / 2, carCanvas.width * 0.9);
    cars  = generateCars(N);
    traffic = generateTraffic();
    bestCar = cars[0];

    // Load saved brain and mutate population
    if (localStorage.getItem("bestBrain")) {
        const savedBrain = JSON.parse(localStorage.getItem("bestBrain"));
        for (let i = 0; i < cars.length; i++) {
            cars[i].brain = JSON.parse(JSON.stringify(savedBrain)); // deep copy
            if (i !== 0) {
                // Elite gets low mutation, rest get higher variance
                const mutationRate = i < N * 0.1 ? 0.05 : i < N * 0.5 ? 0.15 : 0.4;
                NeuralNetwork.mutate(cars[i].brain, mutationRate);
            }
        }
    }
}

init();

// ─── Save / Discard ─────────────────────────────────────────────────────────
function save() {
    localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
    showToast("✅ Brain saved!");
}

function discard() {
    localStorage.removeItem("bestBrain");
    showToast("🗑️ Brain discarded. Restart to reset.");
}

function toggleVisualizer() {
    showVisualizer = !showVisualizer;
    const networkPanel = document.getElementById("networkPanel");
    networkPanel.classList.toggle("hidden", !showVisualizer);
    document.getElementById("vizToggle").textContent = showVisualizer ? "🧠 Network" : "🎮 Focus";
}

function showToast(msg) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        Object.assign(toast.style, {
            position: "fixed", bottom: "20px", left: "50%",
            transform: "translateX(-50%)", background: "#2a2a6a",
            color: "#adf", padding: "10px 20px", borderRadius: "10px",
            fontSize: "14px", fontWeight: "bold", zIndex: 999,
            border: "1px solid #44f", transition: "opacity 0.4s"
        });
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = "0"; }, 2000);
}

// ─── Auto-restart when all cars die ─────────────────────────────────────────
let autoRestartTimeout = null;

function checkAutoRestart() {
    const allDead = cars.every(c => c.damaged);
    if (allDead && !autoRestartTimeout) {
        autoRestartTimeout = setTimeout(() => {
            // Save best before restarting
            localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
            generation++;
            init();
            autoRestartTimeout = null;
        }, 800);
    }
}

// ─── Stats ───────────────────────────────────────────────────────────────────
function updateStats() {
    const alive = cars.filter(c => !c.damaged).length;
    const best  = Math.round(-bestCar.y);
    document.getElementById("genInfo").textContent   = `Gen: ${generation}`;
    document.getElementById("aliveInfo").textContent = `Alive: ${alive}`;
    document.getElementById("scoreInfo").textContent = `Score: ${best}`;
}

// ─── Animation loop ──────────────────────────────────────────────────────────
function animate(time) {
    // Update traffic
    for (let i = 0; i < traffic.length; i++) {
        traffic[i].update(road.borders, []);
    }

    // Update AI cars
    for (let i = 0; i < cars.length; i++) {
        cars[i].update(road.borders, traffic);
    }

    // Best car = farthest (most negative y = most advanced)
    bestCar = cars.reduce((best, car) =>
        car.fitness > best.fitness ? car : best, cars[0]);

    // Resize canvases responsively
    carCanvas.height    = carCanvas.height; // keep — don't reset on every frame
    networkCanvas.height = networkCanvas.height;

    // ── Draw car world ──────────────────────────────────────────────────────
    carCtx.clearRect(0, 0, carCanvas.width, carCanvas.height);
    carCtx.save();
    carCtx.translate(0, -bestCar.y + carCanvas.height * 0.65);

    road.draw(carCtx);

    for (let i = 0; i < traffic.length; i++) {
        traffic[i].draw(carCtx, "#e74c3c");
    }

    // Ghost cars (semi-transparent swarm)
    carCtx.globalAlpha = 0.15;
    for (let i = 0; i < cars.length; i++) {
        if (!cars[i].damaged) {
            cars[i].draw(carCtx, "#5dade2");
        }
    }
    carCtx.globalAlpha = 1;

    // Best car drawn fully with sensor
    bestCar.draw(carCtx, "#27ae60", true);

    carCtx.restore();

    // ── Draw network ────────────────────────────────────────────────────────
    if (showVisualizer) {
        networkCtx.clearRect(0, 0, networkCanvas.width, networkCanvas.height);
        networkCtx.lineDashOffset = -time / 50;
        Visualizer.drawNetwork(networkCtx, bestCar.brain);
    }

    updateStats();
    checkAutoRestart();

    requestAnimationFrame(animate);
}

animate();

// ─── Window resize: re-init road ─────────────────────────────────────────────
window.addEventListener("resize", () => {
    resizeCanvases();
    road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);
});
