// src/tools/get_latest_speedtest.ts
import fetch from "node-fetch";

export const getLatestSpeedtest = async () => {
  // FIXED: Correct endpoint is /api/v1/results/latest
  const API_URL = "https://speedtest.massive-ai.net/api/v1/results/latest";
  const API_TOKEN = process.env.SPEEDTEST_TOKEN!;

  try {
    const response = await fetch(API_URL, {
      headers: {
        "Authorization": `Bearer ${API_TOKEN}`,
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