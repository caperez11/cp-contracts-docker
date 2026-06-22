// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {LogisticsCertification} from "./LogisticsCertification.sol";

contract LogisticsCertificationTest is Test {
  LogisticsCertification private certification;

  string private constant IDEMPOTENCY_KEY = "UBER:EVT-001";
  string private constant EVENT_HASH =
    "sha256:09f5c8773f7615906658bae0b7546026b29be847283b44cfdaa91286925ff75b";
  address private constant CERTIFIER = address(0xCAFE);

  function setUp() public {
    certification = new LogisticsCertification();
  }

  function test_CertifiesAndReturnsHash() public {
    vm.warp(1_782_075_000);
    vm.prank(CERTIFIER);
    certification.certifyHash(IDEMPOTENCY_KEY, EVENT_HASH);

    (string memory eventHash, uint256 certifiedAt, address certifiedBy) =
      certification.getCertificate(IDEMPOTENCY_KEY);

    assertEq(eventHash, EVENT_HASH);
    assertEq(certifiedAt, 1_782_075_000);
    assertEq(certifiedBy, CERTIFIER);
    assertTrue(certification.verifyHash(IDEMPOTENCY_KEY, EVENT_HASH));
  }

  function test_VerificationRejectsAlteredOrUnknownEvents() public {
    certification.certifyHash(IDEMPOTENCY_KEY, EVENT_HASH);

    assertFalse(
      certification.verifyHash(IDEMPOTENCY_KEY, "sha256:altered")
    );
    assertFalse(certification.verifyHash("UBER:UNKNOWN", EVENT_HASH));
  }

  function test_RevertsWhenEventIsCertifiedTwice() public {
    certification.certifyHash(IDEMPOTENCY_KEY, EVENT_HASH);

    vm.expectRevert(
      abi.encodeWithSelector(
        LogisticsCertification.HashAlreadyCertified.selector,
        IDEMPOTENCY_KEY
      )
    );
    certification.certifyHash(IDEMPOTENCY_KEY, EVENT_HASH);
  }

  function test_RevertsForEmptyInput() public {
    vm.expectRevert(LogisticsCertification.EmptyIdempotencyKey.selector);
    certification.certifyHash("", EVENT_HASH);

    vm.expectRevert(LogisticsCertification.EmptyEventHash.selector);
    certification.certifyHash(IDEMPOTENCY_KEY, "");
  }

  function test_RevertsWhenCertificateDoesNotExist() public {
    vm.expectRevert(
      abi.encodeWithSelector(
        LogisticsCertification.CertificateNotFound.selector,
        IDEMPOTENCY_KEY
      )
    );
    certification.getCertificate(IDEMPOTENCY_KEY);
  }
}
