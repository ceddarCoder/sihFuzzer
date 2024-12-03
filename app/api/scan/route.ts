import { NextRequest, NextResponse } from 'next/server';

const ZAP_API_URL = 'http://localhost:8081/';
const ZAP_API_KEY = process.env.ZAP_API_KEY || ''; // Ensure API key is set in .env.local

// Helper function to retry a fetch request in case of errors
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) {
                return response;
            } else {
                const errorBody = await response.text();
                lastError = new Error(`Received non-OK response: ${response.statusText}, Body: ${errorBody}`);
                console.error(lastError.message);  // Log the detailed error response
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                lastError = error;
            } else {
                lastError = new Error('Unknown error occurred');
            }
            console.error(lastError.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Retry delay
    }
    if (lastError) {
        throw lastError;  // Throw the last error encountered
    }
    throw new Error('Failed after retries');
}

// Start spider (crawling) the provided URL
async function startSpider(url: string) {
    const spiderUrl = `${ZAP_API_URL}JSON/spider/action/scan/`;
    const params = new URLSearchParams({
        url: url,
        apikey: ZAP_API_KEY,
    });

    const res = await fetchWithRetry(spiderUrl + '?' + params.toString(), { method: 'GET' });
    if (!res.ok) {
        throw new Error('Failed to start spider scan');
    }

    const data = await res.json();
    return data.scanId; // Return spider scan ID
}

// Check spider status
async function checkSpiderStatus(scanId: string) {
    const statusUrl = `${ZAP_API_URL}JSON/spider/view/status/`;
    const params = new URLSearchParams({
        scanId: scanId,
        apikey: ZAP_API_KEY,
    });

    const res = await fetchWithRetry(statusUrl + '?' + params.toString(), { method: 'GET' });
    if (!res.ok) {
        throw new Error('Failed to fetch spider status');
    }

    const data = await res.json();
    return data.status;
}

// Start the scan on the provided URL
async function startScan(url: string) {
    const scanUrl = `${ZAP_API_URL}JSON/ascan/action/scan/`;
    const params = new URLSearchParams({
        url: url,
        apikey: ZAP_API_KEY,
    });

    const res = await fetchWithRetry(scanUrl + '?' + params.toString(), { method: 'GET' });
    const data = await res.json();
    console.log('Scan started successfully:', data);
    return data.scanId;
}

// Get and filter alerts for the given scan
async function getFilteredAlerts(scanId: string, url: string) {
    const alertsUrl = `${ZAP_API_URL}JSON/core/view/alerts/`;
    const alertParams = new URLSearchParams({
        baseurl: url,
        apikey: ZAP_API_KEY,
    });

    const alertRes = await fetchWithRetry(alertsUrl + '?' + alertParams.toString(), { method: 'GET' });

    if (!alertRes.ok) {
        throw new Error('Failed to fetch the scan alerts');
    }

    const alertData = await alertRes.json();

    // Filter out "Informational" risk alerts
    let filteredAlerts = alertData.alerts.filter((alert: any) => alert.risk !== 'Informational');

    // Remove duplicates based on the 'description' field
    const uniqueAlerts: any[] = [];
    const seenDescriptions = new Set();

    for (const alert of filteredAlerts) {
        if (!seenDescriptions.has(alert.description)) {
            seenDescriptions.add(alert.description);
            uniqueAlerts.push(alert);
        }
    }

    // Sort alerts by risk (you can modify this to sort by another property, such as timestamp)
    const sortedAlerts = uniqueAlerts.sort((a, b) => {
        const riskLevels: { [key: string]: number } = { 'Low': 1, 'Medium': 2, 'High': 3, 'Critical': 4 };
        return (riskLevels[b.risk] || 0) - (riskLevels[a.risk] || 0);  // Sort in descending order (High -> Low)
    });
    return sortedAlerts;
}

// Check the status of a running scan
async function checkScanStatus(scanId: string) {
    const statusUrl = `${ZAP_API_URL}JSON/ascan/view/status/`;
    const params = new URLSearchParams({
        scanId: scanId,
        apikey: ZAP_API_KEY,
    });

    const res = await fetchWithRetry(statusUrl + '?' + params.toString(), { method: 'GET' });

    if (!res.ok) {
        throw new Error('Failed to fetch the scan status');
    }

    const data = await res.json();
    return data.status;
}

// Get scan results after the scan is complete
async function getScanResults(scanId: string, url: string) {
    let scanStatus = await checkScanStatus(scanId);

    // Wait until scan is complete (100% status)
    while (scanStatus !== '100') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
        scanStatus = await checkScanStatus(scanId); // Check scan status again
    }

    // After scan is complete, retrieve and filter the alerts
    const filteredAlerts = await getFilteredAlerts(scanId, url);

    return { scanId, alerts: filteredAlerts };
}

export async function POST(request: NextRequest) {
    const { url } = await request.json();

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    try {
        // Start spider (crawling) the URL first
        const spiderScanId = await startSpider(url);

        // Wait for spidering to finish
        let spiderStatus = await checkSpiderStatus(spiderScanId);
        while (spiderStatus !== '100') {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before checking again
            spiderStatus = await checkSpiderStatus(spiderScanId); // Check spider status again
        }

        // After spidering is done, start the actual vulnerability scan
        const scanId = await startScan(url);

        // Wait for scan to complete and retrieve filtered results
        const { scanId: completedScanId, alerts } = await getScanResults(scanId, url);

        // Return sorted and non-duplicate alerts after scan completion
        return NextResponse.json({ scanId: completedScanId, alerts }, { status: 200 });
        
    } catch (error) {
        console.error('Error during scan:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
