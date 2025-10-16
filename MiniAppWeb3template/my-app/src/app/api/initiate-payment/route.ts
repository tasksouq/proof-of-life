import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { propertyType, paymentToken, amount, userAddress } = body;
    
    // Generate unique reference ID
    const uuid = crypto.randomUUID().replace(/-/g, '');
    
    // TODO: Store the payment reference in your database
    // For now, we'll store it in memory (in production, use a proper database)
    const paymentData = {
      id: uuid,
      propertyType,
      paymentToken,
      amount,
      userAddress,
      status: 'initiated',
      createdAt: new Date().toISOString()
    };
    
    console.log('Payment initiated:', paymentData);
    
    return NextResponse.json({ 
      id: uuid,
      success: true 
    });
  } catch (error) {
    console.error('Error initiating payment:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}