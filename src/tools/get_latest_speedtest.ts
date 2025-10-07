import fetch from "node-fetch";

export const getLatestSpeedtest = async () => {
  const SPEEDTEST_BASE_URL = process.env.SPEEDTEST_BASE_URL as string;
  const SPEEDTEST_TOKEN = process.env.SPEEDTEST_TOKEN;

  const USE_MOCK = !SPEEDTEST_BASE_URL || !SPEEDTEST_TOKEN || process.env.USE_MOCK !== "false";

  if (USE_MOCK) {
    console.error("Using mock data for get_latest_speedtest");
    return {
      id: 12345,
      timestamp: new Date().toISOString(),
      ping: 7,
      download: "918.34 Mbps",
      upload: "838.21 Mbps",
      server: "AT&T Fiber",
      isp: "AT&T",
      location: "Orlando, FL",
      raw: {
        id: 12345,
        service: "ookla",
        ping: 7,
        download: 918340000,
        upload: 838210000,
        download_bits_human: "918.34 Mbps",
        upload_bits_human: "838.21 Mbps",
        created_at: new Date().toISOString()
      }
    };
  }

  try {
    const response = await fetch(`${SPEEDTEST_BASE_URL}/results/latest`, {
      headers: {
        "Authorization": `Bearer ${SPEEDTEST_TOKEN}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Speedtest API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      id: data.id,
      timestamp: data.created_at,
      ping: data.ping,
      download: data.download_bits_human,
      upload: data.upload_bits_human,
      server: data.data?.server?.name || "unknown",
      isp: data.data?.isp || "unknown",
      location: data.data?.server?.location || "unknown",
      raw: data,
    };
  } catch (error: any) {
    console.error("Failed to fetch latest speedtest:", error.message);
    throw error;
  }
};
