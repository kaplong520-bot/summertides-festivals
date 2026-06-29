const express = require("express");
const axios = require("axios");

const router = express.Router();

const PAYHERO_BASE_URL = "https://backend.payhero.co.ke/api/v2";

const {
    PAYHERO_API_USERNAME,
    PAYHERO_API_PASSWORD,
    PAYHERO_CHANNEL_ID
} = process.env;

// Generate Base64 Basic Auth token
const basicAuthToken = Buffer.from(
    `${PAYHERO_API_USERNAME}:${PAYHERO_API_PASSWORD}`
).toString("base64");

// POST /api/payhero/stk-push
router.post("/stk-push", async(req, res) => {
    try {
        const { phone_number, amount } = req.body;

        if (!phone_number || !amount) {
            return res.status(400).json({
                success: false,
                message: "Phone number and amount are required"
            });
        }

        if (!PAYHERO_CHANNEL_ID) {
            return res.status(500).json({
                success: false,
                message: "PAYHERO_CHANNEL_ID is not configured in .env"
            });
        }

        const payload = {
            amount: Math.round(amount),
            phone_number,
            channel_id: Number(PAYHERO_CHANNEL_ID),
            provider: "m-pesa",
            external_reference: `TXN-${Date.now()}`,
            customer_name: "Summer Tides Customer",
            callback_url: "https://yourdomain.com/api/payhero/payhero-callback"
        };

        console.log("📤 Sending to PayHero:", JSON.stringify(payload, null, 2));

        const response = await axios.post(
            `${PAYHERO_BASE_URL}/payments`,
            payload, {
                headers: {
                    "Authorization": `Basic ${basicAuthToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ PayHero response:", response.status, JSON.stringify(response.data));

        return res.json({
            success: true,
            message: "STK Push sent successfully",
            data: response.data
        });

    } catch (error) {
        // Log full error details for debugging
        if (error.response) {
            console.error("❌ PayHero API error response:");
            console.error("   Status:", error.response.status);
            console.error("   Data:", JSON.stringify(error.response.data));
            console.error("   Headers:", JSON.stringify(error.response.headers));
        } else if (error.request) {
            console.error("❌ No response received from PayHero:", error.message);
        } else {
            console.error("❌ Request setup error:", error.message);
        }

        const errorMessage =
            error.response &&
            error.response.data &&
            (error.response.data.message || error.response.data.error || JSON.stringify(error.response.data));

        return res.status(500).json({
            success: false,
            message: errorMessage || "Payment initiation failed. Check server logs for details."
        });
    }
});

// POST /api/payhero/payhero-callback
router.post("/payhero-callback", async(req, res) => {
    console.log("📞 PayHero Callback received:", JSON.stringify(req.body, null, 2));
    // TODO: Save transaction result to your database
    res.sendStatus(200);
});

module.exports = router;