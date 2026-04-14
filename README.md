# Concurso de Arte — Sistema de Votación
**Colegio Marymount Medellín**

Aplicación web de votación para concursos de arte. Frontend en HTML/CSS/JS puro (GitHub Pages), backend en Google Apps Script + Google Sheets.

---

## Estructura del proyecto

```
art-vote/
├── index.html          ← Registro del votante
├── vote.html           ← Interfaz de votación
├── thankyou.html       ← Confirmación post-voto
├── results.html        ← Resultados en tiempo real (público)
├── images/             ← Fotos de las obras (JPG) / SVG de ejemplo
├── css/style.css       ← Diseño visual (no editar)
├── js/
│   ├── config.js       ← ★ ÚNICO archivo que el admin edita
│   └── app.js          ← Lógica de la app (no editar)
└── apps-script/
    └── Code.gs         ← Backend completo en Apps Script
```

---

## 1. Configurar el backend (Google Apps Script)

### Paso 1 — Crear la hoja de cálculo

1. Ve a [Google Sheets](https://sheets.google.com) y crea una hoja nueva.
2. Nómbrala como quieras (p.ej. `Votación Arte Marymount`).
3. Crea manualmente dos hojas dentro del archivo:

   **Hoja `Config`** (solo una fila):
   | A | B |
   |---|---|
   | voting_open | TRUE |

   **Hoja `Votes`** (headers en fila 1):
   | timestamp | name | email | school | cat1_1st | cat1_2nd | cat1_3rd | cat2_1st | cat2_2nd | cat2_3rd |
   |-----------|------|-------|--------|----------|----------|----------|----------|----------|----------|

   > También puedes dejar las hojas vacías y ejecutar la función `setupSheets()` del script (Paso 3) para que las cree automáticamente.

### Paso 2 — Crear el Apps Script

1. En la hoja de cálculo, ve a **Extensiones → Apps Script**.
2. Borra el contenido del editor (`Código.gs`).
3. Copia y pega todo el contenido del archivo `apps-script/Code.gs` de este proyecto.
4. Guarda el archivo (`Ctrl+S` / `Cmd+S`).

### Paso 3 — Inicializar las hojas (opcional)

Si las hojas aún no existen:
1. En el editor de Apps Script, selecciona la función `setupSheets` en el menú desplegable.
2. Haz clic en **Ejecutar**.
3. Acepta los permisos que se soliciten.

### Paso 4 — Desplegar como Web App

1. En el editor de Apps Script, haz clic en **Implementar → Nueva implementación**.
2. Haz clic en el ícono de engranaje ⚙ y selecciona **Aplicación web**.
3. Configura:
   - **Descripción:** `Votación Arte v1` (o cualquier nombre)
   - **Ejecutar como:** `Yo` (tu cuenta de Google)
   - **Quién tiene acceso:** `Cualquier persona` (anyone, even anonymous)
4. Haz clic en **Implementar**.
5. **Copia la URL** que aparece. Se ve así:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

### Paso 5 — Pegar la URL en config.js

Abre `js/config.js` y reemplaza la línea:

```js
scriptURL: "PASTE_YOUR_APPS_SCRIPT_URL_HERE",
```

con la URL copiada:

```js
scriptURL: "https://script.google.com/macros/s/TU_ID_AQUI/exec",
```

> ⚠️ **Importante:** cada vez que hagas cambios en `Code.gs`, debes crear una **nueva implementación** (no actualizar la misma) para que los cambios surtan efecto en producción.

---

## 2. Personalizar el concurso

Edita únicamente el archivo `js/config.js`:

```js
const CONFIG = {
  scriptURL: "https://script.google.com/...",   // URL del backend

  category1Name: "Pintura",                      // Nombre de la categoría 1
  category2Name: "Dibujo",                       // Nombre de la categoría 2

  categories: [
    {
      id: "cat1",
      nameKey: "category1Name",
      pieces: [
        { id: "cat1_p1", title: "Mi Obra",   artist: "Nombre Estudiante", school: "Grado 10" },
        // ... más obras
      ]
    },
    // ... categoría 2
  ]
};
```

- El campo `id` de cada obra debe coincidir con el nombre del archivo de imagen (sin extensión).
- Los cambios surten efecto inmediatamente; no se necesita tocar ningún otro archivo.

---

## 3. Abrir y cerrar la votación

La votación se controla desde la hoja de cálculo:

| Hoja | Celda | Valor | Efecto |
|------|-------|-------|--------|
| Config | B1 | `TRUE` | Votación **abierta** |
| Config | B1 | `FALSE` | Votación **cerrada** |

1. Ve a la hoja de cálculo → pestaña **Config**.
2. Edita la celda **B1**:
   - Escribe `TRUE` para abrir la votación.
   - Escribe `FALSE` para cerrarla.
3. El cambio surte efecto en la siguiente solicitud de la app (no se requiere redesplegar el script).

En `results.html` se mostrará un badge:
- 🟢 **"Votación en progreso"** cuando B1 = TRUE
- 🔴 **"Votación cerrada"** cuando B1 = FALSE

---

## 4. Reemplazar las imágenes de ejemplo

Las imágenes de ejemplo son archivos `.svg` en la carpeta `images/`. Para reemplazarlas con fotos reales:

1. **Prepara tus imágenes** en formato JPG (recomendado: mínimo 600×600 px, proporción cuadrada).
2. **Nómbralas** exactamente igual al campo `id` de cada obra en `config.js`:
   ```
   images/cat1_p1.jpg
   images/cat1_p2.jpg
   images/cat1_p3.jpg
   images/cat2_p1.jpg
   images/cat2_p2.jpg
   images/cat2_p3.jpg
   ```
3. **Copia los archivos JPG** a la carpeta `images/`. La app carga `.jpg` con prioridad y usa `.svg` como respaldo si el JPG no existe.
4. Puedes eliminar los archivos `.svg` una vez que hayas subido todos los JPG.

> **Tip:** Optimiza las imágenes antes de subirlas (usa [Squoosh](https://squoosh.app) o similar) para mejorar la velocidad de carga en móviles.

---

## 5. Publicar en GitHub Pages

### Primer despliegue

```bash
# 1. Crea un repositorio en GitHub (puede ser privado o público)
#    Nombre sugerido: arte-marymount o similar

# 2. Inicializa git en la carpeta art-vote/
cd art-vote
git init
git add .
git commit -m "Initial commit: art contest voting app"

# 3. Conecta con tu repositorio
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git branch -M main
git push -u origin main
```

### Activar GitHub Pages

1. Ve a tu repositorio en GitHub.
2. Haz clic en **Settings → Pages**.
3. En **Source**, selecciona `Deploy from a branch`.
4. Elige la rama `main` y la carpeta `/ (root)`.
5. Haz clic en **Save**.
6. En ~1 minuto, tu sitio estará disponible en:
   ```
   https://TU_USUARIO.github.io/TU_REPO/
   ```

### Actualizar el sitio

```bash
# Después de cualquier cambio en los archivos:
git add .
git commit -m "Actualización: descripción del cambio"
git push
```

GitHub Pages se actualiza automáticamente en ~1 minuto tras cada push.

---

## Solución de problemas frecuentes

| Síntoma | Causa probable | Solución |
|---------|---------------|----------|
| "Error de conexión" al verificar email | `scriptURL` incorrecto o script no desplegado | Verifica la URL en `config.js` y que el script esté desplegado como "Anyone" |
| Las imágenes no cargan | Archivos JPG no subidos o nombre incorrecto | Verifica que los nombres coincidan exactamente con los `id` en `config.js` |
| Los votos no se guardan | `voting_open` es FALSE en Config sheet | Cambia la celda B1 a `TRUE` |
| "Este correo ya votó" siendo la primera vez | El email está en la hoja Votes de una prueba anterior | Borra las filas de prueba en la hoja Votes |
| El script pide permisos cada vez | Normal la primera vez | Acepta todos los permisos solicitados |
| Cambios en Code.gs no funcionan | Actualizaste sin crear nueva implementación | Crea una **nueva** implementación en Apps Script |

---

## Flujo de datos

```
Votante → index.html
  └─ POST check_email → Apps Script → Google Sheets (Votes)
       ├─ ok          → vote.html
       └─ already_voted → mostrar error

vote.html
  └─ POST submit_vote → Apps Script
       ├─ ok          → thankyou.html
       └─ error       → mostrar mensaje

results.html (público, sin login)
  └─ GET ?action=get_results → Apps Script → calcular puntajes → renderizar podio
       (se repite cada 30 segundos)
```

---

## Créditos

- Diseño: Colegio Marymount Medellín
- Iconos: [Heroicons](https://heroicons.com) (MIT License)
- Stack: Vanilla HTML/CSS/JS + Google Apps Script + Google Sheets
