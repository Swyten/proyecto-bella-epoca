import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Asegurarnos de que solo acepta peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Capturar los nuevos datos que envía el frontend
  const { 
    mesa_id, 
    nombre_reserva, 
    fecha_reserva, 
    tipo_reserva, 
    nombre_cumpleanero, 
    usuario_id 
  } = req.body;

  // Validación básica
  if (!mesa_id || !nombre_reserva || !fecha_reserva) {
    return res.status(400).json({ error: 'Faltan datos obligatorios (mesa, nombre o fecha).' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);

    // Insertamos la nueva reserva en la tabla "reservas"
    await sql`
      INSERT INTO reservas (
        mesa_id, 
        usuario_id, 
        nombre_reserva, 
        fecha_reserva, 
        tipo_reserva, 
        nombre_cumpleanero
      ) VALUES (
        ${mesa_id}, 
        ${usuario_id || null}, 
        ${nombre_reserva}, 
        ${fecha_reserva}, 
        ${tipo_reserva || 'generica'}, 
        ${nombre_cumpleanero || null}
      )
    `;

    return res.status(200).json({ mensaje: 'Reserva confirmada con éxito' });

  } catch (error) {
    console.error("Error al guardar la reserva:", error);
    
    // Si el error es por duplicado (código 23505 en PostgreSQL), significa que
    // alguien más acaba de reservar la misma mesa el mismo día (UNIQUE constraint)
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Lo sentimos, esa mesa acaba de ser reservada para esta fecha.' });
    }

    return res.status(500).json({ 
      error: 'Error interno al procesar la reserva en la base de datos.', 
      detalle: error.message 
    });
  }
}