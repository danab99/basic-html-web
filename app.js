const API_BASE_URL = "http://localhost:8080/api";

function mostrarAlerta(contenedor, mensaje, tipo = "success") {
  const alertaDiv = document.getElementById(contenedor);
  const iconos = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };

  alertaDiv.innerHTML = `
        <div class="alert alert-${tipo}">
            <i class="fas ${iconos[tipo]}"></i>
            <span>${mensaje}</span>
        </div>
    `;

  setTimeout(() => {
    alertaDiv.innerHTML = "";
  }, 5000);
}

function mostrarLoading(contenedor) {
  document.getElementById(contenedor).innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Cargando...</p>
        </div>
    `;
}

function formatearPrecio(precio) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(precio);
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mostrarSeccion(seccion) {
  document.getElementById("menuPrincipal").style.display = "none";

  document.querySelectorAll(".content-section").forEach((s) => {
    s.classList.remove("active");
  });

  const seccionId = `seccion${seccion.charAt(0).toUpperCase() + seccion.slice(1)}`;
  document.getElementById(seccionId).classList.add("active");

  if (seccion === "estadisticas") {
    cargarEstadisticas();
  }
}

function volverMenu() {
  document.getElementById("menuPrincipal").style.display = "grid";
  document.querySelectorAll(".content-section").forEach((s) => {
    s.classList.remove("active");
  });

  limpiarFormularios();
}

function limpiarFormularios() {
  document.getElementById("formularioProducto").classList.add("hidden");
  document.getElementById("buscarProducto").classList.add("hidden");
  document.getElementById("listaProductos").classList.add("hidden");
  document.getElementById("formularioPedido").classList.add("hidden");
  document.getElementById("listaPedidos").classList.add("hidden");
  document.getElementById("formProducto").reset();
  document.getElementById("productoId").value = "";
}

function mostrarFormularioProducto() {
  limpiarFormularios();
  document.getElementById("formularioProducto").classList.remove("hidden");
  document.getElementById("tituloFormProducto").textContent = "Agregar Nuevo Producto";
  document.getElementById("formProducto").reset();
  document.getElementById("productoId").value = "";
}

function cancelarFormProducto() {
  document.getElementById("formularioProducto").classList.add("hidden");
  document.getElementById("formProducto").reset();
}

async function guardarProducto(event) {
  event.preventDefault();

  const productoId = document.getElementById("productoId").value;
  const producto = {
    nombre: document.getElementById("nombre").value,
    descripcion: document.getElementById("descripcion").value,
    precio: parseFloat(document.getElementById("precio").value),
    categoria: document.getElementById("categoria").value,
    imagen: document.getElementById("imagen").value,
    stock: parseInt(document.getElementById("stock").value),
    disponible: true,
  };

  try {
    const url = productoId ? `${API_BASE_URL}/productos/${productoId}` : `${API_BASE_URL}/productos`;

    const method = productoId ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(producto),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.mensaje || "Error al guardar producto");
    }

    const accion = productoId ? "actualizado" : "agregado";
    mostrarAlerta("alertaProductos", `Producto ${accion} exitosamente`, "success");
    cancelarFormProducto();
    listarProductos();
  } catch (error) {
    mostrarAlerta("alertaProductos", error.message, "error");
  }
}

async function listarProductos() {
  limpiarFormularios();
  mostrarLoading("listaProductos");
  document.getElementById("listaProductos").classList.remove("hidden");

  try {
    const response = await fetch(`${API_BASE_URL}/productos`);
    if (!response.ok) throw new Error("Error al cargar productos");

    const productos = await response.json();

    if (productos.length === 0) {
      document.getElementById("listaProductos").innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <span>No hay productos registrados</span>
                </div>
            `;
      return;
    }

    let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

    productos.forEach((p) => {
      const estadoBadge = p.disponible
        ? '<span class="badge badge-success">Disponible</span>'
        : '<span class="badge badge-danger">No disponible</span>';

      const stockClass = p.stock <= 10 ? "badge-warning" : "badge-success";

      html += `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${p.nombre}</strong></td>
                    <td>${p.categoria}</td>
                    <td>${formatearPrecio(p.precio)}</td>
                    <td><span class="badge ${stockClass}">${p.stock}</span></td>
                    <td>${estadoBadge}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" style="background: #3498db;" onclick="editarProducto(${
                              p.id
                            })" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-icon" style="background: #e74c3c;" onclick="eliminarProducto(${p.id}, '${
        p.nombre
      }')" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    });

    html += "</tbody></table>";
    document.getElementById("listaProductos").innerHTML = html;
  } catch (error) {
    document.getElementById("listaProductos").innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.message}</span>
            </div>
        `;
  }
}

