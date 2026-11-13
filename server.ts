import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side Gemini AI Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Health
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "finflow-api-gateway",
    version: "1.4.0",
  });
});

// AI Financial Analysis & Assistant Endpoint
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { prompt, transactions, invoices, metricSummary } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback intelligent simulated financial response if API key is not yet set
      return res.json({
        analysis: `**Financial Assessment (FinFlow Intelligence):**\n\n` +
          `• **Cash Flow Health**: Healthy operating buffer with current MTD volume at $842,500.00 and 99.98% payment success rate.\n` +
          `• **Action Item**: 2 overdue invoices total $7,450.00 (Acme Corp & Studio Vertex). Sending automated payment reminder webhooks is recommended.\n` +
          `• **Tax Deduction Opportunity**: Identified 6 SaaS infrastructure and software API vendor expenses eligible for 100% tax write-off.\n` +
          `• **Growth Outlook**: Developer SDK integration time dropped by 60%, driving 3x developer adoption. Projected month-end ARR trajectory: $20.4M.`,
        insights: [
          { type: "warning", message: "2 invoices overdue by > 14 days ($7,450.00 total)" },
          { type: "success", message: "API success rate at 99.98% across 1,242 active SDK integrations" },
          { type: "info", message: "Estimated quarterly tax deduction savings: $3,820.00" }
        ],
        model: "gemini-3.7-flash (fallback preview)"
      });
    }

    const systemInstruction = `You are FinFlow AI, a principal fintech financial analyst and developer advocate for the FinFlow Payments API platform. 
Provide concise, actionable, and mathematically grounded financial insights, cash-flow recommendations, anomaly detection, or API guidance.
Format your answer in crisp markdown with bullet points and bold highlights. Keep it professional and minimalist like a top-tier banking report.`;

    const contextPayload = `
Current Metrics: ${JSON.stringify(metricSummary || {})}
Recent Invoices: ${JSON.stringify((invoices || []).slice(0, 5))}
Recent Transactions: ${JSON.stringify((transactions || []).slice(0, 8))}
User Prompt: ${prompt || "Analyze our current financial health, cash flow risks, and developer API adoption."}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: contextPayload,
      config: {
        systemInstruction,
      }
    });

    res.json({
      analysis: response.text,
      model: "gemini-3.7-flash",
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    res.status(500).json({
      error: "Failed to generate financial analysis",
      details: error.message || "Unknown error"
    });
  }
});

// Simulated Developer-First Payments API Routes for Sandbox
app.post("/api/v1/payments", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ff_")) {
    return res.status(401).json({
      error: {
        code: "unauthorized",
        message: "Invalid or missing FinFlow API Key. Use Bearer ff_test_... or ff_live_...",
      }
    });
  }

  const { amount, currency = "USD", customer_id, payment_method, metadata } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({
      error: {
        code: "invalid_amount",
        message: "Payment amount must be greater than 0."
      }
    });
  }

  // Simulate card declined if amount is 99.00 (test fixture)
  if (amount === 99 || amount === 99.00) {
    return res.status(402).json({
      error: {
        code: "card_declined",
        decline_code: "insufficient_funds",
        message: "Your card has insufficient funds for this transaction.",
        charge_id: `ch_err_${Math.random().toString(36).substring(2, 9)}`
      }
    });
  }

  const paymentIntent = {
    id: `pi_${Math.random().toString(36).substring(2, 11)}`,
    object: "payment_intent",
    amount: parseFloat(amount),
    currency: currency.toUpperCase(),
    status: "succeeded",
    customer: customer_id || `cus_demo_${Math.random().toString(36).substring(2, 7)}`,
    payment_method: payment_method || "pm_card_visa",
    created: Math.floor(Date.now() / 1000),
    livemode: authHeader.includes("ff_live_"),
    metadata: metadata || { platform: "finflow_api" }
  };

  res.status(200).json(paymentIntent);
});

app.post("/api/v1/refunds", (req, res) => {
  const { payment_id, amount, reason } = req.body;
  res.status(200).json({
    id: `ref_${Math.random().toString(36).substring(2, 11)}`,
    object: "refund",
    payment_id: payment_id || "pi_mock_123",
    amount: amount || 45.00,
    currency: "USD",
    status: "succeeded",
    reason: reason || "requested_by_customer",
    created: Math.floor(Date.now() / 1000)
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FinFlow API Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
