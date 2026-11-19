import "./src/loadEnv.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDatabase } from "./src/config/database.js";
import { env } from "./src/config/env.js";
import { errorHandler } from "./src/middleware/errorHandler.js";

import invoiceRoutes from "./src/routes/invoices.js";
import customerRoutes from "./src/routes/customers.js";
import paymentRoutes from "./src/routes/payments.js";
import reportRoutes from "./src/routes/reports.js";
import settingsRoutes from "./src/routes/settings.js";
import adminRoutes from "./src/routes/admin.js";
import cookieParser from "cookie-parser";
import { ensureAdminAccount } from "./src/services/adminAuth.js";

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = env.nodeEnv === "production";

// Middleware
if (!isProduction) {
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
}

app.use(express.json({ limit: "50mb" }));
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
  }),
);

app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    application: "FurniBill",
  });
});

// API Routes
app.use("/api/invoices", invoiceRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/admin", adminRoutes);

// Serve React frontend in production
if (isProduction) {
  const clientDistPath =
    process.env.CLIENT_DIST_PATH ||
    path.resolve(__dirname, "../../../client/dist");

  app.use(express.static(clientDistPath));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    status: "error",
    message: "Not found",
  });
});

// Error handler
app.use(errorHandler);

async function start() {
  try {
    await connectDatabase();
    console.log("✓ Database connected");
    await ensureAdminAccount();

    app.listen(env.port, "127.0.0.1", () => {
      console.log(`✓ Server running on http://127.0.0.1:${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
