import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        status: 'OK',
        service: 'EEG Verification Frontend',
        timestamp: new Date().toISOString()
    });
} 