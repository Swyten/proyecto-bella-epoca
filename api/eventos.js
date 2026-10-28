import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  try {
    // Conecta con la variable DATABASE_URL de tu .env
    const sql = neon(process.env.DATABASE_URL);
    
    // Extrae todos los eventos ordenados por fecha
    const eventos = await sql`SELECT * FROM eventos ORDER BY inicio ASC`;
    
    // Devuelve los datos en formato JSON
    return res.status(200).json(eventos);
  } catch (error) {
    return res.status(500).json({ error: "Error al conectar con la base de datos", detalle: error.message });
  }
}