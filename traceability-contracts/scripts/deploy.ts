import { network } from "hardhat";

const { viem } = await network.create();
const certification = await viem.deployContract(
  "LogisticsCertification",
);

console.log("Contrato desplegado correctamente");
console.log("Direccion del contrato:", certification.address);
