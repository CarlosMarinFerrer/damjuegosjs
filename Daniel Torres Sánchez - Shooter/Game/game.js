let faseGlobal = 0;
let tiempoJuego = 0;
let puntos = 0;

const areaJugable = document.querySelector(".areaJugable");
const jugador = document.querySelector(".jugador");

const estadoJugador = {
    posX: 220,
    posY: 800,
    vidas: 3,
    ultiCargada: 3
};

const teclas = { w: false, a: false, s: false, d: false, j: false, k: false };
const velocidad = 5;

let cooldownDisparo = 0;
const tiempoEntreDisparos = 10;

let enemigos = [];
let jefe1 = null;
let jefe2 = null;

let tiempoSpawn = 0;
let spawnTimer = 0;
let spawnRate = 60;
let spawnBloqueado = false;

let jefe1Derrotado = false;

const columnasB = [
    areaJugable.offsetWidth * 0.25, // izquierda
    areaJugable.offsetWidth * 0.50, // centro
    areaJugable.offsetWidth * 0.75  // derecha
];

const hudVidas = document.querySelector(".hud-vidas");
const hudPuntos = document.querySelector(".hud-puntos");
const hudUlti = document.querySelector(".hud-ulti");

function bucle() {
    let velX = 0;
    let velY = 0;

    if (teclas.w) velY -= velocidad;
    if (teclas.s) velY += velocidad;
    if (teclas.a) velX -= velocidad;
    if (teclas.d) velX += velocidad;

    movimientoConColisiones(velX, velY);

    if (teclas.j && cooldownDisparo <= 0) {
        disparar();
        cooldownDisparo = tiempoEntreDisparos;
    }

    if (cooldownDisparo > 0) {
        cooldownDisparo--;
    }

    moverBalas();

    /*if (tiempoSpawn <= 0) {
        crearEnemigo();
        tiempoSpawn = spawnRate;
    } else {
        tiempoSpawn--;
    }

    moverEnemigos()
    detectarColisiones(); */

    manejarSpawns();
    moverEnemigos();
    moverJefe1();
    detectarColisiones();

    moverBalasEnemigas();
    disparoJefe1();
    disparoJefe2();
    detectarColisionJugador();
    detectarColisionJugadorConEnemigos();

    if (tiempoJuego === 3300) {
        spawnBloqueado = true;
    }

    if (tiempoJuego === 3600 && !jefe1) {
        spawnJefe1();
    }

    if (jefe1Derrotado && estadoJugador.vidas === 3 && estadoJugador.ultiCargada === 3 && !jefe2) {
        spawnJefe2();
    }

    tiempoJuego++;
    requestAnimationFrame(bucle);
}

function movimientoConColisiones(velX, velY) {
    const areaWidth = areaJugable.offsetWidth;
    const areaHeight = areaJugable.offsetHeight;

    estadoJugador.posX += velX;
    estadoJugador.posY += velY;

    if (estadoJugador.posX < 28) estadoJugador.posX = 28;
    if (estadoJugador.posX > areaWidth - 36) estadoJugador.posX = areaWidth - 36;
    if (estadoJugador.posY < 28) estadoJugador.posY = 28;
    if (estadoJugador.posY > areaHeight - 36) estadoJugador.posY = areaHeight - 36;

    jugador.style.left = estadoJugador.posX + "px";
    jugador.style.top = estadoJugador.posY + "px";
}

function disparar() {
    const bala = document.createElement("div");
    bala.classList.add("bala");

    bala.style.left = (estadoJugador.posX + jugador.offsetWidth / 2 - 3) + "px";
    bala.style.top = (estadoJugador.posY) + "px";

    areaJugable.appendChild(bala);
}

