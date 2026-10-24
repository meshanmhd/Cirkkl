import { z } from "zod";
import { Operation } from "./common";

export const CreatePaymentInputSchema = z.object({
  eventId: z.string().uuid(),
  ticketId: z.string().uuid(),
});
export type CreatePaymentInput = z.infer<typeof CreatePaymentInputSchema>;

export const CreatePaymentOutputSchema = z.object({
  paymentId: z.string().uuid(),
  orderReference: z.string(),
  amount: z.number(),
  currency: z.string().default("INR"),
  upiUri: z.string(),
  merchantName: z.string(),
  merchantUpiId: z.string(),
});
export type CreatePaymentOutput = z.infer<typeof CreatePaymentOutputSchema>;

export const createPaymentOperation: Operation<typeof CreatePaymentInputSchema, typeof CreatePaymentOutputSchema> = {
  name: "payments.create",
  method: "POST",
  path: "/api/v1/payments/create",
  auth: "user",
  input: CreatePaymentInputSchema,
  output: CreatePaymentOutputSchema,
  errorCodes: ["BAD_REQUEST", "UNAUTHORIZED", "NOT_FOUND", "INTERNAL_SERVER_ERROR"],
};
