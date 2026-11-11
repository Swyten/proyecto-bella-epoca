import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Capturamos la fecha que nos envía el frontend (reserva.js)
    const { fecha } = req.query;
    
    let mesas;

    if (fecha) {
      // Si hay fecha, cruzamos las mesas con las reservas de ESE DÍA concreto
      mesas = await sql`
        SELECT 
          m.id, 
          m.nombre, 
          m.zona, 
          m.capacidad, 
          m.consumo_minimo,
          -- Si no hay registro en 'reservas' para esa fecha, r.id será nulo (está disponible)
          CASE WHEN r.id IS NULL THEN true ELSE false END as disponible,
          r.nombre_reserva,
          r.tipo_reserva,
          r.nombre_cumpleanero
        FROM mesas m
        LEFT JOIN reservas r ON m.id = r.mesa_id AND r.fecha_reserva = ${fecha}
        ORDER BY m.id ASC
      `;
    } else {
      // Si no se envía fecha (caso raro o carga inicial sin seleccionar fecha), 
      // devolvemos el catálogo de mesas base asumiendo 'true' para no romper la interfaz
      mesas = await sql`
        SELECT *, true as disponible 
        FROM mesas 
        ORDER BY id ASC
      `;
    }
    
    return res.status(200).json(mesas);
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ 
      error: "Error al cargar la disponibilidad de las mesas", 
      detalle: error.message 
    });
  }
}