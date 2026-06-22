import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { network } from "hardhat";

describe("LogisticsCertification", async function () {
  const { viem, networkHelpers } = await network.create();

  async function deployCertification() {
    const certification = await viem.deployContract(
      "LogisticsCertification",
    );
    const [, certifier] = await viem.getWalletClients();
    return { certification, certifier };
  }

  it("certifies and verifies a logistics event", async function () {
    const { certification, certifier } =
      await networkHelpers.loadFixture(deployCertification);
    const idempotencyKey = "UBER:EVT-001";
    const eventHash =
      "sha256:09f5c8773f7615906658bae0b7546026b29be847283b44cfdaa91286925ff75b";

    await viem.assertions.emitWithArgs(
      certification.write.certifyHash([idempotencyKey, eventHash], {
        account: certifier.account,
      }),
      certification,
      "HashCertified",
      [
        idempotencyKey,
        eventHash,
        (timestamp: bigint) => timestamp > 0n,
        certifier.account.address,
      ],
    );

    assert.equal(
      await certification.read.verifyHash([idempotencyKey, eventHash]),
      true,
    );
    assert.equal(
      await certification.read.verifyHash([
        idempotencyKey,
        "sha256:altered",
      ]),
      false,
    );

    const [storedHash, certifiedAt, certifiedBy] =
      await certification.read.getCertificate([idempotencyKey]);
    assert.equal(storedHash, eventHash);
    assert.ok(certifiedAt > 0n);
    assert.equal(certifiedBy.toLowerCase(), certifier.account.address);
  });

  it("enforces idempotency", async function () {
    const { certification } =
      await networkHelpers.loadFixture(deployCertification);
    const idempotencyKey = "UBER:EVT-001";
    const eventHash = "sha256:event";

    await certification.write.certifyHash([idempotencyKey, eventHash]);

    await viem.assertions.revertWithCustomErrorWithArgs(
      certification.write.certifyHash([idempotencyKey, eventHash]),
      certification,
      "HashAlreadyCertified",
      [idempotencyKey],
    );
  });
});
