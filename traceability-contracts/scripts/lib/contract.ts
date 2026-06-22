import { network } from "hardhat";
import { getAddress } from "viem";

export async function getCertificationContract() {
  const address = process.env.CONTRACT_ADDRESS;
  if (address === undefined) {
    throw new Error(
      "CONTRACT_ADDRESS is required. Copy the address printed by the deployment.",
    );
  }

  const { viem } = await network.create();
  const certification = await viem.getContractAt(
    "LogisticsCertification",
    getAddress(address),
  );

  return { certification, viem };
}
