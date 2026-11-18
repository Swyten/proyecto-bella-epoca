import { neon } from '@neondatabase/serverless';
import nodemailer from 'nodemailer';

/**
 * Endpoint Serverless para generar y enviar un código OTP de 6 dígitos
 * al correo del usuario cuando solicita recordar/restablecer su contraseña.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ error: 'Debes introducir tu correo electrónico.' });
    }

    const sql = neon(process.env.DATABASE_URL);
    const usuarios = await sql`SELECT id, email FROM usuarios WHERE email = ${email}`;

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'No existe ninguna cuenta asociada a este correo electrónico.' });
    }

    // Genera un código numérico aleatorio de 6 dígitos y lo almacena en `codigo_verificacion`
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    await sql`UPDATE usuarios SET codigo_verificacion = ${codigo} WHERE email = ${email}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Bella Época" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de contraseña — Bella Época',
      text: `Tu código para restablecer la contraseña en Bella Época es: ${codigo}`,
      html: `
        <div style="background:#000000;color:#F5F5F5;font-family:Arial,sans-serif;padding:32px;max-width:520px;margin:0 auto;border:1px solid #D4A843;border-radius:4px;">
          <p style="color:#D4A843;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Discoteca Bella Época</p>
          <h2 style="margin:0 0 16px 0;color:#FFFFFF;">Restablecer contraseña</h2>
          <p style="color:#A3A3A3;font-size:14px;line-height:1.6;">
            Hemos recibido una solicitud para cambiar la contraseña de tu cuenta. Introduce el siguiente código de verificación en la web:
          </p>
          <div style="background:#141414;border:1px solid #262626;padding:16px;text-align:center;margin:24px 0;border-radius:4px;">
            <strong style="font-size:28px;letter-spacing:6px;color:#D4A843;">${codigo}</strong>
          </div>
          <p style="color:#A3A3A3;font-size:12px;margin:0;">
            Si no has solicitado este cambio, puedes ignorar este mensaje de forma segura.
          </p>
        </div>
      `
    });

    return res.status(200).json({ mensaje: 'Código de recuperación enviado correctamente.' });
  } catch (error) {
    console.error('Error al solicitar recuperación de contraseña:', error);
    return res.status(500).json({ error: 'Error al procesar la solicitud de recuperación.' });
  }
}