function usarUlti() {
    if (estadoJugador.ultiCargada <= 0) return;

    estadoJugador.ultiCargada--;

    const flash = document.createElement("div");
    flash.style.position = "absolute";
    flash.style.top = "0";
    flash.style.left = "0";
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.background = "white";
    flash.style.opacity = "0.8";
    flash.style.zIndex = "900";
    areaJugable.appendChild(flash);

    setTimeout(() => flash.remove(), 150);

    enemigos.forEach(e => {
        const boom = document.createElement("div");
        boom.classList.add("explosion");
        boom.style.left = e.x + "px";
        boom.style.top = e.y + "px";
        areaJugable.appendChild(boom);
        setTimeout(() => boom.remove(), 300);

        e.element.remove();
    });

    const balas = document.querySelectorAll(".balaEnemigo");
    balas.forEach(bala => {
        const bx = parseFloat(bala.style.left);
        const by = parseFloat(bala.style.top);

        const boom = document.createElement("div");
        boom.classList.add("explosion");
        boom.style.left = bx + "px";
        boom.style.top = by + "px";
        areaJugable.appendChild(boom);
        setTimeout(() => boom.remove(), 300);

        bala.remove();
    });

    enemigos = [];

    actualizarHUD();
}

function moverBalas() {
    const balas = document.querySelectorAll(".bala");

    balas.forEach(bala => {
        const y = parseFloat(bala.style.top);
        bala.style.top = (y - 10) + "px";

        if (y < -20) bala.remove();
    })
}

/*function crearEnemigo() {
    const enemigo = document.createElement("div");
    enemigo.classList.add("enemigo");

    const x = Math.random() * (areaJugable.offsetWidth - 30);
    enemigo.style.left = x + "px";
    enemigo.style.top = "-40px";

    areaJugable.appendChild(enemigo);
} */

function manejarSpawns() {
    if (spawnBloqueado) return;

    spawnTimer++;

    if (spawnTimer === 120) {
        spawnEnemigoA();
    }

    if (spawnTimer === 240) {
        spawnEnemigosB();
        spawnTimer = 0;
    }
}

function spawnEnemigoA() {
    const cantidad = 5;
    const espacio = areaJugable.offsetWidth / (cantidad + 1);

    for (let i = 0; i < cantidad; i++) {
        const enemigo = {
            tipo: "A",
            x: espacio * (i + 1),
            y: -40,
            velY: 2
        };

        const div = document.createElement("div");
        div.classList.add("enemigoA");
        div.style.left = enemigo.x + "px";
        div.style.top = enemigo.y + "px";

        enemigo.element = div;
        enemigos.push(enemigo);
        areaJugable.appendChild(div);
    }
}

function spawnEnemigosB() {
    const cantidad = 5;
    const espacio = areaJugable.offsetWidth / (cantidad + 1);
    const columna = columnasB[Math.floor(Math.random() * columnasB.length)];
    const faseBase = Math.random() * Math.PI * 2;
    const offset = 0.35;

    for (let i = 0; i < cantidad; i++) {
        const enemigo = {
            tipo: "B",
            columnaBase: columna,
            indiceOleada: i,
            x: columna,
            y: -40 - (i * 50),
            velY: 2,
            fase: faseBase + (i * offset)
        };

        const div = document.createElement("div");
        div.classList.add("enemigoB");
        div.style.left = enemigo.x + "px";
        div.style.top = enemigo.y + "px";

        enemigo.element = div;
        enemigos.push(enemigo);
        areaJugable.appendChild(div);
    }
}

function spawnJefe1() {
    jefe1 = {
        x: 200,
        y: -150,
        velX: 3,
        vida: 200,
        entrando: true,
        element: null
    };

    const div = document.createElement("div");
    div.classList.add("jefe1");
    div.style.left = jefe1.x + "px";
    div.style.top = jefe1.y + "px";

    jefe1.element = div;
    areaJugable.appendChild(div);
}

function spawnJefe2() {
    spawnBloqueado = true;

    jefe2 = {
        x: 150,
        y: 50,
        vida: 300,
        element: null
    };

    const div = document.createElement("div");
    div.classList.add("jefe2");
    div.style.left = jefe2.x + "px";
    div.style.top = jefe2.y + "px";

    jefe2.element = div;
    areaJugable.appendChild(div);
}

