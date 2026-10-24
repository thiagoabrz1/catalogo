// PEGÁ AQUÍ EL ENLACE CSV PUBLICADO DE TU GOOGLE SHEETS:
const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlDtBXDAZkCm1yfEuFr5qoRcNKqO_5Rp6XwfjkFR2lgZYQkQ0UXi21MArfslU8aem-M0ttmd9Lt2ak/pub?gid=1478131743&single=true&output=csv';

const INTERVALO_ACTUALIZACION_MS = 60000; // Revisa cambios cada 60 segundos
let ultimoHashDatos = '';

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keyup', filtrarTabla);

  cargarDesdeGoogleSheets();
  setInterval(cargarDesdeGoogleSheets, INTERVALO_ACTUALIZACION_MS);
});

function cargarDesdeGoogleSheets() {
  const syncStatus = document.getElementById('syncStatus');

  // Agregamos un parámetro de tiempo para evitar que el navegador guarde una versión vieja en caché
  const urlSinCache = GOOGLE_SHEET_CSV_URL.includes('?')
    ? `${GOOGLE_SHEET_CSV_URL}&t=${Date.now()}`
    : `${GOOGLE_SHEET_CSV_URL}?t=${Date.now()}`;

  Papa.parse(urlSinCache, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      const filas = results.data;

      // Filtrar únicamente productos con código, con imagen y con stock > 0
      const validos = filas.filter(r => {
        const img = (r['Imagen'] || r['IMAGEN 2'] || '').trim();
        const stockRaw = String(r['Stock'] || r['cantidad'] || '0').replace(',', '.');
        const stock = parseFloat(stockRaw);
        const codigo = (r['codigo'] || '').trim();

        return codigo !== '' && img.startsWith('http') && !isNaN(stock) && stock > 0;
      });

      const nuevoHash = JSON.stringify(validos);
      if (nuevoHash !== ultimoHashDatos) {
        ultimoHashDatos = nuevoHash;
        renderizarTabla(validos);
      }

      const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
      syncStatus.textContent = `Actualizado: ${hora}`;
    },
    error: function(err) {
      console.error('Error al leer Google Sheets:', err);
      syncStatus.textContent = 'Error de conexión';
    }
  });
}

function limpiarNumero(valor) {
  if (valor === undefined || valor === null) return NaN;
  const limpio = String(valor)
    .replace(/\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(limpio);
}

function renderizarTabla(productos) {
  const tbody = document.getElementById('tablaBody');
  const titulo = document.getElementById('tituloCatalogo');

  titulo.textContent = `Listado de Productos — ${productos.length} Artículos en Stock`;

  tbody.innerHTML = productos.map(r => {
    const img = (r['Imagen'] || r['IMAGEN 2']).trim();
    const codigo = r['codigo'].trim();
    const nombre = escaparHTML((r['Nombre'] || r['descripcion'] || '').trim());

    const stock = Math.floor(parseFloat(String(r['Stock'] || r['cantidad']).replace(',', '.')));
    const stockClass = stock <= 2 ? 'low-stock' : 'in-stock';

    let precioNum = limpiarNumero(r['Columna 1'] || r['precio venta']);
    if (isNaN(precioNum)) {
      precioNum = limpiarNumero(r['Precio']);
    }

    const precioStr = !isNaN(precioNum)
      ? '$' + Math.round(precioNum).toLocaleString('es-AR')
      : 'Consultar';

    return `
      <tr>
        <td><img src="${img}" alt="${nombre}" class="product-img" loading="lazy"></td>
        <td class="code-cell"><span class="code-badge">${codigo}</span></td>
        <td class="name-cell">${nombre}</td>
        <td class="qty-cell"><span class="stock-badge ${stockClass}">${stock}</span></td>
        <td class="price-cell">${precioStr}</td>
      </tr>`;
  }).join('');

  filtrarTabla();
}

function filtrarTabla() {
  const filtro = document.getElementById('searchInput').value.toUpperCase();
  const filas = document.getElementById('tablaBody').getElementsByTagName('tr');

  for (let i = 0; i < filas.length; i++) {
    const tdCodigo = filas[i].getElementsByTagName('td')[1];
    const tdNombre = filas[i].getElementsByTagName('td')[2];
    if (tdCodigo && tdNombre) {
      const texto = `${tdCodigo.textContent} ${tdNombre.textContent}`.toUpperCase();
      filas[i].style.display = texto.includes(filtro) ? '' : 'none';
    }
  }
}

function escaparHTML(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}