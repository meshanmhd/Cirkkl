import { Hono } from "hono";
import { CreatePaymentInputSchema } from "@cirkkl/contracts";
import { PaymentService } from "../services/payment.service";
import { requireUser } from "./middleware/auth";

export function createPaymentsRoutes(paymentService: PaymentService) {
  const router = new Hono();

  router.post("/create", requireUser(), async (c) => {
    const caller = c.get("caller");
    const body = await c.req.json();
    const parsed = CreatePaymentInputSchema.parse(body);
    const result = await paymentService.createPayment(parsed, caller);
    return c.json(result, 201);
  });

  return router;
}
