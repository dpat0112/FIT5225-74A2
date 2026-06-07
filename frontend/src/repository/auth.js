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

export async function login(email, password) {
  const data = await cognitoRequest("InitiateAuth", {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: COGNITO_CONFIG.clientId,
    AuthParameters: { USERNAME: email, PASSWORD: password },
  });
  const token = data.AuthenticationResult.IdToken;
  const accessToken = data.AuthenticationResult.AccessToken;
  const payload = JSON.parse(atob(token.split(".")[1]));
  return {
    token,
    accessToken,
    user: {
      email: payload.email || email,
      firstName: payload.given_name || email.split("@")[0],
      lastName: payload.family_name || "",
    },
  };
}

export async function signup(email, password, firstName, lastName) {
  await cognitoRequest("SignUp", {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
    Password: password,
    UserAttributes: [
      { Name: "email", Value: email },
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
    ],
  });
  return {
    success: true,
    message:
      "Account created! Please check your email to verify your account before signing in.",
  };
}

export async function logout(accessToken) {
  if (accessToken) {
    try {
      await cognitoRequest("GlobalSignOut", { AccessToken: accessToken });
    } catch (e) {
      /* ignore */
    }
  }
  return { success: true };
}

export async function confirmSignUp(email, code) {
  await cognitoRequest("ConfirmSignUp", {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
    ConfirmationCode: code,
  });
  return { success: true, message: "Account verified successfully." };
}

export async function resendConfirmationCode(email) {
  const data = await cognitoRequest("ResendConfirmationCode", {
    ClientId: COGNITO_CONFIG.clientId,
    Username: email,
  });
  return {
    success: true,
    message: data.CodeDeliveryDetails
      ? `Code sent to ${data.CodeDeliveryDetails.Destination}`
      : "Code resent.",
  };
}

// Note: Additional auth flows you might add later: forgotPassword / confirmForgotPassword, refreshTokens, getUser (AdminGetUser / GetUser).
