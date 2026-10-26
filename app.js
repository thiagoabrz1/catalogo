// 1. CONFIGURACIÓN DE SUPABASE (Pegá tus credenciales aquí)
const SUPABASE_URL = 'https://ivysgmedgkjrlcbrtvmc.supabase.co/';
const SUPABASE_ANON_KEY = 'sb_publishable_WMPaqbMHwwCsYN6vvlm0zw_6-H-hUj-';

// Inicializar el cliente de Supabase
const clienteSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('keyup', filtrarTabla);

  cargarCatalogo();
  
  // Refresca la tabla cada 60 segundos por si hiciste ventas o cambiaste precios
  setInterval(cargarCatalogo, 60000); 
});

async function cargarCatalogo() {
  const syncStatus = document.getElementById('syncStatus');

  try {
    // Usamos clienteSupabase en lugar de supabase
    const { data: productos, error } = await clienteSupabase
      .from('productos')
      .select('codigo, nombre, imagen, stock, precio_venta')
      .gt('stock', 0)
      .not('imagen', 'is', null)
      .neq('imagen', '')
      .order('codigo', { ascending: true });

    // ... el resto de tu código queda igual

    if (error) throw error;

    renderizarTabla(productos);

    const hora = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    syncStatus.textContent = `Sincronizado: ${hora}`;
  } catch (err) {
    console.error('Error al leer Supabase:', err.message);
    syncStatus.textContent = 'Error de conexión';
  }
}

function renderizarTabla(productos) {
  const tbody = document.getElementById('tablaBody');
  const titulo = document.getElementById('tituloCatalogo');

  titulo.textContent = `Listado de Productos — ${productos.length} Artículos en Stock`;

  tbody.innerHTML = productos.map(producto => {
    const stockClass = producto.stock <= 2 ? 'low-stock' : 'in-stock';
    
    // Formatear precio
    const precioStr = (producto.precio_venta && producto.precio_venta > 0)
      ? '$' + Math.round(producto.precio_venta).toLocaleString('es-AR')
      : 'Consultar';

    return `
      <tr>
        <td><img src="${producto.imagen}" alt="${escaparHTML(producto.nombre)}" class="product-img" loading="lazy"></td>
        <td class="code-cell"><span class="code-badge">${producto.codigo}</span></td>
        <td class="name-cell">${escaparHTML(producto.nombre)}</td>
        <td class="qty-cell"><span class="stock-badge ${stockClass}">${producto.stock}</span></td>
        <td class="price-cell">${precioStr}</td>
      </tr>`;
  }).join('');

  // Mantener el filtro aplicado si el usuario estaba escribiendo
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
  if (!texto) return '';
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}