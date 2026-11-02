import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

    const sql = neon(process.env.DATABASE_URL);
    
    // Buscar usuario
    const usuarios = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    if (usuarios.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const usuario = usuarios[0];

    // Comparar la contraseña introducida con el hash guardado
    const coincide = bcrypt.compareSync(password, usuario.password_hash);
    if (!coincide) return res.status(401).json({ error: 'Credenciales incorrectas' });

    // Login exitoso: devolvemos los datos básicos (sin el hash)
    return res.status(200).json({ 
      mensaje: 'Login correcto', 
      usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol } 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
  }
}