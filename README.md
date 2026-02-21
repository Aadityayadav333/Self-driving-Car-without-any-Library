# 🚗 Self-Driving Car — No Libraries, Pure JavaScript

> A fully self-learning autonomous car simulation built from scratch using vanilla JavaScript, a hand-coded neural network, and a genetic evolution algorithm. No TensorFlow. No ML libraries. Just math, canvas, and neurons.

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow?style=for-the-badge&logo=javascript)
![No Libraries](https://img.shields.io/badge/No%20Libraries-100%25%20Vanilla-green?style=for-the-badge)
![Neural Network](https://img.shields.io/badge/Neural%20Network-Handcoded-purple?style=for-the-badge)
![Responsive](https://img.shields.io/badge/Responsive-Mobile%20%26%20Desktop-blue?style=for-the-badge)

---

## 📸 Preview

The car starts with random weights and evolves over generations — learning to dodge traffic and navigate through increasingly dense obstacle patterns.

```
Generation 1: Random chaos 🤪
Generation 5: Starts avoiding walls 🙂
Generation 15+: Weaving through traffic like a pro 🏁
```

---

## ✨ Features

- **Hand-built Neural Network** — Feedforward network with configurable layers, weights, biases, and mutation
- **Genetic Evolution** — The best-performing brain is saved and mutated across generations
- **Ray-cast Sensor System** — 9 sensors with 135° field of view detect road borders and dummy cars
- **Real-time Neural Visualizer** — Live animated network graph showing node activations and weights
- **Auto-restart Generations** — When all cars die, the best brain is preserved and a new generation spawns automatically
- **Fully Responsive** — Works on desktop, mobile portrait, and mobile landscape
- **LocalStorage Brain Persistence** — Save and reload your best-performing brain across sessions

---

## 🛠️ Tech Stack

| Layer | Details |
|---|---|
| Language | Vanilla JavaScript (ES2022, no transpiler) |
| Rendering | HTML5 Canvas API (2D) |
| AI | Custom neural network + genetic algorithm |
| Storage | `localStorage` for brain persistence |
| Styling | Pure CSS3 with responsive media queries |

---

## 🚀 Getting Started

### Prerequisites

All you need is a modern browser. No Node.js. No npm. No build step.

### Running Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/Aadityayadav333/Self-driving-Car-without-any-Library.git
   cd self-driving-car-no-library
   ```

2. **Open in browser**

   Simply open `index.html` directly in your browser:
   ```bash
   # On macOS
   open index.html

   # On Linux
   xdg-open index.html

   # On Windows
   start index.html
   ```
   
   Or use a local dev server (recommended to avoid any CORS quirks):
   ```bash
   # Using Python
   python -m http.server 8080

   # Using VS Code Live Server extension — just click "Go Live"
   ```

3. **Navigate to** `http://localhost:8080` and watch the cars evolve!

---

## 🎮 How to Use

### Controls

| Button | Action |
|---|---|
| 💾 **Save** | Saves the current best brain to `localStorage` |
| 🗑️ **Discard** | Clears the saved brain (resets training) |
| 🧠 **Network** | Toggles the neural network visualizer (useful on mobile) |

### Training Workflow

1. Open the app — 500 cars spawn with random brains (or your saved brain + mutations)
2. Watch the swarm attempt to navigate traffic
3. When all cars are destroyed, the best brain auto-saves and the next generation begins
4. After a few generations of improvement, click **💾 Save** to permanently store the best brain
5. Refresh the page — your trained brain continues evolving from where it left off

### Reading the Visualizer

- **Yellow rays** — Active sensor beams; shorter = obstacle detected closer
- **Orange dots** — Sensor hit points on walls/cars
- **Network graph** — Green connections = positive weights, Red = negative
- **Node brightness** — Shows current activation value (0 or 1)
- **Dashed rings** — Node bias values

---

## 🧠 How It Works

### Neural Network Architecture

```
Input Layer:   9 nodes  (one per sensor ray)
Hidden Layer1: 12 nodes (ReLU-style threshold activation)
Hidden Layer2:  8 nodes
Output Layer:   4 nodes (Forward, Left, Right, Reverse)
```

Each sensor outputs a value from `0` (no obstacle) to `1` (obstacle at car's nose). The network processes these and fires binary steering commands.

### Genetic Algorithm

```
1. Spawn N=500 cars with the saved best brain
2. Mutate each copy with tiered mutation rates:
     Top 10%  → 5%  mutation  (preserve good brains)
     Next 40% → 15% mutation  (fine tuning)
     Bottom 50% → 40% mutation (aggressive exploration)
3. Run the simulation — track each car's distance traveled as fitness
4. When all cars die → save the farthest car's brain
5. Repeat from step 1 (next generation)
```

### Sensor Ray Casting

Each of the 9 rays projects outward from the car at angles spread across a 135° arc (car-relative). When a ray intersects a road border or a dummy car polygon, the offset value (0–1) is used as a network input.

---

## 📁 File Structure

```
self-driving-car-no-library/
│
├── index.html      # App shell, canvas elements, script tags
├── style.css       # Responsive layout, dark theme, animations
│
├── main.js         # Entry point: init, animation loop, auto-restart, stats
├── car.js          # Car class: physics, polygon, damage detection
├── road.js         # Road rendering and lane center calculations
├── sensor.js       # Ray casting and obstacle detection
├── controls.js     # Keyboard input + AI / DUMMY control modes
├── network.js      # NeuralNetwork and Level classes
├── visualizer.js   # Real-time canvas network graph renderer
└── utils.js        # lerp(), getIntersection(), polyIntersect(), getRGBA()
```

---

## 🐛 Bugs Fixed (from original codebase)

### 1. 🔴 Critical — Broken Sensor Ray Angles (`sensor.js`)
**Problem:** The car's angle was incorrectly added to the loop index fraction `i/(rayCount-1)` instead of to the fully interpolated ray angle. This caused rays to rotate incorrectly relative to the car, making the network receive completely wrong spatial inputs.

```js
// ❌ Original (broken):
const rayAngle = lerp(
    this.raySpread / 2,
    -this.raySpread / 2,
    this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1) + this.car.angle  // ← angle added to wrong value
);

// ✅ Fixed:
const rayAngle = lerp(
    this.raySpread / 2,
    -this.raySpread / 2,
    this.rayCount === 1 ? 0.5 : i / (this.rayCount - 1)
) + this.car.angle;  // ← angle added to full interpolated result
```

**Impact:** Without this fix the car was essentially "blind" — sensors pointed in wrong directions, making the neural network train on garbage data. This single bug was the primary reason the car could never pass traffic reliably.

---

### 2. 🔴 Critical — Dead Code in `getLaneCenter()` (`road.js`)
**Problem:** The correct lane center formula was written on the line *after* a `return` statement, making it unreachable. The function returned only a partial calculation.

```js
// ❌ Original (broken):
getLaneCenter(laneIndex) {
    const laneWidth = this.width / this.laneCount;
    return this.left + laneWidth / 2 + laneIndex * laneWidth;  // ← returns here
        Math.min(laneIndex, this.laneCount-1) * laneWidth;     // ← DEAD CODE, never runs
}

// ✅ Fixed:
getLaneCenter(laneIndex) {
    const laneWidth = this.width / this.laneCount;
    return this.left + laneWidth / 2 +
        Math.min(laneIndex, this.laneCount - 1) * laneWidth;
}
```

**Impact:** Cars and traffic were placed in incorrect lane positions, causing phantom collisions and making training nearly impossible.

---

### 3. 🟡 Logic — Wrong Activation Function for Output Layer (`network.js`)
**Problem:** The output layer used a sigmoid function (`1 / (1 + Math.exp(-sum))`), producing soft values like `0.51` or `0.49`. Since steering is a binary on/off decision, this caused the car to "half-steer" all the time.

```js
// ❌ Original (mushy sigmoid for binary controls):
level.outputs[i] = 1 / (1 + Math.exp(-sum));

// ✅ Fixed (clean step function):
level.outputs[j] = sum > level.biases[j] ? 1 : 0;
```

**Impact:** Controls were perpetually at half-activation, making the car sluggish and unable to make sharp evasive maneuvers.

---

### 4. 🟡 Logic — Uniform Mutation Rate Too Aggressive
**Problem:** All 300 cars mutated at 30%, including the elite brain. This meant good solutions were regularly destroyed before being exploited.

```js
// ❌ Original:
NeuralNetwork.mutate(cars[i].brain, 0.3); // same rate for all

// ✅ Fixed (tiered rates):
const mutationRate = i < N * 0.1 ? 0.05 : i < N * 0.5 ? 0.15 : 0.4;
NeuralNetwork.mutate(cars[i].brain, mutationRate);
```

---

### 5. 🟢 Minor — No Mobile or Responsive Layout
**Problem:** Canvas sizes were hardcoded (`carCanvas.width = 200`, `networkCanvas.width = 300`). On mobile the layout was unusable.

**Fix:** Full responsive layout system with CSS media queries for portrait/landscape mobile and desktop, dynamic canvas sizing on load and resize, and a toggle button to hide the visualizer on small screens.

---

### 6. 🟢 Minor — `bestCar` Selected by Raw `y` Coordinate, Inconsistently
**Problem:** `bestCar` was found with `Math.min(...cars.map(c=>c.y))` which spreads a 500-element array into function arguments — a potential stack overflow with large populations. Also done after the draw phase, causing a one-frame lag.

**Fix:** Added a `fitness` property to each car (`fitness = -this.y`) and use `Array.reduce()` for efficient single-pass selection before drawing.

---

## 🔮 Possible Enhancements

- [ ] Add a speed boost for cars that travel farther without crashing
- [ ] Crossover / recombination between top-N brains (true genetic algorithm)
- [ ] Variable traffic speed / density levels
- [ ] Leaderboard of best generation scores
- [ ] Export/import brain as JSON file
- [ ] Touch joystick for manual driving mode on mobile

---


## 🙏 Inspiration

Inspired by [Radu Mariescu-Istodor](https://www.youtube.com/@Radu)'s amazing self-driving car tutorial series. This version extends that foundation with bug fixes, a deeper network, better sensors, tiered mutation, auto-generation evolution, and full mobile responsiveness.

---

<div align="center">
  <sub>Built with 🧠 neurons and 🚗 pixels. No libraries harmed in the making of this project.</sub>
</div>
