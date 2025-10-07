import fetch from "node-fetch";

export const triggerSpeedtest = async () => {
  const SPEEDTEST_BASE_URL = process.env.SPEEDTEST_BASE_URL as string;
  const SPEEDTEST_TOKEN = process.env.SPEEDTEST_TOKEN;

  const USE_MOCK = !SPEEDTEST_BASE_URL || !SPEEDTEST_TOKEN || process.env.USE_MOCK !== "false";

  if (USE_MOCK) {
    console.error("Using mock data for trigger_speedtest");
    
    const shouldSimulateRunning = Math.random() < 0.3;
    
    if (shouldSimulateRunning) {
      throw new Error("Test is already running");
    }

    return {
      success: true,
      message: "Speed test initiated successfully",
      test_id: Math.floor(Math.random() * 10000) + 10000,
      status: "queued",
      estimated_duration: "30-60 seconds"
    };
  }

  try {
    const response = await fetch(`${SPEEDTEST_BASE_URL}/speedtests/run`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SPEEDTEST_TOKEN}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    });

    if (response.status === 409 || response.status === 429) {
      throw new Error("Test is already running");
    }

    if (!response.ok) {
      throw new Error(`Speedtest API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    return {
      success: true,
      message: data.message || "Speed test initiated successfully",
      test_id: data.data?.id,
      status: data.data?.status || "queued",
      estimated_duration: "30-60 seconds"
    };
  } catch (error: any) {
    console.error("Failed to trigger speedtest:", error.message);
    throw error;
  }
};
