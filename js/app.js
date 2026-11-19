// Dirección de la API (la levanta app.py)
const API_URL = 'http://127.0.0.1:5001/api/prompts';

const form = document.getElementById('form-prompt');
const btnSave = document.getElementById('btn-save');
const nameInput = document.getElementById('prompt-name');
const textInput = document.getElementById('prompt-text');
const mensajeForm = document.getElementById('mensaje-form');
const container = document.getElementById('prompts-container');
const statusEl = document.getElementById('status');

const SIN_CONEXION = 'Sin conexión con la API: enciende MySQL en XAMPP y corre "python app.py".';

function mostrarEstado(mensaje, esError = false) {
    statusEl.textContent = mensaje;
    statusEl.classList.toggle('error', esError);
}

// ---------- Peticiones a la API ----------
async function pedir(url, opciones = {}) {
    let respuesta;
    try {
        respuesta = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...opciones
        });
    } catch {
        throw new Error(SIN_CONEXION);
    }
    const datos = await respuesta.json().catch(() => ({}));
    if (!respuesta.ok) {
        throw new Error(datos.error || 'La API respondió con un error.');
    }
    return datos;
}

// ---------- Tarjetas ----------
function crearTarjeta(prompt) {
    const card = document.createElement('div');
    card.className = 'prompt-card';
    card.innerHTML = `
        <div class="prompt-card-header">
            <h3>${escapeHtml(prompt.nombre)}</h3>
            <button class="btn-delete" type="button">Eliminar</button>
        </div>
        <p>${escapeHtml(prompt.contenido)}</p>
    `;
    const btnDelete = card.querySelector('.btn-delete');
    btnDelete.setAttribute('aria-label', `Eliminar ${prompt.nombre}`);
    btnDelete.addEventListener('click', () => eliminar(prompt.id, card));
    return card;
}

function pintar(lista) {
    container.innerHTML = '';
    if (lista.length === 0) {
        container.innerHTML = '<p class="empty">Tu monedero está vacío. Guarda tu primer prompt.</p>';
        return;
    }
    lista.forEach(p => container.appendChild(crearTarjeta(p)));
}

// ---------- Acciones ----------
async function cargar() {
    try {
        const lista = await pedir(API_URL);
        mostrarEstado('Conectado a la base de datos.');
        pintar(lista);
    } catch (error) {
        mostrarEstado(error.message, true);
    }
}

form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const nombre = nameInput.value.trim();
    const contenido = textInput.value.trim();

    if (!nombre || !contenido) {
        mensajeForm.textContent = 'Por favor completa ambos campos.';
        (nombre ? textInput : nameInput).focus();
        return;
    }

    btnSave.disabled = true;
    mensajeForm.textContent = '';
    try {
        const nuevo = await pedir(API_URL, {
            method: 'POST',
            body: JSON.stringify({ nombre, contenido })
        });
        const vacio = container.querySelector('.empty');
        if (vacio) vacio.remove();
        container.prepend(crearTarjeta(nuevo));
        mostrarEstado('Conectado a la base de datos.');
        form.reset();
        nameInput.focus();
    } catch (error) {
        mensajeForm.textContent = error.message;
    } finally {
        btnSave.disabled = false;
    }
});

async function eliminar(id, card) {
    if (!confirm('¿Eliminar este prompt?')) return;
    try {
        await pedir(`${API_URL}/${id}`, { method: 'DELETE' });
        card.remove();
        if (!container.querySelector('.prompt-card')) pintar([]);
    } catch (error) {
        mostrarEstado(error.message, true);
    }
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

cargar();
