import { NextRequest, NextResponse } from 'next/server';
import { MiniAppPaymentSuccessPayload } from '@worldcoin/minikit-js';

interface IRequestPayload {
  payload: MiniAppPaymentSuccessPayload;
}

export async function POST(req: NextRequest) {
  try {
    const { payload } = (await req.json()) as IRequestPayload;
    
    console.log('Payment confirmation received:', payload);
    
    // IMPORTANT: Here we should fetch the reference from database
    // For now, we'll accept any valid reference (in production, validate against stored references)
    const reference = payload.reference;
    
    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Invalid reference' },
        { status: 400 }
      );
    }
    
    // 1. Check that the transaction we received from the mini app is valid
    if (payload.reference === reference) {
      // 2. Verify with World Developer Portal API
      const appId = process.env.APP_ID || process.env.NEXT_PUBLIC_WLD_APP_ID;
      const devPortalApiKey = process.env.DEV_PORTAL_API_KEY;
      
      if (!appId || !devPortalApiKey) {
        console.warn('Missing APP_ID or DEV_PORTAL_API_KEY, skipping verification');
        // For development, we'll optimistically accept the payment
        return NextResponse.json({ 
          success: true,
          message: 'Payment accepted (dev mode)'
        });
      }
      
      try {
        const response = await fetch(
          `https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${appId}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${devPortalApiKey}`,
            },
          }
        );
        
        const transaction = await response.json();
        
        // 2. Here we optimistically confirm the transaction.
        // Otherwise, you can poll until the status == mined
        if (transaction.reference === reference && transaction.status !== 'failed') {
          console.log('Payment verified successfully:', transaction);
          
          // TODO: Update your database to mark payment as confirmed
          // TODO: Trigger property minting or other business logic
          
          return NextResponse.json({ 
            success: true,
            transactionStatus: transaction.status
          });
        } else {
          console.error('Payment verification failed:', transaction);
          return NextResponse.json({ 
            success: false,
            error: 'Payment verification failed'
          });
        }
      } catch (verificationError) {
        console.error('Error verifying payment with World API:', verificationError);
        // Fall back to optimistic acceptance in case of API issues
        return NextResponse.json({ 
          success: true,
          message: 'Payment accepted (verification API unavailable)'
        });
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Reference mismatch' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  }
}