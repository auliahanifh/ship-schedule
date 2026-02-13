import { NextResponse } from 'next/server';
import pool from '@/lib/db'; 
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { username, oldPassword, newPassword, currentUsername } = await request.json();

    if (!currentUsername || !oldPassword) {
      return NextResponse.json({ message: 'Data tidak lengkap' }, { status: 400 });
    }

    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [currentUsername]);
    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ message: 'Password lama salah!' }, { status: 401 });
    }

    let query, params;
    
    if (newPassword && newPassword.length > 0) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      query = 'UPDATE users SET username = $1, password = $2 WHERE username = $3';
      params = [username, hashedPassword, currentUsername];
    } else {
      query = 'UPDATE users SET username = $1 WHERE username = $2';
      params = [username, currentUsername];
    }

    await pool.query(query, params);

    return NextResponse.json({ message: 'Profil berhasil diperbarui' });

  } catch (error) {
    console.error('Update Profile Error:', error);
    if (error.code === '23505') { 
        return NextResponse.json({ message: 'Username sudah dipakai orang lain!' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Gagal update profil' }, { status: 500 });
  }
}