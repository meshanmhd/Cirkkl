import { Kysely, sql } from "kysely";
import { Database } from "./database";
import { TicketRepo } from "../../ports/repositories";
import { Ticket } from "../../ports/domain";

export class KyselyTicketRepo implements TicketRepo {
  constructor(private readonly db: Kysely<Database>) {}

  private mapRow(row: any): Ticket {
    return {
      id: row.id,
      eventId: row.event_id,
      name: row.name,
      price: Number(row.price),
      currency: "INR",
      totalQuantity: Number(row.total_quantity),
      availableQuantity: Number(row.available_quantity),
      createdAt: new Date(row.created_at),
    };
  }

  async findById(id: string): Promise<Ticket | null> {
    const row = await this.db.selectFrom("tickets").selectAll().where("id", "=", id).executeTakeFirst();
    return row ? this.mapRow(row) : null;
  }

  async findByEventId(eventId: string): Promise<Ticket[]> {
    const rows = await this.db.selectFrom("tickets").selectAll().where("event_id", "=", eventId).execute();
    return rows.map((r) => this.mapRow(r));
  }

  async create(data: Omit<Ticket, "id" | "createdAt">): Promise<Ticket> {
    const id = crypto.randomUUID();
    await this.db
      .insertInto("tickets")
      .values({
        id,
        event_id: data.eventId,
        name: data.name,
        price: data.price,
        total_quantity: data.totalQuantity,
        available_quantity: data.availableQuantity,
      })
      .execute();

    const created = await this.findById(id);
    if (!created) {
      throw new Error("Failed to retrieve created ticket");
    }
    return created;
  }

  async createMany(data: Array<Omit<Ticket, "id" | "createdAt">>): Promise<Ticket[]> {
    if (data.length === 0) return [];
    const results: Ticket[] = [];
    for (const item of data) {
      const created = await this.create(item);
      results.push(created);
    }
    return results;
  }

  async update(id: string, data: Partial<Ticket>): Promise<Ticket> {
    const values: Record<string, unknown> = {};
    if (data.name !== undefined) values.name = data.name;
    if (data.price !== undefined) values.price = data.price;
    if (data.totalQuantity !== undefined) values.total_quantity = data.totalQuantity;
    if (data.availableQuantity !== undefined) values.available_quantity = data.availableQuantity;

    if (Object.keys(values).length > 0) {
      await this.db.updateTable("tickets").set(values).where("id", "=", id).execute();
    }

    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Failed to retrieve updated ticket");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.db.deleteFrom("tickets").where("id", "=", id).execute();
  }

  async decrementAvailable(id: string, quantity: number): Promise<void> {
    await this.db
      .updateTable("tickets")
      .set({
        available_quantity: sql`available_quantity - ${quantity}`,
      })
      .where("id", "=", id)
      .where("available_quantity", ">=", quantity)
      .execute();
  }

  async hasRegistrationsOrPayments(ticketId: string): Promise<boolean> {
    const reg = await this.db
      .selectFrom("registrations")
      .select("id")
      .where("ticket_id", "=", ticketId)
      .executeTakeFirst();
    if (reg) return true;

    const pay = await this.db
      .selectFrom("payments")
      .select("id")
      .where("ticket_id", "=", ticketId)
      .executeTakeFirst();
    return Boolean(pay);
  }
}
