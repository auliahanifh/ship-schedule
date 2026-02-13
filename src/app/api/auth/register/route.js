import { NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs"; 

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { message: "Username dan Password wajib diisi!" },
        { status: 400 }
      );
    }

    const checkUser = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    if (checkUser.rows.length > 0) {
      return NextResponse.json(
        { message: "Username sudah terdaftar!" },
        { status: 400 }
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, password) VALUES ($1, $2)",
      [username, hashedPassword] 
    );

    return NextResponse.json({ message: "Register berhasil!" }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}