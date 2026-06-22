# Certificación de estados logísticos

Demo con Hardhat 3, Solidity, viem y Ganache. El evento logístico permanece
fuera de blockchain; el contrato guarda únicamente:

- `idempotencyKey`: `courier + ":" + sourceEventId`
- `eventHash`: SHA-256 del evento serializado en un orden estable
- `certifiedAt`: timestamp del bloque
- `certifiedBy`: wallet que envió la transacción

## Requisitos

- Node.js y pnpm
- Docker con Docker Compose

Las instrucciones completas para ejecutar todos los scripts con Ganache y
`hardhatMainnet`, tanto localmente como con Docker Compose, están en
[`../README.md`](../README.md).

## Instalar y probar

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

## Ejecutar el flujo completo en Ganache

La red usa una frase semilla y una clave privada públicas, exclusivas para
desarrollo local.

Desde el root `cp-contracts-docker`:

```bash
cd ..
docker compose -f compose.yml -f compose.dev.yml up -d --build
docker compose -f compose.yml -f compose.dev.yml exec hardhat pnpm deploy:ganache
```

El despliegue imprime la dirección del contrato. Asígnala antes de ejecutar los
scripts:

```bash
export CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA

docker compose -f compose.yml -f compose.dev.yml exec -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" hardhat pnpm certify:ganache
docker compose -f compose.yml -f compose.dev.yml exec -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" hardhat pnpm verify:ganache
docker compose -f compose.yml -f compose.dev.yml exec -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" hardhat pnpm certificate:ganache
```

Para detener Ganache conservando su estado:

```bash
docker compose -f compose.yml -f compose.dev.yml down
```

Para eliminar también la blockchain local:

```bash
docker compose -f compose.yml -f compose.dev.yml down -v
```

## Regla para calcular el hash

Los campos se concatenan en este orden:

```text
trackingNumber|sourceEventId|courier|eventTime|status|city|country
```

Para el evento de ejemplo, el texto es:

```text
GUIA-001|EVT-001|UBER|2026-06-21T18:30:00-05:00|PICKED_UP|Quito|EC
```

El script aplica SHA-256 y agrega el prefijo `sha256:`. Campos generados por el
sistema o blockchain nunca forman parte del hash.

El resultado correcto para el ejemplo es:

```text
sha256:09f5c8773f7615906658bae0b7546026b29be847283b44cfdaa91286925ff75b
```

## Archivos principales

- `contracts/LogisticsCertification.sol`: contrato e idempotencia.
- `scripts/lib/logistics-event.ts`: serialización y generación SHA-256.
- `scripts/deploy.ts`: despliegue no interactivo sobre Ganache.
- `scripts/certify-hash.ts`: certifica el evento de ejemplo.
- `scripts/verify-hash.ts`: compara los hashes original y alterado.
- `scripts/get-certificate.ts`: consulta la prueba guardada.
- `Dockerfile`: imagen del proyecto Hardhat.
- `../compose.yml`: configuración compartida.
- `../compose.dev.yml`: construcción local.
- `../compose.release.yml`: imagen publicada en Docker Hub.
