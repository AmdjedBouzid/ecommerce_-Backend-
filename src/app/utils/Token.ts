import Jwt from "jsonwebtoken";
const cecret = process.env.SECRETJWTKEY as string;
import { NextResponse } from "next/server";
import { User_Token } from "./types";
if (!cecret) {
  console.log("SECRETJWTKEY is not defined in environment variables");
}
const token_password = process.env.NEXT_PUBLIC_TOKEN_PASSWORD as string;

export function jeneratejwt(user: User_Token): string {
  const token = Jwt.sign(user, token_password, {
    expiresIn: "20d",
  });
  return token;
}
