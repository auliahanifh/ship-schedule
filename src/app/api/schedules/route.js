// app/api/schedules/route.js
export async function GET(request) {
  try {
    const response = await fetch(
      'https://ptosr.pelindo.co.id/ScheduleBoard/GetData?kd_cabang=61&kd_terminal=601',
      {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' 
      }
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

    return Response.json(filteredData);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return Response.json(
      { error: 'Failed to fetch data', message: error.message },
      { status: 500 }
    );
  }
}