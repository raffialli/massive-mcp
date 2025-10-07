import fetch from "node-fetch";

interface BandwidthAnalysis {
  period: {
    days: number;
    start_date: string;
    end_date: string;
  };
  statistics: {
    total_tests: number;
    average_download_mbps: number;
    average_upload_mbps: number;
    min_download_mbps: number;
    max_download_mbps: number;
    min_upload_mbps: number;
    max_upload_mbps: number;
  };
  low_bandwidth_events: Array<{
    id: number;
    timestamp: string;
    download_mbps: number;
    upload_mbps: number;
    percentage_of_average_download: number;
    percentage_of_average_upload: number;
    duration_from_now: string;
  }>;
  summary: string;
}

const bitsToMbps = (bits: number): number => {
  return Math.round((bits / 1000000) * 100) / 100;
};

const getDurationFromNow = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  }
};

export const checkLowBandwidth = async (days: number, thresholdPercentage: number = 70): Promise<BandwidthAnalysis> => {
  const SPEEDTEST_BASE_URL = process.env.SPEEDTEST_BASE_URL as string;
  const SPEEDTEST_TOKEN = process.env.SPEEDTEST_TOKEN;

  if (days < 1 || days > 90) {
    throw new Error("Days must be between 1 and 90");
  }

  if (thresholdPercentage < 1 || thresholdPercentage > 100) {
    throw new Error("Threshold percentage must be between 1 and 100");
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

  const USE_MOCK = !SPEEDTEST_BASE_URL || !SPEEDTEST_TOKEN || process.env.USE_MOCK !== "false";

  if (USE_MOCK) {
    console.error(`Using mock data for check_low_bandwidth (days: ${days}, threshold: ${thresholdPercentage}%)`);
    
    const mockResults: any[] = [];
    const testsPerDay = 8;
    
    for (let i = 0; i < days * testsPerDay; i++) {
      const timestamp = new Date(endDate.getTime() - (i * 3 * 60 * 60 * 1000));
      const baseDownload = 900;
      const baseUpload = 850;
      const variance = Math.random() * 0.4 - 0.2;
      
      const downloadBits = (baseDownload + variance * baseDownload) * 1000000;
      const uploadBits = (baseUpload + variance * baseUpload) * 1000000;
      
      mockResults.push({
        id: 12345 - i,
        created_at: timestamp.toISOString(),
        download: downloadBits,
        upload: uploadBits,
        download_bits: downloadBits,
        upload_bits: uploadBits,
        download_bits_human: `${bitsToMbps(downloadBits)} Mbps`,
        upload_bits_human: `${bitsToMbps(uploadBits)} Mbps`
      });
    }

    const downloadSpeeds = mockResults.map(r => bitsToMbps(r.download_bits));
    const uploadSpeeds = mockResults.map(r => bitsToMbps(r.upload_bits));
    
    const avgDownload = downloadSpeeds.reduce((a, b) => a + b, 0) / downloadSpeeds.length;
    const avgUpload = uploadSpeeds.reduce((a, b) => a + b, 0) / uploadSpeeds.length;
    
    const lowBandwidthEvents = mockResults
      .filter(r => {
        const downloadMbps = bitsToMbps(r.download_bits);
        const uploadMbps = bitsToMbps(r.upload_bits);
        const downloadPct = (downloadMbps / avgDownload) * 100;
        const uploadPct = (uploadMbps / avgUpload) * 100;
        return downloadPct < thresholdPercentage || uploadPct < thresholdPercentage;
      })
      .map(r => ({
        id: r.id,
        timestamp: r.created_at,
        download_mbps: bitsToMbps(r.download_bits),
        upload_mbps: bitsToMbps(r.upload_bits),
        percentage_of_average_download: Math.round((bitsToMbps(r.download_bits) / avgDownload) * 100),
        percentage_of_average_upload: Math.round((bitsToMbps(r.upload_bits) / avgUpload) * 100),
        duration_from_now: getDurationFromNow(r.created_at)
      }));

    const summary = lowBandwidthEvents.length > 0
      ? `Found ${lowBandwidthEvents.length} low bandwidth event${lowBandwidthEvents.length !== 1 ? 's' : ''} out of ${mockResults.length} tests (${Math.round((lowBandwidthEvents.length / mockResults.length) * 100)}%) over the past ${days} day${days !== 1 ? 's' : ''}. Average speeds: ${avgDownload.toFixed(2)} Mbps down / ${avgUpload.toFixed(2)} Mbps up.`
      : `No low bandwidth events detected in the past ${days} day${days !== 1 ? 's' : ''}. All ${mockResults.length} tests were above ${thresholdPercentage}% of average speeds (${avgDownload.toFixed(2)} Mbps down / ${avgUpload.toFixed(2)} Mbps up).`;

    return {
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      statistics: {
        total_tests: mockResults.length,
        average_download_mbps: Math.round(avgDownload * 100) / 100,
        average_upload_mbps: Math.round(avgUpload * 100) / 100,
        min_download_mbps: Math.round(Math.min(...downloadSpeeds) * 100) / 100,
        max_download_mbps: Math.round(Math.max(...downloadSpeeds) * 100) / 100,
        min_upload_mbps: Math.round(Math.min(...uploadSpeeds) * 100) / 100,
        max_upload_mbps: Math.round(Math.max(...uploadSpeeds) * 100) / 100
      },
      low_bandwidth_events: lowBandwidthEvents,
      summary
    };
  }

  try {
    const response = await fetch(
      `${SPEEDTEST_BASE_URL}/results?filter[start_at]=${startDate.toISOString()}&filter[end_at]=${endDate.toISOString()}&per_page=500`,
      {
        headers: {
          "Authorization": `Bearer ${SPEEDTEST_TOKEN}`,
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Speedtest API error: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const results = data.data || [];

    if (results.length === 0) {
      throw new Error(`No results found for the past ${days} day${days !== 1 ? 's' : ''}`);
    }

    const downloadSpeeds = results.map((r: any) => bitsToMbps(r.download_bits));
    const uploadSpeeds = results.map((r: any) => bitsToMbps(r.upload_bits));
    
    const avgDownload = downloadSpeeds.reduce((a: number, b: number) => a + b, 0) / downloadSpeeds.length;
    const avgUpload = uploadSpeeds.reduce((a: number, b: number) => a + b, 0) / uploadSpeeds.length;
    
    const lowBandwidthEvents = results
      .filter((r: any) => {
        const downloadMbps = bitsToMbps(r.download_bits);
        const uploadMbps = bitsToMbps(r.upload_bits);
        const downloadPct = (downloadMbps / avgDownload) * 100;
        const uploadPct = (uploadMbps / avgUpload) * 100;
        return downloadPct < thresholdPercentage || uploadPct < thresholdPercentage;
      })
      .map((r: any) => ({
        id: r.id,
        timestamp: r.created_at,
        download_mbps: bitsToMbps(r.download_bits),
        upload_mbps: bitsToMbps(r.upload_bits),
        percentage_of_average_download: Math.round((bitsToMbps(r.download_bits) / avgDownload) * 100),
        percentage_of_average_upload: Math.round((bitsToMbps(r.upload_bits) / avgUpload) * 100),
        duration_from_now: getDurationFromNow(r.created_at)
      }));

    const summary = lowBandwidthEvents.length > 0
      ? `Found ${lowBandwidthEvents.length} low bandwidth event${lowBandwidthEvents.length !== 1 ? 's' : ''} out of ${results.length} tests (${Math.round((lowBandwidthEvents.length / results.length) * 100)}%) over the past ${days} day${days !== 1 ? 's' : ''}. Average speeds: ${avgDownload.toFixed(2)} Mbps down / ${avgUpload.toFixed(2)} Mbps up.`
      : `No low bandwidth events detected in the past ${days} day${days !== 1 ? 's' : ''}. All ${results.length} tests were above ${thresholdPercentage}% of average speeds (${avgDownload.toFixed(2)} Mbps down / ${avgUpload.toFixed(2)} Mbps up).`;

    return {
      period: {
        days,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      },
      statistics: {
        total_tests: results.length,
        average_download_mbps: Math.round(avgDownload * 100) / 100,
        average_upload_mbps: Math.round(avgUpload * 100) / 100,
        min_download_mbps: Math.round(Math.min(...downloadSpeeds) * 100) / 100,
        max_download_mbps: Math.round(Math.max(...downloadSpeeds) * 100) / 100,
        min_upload_mbps: Math.round(Math.min(...uploadSpeeds) * 100) / 100,
        max_upload_mbps: Math.round(Math.max(...uploadSpeeds) * 100) / 100
      },
      low_bandwidth_events: lowBandwidthEvents,
      summary
    };
  } catch (error: any) {
    console.error("Failed to check low bandwidth:", error.message);
    throw error;
  }
};
