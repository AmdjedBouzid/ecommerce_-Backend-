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
  let db;
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
    const [existingUsers]: any = await db.query(
      `SELECT * FROM User WHERE email = ?`,
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
    await db.query(
      `INSERT INTO User (name, email, password, IS_Admin, IS_Super_Admin) VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, false, false]
    );

    // Retrieve the newly created user
    const [newUserResult]: any = await db.query(
      `SELECT * FROM User WHERE email = ?`,
      [email]
    );

    if (newUserResult.length === 0) {
      return NextResponse.json(
        { message: "User not found after creation" },
        { status: 500 }
      );
    }
    const NewUser = newUserResult[0];

    // Create favorite list
    await db.query(`INSERT INTO Favorate (ID_User) VALUES (?)`, [
      NewUser.ID_User,
    ]);
    const [listes]: any = await db.query(
      `SELECT * FROM Favorate WHERE ID_User = ?`,
      [NewUser.ID_User]
    );

    if (listes.length === 0) {
      return NextResponse.json(
        { message: "Error creating favorite list" },
        { status: 400 }
      );
    }
    const LISTE = listes[0];

    // Update user with the favorite list ID
    await db.query(`UPDATE User SET ID_FAVORATE_List = ? WHERE ID_User = ?`, [
      LISTE.ID_FAVORATE_List,
      NewUser.ID_User,
    ]);

    // Create toshop list
    await db.query(`INSERT INTO ToShop_List_List (ID_User) VALUES (?)`, [
      NewUser.ID_User,
    ]);
    const [toshope_liste]: any = await db.query(
      `SELECT * FROM ToShop_List_List WHERE ID_User = ?`,
      [NewUser.ID_User]
    );

    if (toshope_liste.length === 0) {
      return NextResponse.json(
        { message: "Error creating toshop list" },
        { status: 400 }
      );
    }
    const TOSHOPE_LISTE = toshope_liste[0];

    // Update user with the toshop list ID
    await db.query(
      `UPDATE User SET ID_ToShop_List_List = ? WHERE ID_User = ?`,
      [TOSHOPE_LISTE.ID_ToShop_List_List, NewUser.ID_User]
    );

    // Create JWT token
    const jwtPayloadUser: User_Token = {
      id: NewUser.ID_User,
      email: NewUser.email,
      name: NewUser.name,
      ID_Toshop_List: TOSHOPE_LISTE.ID_ToShop_List_List,
      ID_Favorate_List: LISTE.ID_FAVORATE_List,
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
    if (db) {
      db.release();
    }
  }
}
