export const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: parseInt(process.env.PORT || "5000", 10),

  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/furnibill",

  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-in-production",

  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173" ||"http://localhost:4173",

  businessName: process.env.BUSINESS_NAME || "FurniBill Store",

  businessState: process.env.BUSINESS_STATE || "MH",
};

if (
  env.nodeEnv === "production" &&
  (!process.env.JWT_SECRET ||
    env.jwtSecret === "dev-secret-change-in-production")
) {
  throw new Error("JWT_SECRET must be configured in production");
}
