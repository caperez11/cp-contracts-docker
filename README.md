# Tutorial: certificación de estados logísticos con blockchain

En este tutorial desplegarás el contrato `LogisticsCertification`, certificarás
el hash de un evento logístico y comprobarás que una modificación del evento
puede detectarse.

Puedes realizar el ejercicio con:

- Ganache, en el puerto `8545`.
- `hardhatMainnet`, una red temporal de Hardhat en el puerto `8546`.
- Docker Compose, que levanta todo el entorno automáticamente.

## 1. ¿Qué hace el proyecto?

El evento original permanece fuera de blockchain:

```json
{
  "trackingNumber": "GUIA-001",
  "sourceEventId": "EVT-001",
  "courier": "UBER",
  "eventTime": "2026-06-21T18:30:00-05:00",
  "status": "PICKED_UP",
  "city": "Quito",
  "country": "EC"
}
```

El proyecto concatena sus campos en un orden fijo y calcula este SHA-256:

```text
sha256:09f5c8773f7615906658bae0b7546026b29be847283b44cfdaa91286925ff75b
```

El contrato guarda:

- La clave idempotente `UBER:EVT-001`.
- El hash del evento.
- La fecha de certificación.
- La dirección que realizó la certificación.

## 2. Estructura del proyecto

```text
cp-contracts-docker/
├── compose.yml
├── compose.dev.yml
├── compose.release.yml
├── README.md
└── traceability-contracts/
    ├── Dockerfile
    ├── contracts/
    │   └── LogisticsCertification.sol
    ├── scripts/
    ├── test/
    ├── hardhat.config.ts
    └── package.json
```

## 3. Requisitos

Para ejecutar Hardhat desde tu máquina:

- Node.js 22 o superior.
- pnpm.
- Docker.

Para ejecutar todo con Docker Compose solamente necesitas:

- Docker.
- Docker Compose.

Comprueba las herramientas:

```bash
node --version
pnpm --version
docker --version
docker compose version
```

## 4. Preparar y probar el proyecto localmente

Abre una terminal en el root `cp-contracts-docker`.

Entra al proyecto Hardhat:

```bash
cd traceability-contracts
```

Instala las dependencias:

```bash
pnpm install
```

Compila el contrato:

```bash
pnpm build
```

Valida el código TypeScript:

```bash
pnpm typecheck
```

Ejecuta las pruebas:

```bash
pnpm test
```

Debes obtener:

```text
7 passing (5 solidity, 2 nodejs)
```

## 5. Tutorial con Ganache

En este recorrido, Ganache se ejecuta con Docker y los scripts de Hardhat se
ejecutan desde tu máquina.

### Paso 1: iniciar Ganache

Desde `traceability-contracts`, vuelve al root:

```bash
cd ..
```

Inicia únicamente Ganache:

```bash
docker compose -f compose.yml -f compose.dev.yml up -d ganache
```

Comprueba su estado:

```bash
docker compose -f compose.yml -f compose.dev.yml ps ganache
```

Debe aparecer `logistics-ganache` escuchando en el puerto `8545`.

### Paso 2: configurar la cuenta de desarrollo

Regresa al proyecto Hardhat:

```bash
cd traceability-contracts
```

Exporta la clave privada de la primera cuenta de Ganache:

```bash
export GANACHE_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Esta clave es pública y solo debe utilizarse en redes locales.

### Paso 3: desplegar el contrato

```bash
pnpm deploy:ganache
```

Obtendrás una salida similar:

```text
Contrato desplegado correctamente
Direccion del contrato: 0x...
```

Copia la dirección:

```bash
export CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

### Paso 4: certificar el evento

```bash
pnpm certify:ganache
```

La salida muestra la clave idempotente, el hash y la transacción:

```text
Evento certificado
Idempotency key: UBER:EVT-001
Event hash: sha256:09f5c8773f7615906658bae0b7546026b29be847283b44cfdaa91286925ff75b
Transaccion: 0x...
```

### Paso 5: verificar la integridad

```bash
pnpm verify:ganache
```

Resultado esperado:

```text
Hash original valido: true
Hash alterado valido: false
```

### Paso 6: consultar el certificado

```bash
pnpm certificate:ganache
```

Obtendrás:

```json
{
  "idempotencyKey": "UBER:EVT-001",
  "eventHash": "sha256:09f5c8773f7615906658bae0b7546026b29be847283b44cfdaa91286925ff75b",
  "certifiedAt": "...",
  "certifiedBy": "0x..."
}
```

### Paso 7: detener Ganache

Desde el root:

```bash
cd ..
docker compose -f compose.yml -f compose.dev.yml down
```

El volumen conserva la blockchain. Para eliminarla:

```bash
docker compose -f compose.yml -f compose.dev.yml down -v
```

