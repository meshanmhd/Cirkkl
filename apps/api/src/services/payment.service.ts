import { PaymentRepo, TicketRepo } from "../ports/repositories";
import { CallerContext } from "./auth.service";
import { badRequest, notFound } from "../errors";

export class PaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepo,
    private readonly ticketRepo: TicketRepo
  ) {}

  async createPayment(
    input: { eventId: string; ticketId: string },
    caller: CallerContext
  ): Promise<any> {
    const ticket = await this.ticketRepo.findById(input.ticketId);
    if (!ticket || ticket.eventId !== input.eventId) {
      throw notFound("Ticket not found for event");
    }

    if (ticket.availableQuantity <= 0) {
      throw badRequest("Ticket tier is sold out");
    }

    const merchantSettings = await this.paymentRepo.getMerchantSettings();
    const orderReference = `CRK_ORD_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const upiUri = `upi://pay?pa=${encodeURIComponent(merchantSettings.upiId)}&pn=${encodeURIComponent(
      merchantSettings.merchantName
    )}&am=${ticket.price.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderReference)}`;

    const payment = await this.paymentRepo.create({
      orderReference,
      userId: caller.userId,
      eventId: input.eventId,
      ticketId: input.ticketId,
      amount: ticket.price,
      currency: "INR",
      status: "pending",
      upiUri,
    });

    return {
      paymentId: payment.id,
      orderReference: payment.orderReference,
      amount: payment.amount,
      currency: payment.currency,
      upiUri: payment.upiUri,
      merchantName: merchantSettings.merchantName,
      merchantUpiId: merchantSettings.upiId,
    };
  }
}
