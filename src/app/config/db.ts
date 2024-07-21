import mysql from "mysql2/promise";

const connection = mysql.createPool({
  host: process.env.NEXT_PUBLIC_MYSQL_HOST as string,
  user: process.env.NEXT_PUBLIC_MYSQL_USER as string,
  password: process.env.NEXT_PUBLIC_MYSQL_PASSWORD as string,
  database: process.env.NEXT_PUBLIC_MYSQL_DATABASE as string,
  port: 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default connection;
