import { Kysely } from "kysely";
import { Database } from "./database";
import { TransactionRunner, UnitOfWork } from "../../ports/repositories";
import { KyselyEventRepo } from "./event.repo";
import { KyselyTicketRepo } from "./ticket.repo";
import { KyselyRegistrationRepo } from "./registration.repo";
import { KyselyTeamRepo } from "./team.repo";
import { KyselyNotificationRepo } from "./notification.repo";

export class KyselyTransactionRunner implements TransactionRunner {
  constructor(private readonly db: Kysely<Database>) {}

  async run<T>(fn: (uow: UnitOfWork) => Promise<T>): Promise<T> {
    return this.db.transaction().execute(async (trx) => {
      const uow: UnitOfWork = {
        eventRepo: new KyselyEventRepo(trx),
        ticketRepo: new KyselyTicketRepo(trx),
        registrationRepo: new KyselyRegistrationRepo(trx),
        teamRepo: new KyselyTeamRepo(trx),
        notificationRepo: new KyselyNotificationRepo(trx),
      };
      return fn(uow);
    });
  }
}
