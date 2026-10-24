import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateUpiUri, generateOrderReference } from '@/utils/upi';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId, eventId } = await request.json();

    if (!ticketId || !eventId) {
      return NextResponse.json({ error: 'Missing ticketId or eventId' }, { status: 400 });
    }

    // 1. Fetch ticket details to get amount
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('price, name')
      .eq('id', ticketId)
      .eq('event_id', eventId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    if (ticket.price <= 0) {
      return NextResponse.json({ error: 'Free tickets do not require payment generation' }, { status: 400 });
    }

    // 2. Fetch merchant settings
    const { data: merchantSettings, error: merchantError } = await supabase
      .from('merchant_settings')
      .select('upi_id, merchant_name')
      .limit(1)
      .single();

    if (merchantError || !merchantSettings) {
      console.error("Merchant settings not configured in DB.");
      return NextResponse.json({ error: 'Payment gateway is currently unavailable' }, { status: 500 });
    }

    // 3. Generate Order Reference & UPI URI
    const orderReference = generateOrderReference();
    const upiUri = generateUpiUri({
      upiId: merchantSettings.upi_id,
      name: merchantSettings.merchant_name,
      amount: ticket.price,
      orderReference,
    });

    // 4. Create pending payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_reference: orderReference,
        user_id: user.id,
        ticket_id: ticketId,
        amount: ticket.price,
        currency: 'INR',
        merchant_upi_id: merchantSettings.upi_id,
        merchant_name: merchantSettings.merchant_name,
        upi_uri: upiUri,
        status: 'PENDING'
      })
      .select()
      .single();

    if (paymentError) {
      console.error("Error creating payment record", paymentError);
      return NextResponse.json({ error: 'Failed to initialize payment' }, { status: 500 });
    }

    // Return the generated details to the frontend
    return NextResponse.json({
      order_reference: orderReference,
      upi_uri: upiUri,
      amount: ticket.price
    });
    
  } catch (err: any) {
    console.error("Payment creation error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
