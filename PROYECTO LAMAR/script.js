// ==================== ESTADO ====================
const estado = {
    pantalla: "menu",
    puntuacion: 0,
    juegoActivo: false,
    jugador: { x: 180, y: 520, ancho: 40, alto: 40 },
    proyectiles: [],
    npcs: [],
    vidas: 3,
};

const teclasPresionadas = {};

// ==================== INPUT ====================
document.addEventListener("keydown", function (e) {
    teclasPresionadas[e.code] = true;
    if (estado.juegoActivo && e.code === "Space") disparar();
    if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
});

document.addEventListener("keyup", function (e) {
    teclasPresionadas[e.code] = false;
});

// ==================== LÓGICA DE MOVIMIENTO ====================
function moverJugador() {
    const vel = 6;
    if (teclasPresionadas["ArrowLeft"] || teclasPresionadas["KeyA"]) estado.jugador.x -= vel;
    if (teclasPresionadas["ArrowRight"] || teclasPresionadas["KeyD"]) estado.jugador.x += vel;
    if (teclasPresionadas["ArrowUp"] || teclasPresionadas["KeyW"]) estado.jugador.y -= vel;
    if (teclasPresionadas["ArrowDown"] || teclasPresionadas["KeyS"]) estado.jugador.y += vel;

    if (estado.jugador.x < 0) estado.jugador.x = 0;
    if (estado.jugador.x > 360) estado.jugador.x = 360;
    if (estado.jugador.y < 0) estado.jugador.y = 0;
    if (estado.jugador.y > 560) estado.jugador.y = 560;
}

function disparar() {
    const nuevaBala = {
        x: estado.jugador.x + 15,
        y: estado.jugador.y,
        ancho: 10,
        alto: 20
    };
    estado.proyectiles.push(nuevaBala);
}

// ==================== BUCLES Y LÓGICA ====================

function manejarProyectiles() {
    for (let i = estado.proyectiles.length - 1; i >= 0; i--) {
        estado.proyectiles[i].y -= 8;
        if (estado.proyectiles[i].y < -20) {
            estado.proyectiles.splice(i, 1);
        }
    }
}

function manejarNPCs() {
    if (Math.random() < 0.02) generarNPC();

    for (let i = estado.npcs.length - 1; i >= 0; i--) {
        const npc = estado.npcs[i];
        npc.y += npc.velocidad;

        if (comprobarColisionJugador(npc, i)) continue;
        if (comprobarColisionBalas(npc, i)) continue;
        if (comprobarSalidaMapa(npc, i)) continue;
    }
}

function comprobarColisionJugador(npc, indice) {
    if (rectIntersect(estado.jugador, npc)) {
        if (npc.tipo === "enemigo") {
            estado.vidas--;
        } else {
            estado.puntuacion += 15;
        }
        estado.npcs.splice(indice, 1);
        return true;
    }
    return false;
}

function comprobarColisionBalas(npc, indiceNPC) {
    for (let j = estado.proyectiles.length - 1; j >= 0; j--) {
        if (rectIntersect(estado.proyectiles[j], npc)) {
            if (npc.tipo === "enemigo") {
                estado.puntuacion += 10;
            } else {
                estado.puntuacion = Math.max(0, estado.puntuacion - 25);
            }
            estado.npcs.splice(indiceNPC, 1);
            estado.proyectiles.splice(j, 1);
            return true;
        }
    }
    return false;
}

function comprobarSalidaMapa(npc, indice) {
    if (npc.y > 600) {
        if (npc.tipo === "enemigo") {
            estado.vidas--;
        } else {
            estado.puntuacion += 20;
        }
        estado.npcs.splice(indice, 1);
        return true;
    }
    return false;
}

function generarNPC() {
    const esVerde = Math.random() < 0.6;
    const nuevoNPC = {
        x: Math.random() * 360,
        y: -40,
        ancho: 40,
        alto: 40,
        tipo: esVerde ? "enemigo" : "amigo",
        color: esVerde ? "#4CAF50" : "#2196F3", // Verde y Azul
        velocidad: esVerde ? 2 : 1.5
    };
    estado.npcs.push(nuevoNPC);
}

function rectIntersect(a, b) {
    return a.x < b.x + b.ancho && a.x + a.ancho > b.x && a.y < b.y + b.alto && a.y + a.alto > b.y;
}

function reiniciarJuego() {
    estado.juegoActivo = false;
    estado.pantalla = "menu";
    estado.vidas = 3;
    estado.puntuacion = 0;
    estado.npcs = [];
    estado.proyectiles = [];
    estado.jugador.x = 180;
    estado.jugador.y = 520;
    render();
}

// ==================== RENDER Y LOOP ====================

function render() {
    const app = document.getElementById("app");
    if (estado.pantalla === "menu") {
        app.innerHTML = `
            <div class="menu" style="text-align:center; color: white; background: #222; padding: 50px;">
                <h1>PROYECTO LAMAR</h1>
                <p>Usa las flechas / WASD y espacio para jugar</p>
                <button onclick="empezarJuego()">JUGAR</button>
            </div>`;
    } else {
        // 1. JUGADOR (Cubo rojo redondeado)
        let entidades = `
        <div style="position:absolute; left:${estado.jugador.x}px; top:${estado.jugador.y}px; width:40px; height:40px; background: #f44336; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`;

        // 2. PROYECTILES (Rectángulos amarillos redondeados)
        for (let p of estado.proyectiles) {
            entidades += `
                <div style="position:absolute; left:${p.x}px; top:${p.y}px; width:${p.ancho}px; height:${p.alto}px; background: #ffeb3b; border-radius: 4px;"></div>`;
        }

        // 3. NPCs (Cubos verdes/azules redondeados)
        for (let n of estado.npcs) {
            entidades += `
                <div style="position:absolute; left:${n.x}px; top:${n.y}px; width:${n.ancho}px; height:${n.alto}px; background: ${n.color}; border-radius: 8px;"></div>`;
        }

        app.innerHTML = `
            <div style="position: relative; width: 400px; margin: auto; padding-top: 60px; font-family: sans-serif;">
                <div style="position: absolute; top: 10px; left: 0; width: 100%; display: flex; justify-content: space-between; align-items: center;">
                    <button onclick="volverMenu()" style="font-size:14px; padding:5px 10px; cursor:pointer;">Menú</button>
                    <div style="font-size: 20px;">${"❤️".repeat(estado.vidas)}</div>
                </div>
                <div style="position: relative; width: 400px; height: 600px; border: 4px solid #444; background: #1a1a1a; overflow: hidden; border-radius: 10px;">
                    ${entidades}
                </div>
                <div style="text-align: center; margin-top: 10px; font-size: 20px; font-weight: bold;">PUNTOS: ${estado.puntuacion}</div>
            </div>`;
    }
}

function empezarJuego() {
    estado.pantalla = "juego";
    estado.juegoActivo = true;
    render();
}

function volverMenu() {
    estado.juegoActivo = false;
    estado.pantalla = "menu";
    render();
}

function loop() {
    if (estado.juegoActivo) {
        moverJugador();
        manejarProyectiles();
        manejarNPCs();
        if (estado.vidas <= 0) reiniciarJuego();
        render();
    }
    requestAnimationFrame(loop);
}

render();
loop();