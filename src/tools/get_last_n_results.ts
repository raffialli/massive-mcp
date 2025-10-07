import fetch from "node-fetch";

interface SpeedtestResult {
  id: number;
  timestamp: string;
  ping: number;
  download: string;
  upload: string;
  server: string;
  isp: string;
  location: string;
}

export const getLastNResults = async (limit: number) => {
  const SPEEDTEST_BASE_URL = process.env.SPEEDTEST_BASE_URL as string;
  const SPEEDTEST_TOKEN = process.env.SPEEDTEST_TOKEN;

  if (limit < 1 || limit > 100) {
    throw new Error("Limit must be between 1 and 100");
  }

  const USE_MOCK = !SPEEDTEST_BASE_URL || !SPEEDTEST_TOKEN || process.env.USE_MOCK !== "false";

  if (USE_MOCK) {
    console.error(`Using mock data for get_last_n_results (limit: ${limit})`);
    
    const mockResults: SpeedtestResult[] = [];
    const now = new Date();
    
    for (let i = 0; i < limit; i++) {
      const timestamp = new Date(now.getTime() - (i * 3600000 * 2));
      const downloadSpeed = 800 + Math.random() * 200;
      const uploadSpeed = 700 + Math.random() * 200;
      
      mockResults.push({
        id: 12345 - i,
        timestamp: timestamp.toISOString(),
        ping: Math.floor(5 + Math.random() * 10),
        download: `${downloadSpeed.toFixed(2)} Mbps`,
        upload: `${uploadSpeed.toFixed(2)} Mbps`,
        server: i % 3 === 0 ? "AT&T Fiber" : i % 3 === 1 ? "Comcast" : "Verizon",
        isp: i % 3 === 0 ? "AT&T" : i % 3 === 1 ? "Comcast" : "Verizon",
        location: i % 2 === 0 ? "Orlando, FL" : "Tampa, FL"
      });
    }

    return {
      count: mockResults.length,
      results: mockResults
    };
  }

  try {
    const response = await fetch(`${SPEEDTEST_BASE_URL}/results?per_page=${limit}&page=1`, {
      headers: {
        "Authorization": `Bearer ${SPEEDTEST_TOKEN}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Speedtest API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const results: SpeedtestResult[] = (data.data || []).map((item: any) => ({
      id: item.id,
      timestamp: item.created_at,
      ping: item.ping,
      download: item.download_bits_human,
      upload: item.upload_bits_human,
      server: item.data?.server?.name || "unknown",
      isp: item.data?.isp || "unknown",
      location: item.data?.server?.location || "unknown"
    }));

    return {
      count: results.length,
      results
    };
  } catch (error: any) {
    console.error("Failed to fetch results:", error.message);
    throw error;
  }
};
