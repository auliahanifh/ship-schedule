import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const id_kapal = formData.get('id_kapal'); 
    const operator = formData.get('operator');
    const kapal = formData.get('kapal');
    const file = formData.get('logo');
    const targetLoketUrl = formData.get('target_loket_url');

    let imageBuffer = null;

    if (file && file instanceof File && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const query = `
      INSERT INTO schedule_overrides (voyage_no, nm_operator, nama_kapal, logo_operator, target_loket_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (voyage_no) 
      DO UPDATE SET 
        nm_operator = EXCLUDED.nm_operator,
        nama_kapal = EXCLUDED.nama_kapal,
        logo_operator = COALESCE($4, schedule_overrides.logo_operator),
        target_loket_url = EXCLUDED.target_loket_url,
        updated_at = NOW();
    `;

    const client = await pool.connect();
    await client.query(query, [id_kapal, operator, kapal, imageBuffer, targetLoketUrl]);
    client.release();

    return NextResponse.json({ message: 'Data & Gambar (BYTEA) berhasil disimpan' });

  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ message: 'Gagal update database' }, { status: 500 });
  }
}