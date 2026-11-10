// Obtener todas las reseñas ordenadas por fecha más reciente
app.get('/api/resenas', async (req, res) => {
  try {
    const result = await sql`SELECT * FROM resenas ORDER BY fecha DESC`;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener las reseñas' });
  }
});

// Crear una nueva reseña
app.post('/api/crearResena', async (req, res) => {
  const { nombre, estrellas, comentario } = req.body;

  if (!nombre || !estrellas || !comentario) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const result = await sql`
      INSERT INTO resenas (nombre, estrellas, comentario) 
      VALUES (${nombre}, ${estrellas}, ${comentario}) 
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al guardar la reseña' });
  }
});