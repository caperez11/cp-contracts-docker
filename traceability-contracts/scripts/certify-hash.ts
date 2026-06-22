import { getCertificationContract } from "./lib/contract.js";
import {
  createEventHash,
  createIdempotencyKey,
  sampleEvent,
} from "./lib/logistics-event.js";

const { certification, viem } = await getCertificationContract();
const publicClient = await viem.getPublicClient();
const idempotencyKey = createIdempotencyKey(sampleEvent);
const eventHash = createEventHash(sampleEvent);

const transactionHash = await certification.write.certifyHash([
  idempotencyKey,
  eventHash,
]);
await publicClient.waitForTransactionReceipt({ hash: transactionHash });

console.log("Evento certificado");
console.log("Idempotency key:", idempotencyKey);
console.log("Event hash:", eventHash);
console.log("Transaccion:", transactionHash);
