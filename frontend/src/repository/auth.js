import { COGNITO_CONFIG, COGNITO_URL } from "../config";

// Helper: call Cognito API
async function cognitoRequest(action, body) {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || data.__type || "Cognito error");
  return data;
}

// Note: Additional auth flows you might add later: forgotPassword / confirmForgotPassword, refreshTokens, getUser (AdminGetUser / GetUser).