function moverEnemigos() {
    faseGlobal += 0.1;

    enemigos.forEach((enemigo, index) => {

        enemigo.y += enemigo.velY;

        if (enemigo.tipo === "B") {
            const delay = enemigo.indiceOleada * 0.8;
            const amplitud = 80;

            enemigo.x = enemigo.columnaBase + Math.sin(faseGlobal - delay) * amplitud;
        }

        if (enemigo.tipo === "B" && Math.random() < 0.02) {
            disparoEnemigo(enemigo);
        }

        enemigo.element.style.left = enemigo.x + "px";
        enemigo.element.style.top = enemigo.y + "px";

        if (enemigo.y > areaJugable.offsetHeight + 50) {
            enemigo.element.remove();
            enemigos.splice(index, 1);
        }
    });
}

function moverJefe1() {
    if (!jefe1) return;

    if (jefe1.entrando) {
        jefe1.y += 2;

        if (jefe1.y >= 10) {
            jefe1.y = 10;
            jefe1.entrando = false;
        }

        jefe1.element.style.top = jefe1.y + "px";
        return;
    }

    jefe1.x += jefe1.velX;

    if (jefe1.x < 0 || jefe1.x > areaJugable.offsetWidth - 160) {
        jefe1.velX *= -1;
    }

    jefe1.element.style.left = jefe1.x + "px";
}

function disparoEnemigo(enemigo) {
    const bala = document.createElement("div");
    bala.classList.add("balaEnemigo");

    bala.style.left = enemigo.x + "px";
    bala.style.top = enemigo.y + "px";

    areaJugable.appendChild(bala);
}

function disparoJefe1() {
    if (!jefe1) return;

    if (Math.random() < 0.03) {
        for (let i = -1; i <= 1; i++) {
            const bala = document.createElement("div");
            bala.classList.add("balaEnemigo");
            bala.style.left = ((jefe1.x + 50) + i * 60) + "px";
            bala.style.top = (jefe1.y + 150) + "px";
            areaJugable.appendChild(bala);
        }
    }
}

function disparoJefe2() {
    if (!jefe2) return;

    if (Math.random() < 0.04) {
        for (let i = 0; i < 10; i++) {
            const bala = document.createElement("div");
            bala.classList.add("balaEnemigo");
            bala.style.left = (jefe2.x + i * 20) + "px";
            bala.style.top = (jefe2.y + 174) + "px";
            areaJugable.appendChild(bala);
        }
    }
}

function moverBalasEnemigas() {
    const balas = document.querySelectorAll(".balaEnemigo");

    balas.forEach(bala => {
        const y = parseFloat(bala.style.top);
        bala.style.top = (y + 6) + "px";

        if (y > areaJugable.offsetHeight + 20) {
            bala.remove();
        }
    });
}

function detectarColisiones() {
    const balas = document.querySelectorAll(".bala");

    balas.forEach(bala => {
        const bx = parseFloat(bala.style.left);
        const by = parseFloat(bala.style.top);

        enemigos.forEach((enemigo, index) => {
            const ex = enemigo.x;
            const ey = enemigo.y;

            const distancia = Math.hypot(bx - ex, by - ey);

            if (distancia < 20) {
                enemigo.element.remove();
                enemigos.splice(index, 1);
                bala.remove();
                puntos += 100;

                if (puntos % 10000 === 0 && estadoJugador.ultiCargada < 3) {
                    estadoJugador.ultiCargada++;
                }

                actualizarHUD();

                const boom = document.createElement("div");
                boom.classList.add("explosion");
                boom.style.left = ex + "px";
                boom.style.top = ey + "px";
                areaJugable.appendChild(boom);

                setTimeout(() => boom.remove(), 300);
            }
        })

        if (jefe1) {
            const cx = jefe1.x;
            const cy = jefe1.y + 20;

            const distanciaJ1 = Math.hypot(bx - cx, by - cy);
            if (distanciaJ1 < 55) {
                bala.remove();
                jefe1.vida -= 10;

                if (jefe1.vida <= 0) {
                    const boom = document.createElement("div");
                    boom.classList.add("explosion");
                    boom.style.left = jefe1.x + "px";
                    boom.style.top = jefe1.y + "px";
                    boom.style.transform = "scale(2)"
                    areaJugable.appendChild(boom);
                    setTimeout (() => boom.remove(), 300);

                    puntos += 5000;
                    jefe1.element.remove();
                    jefe1 = null;
                    jefe1Derrotado = true;
                    spawnBloqueado = false;
                }
            }
        }

        if (jefe2) {
            const distanciaJ2 = Math.hypot(bx - (jefe2.x + 100), by - (jefe2.y + 40));
            if (distanciaJ2 < 32) {
                bala.remove();
                jefe2.vida -= 10;

                if (jefe2.vida <= 0) {
                    const boom = document.createElement("div");
                    boom.classList.add("explosion");
                    boom.style.left = jefe2.x + "px";
                    boom.style.top = jefe2.y + "px";
                    boom.style.transform = "scale(3)"
                    areaJugable.appendChild(boom);
                    setTimeout (() => boom.remove(), 300);

                    puntos += 10000;
                    jefe2.element.remove();
                    jefe2 = null;
                    spawnBloqueado = false;
                }
            }
        }
    })
}

