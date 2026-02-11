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

export async function GET(request) {
  try {
    const response = await fetch(
      'https://ptosr.pelindo.co.id/ScheduleBoard/GetData?kd_cabang=61&kd_terminal=601',
        { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter: IS_OPEN_CHECKIN = "1"
    const filteredData = data.filter(item => 
      item.IS_OPEN_CHECKIN === "1" || item.IS_OPEN_CHECKIN === 1
    );

    console.log(`Total kapal: ${data.length}, IS_OPEN_CHECKIN=1: ${filteredData.length}`);

    const client = await pool.connect();
    const result = await client.query('SELECT * FROM schedule_overrides');
    const overrides = result.rows;
    client.release();

    const finalShips = filteredData.map(ship => {
      const overrideData = overrides.find(o => o.voyage_no === ship.VOYAGE_NO);

      if (overrideData) {
        let finalLogo = ship.LOGO_OPERATOR; 

        if (overrideData.logo_operator) {
            const base64String = overrideData.logo_operator.toString('base64');
            const mime = overrideData.mime_type || 'image/jpeg'; 
            finalLogo = `data:${mime};base64,${base64String}`;
        }

        return {
          ...ship,
          NM_OPERATOR: overrideData.nm_operator, 
          NAMA_KAPAL: overrideData.nama_kapal,
          LOGO_OPERATOR: finalLogo,
          id_loket: overrideData.id_loket
        };
      }
      return ship;
    });

    return NextResponse.json(finalShips);

  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    );
  }
}