## 6. Tutorial con hardhatMainnet

`hardhatMainnet` es una red temporal. Necesitas mantener un nodo activo para
que despliegue, certificación y consultas compartan el mismo estado.

### Paso 1: iniciar el nodo

Abre una primera terminal en `traceability-contracts`:

```bash
pnpm node:hardhat-mainnet
```

Déjala abierta. El nodo estará disponible en:

```text
http://127.0.0.1:8546
```

### Paso 2: desplegar desde otra terminal

Abre una segunda terminal en `traceability-contracts`:

```bash
pnpm deploy:hardhat-mainnet
```

Copia la dirección:

```bash
export CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

### Paso 3: certificar el evento

```bash
pnpm certify:hardhat-mainnet
```

### Paso 4: verificar el evento

```bash
pnpm verify:hardhat-mainnet
```

Debes obtener:

```text
Hash original valido: true
Hash alterado valido: false
```

### Paso 5: consultar el certificado

```bash
pnpm certificate:hardhat-mainnet
```

### Paso 6: detener la red

Regresa a la primera terminal y presiona:

```text
Ctrl+C
```

Al detener el nodo se elimina todo el estado de `hardhatMainnet`.

## 7. Tutorial completo con Docker Compose

En este recorrido, Ganache, `hardhatMainnet` y Hardhat se ejecutan dentro de
contenedores.

La configuración sigue el patrón base + overrides:

| Archivo | Responsabilidad |
|---|---|
| `compose.yml` | Servicios, red, puertos, variables y volumen compartidos |
| `compose.dev.yml` | Construye y reutiliza la imagen local del Dockerfile |
| `compose.release.yml` | Consume una versión publicada en Docker Hub |

Los archivos de override contienen únicamente las diferencias entre
desarrollo y release.

### Paso 1: construir e iniciar el entorno

Desde el root `cp-contracts-docker`:

```bash
docker compose -f compose.yml -f compose.dev.yml up -d --build
```

Comprueba los servicios:

```bash
docker compose -f compose.yml -f compose.dev.yml ps
```

Debes ver:

```text
logistics-ganache
logistics-hardhat-mainnet
logistics-hardhat
```

### Paso 2: ejecutar el flujo en Ganache

Despliega:

```bash
docker compose -f compose.yml -f compose.dev.yml \
  exec hardhat pnpm deploy:ganache
```

Copia la dirección:

```bash
export GANACHE_CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

Certifica:

```bash
docker compose -f compose.yml -f compose.dev.yml exec \
  -e CONTRACT_ADDRESS="$GANACHE_CONTRACT_ADDRESS" \
  hardhat pnpm certify:ganache
```

Verifica:

```bash
docker compose -f compose.yml -f compose.dev.yml exec \
  -e CONTRACT_ADDRESS="$GANACHE_CONTRACT_ADDRESS" \
  hardhat pnpm verify:ganache
```

Consulta:

```bash
docker compose -f compose.yml -f compose.dev.yml exec \
  -e CONTRACT_ADDRESS="$GANACHE_CONTRACT_ADDRESS" \
  hardhat pnpm certificate:ganache
```

### Paso 3: ejecutar el flujo en hardhatMainnet

Despliega:

```bash
docker compose -f compose.yml -f compose.dev.yml \
  exec hardhat pnpm deploy:hardhat-mainnet
```

Copia la dirección:

```bash
export HARDHAT_CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

Certifica:

```bash
docker compose -f compose.yml -f compose.dev.yml exec \
  -e CONTRACT_ADDRESS="$HARDHAT_CONTRACT_ADDRESS" \
  hardhat pnpm certify:hardhat-mainnet
```

Verifica:

```bash
docker compose -f compose.yml -f compose.dev.yml exec \
  -e CONTRACT_ADDRESS="$HARDHAT_CONTRACT_ADDRESS" \
  hardhat pnpm verify:hardhat-mainnet
```

Consulta:

```bash
docker compose -f compose.yml -f compose.dev.yml exec \
  -e CONTRACT_ADDRESS="$HARDHAT_CONTRACT_ADDRESS" \
  hardhat pnpm certificate:hardhat-mainnet
