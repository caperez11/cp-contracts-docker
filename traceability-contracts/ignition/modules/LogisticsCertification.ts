import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("LogisticsCertificationModule", (m) => {
  const certification = m.contract("LogisticsCertification");
  return { certification };
});
