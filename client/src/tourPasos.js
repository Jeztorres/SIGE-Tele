import {
  Menu,
  Settings,
  UserCheck,
  CheckSquare,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  Users,
  FolderLock,
  StickyNote
} from 'lucide-react';

// Recorrido guiado de la app. Cada paso señala un elemento real de la pantalla
// (el que lleva data-tour="<target>") y explica qué hace.
//
//  tab        → pantalla a la que se navega antes del paso
//  target     → valor de data-tour del elemento a resaltar
//  clic       → data-tour de un elemento al que se le da clic antes de buscar el target
//  opcional   → si el elemento no existe (p. ej. aún no hay tareas), el paso se salta
//  menuMovil  → en celular abre el menú lateral para poder señalar algo ahí

export const MODULOS = [
  {
    id: 'menu',
    titulo: 'El menú y el periodo',
    descripcion: 'Cómo moverte por la app',
    icono: Menu,
    pasos: [
      {
        target: 'nav-menu',
        menuMovil: true,
        titulo: 'Tu menú principal',
        texto:
          'Aquí están todos los módulos. Toca uno para entrar. El número rojo en «Tablero & Alertas» te dice cuántos alumnos tienen una alerta.'
      },
      {
        target: 'nav-periodo',
        menuMovil: true,
        titulo: 'Periodo activo',
        texto:
          'Elige el trimestre en el que estás trabajando. Pase de lista, tareas, calificaciones y reportes muestran solo los datos de ese periodo.'
      },
      {
        target: 'nav-tema',
        menuMovil: true,
        titulo: 'Modo claro u oscuro',
        texto:
          'Cambia el color de la app. «Auto» sigue el modo de tu teléfono o computadora. El modo oscuro cansa menos la vista por la noche; al imprimir, los reportes siempre salen en blanco.'
      }
    ]
  },
  {
    id: 'ajustes',
    titulo: 'Ajustes y Materias',
    descripcion: 'Escuela, materias y respaldo',
    icono: Settings,
    tab: 'ajustes',
    pasos: [
      {
        target: 'ajustes-tabs',
        titulo: 'Cuatro secciones',
        texto: 'Cambia entre «Datos Escolares», «Materias», «Membrete» y «Respaldo» con estos botones.'
      },
      {
        target: 'ajustes-escuela',
        clic: 'ajustes-tab-escuela',
        titulo: 'Los datos de tu escuela',
        texto:
          'Escribe escuela, C.C.T., zona, sector, grado, grupo, ciclo y tu nombre. Aparecen en tus reportes, boletas y archivos de Excel. Al terminar presiona «Guardar y Actualizar Ahora».'
      },
      {
        target: 'ajustes-materias',
        clic: 'ajustes-tab-materias',
        titulo: 'Tus materias',
        texto:
          'Agrega las materias que impartes, edítalas o bórralas. Las que crees aparecen en tareas, calificaciones y en el Excel.'
      },
      {
        target: 'ajustes-membrete',
        clic: 'ajustes-tab-membrete',
        titulo: 'Membrete de tus documentos',
        texto:
          'Personaliza el encabezado que sale en el reporte del CTE, el expediente de cada alumno y el Excel: texto superior, lema, domicilio o teléfono, tus logos y el color de la línea. A la derecha ves cómo queda.'
      },
      {
        target: 'ajustes-respaldo',
        clic: 'ajustes-tab-respaldo',
        titulo: 'Copia de seguridad',
        texto:
          'Descarga un respaldo con todos tus datos y restáuralo cuando lo necesites. También sirve para importar la información de la versión anterior. Descárgalo de vez en cuando.'
      }
    ]
  },
  {
    id: 'alumnos',
    titulo: 'Padrón de Alumnos',
    descripcion: 'Registra a tu grupo',
    icono: UserCheck,
    tab: 'alumnos',
    pasos: [
      {
        target: 'alu-nuevo',
        titulo: 'Registrar un alumno',
        texto:
          'Agrega a cada alumno con su nombre, CURP, tutor y teléfono. El número de lista se asigna solo. Sin alumnos, los demás módulos estarán vacíos.'
      },
      {
        target: 'alu-buscar',
        titulo: 'Buscador',
        texto: 'Encuentra a un alumno escribiendo su nombre, su CURP o el nombre del tutor.'
      },
      {
        target: 'alu-lista',
        titulo: 'Lista oficial del grupo',
        texto:
          'Aquí ves a todo tu grupo. Desde cada fila puedes editar sus datos o darlo de baja (al dar de baja se borran también su asistencia y sus calificaciones).'
      }
    ]
  },
  {
    id: 'asistencia',
    titulo: 'Pase de Lista',
    descripcion: 'Asistencia diaria e historial',
    icono: CheckSquare,
    tab: 'asistencia',
    pasos: [
      {
        target: 'asist-vista',
        titulo: 'Pase de hoy o listas anteriores',
        texto:
          '«Pase de Lista» es para registrar la asistencia. «Listas Anteriores» muestra los días ya registrados y una tabla con todo el periodo.'
      },
      {
        target: 'asist-fecha',
        titulo: 'Fecha y guardado',
        texto:
          'Elige la fecha (por defecto es hoy). «Marcar Todos Presentes» pone a todos en presente para que solo cambies a quienes faltaron. Al terminar, «Guardar Pase de Lista». Abajo puedes saltar a un día ya registrado.'
      },
      {
        target: 'asist-resumen',
        titulo: 'Resumen del día',
        texto: 'Presentes, faltas, retardos y justificadas del día, que se actualizan mientras marcas.'
      },
      {
        target: 'asist-lista',
        titulo: 'Tus alumnos',
        texto: 'Una fila por alumno. Marca su estado con los botones de la derecha.'
      },
      {
        target: 'asist-botones',
        titulo: 'P · F · R · J',
        texto:
          '[P] Presente, [F] Falta, [R] Retardo y [J] Justificada. Si un alumno junta 3 faltas seguidas, aparece una alerta roja en el tablero.'
      }
    ]
  },
  {
    id: 'tareas',
    titulo: 'Tareas y Trabajos',
    descripcion: 'Entregas por alumno',
    icono: BookOpen,
    tab: 'tareas',
    pasos: [
      {
        target: 'tareas-nueva',
        titulo: 'Crear una tarea',
        texto: 'Registra una tarea o actividad con su título, materia, fecha y descripción.'
      },
      {
        target: 'tareas-lista',
        opcional: true,
        titulo: 'Tareas del periodo',
        texto: 'Toca una tarea para abrirla y ver quién la entregó. El bote de basura la elimina.'
      },
      {
        target: 'tareas-stats',
        opcional: true,
        titulo: 'Estadísticas de la tarea',
        texto: 'Cuántos alumnos entregaron, cuántos no y cuántos entregaron incompleta, con su porcentaje.'
      },
      {
        target: 'tareas-botones',
        opcional: true,
        titulo: 'Entregó · Incompleta · No entregó',
        texto:
          'Marca el estado de cada alumno y presiona «Guardar Entregas». Tres tareas seguidas sin entregar generan una alerta en el tablero.'
      }
    ]
  },
  {
    id: 'calificaciones',
    titulo: 'Calificaciones',
    descripcion: 'Captura, comparativa y Excel',
    icono: GraduationCap,
    tab: 'calificaciones',
    pasos: [
      {
        target: 'cal-vista',
        titulo: 'Captura o Comparativa',
        texto:
          '«Captura» es para escribir las notas. «Comparativa» muestra cómo subió o bajó cada alumno frente al periodo anterior.'
      },
      {
        target: 'cal-materias',
        titulo: 'Materias',
        texto: 'Agrega, edita o quita materias sin salir de esta pantalla.'
      },
      {
        target: 'cal-tabla',
        titulo: 'Tabla de calificaciones',
        texto: 'Escribe la nota (de 0 a 10) de cada alumno en cada materia. El promedio se calcula solo.'
      },
      {
        target: 'cal-guardar',
        titulo: 'Guardar',
        texto: 'Al terminar de capturar presiona «Guardar Calificaciones». Si no lo haces, los cambios no se guardan.'
      },
      {
        target: 'cal-excel',
        titulo: 'Exportar a Excel',
        texto:
          'Elige qué incluir (datos de la escuela, firmas, sello, estadísticas y boleta individual) y descarga un Excel interactivo: si cambias una nota dentro del archivo, todo se recalcula.'
      }
    ]
  },
  {
    id: 'dashboard',
    titulo: 'Tablero y semáforo',
    descripcion: 'Cómo va tu grupo de un vistazo',
    icono: LayoutDashboard,
    tab: 'dashboard',
    pasos: [
      {
        target: 'dash-alertas',
        titulo: 'Alertas críticas',
        texto:
          'Se activa cuando un alumno junta 3 faltas seguidas o 3 tareas sin entregar. Si todo va bien, verás esta franja en verde. Desde aquí puedes abrir el expediente del alumno.'
      },
      {
        target: 'dash-kpis',
        titulo: 'Indicadores del grupo',
        texto:
          'Promedio grupal, asistencia (meta mínima 85%), cumplimiento de tareas y matrícula activa. Se calculan solos con lo que vas capturando.'
      },
      {
        target: 'dash-semaforo',
        titulo: 'Semáforo de desempeño y riesgo',
        texto:
          'Cada alumno tiene un color según su asistencia, tareas y promedio: verde va bien, amarillo está en observación y rojo necesita apoyo prioritario.'
      },
      {
        target: 'dash-filtros',
        titulo: 'Filtra por color',
        texto: 'Toca Verdes, Amarillos o Rojos para ver solo ese grupo. «Alertas» muestra a quienes tienen faltas o tareas seguidas.'
      },
      {
        target: 'dash-lista',
        titulo: 'Alumno por alumno',
        texto:
          'Ves su porcentaje de asistencia, de tareas y su promedio, y la causa de su color (por ejemplo «lleva 3 faltas seguidas»).'
      },
      {
        target: 'dash-expediente',
        opcional: true,
        titulo: 'Expediente',
        texto: 'Abre la carpeta completa del alumno: su estado, calificaciones y fotos de evidencias, lista para imprimir.'
      },
      {
        target: 'dash-accesos',
        titulo: 'Accesos rápidos',
        texto: 'Atajos para pasar lista, generar el reporte del CTE o subir evidencias.'
      }
    ]
  },
  {
    id: 'cte',
    titulo: 'Consejo Técnico (CTE)',
    descripcion: 'Reporte y bitácora de acuerdos',
    icono: Users,
    tab: 'cte',
    pasos: [
      {
        target: 'cte-imprimir',
        titulo: 'Reporte en 1 clic',
        texto: 'Imprime o guarda en PDF el reporte oficial del grupo, ya con los datos del periodo activo.'
      },
      {
        target: 'cte-nuevo-acuerdo',
        titulo: 'Nuevo acuerdo',
        texto: 'Registra un acuerdo del CTE: sesión, acuerdo, responsable, fecha límite y observaciones.'
      },
      {
        target: 'cte-opciones',
        titulo: 'Qué incluir al imprimir',
        texto: 'Marca membrete, nombre y firma del docente, firma de Dirección y sello oficial. Lo que desmarques no se imprime.'
      },
      {
        target: 'cte-resumen',
        titulo: 'Resumen del grupo',
        texto: 'Las cifras del grupo según el semáforo del periodo, listas para presentar en la sesión.'
      },
      {
        target: 'cte-prioritarios',
        titulo: 'Alumnos que requieren apoyo',
        texto: 'Los alumnos en rojo y amarillo con la causa de su situación, para planear la intervención.'
      },
      {
        target: 'cte-firmas',
        opcional: true,
        titulo: 'Firmas y sello',
        texto: 'Espacios para las firmas y el sello, según lo que elegiste incluir.'
      },
      {
        target: 'cte-bitacora',
        titulo: 'Bitácora de acuerdos',
        texto:
          'Aquí quedan todos los acuerdos. Filtra por estatus y cámbialos entre Pendiente, En proceso y Cumplido conforme avances.'
      }
    ]
  },
  {
    id: 'evidencias',
    titulo: 'Carpeta de Evidencias',
    descripcion: 'Fotos de trabajos por alumno',
    icono: FolderLock,
    tab: 'evidencias',
    pasos: [
      {
        target: 'evi-subir',
        titulo: 'Subir foto o archivo',
        texto:
          'Elige el alumno, la materia, un título y la foto. Cada foto puede pesar hasta 3 MB; si pesa más, la app la comprime sola. Desde el celular puedes tomarla en el momento.'
      },
      {
        target: 'evi-filtros',
        titulo: 'Filtros',
        texto: 'Busca por alumno, asignatura o periodo. «Limpiar filtros» los quita todos.'
      },
      {
        target: 'evi-galeria',
        opcional: true,
        titulo: 'Galería',
        texto: 'Toca una foto para verla en grande, pasar al siguiente alumno o ver todas las evidencias de ese alumno.'
      },
      {
        target: 'evi-exportar',
        opcional: true,
        titulo: 'Exportar carpeta del alumno',
        texto: 'Con un alumno elegido en el filtro, abre su expediente completo para imprimirlo o guardarlo en PDF.'
      }
    ]
  },
  {
    id: 'notas',
    titulo: 'Notas de la Maestra',
    descripcion: 'Tu libreta digital',
    icono: StickyNote,
    tab: 'notas',
    pasos: [
      {
        target: 'notas-voz',
        titulo: 'Grabar nota de voz',
        texto: 'Graba un audio rápido sin escribir. Después puedes escucharlo desde la tarjeta de la nota.'
      },
      {
        target: 'notas-nueva',
        titulo: 'Nueva nota',
        texto: 'Escribe una nota con título y categoría (puedes crear las tuyas), y ligarla a un alumno si quieres.'
      },
      {
        target: 'notas-buscar',
        titulo: 'Buscar y filtrar',
        texto: 'Busca por título, texto, categoría o alumno, y filtra por categoría o por «Destacadas».'
      },
      {
        target: 'notas-grid',
        opcional: true,
        titulo: 'Tus notas',
        texto: 'Cada tarjeta se puede editar, destacar o borrar.'
      }
    ]
  }
];