```

### Paso 4: revisar logs

Logs de Ganache:

```bash
docker compose -f compose.yml -f compose.dev.yml logs -f ganache
```

Logs de `hardhatMainnet`:

```bash
docker compose -f compose.yml -f compose.dev.yml logs -f hardhat-mainnet
```

Presiona `Ctrl+C` para salir de la vista de logs.

### Paso 5: detener el entorno

Conservar el volumen de Ganache:

```bash
docker compose -f compose.yml -f compose.dev.yml down
```

Eliminar también la blockchain de Ganache:

```bash
docker compose -f compose.yml -f compose.dev.yml down -v
```

## 8. Comandos de referencia

| Operación | Ganache | hardhatMainnet |
|---|---|---|
| Iniciar nodo | `docker compose -f compose.yml -f compose.dev.yml up -d ganache` | `pnpm node:hardhat-mainnet` |
| Desplegar | `pnpm deploy:ganache` | `pnpm deploy:hardhat-mainnet` |
| Certificar | `pnpm certify:ganache` | `pnpm certify:hardhat-mainnet` |
| Verificar | `pnpm verify:ganache` | `pnpm verify:hardhat-mainnet` |
| Consultar | `pnpm certificate:ganache` | `pnpm certificate:hardhat-mainnet` |

## 9. Validaciones realizadas

| Entorno | Red | Deploy | Certify | Verify | Consulta |
|---|---|---:|---:|---:|---:|
| Host local | Ganache | OK | OK | OK | OK |
| Host local | hardhatMainnet | OK | OK | OK | OK |
| Docker Compose | Ganache | OK | OK | OK | OK |
| Docker Compose | hardhatMainnet | OK | OK | OK | OK |

El build de la imagen también ejecuta:

```bash
pnpm build
pnpm typecheck
pnpm test
```

## 10. Problemas comunes

### `CONTRACT_ADDRESS is required`

Debes exportar la dirección obtenida durante el despliegue:

```bash
export CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

### No se puede conectar al puerto `8545`

Comprueba Ganache:

```bash
docker compose -f compose.yml -f compose.dev.yml ps ganache
docker compose -f compose.yml -f compose.dev.yml logs ganache
```

### No se puede conectar al puerto `8546`

Para ejecución local, verifica que `pnpm node:hardhat-mainnet` siga activo.

Para Docker:

```bash
docker compose -f compose.yml -f compose.dev.yml ps hardhat-mainnet
docker compose -f compose.yml -f compose.dev.yml logs hardhat-mainnet
```

### `Hash already certified`

El mismo evento no puede certificarse dos veces. Reinicia la blockchain:

```bash
docker compose -f compose.yml -f compose.dev.yml down -v
docker compose -f compose.yml -f compose.dev.yml up -d --build
```

## 11. Descargar y usar la imagen desde Docker Hub

La imagen se publica automáticamente con cada `push` a `main` en:
`USUARIO_DOCKERHUB/cp-contracts-docker`

### Requisitos

- Docker
- Docker Compose

### Descargar e iniciar el entorno

Desde el root del proyecto:

```bash
docker compose -f compose.yml -f compose.release.yml pull
docker compose -f compose.yml -f compose.release.yml up -d
docker compose -f compose.yml -f compose.release.yml ps
```

Verás tres servicios:

```text
logistics-ganache
logistics-hardhat-mainnet
logistics-hardhat
```

### Flujo completo con Ganache

**1. Desplegar el contrato:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T hardhat pnpm deploy:ganache
```

Copia la dirección del contrato.

**2. Exportar la dirección:**

```bash
export CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

**3. Certificar el evento:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
  hardhat pnpm certify:ganache
```

**4. Verificar integridad:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
  hardhat pnpm verify:ganache
```

Resultado esperado:

```text
Hash original valido: true
Hash alterado valido: false
```

**5. Consultar el certificado:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
  hardhat pnpm certificate:ganache
```

### Flujo completo con hardhatMainnet

**1. Desplegar:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T hardhat pnpm deploy:hardhat-mainnet
```

Copia la dirección.

**2. Exportar:**

```bash
export CONTRACT_ADDRESS=0xDIRECCION_DESPLEGADA
```

**3. Certificar:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
  hardhat pnpm certify:hardhat-mainnet
```

**4. Verificar:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
  hardhat pnpm verify:hardhat-mainnet
```

**5. Consultar:**

```bash
docker compose -f compose.yml -f compose.release.yml \
  exec -T -e CONTRACT_ADDRESS="$CONTRACT_ADDRESS" \
  hardhat pnpm certificate:hardhat-mainnet
```

### Detener el entorno

Conservar datos de Ganache:

```bash
docker compose -f compose.yml -f compose.release.yml down
```

Eliminar todo incluido volúmenes:

```bash
docker compose -f compose.yml -f compose.release.yml down -v
```

### Comandos de referencia

| Operación | Ganache | hardhatMainnet |
|---|---|---|
| Desplegar | `pnpm deploy:ganache` | `pnpm deploy:hardhat-mainnet` |
| Certificar | `pnpm certify:ganache` | `pnpm certify:hardhat-mainnet` |
| Verificar | `pnpm verify:ganache` | `pnpm verify:hardhat-mainnet` |
| Consultar | `pnpm certificate:ganache` | `pnpm certificate:hardhat-mainnet` |