async function editarProducto(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`);
    if (!response.ok) throw new Error("Producto no encontrado");

    const producto = await response.json();

    document.getElementById("productoId").value = producto.id;
    document.getElementById("nombre").value = producto.nombre;
    document.getElementById("descripcion").value = producto.descripcion;
    document.getElementById("precio").value = producto.precio;
    document.getElementById("categoria").value = producto.categoria;
    document.getElementById("imagen").value = producto.imagen;
    document.getElementById("stock").value = producto.stock;

    document.getElementById("tituloFormProducto").textContent = "Editar Producto";
    document.getElementById("formularioProducto").classList.remove("hidden");
    document.getElementById("listaProductos").classList.add("hidden");
  } catch (error) {
    mostrarAlerta("alertaProductos", error.message, "error");
  }
}

async function eliminarProducto(id, nombre) {
  if (!confirm(`¿Está seguro de eliminar el producto "${nombre}"?`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) throw new Error("Error al eliminar producto");

    mostrarAlerta("alertaProductos", "Producto eliminado exitosamente", "success");
    listarProductos();
  } catch (error) {
    mostrarAlerta("alertaProductos", error.message, "error");
  }
}

function mostrarBuscarProducto() {
  limpiarFormularios();
  document.getElementById("buscarProducto").classList.remove("hidden");
  document.getElementById("buscarId").value = "";
  document.getElementById("resultadoBusqueda").innerHTML = "";
}

async function buscarProductoPorId() {
  const id = document.getElementById("buscarId").value;

  if (!id) {
    mostrarAlerta("alertaProductos", "Ingrese un ID válido", "warning");
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/productos/${id}`);
    if (!response.ok) throw new Error("Producto no encontrado");

    const producto = await response.json();

    const estadoBadge = producto.disponible
      ? '<span class="badge badge-success">Disponible</span>'
      : '<span class="badge badge-danger">No disponible</span>';

    document.getElementById("resultadoBusqueda").innerHTML = `
            <div style="border: 2px solid #ecf0f1; padding: 20px; border-radius: 12px;">
                <div style="display: grid; grid-template-columns: 200px 1fr; gap: 20px;">
                    <img src="${producto.imagen}" alt="${producto.nombre}" 
                         style="width: 100%; border-radius: 8px;" 
                         onerror="this.src='https://via.placeholder.com/200'">
                    <div>
                        <h3>${producto.nombre}</h3>
                        <p><strong>ID:</strong> ${producto.id}</p>
                        <p><strong>Categoría:</strong> ${producto.categoria}</p>
                        <p><strong>Precio:</strong> ${formatearPrecio(producto.precio)}</p>
                        <p><strong>Stock:</strong> ${producto.stock} unidades</p>
                        <p><strong>Estado:</strong> ${estadoBadge}</p>
                        <p><strong>Descripción:</strong> ${producto.descripcion}</p>
                        <div style="margin-top: 15px;">
                            <button class="btn btn-primary" onclick="editarProducto(${producto.id})">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
  } catch (error) {
    document.getElementById("resultadoBusqueda").innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.message}</span>
            </div>
        `;
  }
}

let contadorLineas = 0;

function mostrarFormularioPedido() {
  limpiarFormularios();
  document.getElementById("formularioPedido").classList.remove("hidden");
  document.getElementById("productosPedido").innerHTML = "";
  contadorLineas = 0;
  agregarLineaPedido();
}

function cancelarFormPedido() {
  document.getElementById("formularioPedido").classList.add("hidden");
  document.getElementById("formPedido").reset();
}

