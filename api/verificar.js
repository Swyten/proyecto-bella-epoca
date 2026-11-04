import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { email, codigo } = req.body;
    const sql = neon(process.env.DATABASE_URL);
    
    const usuarios = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    if (usuarios.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const usuario = usuarios[0];
    if (usuario.codigo_verificacion !== codigo) {
      return res.status(401).json({ error: 'Código incorrecto' });
    }

    await sql`UPDATE usuarios SET verificado = true, codigo_verificacion = NULL WHERE email = ${email}`;
    
    return res.status(200).json({ mensaje: 'Cuenta verificada correctamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}