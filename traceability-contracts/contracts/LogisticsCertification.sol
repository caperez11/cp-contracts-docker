// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title LogisticsCertification
/// @notice Certifies off-chain logistics events without exposing their contents.
contract LogisticsCertification {
  struct Certificate {
    string eventHash;
    uint256 certifiedAt;
    address certifiedBy;
    bool exists;
  }

  mapping(string idempotencyKey => Certificate certificate) private certificates;

  error EmptyIdempotencyKey();
  error EmptyEventHash();
  error HashAlreadyCertified(string idempotencyKey);
  error CertificateNotFound(string idempotencyKey);

  event HashCertified(
    string idempotencyKey,
    string eventHash,
    uint256 certifiedAt,
    address indexed certifiedBy
  );

  function certifyHash(
    string calldata idempotencyKey,
    string calldata eventHash
  ) external {
    if (bytes(idempotencyKey).length == 0) revert EmptyIdempotencyKey();
    if (bytes(eventHash).length == 0) revert EmptyEventHash();
    if (certificates[idempotencyKey].exists) {
      revert HashAlreadyCertified(idempotencyKey);
    }

    certificates[idempotencyKey] = Certificate({
      eventHash: eventHash,
      certifiedAt: block.timestamp,
      certifiedBy: msg.sender,
      exists: true
    });

    emit HashCertified(idempotencyKey, eventHash, block.timestamp, msg.sender);
  }

  function verifyHash(
    string calldata idempotencyKey,
    string calldata eventHash
  ) external view returns (bool) {
    Certificate storage certificate = certificates[idempotencyKey];

    return certificate.exists
      && keccak256(bytes(certificate.eventHash)) == keccak256(bytes(eventHash));
  }

  function getCertificate(
    string calldata idempotencyKey
  )
    external
    view
    returns (string memory eventHash, uint256 certifiedAt, address certifiedBy)
  {
    Certificate storage certificate = certificates[idempotencyKey];
    if (!certificate.exists) revert CertificateNotFound(idempotencyKey);

    return (
      certificate.eventHash,
      certificate.certifiedAt,
      certificate.certifiedBy
    );
  }
}