async function agregarLineaPedido() {
  const container = document.getElementById("productosPedido");

  try {
    const response = await fetch(`${API_BASE_URL}/productos`);
    const productos = await response.json();

    const lineaDiv = document.createElement("div");
    lineaDiv.className = "form-grid";
    lineaDiv.style.border = "2px solid #ecf0f1";
    lineaDiv.style.padding = "15px";
    lineaDiv.style.borderRadius = "8px";
    lineaDiv.style.marginBottom = "15px";
    lineaDiv.id = `linea-${contadorLineas}`;

    let opcionesProductos = '<option value="">Seleccionar producto...</option>';
    productos.forEach((p) => {
      opcionesProductos += `<option value="${p.id}" data-stock="${p.stock}">${p.nombre} (Stock: ${p.stock})</option>`;
    });

    lineaDiv.innerHTML = `
            <div class="form-group">
                <label>Producto</label>
                <select class="productoSelect" required>
                    ${opcionesProductos}
                </select>
            </div>
            <div class="form-group">
                <label>Cantidad</label>
                <input type="number" class="cantidadInput" min="1" value="1" required>
            </div>
            <div class="form-group" style="display: flex; align-items: end;">
                <button type="button" class="btn btn-danger" onclick="eliminarLinea(${contadorLineas})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

    container.appendChild(lineaDiv);
    contadorLineas++;
  } catch (error) {
    mostrarAlerta("alertaPedidos", "Error al cargar productos", "error");
  }
}

function eliminarLinea(id) {
  const linea = document.getElementById(`linea-${id}`);
  if (linea) {
    linea.remove();
  }
}

async function crearPedido(event) {
  event.preventDefault();

  const clienteNombre = document.getElementById("clienteNombre").value;
  const lineas = document.querySelectorAll("#productosPedido > div");

  if (lineas.length === 0) {
    mostrarAlerta("alertaPedidos", "Debe agregar al menos un producto", "warning");
    return;
  }

  const productos = [];
  for (let linea of lineas) {
    const productoId = parseInt(linea.querySelector(".productoSelect").value);
    const cantidad = parseInt(linea.querySelector(".cantidadInput").value);

    if (!productoId || !cantidad) {
      mostrarAlerta("alertaPedidos", "Complete todos los campos", "warning");
      return;
    }

    productos.push({ productoId, cantidad });
  }

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/crear-completo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ clienteNombre, productos }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.mensaje || "Error al crear pedido");
    }

    mostrarAlerta("alertaPedidos", "Pedido creado exitosamente", "success");
    cancelarFormPedido();
    listarPedidos();
  } catch (error) {
    mostrarAlerta("alertaPedidos", error.message, "error");
  }
}

async function listarPedidos() {
  limpiarFormularios();
  mostrarLoading("listaPedidos");
  document.getElementById("listaPedidos").classList.remove("hidden");

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos`);
    if (!response.ok) throw new Error("Error al cargar pedidos");

    const pedidos = await response.json();

    if (pedidos.length === 0) {
      document.getElementById("listaPedidos").innerHTML = `
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i>
                    <span>No hay pedidos registrados</span>
                </div>
            `;
      return;
    }

    let html = `
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Productos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;

    pedidos.forEach((p) => {
      const total = p.lineas.reduce((sum, l) => sum + l.precioUnitario * l.cantidad, 0);
      const cantidadProductos = p.lineas.reduce((sum, l) => sum + l.cantidad, 0);

      const estadoBadge =
        {
          pendiente: "badge-warning",
          confirmado: "badge-success",
          cancelado: "badge-danger",
          enviado: "badge-info",
        }[p.estado] || "badge-secondary";

      html += `
                <tr>
                    <td>${p.id}</td>
                    <td><strong>${p.clienteNombre}</strong></td>
                    <td>${formatearFecha(p.fecha)}</td>
                    <td>${cantidadProductos} items</td>
                    <td>${formatearPrecio(total)}</td>
                    <td><span class="badge ${estadoBadge}">${p.estado}</span></td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon" style="background: #3498db;" onclick="verDetallePedido(${
                              p.id
                            })" title="Ver detalle">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${
                              p.estado === "pendiente"
                                ? `
                                <button class="btn-icon" style="background: #27ae60;" onclick="confirmarPedido(${p.id})" title="Confirmar">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn-icon" style="background: #e74c3c;" onclick="cancelarPedido(${p.id})" title="Cancelar">
                                    <i class="fas fa-times"></i>
                                </button>
                            `
                                : ""
                            }
                        </div>
                    </td>
                </tr>
            `;
    });

    html += "</tbody></table>";
    document.getElementById("listaPedidos").innerHTML = html;
  } catch (error) {
    document.getElementById("listaPedidos").innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>${error.message}</span>
            </div>
        `;
  }
}

async function verDetallePedido(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}/resumen`);
    if (!response.ok) throw new Error("Error al cargar detalle");

    const data = await response.json();
    const resumen = data.resumen;

    alert(resumen);
  } catch (error) {
    mostrarAlerta("alertaPedidos", error.message, "error");
  }
}

async function confirmarPedido(id) {
  if (!confirm("¿Confirmar este pedido? Se reducirá el stock de los productos.")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}/confirmar`, {
      method: "POST",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.mensaje || "Error al confirmar pedido");
    }

    mostrarAlerta("alertaPedidos", "Pedido confirmado exitosamente", "success");
    listarPedidos();
  } catch (error) {
    mostrarAlerta("alertaPedidos", error.message, "error");
  }
}

async function cancelarPedido(id) {
  if (!confirm("¿Cancelar este pedido?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/${id}/cancelar`, {
      method: "POST",
    });

    if (!response.ok) throw new Error("Error al cancelar pedido");

    mostrarAlerta("alertaPedidos", "Pedido cancelado", "info");
    listarPedidos();
  } catch (error) {
    mostrarAlerta("alertaPedidos", error.message, "error");
  }
}

