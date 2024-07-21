import { NextRequest, NextResponse } from "next/server";
import { regester } from "@/app/utils/validation";
import bcrypt from "bcryptjs";
import { jeneratejwt } from "@/app/utils/Token";
import { User_Token } from "@/app/utils/types";
import connection from "@/app/config/db";

/**
 * @method POST
 * @route http://localhost:3000/api/regester
 * @description Register a user
 * @access public
 */

export async function POST(request: NextRequest) {
  var db;
  try {
    const body = await request.json();

    const validation = regester.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }
    db = await connection.getConnection();
    const { username, email, password } = body;

    // Check if the user already exists
    const [existingUsers]: any = await connection.query(
      `
      SELECT * FROM User WHERE email = ?
    `,
      [email]
    );

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const saltNumber = parseInt(
      process.env.NEXT_PUBLIC_SALT_NUMBER as string,
      10
    );
    const salt = await bcrypt.genSalt(saltNumber);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert the new user into the database
    await connection.query(
      `
      INSERT INTO User (name, email, password)
      VALUES (?, ?, ?)
    `,
      [username, email, hashedPassword]
    );

    // Retrieve the newly created user
    const [newUserResult]: any = await connection.query(
      `
      SELECT * FROM User WHERE email = ?
    `,
      [email]
    );

    if (newUserResult.length === 0) {
      return NextResponse.json(
        { message: "User not found after creation" },
        { status: 500 }
      );
    }

    const newUser = newUserResult[0];
    const jwtPayloadUser: User_Token = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
    };
    const token = jeneratejwt(jwtPayloadUser);

    return NextResponse.json(
      {
        message: "Successful",
        user: { name: username, email: email },
        token: token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { message: "Error occurred", error },
      { status: 500 }
    );
  } finally {
    db?.release();
  }
}