function detectarColisionJugadorConEnemigos() {
    enemigos.forEach((enemigo, index) => {
        const ex = enemigo.x + 15;
        const ey = enemigo.y + 15;

        const jx = estadoJugador.posX + 4;
        const jy = estadoJugador.posY + 4;

        const distancia = Math.hypot(ex - jx, ey - jy);

        if (distancia < 22) {
            enemigo.element.remove();
            enemigos.splice(index, 1);

            estadoJugador.vidas--;
            actualizarHUD();

            jugador.style.background = "yellow";
            setTimeout(() => jugador.style.background = "red", 150);

            if (estadoJugador.vidas <= 0) {
                explosionJugador();
                setTimeout(() => mostrarGameOver(), 400);
            }
        }
    });
}

function detectarColisionJugador() {
    const balas = document.querySelectorAll(".balaEnemigo");

    balas.forEach(bala => {
        const bx = parseFloat(bala.style.left);
        const by = parseFloat(bala.style.top);

        const jx = estadoJugador.posX;
        const jy = estadoJugador.posY;

        const distancia = Math.hypot(bx - jx, by - jy);

        if (distancia < 15) {
            bala.remove();
            estadoJugador.vidas--;
            actualizarHUD();

            jugador.style.background = "yellow";
            setTimeout(() => jugador.style.background = "red", 150);

            if (estadoJugador.vidas <= 0) {
                explosionJugador();
                setTimeout(() => mostrarGameOver(), 400);
            }
        }
    });
}

function actualizarHUD() {
    hudVidas.textContent = "Vidas: " + estadoJugador.vidas;
    hudPuntos.textContent = "Puntos: " + puntos;
    hudUlti.textContent = "Ulti: " + estadoJugador.ultiCargada + " / 3";
}

function explosionJugador() {
    const boom = document.createElement("div");
    boom.classList.add("explosion");

    boom.style.left = estadoJugador.posX + "px";
    boom.style.top = estadoJugador.posY + "px";

    areaJugable.appendChild(boom);

    jugador.style.display = "none";

    setTimeout(() => boom.remove(), 300);
}

function mostrarGameOver() {
    const pantalla = document.createElement("div");
    pantalla.classList.add("gameOverScreen");

    pantalla.innerHTML = `
        <div>GAME OVER</div>
        <div style="font-size:20px; margin-top:10px;">Puntos: ${puntos}</div>
    `;

    areaJugable.appendChild(pantalla);
}

document.addEventListener("keydown", (e) => {
    const tecla = e.key.toLowerCase();
    if (teclas.hasOwnProperty(tecla)) teclas[tecla] = true;
    if (tecla === "k") usarUlti();
});

document.addEventListener("keyup", (e) => {
    const tecla = e.key.toLowerCase();
    if (teclas.hasOwnProperty(tecla)) teclas[tecla] = false;
});

actualizarHUD();
bucle();
