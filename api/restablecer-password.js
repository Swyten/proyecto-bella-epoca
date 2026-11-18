import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

/**
 * Endpoint Serverless para verificar el código OTP de 6 dígitos y actualizar
 * la contraseña hasheada con bcrypt en la tabla `usuarios` de Neon PostgreSQL.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email, codigo, nuevaPassword } = req.body || {};

    if (!email || !codigo || !nuevaPassword) {
      return res.status(400).json({ error: 'Faltan datos obligatorios.' });
    }

    if (nuevaPassword.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const usuarios = await sql`SELECT id, codigo_verificacion FROM usuarios WHERE email = ${email}`;

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = usuarios[0];

    // Comprueba que el código OTP almacenado coincida exactamente con el introducido
    if (!usuario.codigo_verificacion || usuario.codigo_verificacion !== codigo) {
      return res.status(401).json({ error: 'El código de verificación es incorrecto.' });
    }

    // Hashea la nueva contraseña con bcrypt (coste 10) igual que en registro.js
    const nuevoHash = bcrypt.hashSync(nuevaPassword, 10);

    // Actualiza la contraseña hasheada, invalida el código usado y asegura `verificado = true`
    await sql`
      UPDATE usuarios
      SET password_hash = ${nuevoHash},
          codigo_verificacion = NULL,
          verificado = true
      WHERE email = ${email}
    `;

    return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error('Error al restablecer la contraseña:', error);
    return res.status(500).json({ error: 'Error en el servidor al actualizar la contraseña.' });
  }
}