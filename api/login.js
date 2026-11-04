import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, password } = req.body;
    const sql = neon(process.env.DATABASE_URL);
    
    const usuarios = await sql`SELECT * FROM usuarios WHERE email = ${email}`;
    if (usuarios.length === 0) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const usuario = usuarios[0];
    if (!bcrypt.compareSync(password, usuario.password_hash)) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Comprobar si la cuenta está verificada
    if (!usuario.verificado) {
      return res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesión' });
    }

    return res.status(200).json({ 
      mensaje: 'Login correcto', 
      usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol } 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
}