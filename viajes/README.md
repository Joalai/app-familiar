# App reutilizable para grandes viajes

Primera implementación real: **China · Semana Santa 2027**.

## Arquitectura
- **Motor**: `index.html`, `styles.css`, `app.js`.
- **Datos**: Supabase, tablas `travel_*`, separadas de la App Familiar.
- **Viaje activo**: se selecciona por `?trip=china-2027`.
- **Integración familiar**: reutiliza el mismo código familiar y usuario almacenados en el navegador, pero no mezcla el itinerario con la agenda familiar.
- **Offline**: service worker para el shell + última copia de datos en localStorage.

## Alcance v0.1
- Portada China 2027 y cuenta atrás.
- Bloque Ahora / Lo siguiente.
- Itinerario actual día a día.
- Transportes, alojamientos, entradas y documentación.
- Cambio compartido de estado: pendiente / planificado / reservado / pagado / completado / no necesario.
- Presupuesto inicial basado en las estimaciones de la guía v4.
- Base técnica reutilizable para futuros viajes.

## Próximas fases
Edición completa de fichas, mapa, documentos/QR, restaurantes, información útil, maletas enlazadas, pendientes derivados y sincronización selectiva con Tareas / Lo que viene de la App Familiar.
