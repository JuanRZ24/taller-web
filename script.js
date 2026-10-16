// Espera a que todo el HTML se cargue antes de ejecutar la logica
document.addEventListener("DOMContentLoaded", () => {

  // TRADUCCIONES DE LOS VALORES QUE MANDA LA API
  const NIVELES = { beginner: "Principiante", intermediate: "Intermedio", advanced: "Avanzado" };
  const ESTADOS = { draft: "Borrador", pending: "En revisión", published: "Publicado", rejected: "Rechazado" };
  const TIPOS = { text: "Texto", link: "Enlace", video: "Video", file: "Archivo" };

  // LEE EL USUARIO GUARDADO EN EL LOGIN (puede no haber ninguno)
  function usuarioActual() {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch (e) {
      return null;
    }
  }

  // PORTADA DEL CURSO: la imagen si tiene, si no un cuadro de color con la inicial
  function portada(curso) {
    if (curso.cover_url) {
      return `<div class="portada"><img src="${curso.cover_url}" alt="Portada de ${curso.title}"></div>`;
    }
    const inicial = (curso.title || "?").trim().charAt(0).toUpperCase();
    const tono = "c" + ((curso.id % 5) + 1);
    return `<div class="portada ${tono}">${inicial}</div>`;
  }

  // JUNTA LOS MENSAJES DE ERROR QUE DEVUELVE LA API EN UN SOLO TEXTO
  function textoDeErrores(data) {
    if (data && data.errors) {
      return Object.values(data.errors).flat().join("\n");
    }
    return (data && data.message) || "Ocurrio un error inesperado.";
  }

  const usuario = usuarioActual();

  // ENLACES DEL ENCABEZADO: se muestran segun el rol del usuario
  const linkInstructor = document.getElementById("linkInstructor");
  if (linkInstructor) {
    linkInstructor.style.display = usuario && usuario.role === "student" ? "inline-block" : "none";
  }

  const linkMisCursos = document.getElementById("linkMisCursos");
  if (linkMisCursos) {
    linkMisCursos.style.display = usuario && usuario.role === "instructor" ? "inline-block" : "none";
  }

  const linkSalir = document.getElementById("linkSalir");
  if (linkSalir) {
    linkSalir.style.display = usuario ? "inline-block" : "none";
    linkSalir.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }

  // ARCHIVO REGISTRO (index.html)
  const registroForm = document.getElementById("registroForm");
  if (registroForm) {
    registroForm.addEventListener("submit", async (e) => {
      e.preventDefault(); // Detiene la recarga automática de la página
      // INPUT DE ARCHIVO REGISTROS
      const nombre = document.getElementById("nombre").value.trim(); //value extrae la ifno de la casilla .trim() Omite los espacios si el usuaro lo presiona por error
      const correo = document.getElementById("correo").value.trim();
      const password = document.getElementById("password").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();
      const mensajeError = document.getElementById("mensajeError");
      // VALIDA QUE NO QUEDEN CAMPOS VACIOS
      if (!nombre || !correo || !password || !confirmPassword) {
        alert("Por favor, llena todos los campos obligatorios.");
        return;
      }
      // VALIDA QUE LA CONTRASEÑA Y LA CONFIRMACION  DE LA CONTRASEÑA COINCIDAN
      if (password !== confirmPassword) {
        mensajeError.textContent = "Las contraseñas no coinciden. Inténtalo de nuevo.";
        return;
      }
      // PIDE QUE LA CONTRASEÑA SEA DE MINIMO 8 CARACTEREES
      if (password.length < 8) {
        mensajeError.textContent = "La contraseña debe tener al menos 8 caracteres.";
        return;
      }
      // ENVIAR INFORMACION AL BACKEND
      try {
        // DIRECCION DE API PARA REGISTRO
        const respuesta = await fetch("http://127.0.0.1:8000/api/v1/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          // ENVIA LOS DATOS DEL FORMULARIO EN FORMATO JSON
          body: JSON.stringify({
            name: nombre,
            email: correo,
            password: password,
            password_confirmation: confirmPassword
          })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
          if (data.token) {
            localStorage.setItem("authToken", data.token);
          }
          // GUARDAMOS TAMBIEN AL USUARIO PARA SABER SU ROL EN LAS DEMAS PANTALLAS
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          alert("¡Registro exitoso! Redirigiendo a la pantalla principal...");
          window.location.href = "pantallaPrincipal.html";
        } else {
          // LA API DEVUELVE MENSAJE DE ERROR SI FALLA EL REGISTRO
          mensajeError.textContent = textoDeErrores(data);
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        mensajeError.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }

  // ARCHIVO DE LOGIN (login.html)
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      // INPUT DE ARCHIVO LOGIN
      const correo = document.getElementById("loginCorreo").value.trim();
      const password = document.getElementById("loginPassword").value.trim();
      const mensajeError = document.getElementById("mensajeError");
      // ENVIAMOS CREDENCIALES AL BACKEND
      try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            email: correo,
            password: password
          })
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
          if (data.token) {
            localStorage.setItem("authToken", data.token);
          }
          // SIN ESTO NO SABEMOS SI ES ALUMNO O INSTRUCTOR Y TODOS ACABAN EN LA MISMA PANTALLA
          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          // AQIUI SE PONE LA REDIRECCION A LA PAGINA PRINCIPAL SEGUN EL ROL
          if (data.user && data.user.role === "instructor") {
            window.location.href = "pantallaPrincipalInstructor.html";
          } else {
            window.location.href = "pantallaPrincipal.html";
          }
        } else {
          mensajeError.textContent = data.message || "Correo o contraseña incorrectos.";
        }
      } catch (error) {
        console.error("Error de conexión:", error);
        mensajeError.textContent = "No se pudo conectar con el servidor.";
      }
    });
  }

   // ARCHIVO DE ALTA DE INSTRUCTOR (alta-instructor.html)
  const altaInstructorForm = document.getElementById("altaInstructorForm");
  if (altaInstructorForm) {
    altaInstructorForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("authToken");

      if (!token) {
        alert("Debes iniciar sesion para darte de alta como un instructor.");
        window.location.href = "login.html";
        return;
      }
      // INPUT DE ARCHIVO ALTA DE INSTRUCTOR
      const headline = document.getElementById("headline").value.trim();
      const specialty = document.getElementById("specialty").value.trim();
      const biography = document.getElementById("biography").value.trim();
      const fotoInput = document.getElementById("fotografia");
      try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/v1/instructors", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            headline: headline,
            specialty: specialty,
            biography: biography
          })
        });
        const data = await respuesta.json();
        if (!respuesta.ok) {
          alert(textoDeErrores(data));
          return;
        }

          if (data.user) {
            localStorage.setItem("user", JSON.stringify(data.user));
          }
          if (fotoInput && fotoInput.files.length > 0) {
            const formData = new FormData();
            formData.append("photo", fotoInput.files[0]);
            // La foto va como FormData, por eso aqui no se manda Content-Type
            const photoResponse = await fetch("http://127.0.0.1:8000/api/v1/instructors/me/photo", {
              method: "POST",
              headers: {
                "Accept": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: formData
          });
          if (!photoResponse.ok) {
            const photoError = await photoResponse.json();
            alert(`Perfil creado, pero hubo un detalle con la foto: ${photoError.message}`);
          }
          }
          alert("Felicidades, tu perfil de instructor ha sido creado exitosamente.");
          window.location.href="pantallaPrincipalInstructor.html"
      } catch (error) {
        console.error("Error de red:", error);
        alert("No se pudo conectar con el servidor.");
      }
    });
  }

  // CAPTURAMOS EL FORMULARIO (crearCurso.html)
  const crearCursoForm = document.getElementById('crearCursoForm');
  const btnAgregarModulo = document.getElementById('btnAgregarModulo');
  const contenedorModulos = document.getElementById('contenedor-modulos');
  let contadorModulo = 0;

  // auxiliar para agregar una fila de contenido dentro de un modulo
  // la API acepta varios contenidos por modulo, por eso cada uno es su propia fila
  function agregarFilaContenido(contenedor, contenido) {
    const tipo = contenido ? contenido.type : 'text';
    // segun el tipo, el texto vive en body y el enlace en url
    const detalle = contenido ? (contenido.type === 'text' ? contenido.body : contenido.url) : '';

    const fila = document.createElement('div');
    fila.className = 'fila-contenido';
    // guardamos el id para saber si hay que crearlo o actualizarlo al guardar
    if (contenido && contenido.id) fila.dataset.contentId = contenido.id;

    fila.innerHTML = `
      <button type="button" class="btn-quitar">Quitar</button>

      <div class="form-group">
        <label>Tipo de Contenido:</label>
        <select class="form-control tipo-contenido">
          <option value="text" ${tipo === 'text' ? 'selected' : ''}>Texto</option>
          <option value="link" ${tipo === 'link' ? 'selected' : ''}>Enlace</option>
          <option value="video" ${tipo === 'video' ? 'selected' : ''}>Video</option>
        </select>
      </div>

      <div class="form-group">
        <label>Título del Contenido:</label>
        <input type="text" class="form-control titulo-contenido" value="${contenido ? contenido.title || '' : ''}" placeholder="Ej. Lección 1">
      </div>

      <div class="form-group">
        <label class="etiqueta-detalle">${tipo === 'text' ? 'Contenido en texto:' : 'Enlace:'}</label>
        <input type="text" class="form-control detalle-contenido" value="${detalle || ''}" placeholder="${tipo === 'text' ? 'Escribe el contenido' : 'https://...'}">
      </div>
    `;

    const selectTipo = fila.querySelector('.tipo-contenido');
    const etiqueta = fila.querySelector('.etiqueta-detalle');
    const inputDetalle = fila.querySelector('.detalle-contenido');

    // cambia la etiqueta para que se entienda que se pide texto o un enlace
    selectTipo.addEventListener('change', () => {
      const esTexto = selectTipo.value === 'text';
      etiqueta.textContent = esTexto ? 'Contenido en texto:' : 'Enlace:';
      inputDetalle.placeholder = esTexto ? 'Escribe el contenido' : 'https://...';
    });

    fila.querySelector('.btn-quitar').addEventListener('click', async () => {
      const contentId = fila.dataset.contentId;
      // si ya existia en la base hay que borrarlo tambien alla
      if (contentId && confirm('¿Eliminar este contenido? No se puede deshacer.')) {
        const token = localStorage.getItem('authToken');
        try {
          const respuesta = await fetch(`http://127.0.0.1:8000/api/v1/contents/${contentId}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!respuesta.ok) {
            const data = await respuesta.json();
            alert(textoDeErrores(data));
            return;
          }
        } catch (error) {
          console.error('Error al eliminar el contenido:', error);
          alert('No se pudo conectar con el servidor.');
          return;
        }
      }
      fila.remove();
    });

    contenedor.appendChild(fila);
  }

  //  auxiliar para agregar un bloque de modulo al DOM
  function agregarBloqueModulo(modulo) {
    contadorModulo++;

    const divModulo = document.createElement('div');
    divModulo.className = 'bloque-modulo';
    if (modulo && modulo.id) divModulo.dataset.moduleId = modulo.id;

    divModulo.innerHTML = `
      <h4>Modulo ${contadorModulo}</h4>

      <div class="form-group">
        <label>Título del Módulo:</label>
        <input type="text" class="form-control titulo-modulo" value="${modulo ? modulo.title || '' : ''}" placeholder="Ej. Introducción al curso" required>
      </div>

      <label>Contenidos del Módulo:</label>
      <div class="contenidos-modulo"></div>

      <button type="button" class="btn-secundario btn-agregar-contenido">+ Agregar contenido</button>
      <button type="button" class="btn-secundario btn-quitar-modulo">Eliminar módulo</button>
    `;

    const contenedorContenidos = divModulo.querySelector('.contenidos-modulo');

    const contenidos = modulo && modulo.contents ? modulo.contents : [];
    if (contenidos.length > 0) {
      contenidos.forEach(c => agregarFilaContenido(contenedorContenidos, c));
    } else {
      agregarFilaContenido(contenedorContenidos, null);
    }

    divModulo.querySelector('.btn-agregar-contenido').addEventListener('click', () => {
      agregarFilaContenido(contenedorContenidos, null);
    });

    divModulo.querySelector('.btn-quitar-modulo').addEventListener('click', async () => {
      const moduleId = divModulo.dataset.moduleId;
      if (moduleId && !confirm('¿Eliminar este módulo y todos sus contenidos? No se puede deshacer.')) return;
      if (moduleId) {
        const token = localStorage.getItem('authToken');
        try {
          const respuesta = await fetch(`http://127.0.0.1:8000/api/v1/modules/${moduleId}`, {
            method: 'DELETE',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          });
          if (!respuesta.ok) {
            const data = await respuesta.json();
            alert(textoDeErrores(data));
            return;
          }
        } catch (error) {
          console.error('Error al eliminar el modulo:', error);
          alert('No se pudo conectar con el servidor.');
          return;
        }
      }
      divModulo.remove();
    });

    contenedorModulos.appendChild(divModulo);
  }

  //  boton "agregar modulo"
  if (btnAgregarModulo && contenedorModulos) {
    btnAgregarModulo.addEventListener('click', () => {
      agregarBloqueModulo(null);
    });
  }

  // llena el select de categorias con las que manda la API
  // antes los ids estaban escritos a mano en el HTML y no coincidian con la base
  async function cargarCategorias(seleccionada) {
    const select = document.getElementById('categoria');
    if (!select) return;

    try {
      const respuesta = await fetch('http://127.0.0.1:8000/api/v1/categories', {
        headers: { 'Accept': 'application/json' }
      });
      const data = await respuesta.json();
      if (!respuesta.ok) return;

      select.innerHTML = '<option value="" disabled selected>Selecciona una categoria...</option>';
      data.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        if (seleccionada && Number(seleccionada) === cat.id) option.selected = true;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar categorias:', error);
    }
  }

  // guarda modulos y contenidos uno por uno
  // la API no los acepta anidados dentro del curso, hay que mandarlos en peticiones aparte
  async function guardarEstructura(cursoId) {
    const token = localStorage.getItem('authToken');
    const bloques = Array.from(document.querySelectorAll('.bloque-modulo'));

    for (const bloque of bloques) {
      const tituloModulo = bloque.querySelector('.titulo-modulo').value.trim();
      if (!tituloModulo) continue;

      let moduleId = bloque.dataset.moduleId;

      if (moduleId) {
        // ya existe, solo se actualiza el titulo
        await fetch(`http://127.0.0.1:8000/api/v1/modules/${moduleId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: tituloModulo })
        });
      } else {
        // es nuevo, se crea y guardamos el id que devuelve
        const respuesta = await fetch(`http://127.0.0.1:8000/api/v1/courses/${cursoId}/modules`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title: tituloModulo })
        });
        const data = await respuesta.json();
        if (!respuesta.ok) {
          alert(textoDeErrores(data));
          return;
        }
        moduleId = data.module.id;
        bloque.dataset.moduleId = moduleId;
      }

      const filas = Array.from(bloque.querySelectorAll('.fila-contenido'));

      for (const fila of filas) {
        const tipo = fila.querySelector('.tipo-contenido').value;
        const tituloContenido = fila.querySelector('.titulo-contenido').value.trim();
        const detalle = fila.querySelector('.detalle-contenido').value.trim();

        if (!tituloContenido || !detalle) continue;

        // el texto va en body y el enlace en url, no en un campo content
        const cuerpo = { title: tituloContenido, type: tipo };
        if (tipo === 'text') {
          cuerpo.body = detalle;
        } else {
          cuerpo.url = detalle;
        }

        const contentId = fila.dataset.contentId;

        if (contentId) {
          await fetch(`http://127.0.0.1:8000/api/v1/contents/${contentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cuerpo)
          });
        } else {
          const respuesta = await fetch(`http://127.0.0.1:8000/api/v1/modules/${moduleId}/contents`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cuerpo)
          });
          const data = await respuesta.json();
          if (!respuesta.ok) {
            alert(textoDeErrores(data));
            return;
          }
          fila.dataset.contentId = data.content.id;
        }
      }
    }
  }

  // verificar si viene un ID en la URL
  if (crearCursoForm) {
    const urlParams = new URLSearchParams(window.location.search);
    const cursoId = urlParams.get('id');

    if (cursoId) {
      // Cambiar encabezado si existe
      const tituloPagina = document.querySelector('.card-header h2');
      if (tituloPagina) tituloPagina.textContent = 'EDITAR CURSO';

      const botonGuardar = crearCursoForm.querySelector('.btn-guardar');
      if (botonGuardar) botonGuardar.textContent = 'Actualizar Curso';

      // Cargar datos del curso a editar desde la API
      const token = localStorage.getItem('authToken');
      if (token) {
        fetch(`http://127.0.0.1:8000/api/v1/courses/${cursoId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        .then(res => res.json())
        .then(async (data) => {
          const curso = data.course || data;
          if (curso) {
            document.getElementById('titulo').value = curso.title || '';
            document.getElementById('nivel').value = curso.level || '';
            document.getElementById('descripcion').value = curso.description || '';

            // la categoria viene como objeto anidado, no como category_id
            await cargarCategorias(curso.category ? curso.category.id : null);

            // Cargar los modulos existentes con todos sus contenidos
            if (curso.modules && curso.modules.length > 0) {
              contenedorModulos.innerHTML = '';
              contadorModulo = 0;
              curso.modules.forEach(mod => agregarBloqueModulo(mod));
            }
          }
        })
        .catch(err => console.error('Error al cargar datos del curso:', err));
      }
    } else {
      cargarCategorias(null);
    }

    // guardar crear o actualizar)
    crearCursoForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Sesion no valida.');
        window.location.href = 'login.html';
        return;
      }

      const botonGuardar = crearCursoForm.querySelector('.btn-guardar');
      const textoBoton = botonGuardar ? botonGuardar.textContent : '';
      if (botonGuardar) {
        botonGuardar.disabled = true;
        botonGuardar.textContent = 'Guardando...';
      }

      // el curso se manda solo, sin los modulos adentro
      const datosCurso = {
        title: document.getElementById('titulo').value.trim(),
        category_id: parseInt(document.getElementById('categoria').value),
        level: document.getElementById('nivel').value,
        description: document.getElementById('descripcion').value.trim()
      };

      const esEdicion = Boolean(cursoId);
      const url = esEdicion
        ? `http://127.0.0.1:8000/api/v1/courses/${cursoId}`
        : 'http://127.0.0.1:8000/api/v1/courses';
      const metodo = esEdicion ? 'PATCH' : 'POST';

      try {
        const response = await fetch(url, {
          method: metodo,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(datosCurso)
        });

        const data = await response.json();

        if (response.ok) {
          // ya que existe el curso, ahora si se mandan los modulos y contenidos
          await guardarEstructura(data.course.id);
          alert(esEdicion ? '¡Curso actualizado exitosamente!' : '¡Curso y modulos creados exitosamente!');
          window.location.href = 'misCursos.html';
        } else {
          alert(textoDeErrores(data));
        }
      } catch (error) {
        console.error('Error al conectar con la API:', error);
        alert('Ocurrio un error al intentar conectar con el servidor.');
      } finally {
        if (botonGuardar) {
          botonGuardar.disabled = false;
          botonGuardar.textContent = textoBoton;
        }
      }
    });
  }

  // ARCHIVO MIS CURSOS (misCursos.html)
  const gridCursos = document.getElementById("grid-cursos");
  const estadoVacio = document.getElementById("estado-vacio");

  if (gridCursos && estadoVacio) {
    async function obtenerCursos() {
      const token = localStorage.getItem("authToken");
      try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/v1/courses/me", {
          headers: {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await respuesta.json();

        if (respuesta.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          window.location.href = "login.html";
          return;
        }

        if (respuesta.ok) {
          const cursosBasicos = data.courses || [];

          // la lista no trae los modulos, hay que pedir el detalle de cada curso
          const cursos = await Promise.all(
            cursosBasicos.map(async (curso) => {
              try {
                const resDetalle = await fetch(`http://127.0.0.1:8000/api/v1/courses/${curso.id}`, {
                  headers: {
                    "Accept": "application/json",
                    "Authorization": "Bearer " + token
                  }
                });
                if (resDetalle.ok) {
                  const dataDetalle = await resDetalle.json();
                  return dataDetalle.course || curso;
                }
              } catch (e) {
                console.error(e);
              }
              return curso;
            })
          );

          if (Array.isArray(cursos) && cursos.length > 0) {
            estadoVacio.classList.add("d-none");
            gridCursos.classList.remove("d-none");

            const barra = document.getElementById("barra-acciones");
            if (barra) {
              barra.innerHTML = '<a href="crearCurso.html" class="btn-crear">+ Crear Nuevo Curso</a>';
            }

            gridCursos.innerHTML = cursos.map(curso => {
              // Construimos el HTML de los módulos si existen
              const modulos = curso.modules || [];
              // solo los borradores y los rechazados se pueden editar
              const editable = curso.status === "draft" || curso.status === "rejected";

              const htmlModulos = (modulos.length > 0)
                ? modulos.slice(0, 3).map(mod => {
                    const contenidos = mod.contents || [];
                    return `
                      <div class="modulo-mini">
                        <strong>${mod.title}</strong>
                        ${
                          (contenidos.length > 0)
                            ? `<p>${contenidos.length} contenido${contenidos.length === 1 ? '' : 's'}</p>`
                            : '<p>Sin contenido</p>'
                        }
                      </div>
                    `;
                  }).join('') + (modulos.length > 3 ? `<p class="sin-modulos">y ${modulos.length - 3} módulo(s) más</p>` : '')
                : '<p class="sin-modulos">Este curso no tiene módulos creados.</p>';

              // se crea la tarjeta con sus modulos
              const cuerpo = `
                ${portada(curso)}
                <div class="card-cuerpo">
                  <div class="etiquetas">
                    <span class="badge-estado ${curso.status}">${ESTADOS[curso.status] || curso.status}</span>
                    <span class="badge">${NIVELES[curso.level] || curso.level}</span>
                  </div>
                  <h3>${curso.title}</h3>
                  <p>${curso.description}</p>

                  <div class="seccion-modulos">
                    <h4>Módulos</h4>
                    ${htmlModulos}
                  </div>

                  <div class="card-pie">
                    ${editable ? '<span>Clic para editar</span>' : '<span class="ver-temario">Ver temario &rsaquo;</span>'}
                    <span>${curso.category ? curso.category.name : ''}</span>
                  </div>
                </div>
              `;

              // los editables van al formulario, los demas al temario de solo lectura
              return editable
                ? `<a class="card-curso" href="crearCurso.html?id=${curso.id}">${cuerpo}</a>`
                : `<a class="card-curso" href="curso.html?id=${curso.id}">${cuerpo}</a>`;
            }).join('');
          } else {
            estadoVacio.classList.remove("d-none");
            gridCursos.classList.add("d-none");
          }
        }
      } catch (error) {
        console.error("Error al obtener los cursos:", error);
      }
    }

    obtenerCursos();
  }

  // ARCHIVO DETALLE DEL CURSO (curso.html)
  const detalleCurso = document.getElementById("detalle-curso");

  if (detalleCurso) {
    async function cargarDetalle() {
      const cursoId = new URLSearchParams(window.location.search).get("id");

      if (!cursoId) {
        detalleCurso.innerHTML = '<p class="sin-resultados">No se indicó qué curso mostrar.</p>';
        return;
      }

      const token = localStorage.getItem("authToken");
      const headers = { "Accept": "application/json" };
      // el token es opcional: si el curso es publico cualquiera lo ve
      if (token) headers["Authorization"] = `Bearer ${token}`;

      try {
        const respuesta = await fetch(`http://127.0.0.1:8000/api/v1/courses/${cursoId}`, { headers });

        if (respuesta.status === 403) {
          detalleCurso.innerHTML = '<p class="sin-resultados">Este curso no está publicado y no es tuyo, así que no se puede consultar.</p>';
          return;
        }
        if (respuesta.status === 404) {
          detalleCurso.innerHTML = '<p class="sin-resultados">No encontramos ese curso.</p>';
          return;
        }

        const data = await respuesta.json();

        if (!respuesta.ok) {
          detalleCurso.innerHTML = `<p class="sin-resultados">${data.message || 'No se pudo cargar el curso.'}</p>`;
          return;
        }

        const curso = data.course;
        const modulos = curso.modules || [];
        const editable = curso.status === "draft" || curso.status === "rejected";
        const totalContenidos = modulos.reduce((n, m) => n + (m.contents || []).length, 0);

        detalleCurso.innerHTML = `
          <div class="detalle-portada">${portada(curso)}</div>

          <div class="detalle-cuerpo">
            <div class="etiquetas">
              <span class="badge">${curso.category ? curso.category.name : 'Sin categoría'}</span>
              <span class="badge">${NIVELES[curso.level] || curso.level}</span>
              ${curso.status ? `<span class="badge-estado ${curso.status}">${ESTADOS[curso.status] || curso.status}</span>` : ''}
            </div>

            <h2>${curso.title}</h2>
            <p class="detalle-descripcion">${curso.description || ''}</p>

            ${curso.rejection_reason
              ? `<div class="aviso-rechazo"><b>Motivo del rechazo:</b> ${curso.rejection_reason}</div>`
              : ''}

            <div class="detalle-acciones">
              ${editable
                ? `<a href="crearCurso.html?id=${curso.id}" class="btn-filtrar">Editar este curso</a>`
                : ''}
            </div>

            <h3 class="panel-titulo">Temario</h3>
            <p class="ayuda">
              ${modulos.length} módulo${modulos.length === 1 ? '' : 's'} &middot;
              ${totalContenidos} contenido${totalContenidos === 1 ? '' : 's'}
            </p>

            ${modulos.length > 0
              ? `<ol class="temario">${modulos.map(mod => `
                  <li class="temario-modulo">
                    <span class="temario-titulo">${mod.title}</span>
                    ${(mod.contents || []).length > 0
                      ? `<ul class="temario-contenidos">${mod.contents.map(c => `
                          <li>
                            <span class="tipo-contenido-badge ${c.type}">${TIPOS[c.type] || c.type}</span>
                            <span>${c.title}</span>
                            ${c.url ? `<a href="${c.url}" target="_blank" rel="noopener">abrir</a>` : ''}
                          </li>`).join('')}</ul>`
                      : '<p class="sin-modulos">Este módulo todavía no tiene contenidos.</p>'}
                  </li>`).join('')}</ol>`
              : '<p class="sin-modulos">Este curso todavía no tiene temario.</p>'}
          </div>
        `;
      } catch (error) {
        console.error("Error al cargar el curso:", error);
        detalleCurso.innerHTML = '<p class="sin-resultados">No se pudo conectar con el servidor.</p>';
      }
    }

    cargarDetalle();
  }

  // CATALOGO DE LA PANTALLA PRINCIPAL (pantallaPrincipal.html)
  const gridCursosInicio = document.getElementById("grid-cursos-inicio");

  if (gridCursosInicio) {
    const encabezado = document.getElementById("encabezado-catalogo");
    const barraFiltros = document.getElementById("filtros-catalogo");

    // dibuja la barra de busqueda con las categorias que manda la API
    async function montarFiltros() {
      if (!barraFiltros) return;

      let opciones = "";
      try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/v1/categories", {
          headers: { "Accept": "application/json" }
        });
        const data = await respuesta.json();
        if (respuesta.ok) {
          opciones = data.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
      } catch (error) {
        console.error("Error al cargar categorias:", error);
      }

      barraFiltros.innerHTML = `
        <input type="text" id="fBuscar" class="form-control" placeholder="Buscar por título...">
        <select id="fCategoria" class="form-control">
          <option value="">Todas las categorías</option>
          ${opciones}
        </select>
        <select id="fNivel" class="form-control">
          <option value="">Todos los niveles</option>
          <option value="beginner">Principiante</option>
          <option value="intermediate">Intermedio</option>
          <option value="advanced">Avanzado</option>
        </select>
        <button type="button" id="bFiltrar" class="btn-filtrar">Filtrar</button>
      `;

      document.getElementById("bFiltrar").addEventListener("click", cargarCursosInicio);
      document.getElementById("fBuscar").addEventListener("keydown", (e) => {
        if (e.key === "Enter") cargarCursosInicio();
      });
      document.getElementById("fCategoria").addEventListener("change", cargarCursosInicio);
      document.getElementById("fNivel").addEventListener("change", cargarCursosInicio);
    }

    async function cargarCursosInicio() {
      const buscar = document.getElementById("fBuscar");
      const categoria = document.getElementById("fCategoria");
      const nivel = document.getElementById("fNivel");

      // los filtros viajan como parametros en la URL
      const qs = new URLSearchParams();
      if (buscar && buscar.value.trim()) qs.set("search", buscar.value.trim());
      if (categoria && categoria.value) qs.set("category_id", categoria.value);
      if (nivel && nivel.value) qs.set("level", nivel.value);

      const url = "http://127.0.0.1:8000/api/v1/courses" + (qs.toString() ? "?" + qs : "");

      try {
        // el catalogo es publico, aqui no hace falta token
        const respuesta = await fetch(url, {
          headers: { "Accept": "application/json" }
        });

        const data = await respuesta.json();

        if (respuesta.ok) {
          const cursos = data.courses || [];
          const total = data.pagination ? data.pagination.total : cursos.length;

          if (encabezado) {
            encabezado.innerHTML = `
              <h2>Catálogo de cursos</h2>
              <p>${total} curso${total === 1 ? '' : 's'} publicado${total === 1 ? '' : 's'}</p>
            `;
          }

          if (cursos.length > 0) {
            gridCursosInicio.innerHTML = cursos.map(curso => `
              <a class="card-curso" href="curso.html?id=${curso.id}">
                ${portada(curso)}
                <div class="card-cuerpo">
                  <div class="etiquetas">
                    <span class="badge">${curso.category ? curso.category.name : 'Sin categoría'}</span>
                    <span class="badge">${NIVELES[curso.level] || curso.level}</span>
                  </div>
                  <h3>${curso.title}</h3>
                  <p>${curso.description || 'Sin descripción'}</p>
                  <div class="card-pie">
                    <span>Por ${curso.instructor ? curso.instructor.name : 'Sin asignar'}</span>
                    <span class="ver-temario">Ver temario &rsaquo;</span>
                  </div>
                </div>
              </a>
            `).join('');
          } else {
            gridCursosInicio.innerHTML = '<p class="sin-resultados">No hay cursos que coincidan con la búsqueda.</p>';
          }
        } else {
          gridCursosInicio.innerHTML = '<p class="sin-resultados">Error al obtener la lista de cursos.</p>';
        }
      } catch (error) {
        console.error("Error al cargar cursos en inicio:", error);
        gridCursosInicio.innerHTML = '<p class="sin-resultados">No se pudo conectar con el servidor.</p>';
      }
    }

    montarFiltros().then(cargarCursosInicio);
  }

});
