import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token no proporcionado' });
    }

    // 1. Validar el token con la API de Google para obtener los datos del usuario
    const googleRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const googleUser = await googleRes.json();

    if (!googleUser.email) {
      return res.status(401).json({ error: 'Token de Google inválido' });
    }

    const sql = neon(process.env.DATABASE_URL);
    
    // 2. Comprobar si el usuario ya existe en tu base de datos Neon
    let usuarios = await sql`SELECT * FROM usuarios WHERE email = ${googleUser.email}`;

    // 3. Si no existe, lo registramos automáticamente (verificado: true porque Google ya validó su correo)
    if (usuarios.length === 0) {
      const randomPass = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      const hash = bcrypt.hashSync(randomPass, 10);
      
      await sql`
        INSERT INTO usuarios (email, password_hash, rol, verificado) 
        VALUES (${googleUser.email}, ${hash}, 'usuario', true)
      `;
      
      usuarios = await sql`SELECT * FROM usuarios WHERE email = ${googleUser.email}`;
    }

    const usuario = usuarios[0];

    // 4. Devolver la respuesta en formato JSON correcto
    return res.status(200).json({ 
      mensaje: 'Login con Google correcto', 
      usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol } 
    });

  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
  }
}