// Orden del recorrido completo (primero lo que hay que configurar, luego el uso diario)
const ORDEN_COMPLETO = [
  'menu', 'ajustes', 'alumnos', 'asistencia', 'tareas', 'calificaciones', 'dashboard', 'cte', 'evidencias', 'notas'
];

const PASO_FINAL = {
  centrado: true,
  titulo: '¡Listo, ya conoces tu app!',
  texto:
    'Cuando quieras repasar un módulo, abre «Guía de uso» en el menú y elige el que necesites. Tus datos se guardan en tu cuenta, así que puedes entrar desde cualquier equipo.'
};

export function contarPasos(idModulo) {
  if (idModulo === 'todo') {
    return ORDEN_COMPLETO.reduce((n, id) => n + MODULOS.find((m) => m.id === id).pasos.length, 0) + 1;
  }
  return MODULOS.find((m) => m.id === idModulo)?.pasos.length || 0;
}

// Devuelve la lista plana de pasos, cada uno con los datos de su módulo
export function construirRecorrido(idModulo) {
  const ids = idModulo === 'todo' ? ORDEN_COMPLETO : [idModulo];
  const pasos = ids.flatMap((id) => {
    const mod = MODULOS.find((m) => m.id === id);
    return mod.pasos.map((p) => ({
      ...p,
      tab: p.tab || mod.tab,
      moduloId: mod.id,
      modulo: mod.titulo,
      icono: mod.icono
    }));
  });
  if (idModulo === 'todo') pasos.push({ ...PASO_FINAL, moduloId: 'fin', modulo: 'Fin', icono: LayoutDashboard });
  return pasos;
}
