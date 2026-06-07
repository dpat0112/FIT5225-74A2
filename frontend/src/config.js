// Shared configuration and small helpers extracted from App.js
export const COGNITO_CONFIG = {
  region: "us-east-1",
  userPoolId: "us-east-1_FB2bm3xBs",
  clientId: "8cc8uqaupjpe5hl005ktue5gr",
};

export const COGNITO_URL = `https://cognito-idp.${COGNITO_CONFIG.region}.amazonaws.com/`;

export const API_BASE = "https://YOUR_API_GATEWAY_URL"; // TODO: replace with real API Gateway URL

export const mockDelay = (ms = 800) => new Promise((r) => setTimeout(r, ms));
