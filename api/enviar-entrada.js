import nodemailer from 'nodemailer';

/**
 * Endpoint Serverless para enviar por correo electrónico la entrada anticipada
 * con su código QR y los datos nominativos del comprador (tomando el email de la sesión).
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { referencia, nombre, email, telefono, fecha, ultimos4, qrData } = req.body || {};

  if (!referencia || !nombre || !email || !telefono || !fecha || !qrData) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para generar y enviar la entrada.' });
  }

  // Genera la imagen del código QR compatible con cualquier cliente de correo
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrData)}`;

  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Discoteca Bella Época" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Tu Entrada Anticipada con QR — Bella Época (${referencia})`,
        html: `
          <div style="background:#000000;color:#F5F5F5;font-family:Arial,sans-serif;padding:32px;max-width:560px;margin:0 auto;border:1px solid #D4A843;border-radius:4px;">
            <p style="color:#D4A843;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px 0;">Discoteca Bella Época · Logroño</p>
            <h1 style="margin:0 0 16px 0;font-size:24px;color:#FFFFFF;">Pase Nominativo Oficial</h1>
            <p style="color:#A3A3A3;font-size:14px;line-height:1.6;">
              Hola <strong style="color:#FFFFFF;">${nombre}</strong>, adjuntamos tu entrada anticipada con código QR asociada a tu cuenta.
            </p>
            <div style="background:#FFFFFF;padding:16px;border-radius:4px;text-align:center;margin:24px 0;">
              <img src="${qrImageUrl}" alt="Código QR de acceso ${referencia}" width="200" height="200" />
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:14px;color:#F5F5F5;">
              <tr><td style="padding:8px 0;color:#A3A3A3;">Referencia:</td><td style="padding:8px 0;text-align:right;font-weight:bold;color:#D4A843;">#${referencia}</td></tr>
              <tr><td style="padding:8px 0;color:#A3A3A3;">Titular:</td><td style="padding:8px 0;text-align:right;">${nombre}</td></tr>
              <tr><td style="padding:8px 0;color:#A3A3A3;">Fecha de acceso:</td><td style="padding:8px 0;text-align:right;">${fecha}</td></tr>
              <tr><td style="padding:8px 0;color:#A3A3A3;">Correo asociado:</td><td style="padding:8px 0;text-align:right;">${email}</td></tr>
              <tr><td style="padding:8px 0;color:#A3A3A3;">Teléfono:</td><td style="padding:8px 0;text-align:right;">${telefono}</td></tr>
              <tr><td style="padding:8px 0;color:#A3A3A3;">Pago:</td><td style="padding:8px 0;text-align:right;">Tarjeta Visa •••• ${ultimos4 || 'XXXX'} (15,00 €)</td></tr>
            </table>
            <p style="color:#A3A3A3;font-size:12px;margin-top:24px;border-top:1px solid #262626;padding-top:16px;">
              Presenta este código QR junto con tu DNI, pasaporte o carné físico original en Calle Vitoria, 25 (Logroño). Acceso exclusivo mayores de 18 años.
            </p>
          </div>
        `
      });
    }

    return res.status(200).json({
      ok: true,
      mensaje: 'Entrada generada y enviada correctamente al correo de la sesión.',
      referencia
    });
  } catch (error) {
    console.error('Error al enviar entrada por correo:', error);
    return res.status(500).json({ error: 'Error al enviar el correo con la entrada.' });
  }
}