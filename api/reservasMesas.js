import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    // Conectamos a Neon usando la variable de entorno
    const sql = neon(process.env.DATABASE_URL);
    
    // Obtenemos todas las mesas ordenadas por su ID
    const mesas = await sql`SELECT * FROM mesas ORDER BY id ASC`;
    
    // Devolvemos los datos al frontend en formato JSON
    return res.status(200).json(mesas);
  } catch (error) {
    return res.status(500).json({ 
      error: "Error al cargar las mesas de la base de datos", 
      detalle: error.message 
    });
  }
}