async function listarPedidosPorEstado() {
  const estado = prompt("Ingrese el estado (pendiente, confirmado, cancelado, enviado):");

  if (!estado) return;

  limpiarFormularios();
  mostrarLoading("listaPedidos");
  document.getElementById("listaPedidos").classList.remove("hidden");

  try {
    const response = await fetch(`${API_BASE_URL}/pedidos/estado/${estado}`);
    console.log(response);

    if (!response.ok) throw new Error("Error al filtrar pedidos");

    const pedidos = await response.json();
    console.log(pedidos);

    if (pedidos.length === 0) {
      document.getElementById("listaPedidos").innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          <span>No hay pedidos con estado "${estado}"</span>
        </div>
      `;
      return;
    }

    mostrarAlerta("alertaPedidos", `Mostrando ${pedidos.length} pedidos con estado "${estado}"`, "info");

    let html = `
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
    `;

    pedidos.forEach((p) => {
      const total = p.lineas.reduce((sum, l) => sum + l.precioUnitario * l.cantidad, 0);
      const cantidadProductos = p.lineas.reduce((sum, l) => sum + l.cantidad, 0);

      const estadoBadge =
        {
          pendiente: "badge-warning",
          confirmado: "badge-success",
          cancelado: "badge-danger",
          enviado: "badge-info",
        }[p.estado] || "badge-secondary";

      html += `
        <tr>
          <td>${p.id}</td>
          <td><strong>${p.clienteNombre}</strong></td>
          <td>${formatearFecha(p.fecha)}</td>
          <td>${cantidadProductos} items</td>
          <td>${formatearPrecio(total)}</td>
          <td><span class="badge ${estadoBadge}">${p.estado}</span></td>
          <td>
            <div class="action-buttons">
              <button class="btn-icon" style="background: #3498db;" onclick="verDetallePedido(${
                p.id
              })" title="Ver detalle">
                <i class="fas fa-eye"></i>
              </button>
              ${
                p.estado === "pendiente"
                  ? `
                <button class="btn-icon" style="background: #27ae60;" onclick="confirmarPedido(${p.id})" title="Confirmar">
                  <i class="fas fa-check"></i>
                </button>
                <button class="btn-icon" style="background: #e74c3c;" onclick="cancelarPedido(${p.id})" title="Cancelar">
                  <i class="fas fa-times"></i>
                </button>
              `
                  : ""
              }
            </div>
          </td>
        </tr>
      `;
    });

    html += "</tbody></table>";

    document.getElementById("listaPedidos").innerHTML = html;
  } catch (error) {
    document.getElementById("listaPedidos").innerHTML = `
      <div class="alert alert-error">
        <i class="fas fa-exclamation-circle"></i>
        <span>${error.message}</span>
      </div>
    `;
  }
}

async function cargarEstadisticas() {
  const container = document.getElementById("statsContainer");
  container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Cargando estadísticas...</p></div>';

  try {
    const [statsProductos, statsPedidos, stockBajo] = await Promise.all([
      fetch(`${API_BASE_URL}/productos/estadisticas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/pedidos/estadisticas`).then((r) => r.json()),
      fetch(`${API_BASE_URL}/productos/stock-bajo?umbral=10`).then((r) => r.json()),
    ]);

    let html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>${statsProductos.totalProductos || 0}</h3>
                    <p>Total Productos</p>
                </div>
                <div class="stat-card">
                    <h3>${statsProductos.productosDisponibles || 0}</h3>
                    <p>Disponibles</p>
                </div>
                <div class="stat-card">
                    <h3>${statsPedidos.totalPedidos || 0}</h3>
                    <p>Total Pedidos</p>
                </div>
                <div class="stat-card">
                    <h3>${formatearPrecio(statsProductos.valorInventario || 0)}</h3>
                    <p>Valor Inventario</p>
                </div>
            </div>
            
            <h3 style="margin: 30px 0 15px;">Productos con Stock Bajo</h3>
        `;

    if (stockBajo.length > 0) {
      html +=
        '<div class="table-container"><table><thead><tr><th>Producto</th><th>Stock</th><th>Categoría</th></tr></thead><tbody>';
      stockBajo.forEach((p) => {
        html += `<tr><td>${p.nombre}</td><td><span class="badge badge-warning">${p.stock}</span></td><td>${p.categoria}</td></tr>`;
      });
      html += "</tbody></table></div>";
    } else {
      html +=
        '<div class="alert alert-success"><i class="fas fa-check-circle"></i> Todos los productos tienen stock suficiente</div>';
    }

    container.innerHTML = html;
  } catch (error) {
    container.innerHTML = `
            <div class="alert alert-error">
                <i class="fas fa-exclamation-circle"></i>
                <span>Error al cargar estadísticas: ${error.message}</span>
            </div>
        `;
  }
}
