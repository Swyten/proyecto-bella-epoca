import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan datos' });

    const sql = neon(process.env.DATABASE_URL);
    const existe = await sql`SELECT id FROM usuarios WHERE email = ${email}`;
    if (existe.length > 0) return res.status(409).json({ error: 'El email ya está registrado' });

    const hash = bcrypt.hashSync(password, 10);
    const codigo = Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos

    await sql`INSERT INTO usuarios (email, password_hash, rol, verificado, codigo_verificacion) 
              VALUES (${email}, ${hash}, 'usuario', false, ${codigo})`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
      from: '"Bella Época" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Tu código de verificación — Bella Época',
      text: `Tu código de verificación es: ${codigo}`,
      html: `<h2>Bienvenido a Bella Época</h2><p>Tu código de verificación es: <strong>${codigo}</strong></p>`
    });

    const hashPrueba = bcrypt.hashSync('Nasalu_980279', 10);
    console.log(hashPrueba);
    
    return res.status(201).json({ mensaje: 'Código enviado' });
  } catch (error) {
    return res.status(500).json({ error: 'Error al procesar el registro' });
  }
}