import { Kysely } from "kysely";
import { Database } from "./database";
import { PaymentRepo } from "../../ports/repositories";
import { MerchantSettings, Payment, PaymentStatus } from "../../ports/domain";

export class KyselyPaymentRepo implements PaymentRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any): Payment {
    return {
      id: row.id,
      orderReference: row.order_reference,
      userId: row.user_id,
      eventId: row.event_id,
      ticketId: row.ticket_id,
      amount: Number(row.amount),
      currency: "INR",
      status: row.status as PaymentStatus,
      transactionId: row.transaction_id,
      merchantUpiId: row.merchant_upi_id,
      merchantName: row.merchant_name,
      upiUri: row.upi_uri,
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Payment | null> {
    const row = await this.db.selectFrom("payments").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByOrderReference(orderReference: string): Promise<Payment | null> {
    const row = await this.db
      .selectFrom("payments")
      .selectAll()
      .where("order_reference", "=", orderReference)
      .executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async getMerchantSettings(): Promise<MerchantSettings> {
    const row = await this.db.selectFrom("merchant_settings").selectAll().executeTakeFirst();
    return {
      upiId: row?.upi_id || "merchant@upi",
      merchantName: row?.merchant_name || "Cirkkl Events",
    };
  }

  async create(data: Omit<Payment, "id" | "createdAt" | "updatedAt">): Promise<Payment> {
    const id = crypto.randomUUID();
    const merchant = await this.getMerchantSettings();
    await this.db
      .insertInto("payments")
      .values({
        id,
        order_reference: data.orderReference,
        user_id: data.userId,
        event_id: data.eventId,
        ticket_id: data.ticketId,
        amount: data.amount,
        status: data.status,
        merchant_upi_id: data.merchantUpiId || merchant.upiId,
        merchant_name: data.merchantName || merchant.merchantName,
        transaction_id: data.transactionId ?? null,
        upi_uri: data.upiUri,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created payment");
    }
    return created;
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<Payment> {
    const values: Record<string, unknown> = { status };
    if (transactionId !== undefined) {
      values.transaction_id = transactionId;
    }

    await this.db.updateTable("payments").set(values).where("id", "=", id).execute();

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to retrieve updated payment");
    }
    return updated;
  }
}
