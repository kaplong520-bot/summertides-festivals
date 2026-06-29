const axios = require("axios");

module.exports = async(req, res) => {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight OPTIONS request
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ success: false, message: "Method not allowed" });
    }

    try {
        const { phone_number, amount } = req.body;

        if (!phone_number || !amount) {
            return res.status(400).json({
                success: false,
                message: "Phone number and amount are required"
            });
        }

        const PAYHERO_BASE_URL = "https://backend.payhero.co.ke/api/v2";

        // Check environment variables
        if (!process.env.PAYHERO_API_USERNAME || !process.env.PAYHERO_API_PASSWORD || !process.env.PAYHERO_CHANNEL_ID) {
            console.error("❌ Missing PayHero environment variables");
            return res.status(500).json({
                success: false,
                message: "Server configuration error: Missing PayHero credentials"
            });
        }

        // Generate Basic Auth token
        const basicAuthToken = Buffer.from(
            `${process.env.PAYHERO_API_USERNAME}:${process.env.PAYHERO_API_PASSWORD}`
        ).toString("base64");

        const payload = {
            amount: Math.round(amount),
            phone_number,
            channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
            provider: "m-pesa",
            external_reference: `TXN-${Date.now()}`,
            customer_name: "Summer Tides Customer",
            callback_url: "https://yourdomain.com/api/payhero-callback"
        };

        console.log("📤 Sending to PayHero:", JSON.stringify(payload, null, 2));

        const response = await axios.post(
            `${PAYHERO_BASE_URL}/payments`,
            payload, {
                headers: {
                    "Authorization": `Basic ${basicAuthToken}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );

        console.log("✅ PayHero response:", response.status, JSON.stringify(response.data));

        return res.status(200).json({
            success: true,
            message: "STK Push sent successfully",
            data: response.data
        });

    } catch (error) {
        // Detailed error logging
        if (error.response) {
            console.error("❌ PayHero API error:");
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data));
        } else if (error.code === "ECONNABORTED") {
            console.error("❌ PayHero request timed out");
        } else {
            console.error("❌ PayHero error:", error.message);
        }

        const errorMessage =
            error.response &&
            error.response.data &&
            (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data));

        return res.status(500).json({
            success: false,
            message: errorMessage || "Payment initiation failed. Please try again."
        });
    }
};