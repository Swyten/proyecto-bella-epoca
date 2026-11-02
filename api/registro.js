import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

    const sql = neon(process.env.DATABASE_URL);
    
    // Verificar si ya existe
    const existe = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existe.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

    // Encriptar contraseña (10 rondas de salt)
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // Insertar en base de datos
    await sql`INSERT INTO usuarios (email, password_hash) VALUES (${email}, ${hash})`;
    
    return res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor', detalle: error.message });
  }
}