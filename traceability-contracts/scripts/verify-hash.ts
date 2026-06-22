import { getCertificationContract } from "./lib/contract.js";
import {
  createEventHash,
  createIdempotencyKey,
  sampleEvent,
} from "./lib/logistics-event.js";

const { certification } = await getCertificationContract();
const idempotencyKey = createIdempotencyKey(sampleEvent);
const eventHash = createEventHash(sampleEvent);

const isValid = await certification.read.verifyHash([
  idempotencyKey,
  eventHash,
]);
const alteredEventIsValid = await certification.read.verifyHash([
  idempotencyKey,
  createEventHash({ ...sampleEvent, status: "DELIVERED" }),
]);

console.log("Hash original valido:", isValid);
console.log("Hash alterado valido:", alteredEventIsValid);
