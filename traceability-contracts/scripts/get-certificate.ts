import { getCertificationContract } from "./lib/contract.js";
import {
  createIdempotencyKey,
  sampleEvent,
} from "./lib/logistics-event.js";

const { certification } = await getCertificationContract();
const idempotencyKey = createIdempotencyKey(sampleEvent);
const [eventHash, certifiedAt, certifiedBy] =
  await certification.read.getCertificate([idempotencyKey]);

console.log(
  JSON.stringify(
    {
      idempotencyKey,
      eventHash,
      certifiedAt: certifiedAt.toString(),
      certifiedBy,
    },
    null,
    2,
  ),
);
