import { NextRequest, NextResponse } from "next/server";
import { Login } from "@/app/utils/validation";
import connection from "@/app/config/db";
import bcrypt from "bcryptjs";
import { jeneratejwt } from "@/app/utils/Token";
import { User_Token } from "@/app/utils/types";
/**
 * @method POST
 * @route http://localhost:3000/api/login
 * @description Login a user
 * @access Public
 */
export async function POST(request: NextRequest) {
  var db;
  console.log({
    host: process.env.NEXT_PUBLIC_MYSQL_HOST as string,
    user: process.env.NEXT_PUBLIC_MYSQL_USER as string,
    password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD as string,
    database: process.env.NEXT_PUBLIC_MYSQL_DATABASE as string,
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
  try {
    db = await connection.getConnection();

    const body = await request.json();

    const validation = Login.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const query = "SELECT * FROM User WHERE email = ?";
    const [users]: any = await db.query(query, [body.email]);

    if (users.length > 0) {
      const user = users[0];
      const password: string = user.password;

      const jwtPayloadUser: User_Token = {
        id: user.ID_User,
        email: user.email,
        name: user.name,
        ID_Toshop_List: user.ID_ToShop_List_List,
        ID_Favorate_List: user.ID_FAVORATE_List,
      };

      const token = jeneratejwt(jwtPayloadUser);

      const isValidPassword = await bcrypt.compare(body.password, password);

      if (isValidPassword) {
        return NextResponse.json(
          { message: "Login successfully", token },
          { status: 200 }
        );
      } else {
        return NextResponse.json(
          { message: "Invalid email or password" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error during login:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  } finally {
    if (db) {
      db.release();
    }
  }
}
