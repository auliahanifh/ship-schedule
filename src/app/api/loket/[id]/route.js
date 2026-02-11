export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { Pool } from 'pg'; 

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const loketId = resolvedParams.id; 

  try {
    const client = await pool.connect();
    const result = await client.query(
      `SELECT voyage_no FROM schedule_overrides WHERE id_loket = $1 ORDER BY updated_at DESC LIMIT 1`,
      [loketId]
    );
    client.release();

    if (result.rows.length === 0) {
        return NextResponse.json({ 
            error: `Loket ${loketId} belum di-setting untuk kapal apapun.` 
        }, { status: 404 });
    }

    const voyageNo = result.rows[0].voyage_no;
    const baseUrl = new URL(request.url).origin;
    const response = NextResponse.redirect(`${baseUrl}/view/${voyageNo}?id_loket=${loketId}`, 307);

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}