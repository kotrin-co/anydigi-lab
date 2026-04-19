import { SignJWT, jwtVerify } from "jose";

const getSecret = () => {
  const secret = process.env.MCP_JWT_SECRET;
  if (!secret) throw new Error("MCP_JWT_SECRET is not set");

  return new TextEncoder().encode(secret);
};

export const signToken = async (email: string, expiresInDays: number = 7) => {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${expiresInDays}d`)
    .setIssuer("anydigi-lab")
    .sign(getSecret());

  return token;
};

export const verifyToken = async (token: string) => {
  const { payload } = await jwtVerify(token, getSecret(), {
    issuer: "anydigi-lab",
  });

  if (typeof payload.email !== "string") {
    throw new Error("Invalid token: missing email");
  }

  return payload.email;
};
