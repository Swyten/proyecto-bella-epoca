import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // GET: Obtener reseñas
    if (req.method === 'GET') {
      const result = await sql`SELECT * FROM resenas ORDER BY fecha DESC`;
      return res.status(200).json(result);
    }

    // POST: Crear reseña
    if (req.method === 'POST') {
      const { nombre, estrellas, comentario } = req.body || {};

      if (!nombre || !estrellas || !comentario) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' });
      }

      const result = await sql`
        INSERT INTO resenas (nombre, estrellas, comentario) 
        VALUES (${nombre}, ${parseInt(estrellas)}, ${comentario}) 
        RETURNING *
      `;
      return res.status(201).json(result[0]);
    }

    return res.status(405).json({ error: 'Método no permitido' });
  } catch (error) {
    console.error('Error en API Reseñas:', error);
    return res.status(500).json({ error: 'Error interno en la base de datos' });
  }
}