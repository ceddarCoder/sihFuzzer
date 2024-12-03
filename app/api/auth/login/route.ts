import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 
import UserModel from '../../../../lib/models/User';

const uri = process.env.MONGODB_URI;

async function connectToDatabase() {
    if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri as string);
    }
}

export async function POST(request: Request) {
    const { username, password } = await request.json();

    try {
        await connectToDatabase();

        const user = await UserModel.findOne({ name: username });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }   

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

        // Create the response and set both the JWT token and isAuthenticated cookies
        // server-side code in login/route.ts
        const response = NextResponse.json({ message: 'Login successful', userId: user._id }, { status: 200 });

        // Set the JWT token as HTTP-only cookie
        response.cookies.set('token', token, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1, // Expires in 1 hour
        });

        // Set the userId as a normal cookie (accessible via JavaScript)
        response.cookies.set('userId', user._id.toString(), {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 1, // Expires in 1 hour
        });



        // Set the isAuthenticated flag cookie
        response.cookies.set('isAuthenticated', 'true', {
            httpOnly: false, // This one can be accessed by JavaScript
            path: '/',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 1, // Same expiration time
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
