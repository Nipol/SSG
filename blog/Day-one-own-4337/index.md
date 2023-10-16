---
title: 계정 추상화 구현 첫번째 날.
date: 2023-10-17T10:00:00+09:00
language: ko-KR
author: yoonsung.eth
desc: 계정 추상화를 구현하는 여정의 첫번째 날에 대한 정리입니다.
tags:
  - Account Abstraction
  - Solidity
  - Ethereum
revision: 1
---

Ethereum에서 계정은 두 가지 종류가 있습니다. 저희가 구현할 컨트랙트 계정이 있고, 공개키 비밀키 방식으로 작동되는 계정이 존재합니다. 공개키 비밀키 방식 계정은 트랜잭션을 트리거 할 수 있으며, 네트워크 사용비를 직접적으로 지불하는 주체입니다. 

컨트랙트 계정은 트랜잭션을 트리거 할 수 없기에 가스비를 직접적으로 지불하는 주체가 아니지만, 해당 계정의 사용 권한은 컨트랙트를 만들때 정의된 소스코드에 따라 가능합니다. 

계정 추상화(Account Abstraction)는 이더리움의 시초부터 함께 했던 제안으로써 모든 공개키-비밀키 방식의 계정을 없애고 코드로 동작하는 계정으로 일원화 하는 제안이었습니다. 특히나 당시에 공개키-비밀키 방식이 Quantum Resistant, 양자 저항력이 낮았으므로 이를 높이는 과정에서 고안되었던 것이었습니다.

그러나, 근래의 계정 추상화는 사용자 경험 부분에서 더욱 집중됩니다. 이더리움의 블록 생성은 `Proof of Work`에서 `Proof of Stake`로 변경되었으며, 블록을 생성하는 주체인 `블록 생성자`와 `블록 검증자`가 분리될 예정입니다. 특히나 블록 생성자가 검증자와 분리되면서 생성자는 다양한 네트워크를 통해서 트랜잭션을 수집할 수 있으므로 탈중앙화는 더욱 가속됩니다. 그러나, 원래의 계획대로였다면 AA는 자율적으로 트랜잭션을 발생시킬 수 있었을 테지만 지금은 다릅니다.

지금 모든 이더리움 계정을 AA로 변경하는 것은 아주 중대한 결정을 요구합니다. 모든 계정에게 버그가 없는 코드를 제공하여야 하며, 사용성은 간단해야 합니다. 또한 컨트랙트가 트랜잭션을 트리거링 할 수 있게되면 Ethereum의 프로토콜을 변경해야하며 이에 따른 기존 시스템에 끼치는 영향력은 상상도 할 수 없을만큼 충격적일 것이기에, ERC 4337의 경우 기존 프로토콜의 변경을 하지 않는 선에서 구현된다는 점이 특징이겠습니다.

결국 공개키-비밀키 기반의 계정이, AA 계정들이 사용하게될 다양한 호출들을(기존 공개키-비밀키 트랜잭션과 혼동을 피하기 위해서 `UserOperation`이라는 이름을 사용합니다)을 모아 하나의 트랜잭션으로 묶어서 처리하는 것으로 소량이나마 호출들을 개별적으로 사용했을 때 보다, 하나로 묶었을때 가스비가 절감되는 것, 그리고 가스비를 ETH가 아닌 다른 수단(ERC20, 카드 결제, 등)으로도 지불할 수 있다는 것이 특징이겠습니다.

이러한 특징 이외에도, Web3 프로젝트들의 테스트 주기를 여러번 경험하는 동안 다양한 문제들에 직면했었는데, 가장 큰 부분 중 하나는 사용자들의 실질적인 테스트 경험에 관한 불편이 있었습니다. 사용자가 실제 Web3 제품을 테스트하기 위해서는 메타마스크나, 월렛커넥트를 지원하는 지갑이 있어야 하며, 대체로 테스트가 공개적인 네트워크에서 진행되는 경우가 많으므로 테스트넷에서 트랜잭션 비용을 지불하기 위한 테스트넷 ETH를 가졌어야 했습니다. 

테스트넷 ETH를 쉽게 얻을 수 있었던 네트워크에는 지속적인 DDoS 가 많이 발생했기에 이를 실질적인 개발자를 대상으로 배포하는 경우가 많아졌습니다. 특히나, 테스트넷에 배포된 Web3에 대해 

실제로 테스트넷에 쏟아진 DDoS 덕분에, 테스트넷 ETH를 얻는 과정이 많이 힘들어졌습니다. 따라서 인증된 개발자를 대상으로 테스트넷 코인을 배포하는 경우가 있기때문에, 실제 제품의 테스트를 하는 경우 이를 얻는 것이 무척 어렵습니다. 따라서, 사용자들이 Web3를 테스트 하는 경우에도 테스트에 필요한 가스비를 AA를 통해서 대납하면서, 기존 컨트랙트의 무결성을 검증할 수 있습니다.

이러한 이유들로 최근 테스트를 준비하면서 ERC-4337을 시험삼아 구현해봐야겠다는 생각이 들었습니다. 기록또한 아주 중요하므로, AA를 구현하고 통합하는 과정들을 블로그를 통해 공개하려고 합니다. 모든 구현의 기본은, [ERC-4337](https://eips.ethereum.org/EIPS/eip-4337)을 따라서 구현할 것이며, 공개된 과정을 통해 이 글을 지속적으로 작성해야할 훌륭한 동기가 되리라 생각합니다. 혹시나, 잘못된 구현이 있더라도 지속적으로 구현하고 이를 통합하는 과정을 가지면서 고쳐나갈 것입니다. 언제든지 알려주세요!

## 구현 시작

대체로, 모든 시작점이 `UserOperation`구조체에서 시작합니다. 사용자가 수행하고자 하는 작업을 정의하기 때문에, 이를 먼저 문서대로 정의합니다.

```solidity
// file Constants.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

struct UserOperation {
	address sender;
	uint256 nonce;
	bytes initCode;
	bytes callData;
	uint256 callGasLimit;
	uint256 verificationGasLimit;
	uint256 preVerificationGas;
	uint256 maxFeePerGas;
	uint256 maxPriorityFeePerGas;
	bytes paymasterAndData;
	bytes signature; // r, s, v order
}
```

그리고 해당 구조체를 통해서, `UserOperationID`를 생성하기 때문에, 구조체와 연계된 작업들을 처리할 라이브러리도 만들어 줍니다. 우선은 Operation에 해당하는 고유 아이디를 생성할 해시 정보를 생성합니다. 여기에는 해시값의 재사용과 리플레이 공격을 막기 위해, 서명을 제외한 chainid, nonce, EntryPoint 등등 정보에 따라 생성됩니다.

```solidity
// file UserOpLib.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Constants.sol";

library UserOpLib {
	/**
	* @notice Generate a unique hash for an Operation based on a given `UserOperation` structure,
	* *`Entrypoint` address, and `chainid`.
	* @param op UserOperation struct
	* @param EntryPointAddr Entrypoint Contract Address
	* @return h Unique UserOperation hash.
	*/
	function opHash(UserOperation calldata op, address EntryPointAddr) internal view returns (bytes32 h) {
		// stored chainid
		uint256 chainId;

		// load chainid
		assembly {
			chainId := chainid()
		}

		// hashing
		h = keccak256(
			// concat data without signature(Too deep. use viaIr)
			abi.encodePacked(
				chainId,
				EntryPointAddr,
				op.sender,
				op.nonce,
				op.initCode,
				op.callData,
				op.callGasLimit,
				op.verificationGasLimit,
				op.preVerificationGas,
				op.maxFeePerGas,
				op.maxPriorityFeePerGas,
				op.paymasterAndData
			)
		);
	}
}
```

그리고 이를 테스트할 코드들도 작성해서 잘 작동하는 것을 확인합니다.

```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console2} from "forge-std/Test.sol";
import "../src/UserOpLib.sol";

// 라이브러리의 기능을 빼내기 위해서 Mock 컨트랙트를 만들어줍니다.
contract HelperMock {
	// 구조체에 라이브러리 사용하도록 연결
	using UserOpLib for UserOperation;

	// 제공된 UserOperation에 대한 해시를 생성합니다.
	function getHash(UserOperation calldata op, address entryAddr) external view returns (bytes32 h) {
		h = op.opHash(entryAddr);
	}
}

contract UserOperationHelperTest is Test {
	UserOperation op1;
	HelperMock ohm;

	function setUp() public {
		// 샘플로 사용할 UserOperation 생성
		op1 = UserOperation({
			sender: Address("Sender"),
			nonce: 0,
			initCode: abi.encode(0),
			callData: abi.encode(0),
			callGasLimit: 0,
			verificationGasLimit: 0,
			preVerificationGas: 0,
			maxFeePerGas: 0,
			maxPriorityFeePerGas: 0,
			paymasterAndData: abi.encode(0),
			signature: abi.encode(0)
		});
		ohm = new HelperMock();
	}

	// for Debug
	function Address(string memory name) internal returns (address ret) {
		ret = address(uint160(uint256(keccak256(abi.encode(name)))));
		vm.label(ret, name);
	}

	// 실질적으로 테스트 될 대상
	function testHash() public {
		UserOperation memory op = op1;
		// base
		emit log_uint(block.chainid);
		bytes32 h = ohm.getHash(op, Address("EntryPoint"));
		assertEq(h, 0x703b673b8562624140ecc3e1d3a7fe0a0ce9e511dfebb90e27a37140a08b394a);

		// chanage chainid		
		vm.chainId(999);
		emit log_uint(block.chainid);
		h = ohm.getHash(op, Address("EntryPoint"));
		assertEq(h, 0x512faaea96afd35c2a0f8f2a3fa3963a06769da4a64069efcc330df8c7f175ec);
		
		// chanage Entrypoint addr
		h = ohm.getHash(op, Address("Another EntryPoint"));
		assertEq(h, 0xe9ba5bc83fc204a07cf299be67a5c912c761a8c88ae534fb148c900a4194745c);
	}
}
```

해시가 전부 다른 것을 보면, 해시 값 변화에 영향을 미치는 변수들이 잘 적용된 것으로 보입니다. 

사용자가 전송할 트랜잭션을 기술하는 `UserOperation`구조체를 다양한 네트워크를 통해 `Bundler`로 보내 Bundler가 Entrypoint 컨트랙트를 통해서 각각의 `Account`를 호출하는 구조를 가지고 있습니다. 실질적으로 다른 모든 컨트랙트에서 인식될 주체이므로, 가장 작게 시작해 볼 수 있는 것이 Account 컨트랙트 이기에 이것을 구현하려고 합니다.

가장 중요한 `validateUserOp`을 구현합니다. EntryPoint의 범용성을 위해서, 호출자가 EntryPoint 인터페이스들을 구현하고 있는지 확인합니다. 여기에는 [EIP-165](https://eips.ethereum.org/EIPS/eip-165)가 사용되며 이를 구현하지 않은 컨트랙트가 검증하려고 하는 경우 실패 처리를 하도록 했습니다. 이것은 해당 컨트랙트가 온전하게 동작한다는 기준이며, 컨트랙트를 검증하는 가장 가벼운 방법이라고 볼 수 있습니다.

`Signature Aggregation`의 경우 BLS기반 서명을 의미합니다. 기존 ECDSA라면, AA의 소유자가 만든 서명이 하나씩 존재할 것이라 트랜잭션의 크기를 늘리게 됩니다. 그러나 BLS 기반의 서명은, 이러한 서명을 하나의 서명으로 압축하면서도 모든 사용자들이 인증했다는 진본성(Authenticity)가 증명되기 때문에 트랜잭션의 크기가 줄어든다는 장점이 존재합니다. 다만 지금은 BLS 기반의 서명방식을 구현하지 않고, 4337의 검증이 목적이기 때문에 ECDSA 방식의 검증 방법을 이용할 것입니다.

```solidity
// file Account.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Constants.sol";
import "./UserOpLib.sol";
import "./IERC165.sol";
import "./IEntryPoint.sol";
import "./IAccount.sol";

contract Account is IAccount {
	function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
	external
	returns (uint256 validationData)
	{
		// is caller EntryPoint?	
		if (IERC165(msg.sender).supportsInterface(type(IEntryPoint).interfaceId) != true) revert();

		if (missingAccountFunds != 0) {
			payable(msg.sender).transfer(missingAccountFunds);
		}

		// is this Account support `Signature Aggregation`? for Now. No.		
		uint8 v;
		bytes32 r;
		bytes32 s;

		// length check
		if (userOp.signature.length != 65) revert();
		
		// for easy accesible.
		bytes calldata signature = userOp.signature;

		assembly {
			calldatacopy(mload(0x40), signature.offset, 0x20)
			calldatacopy(add(mload(0x40), 0x20), add(signature.offset, 0x20), 0x20)
			calldatacopy(add(mload(0x40), 0x5f), add(signature.offset, 0x40), 0x2)

			// check signature malleability
			if gt(mload(add(mload(0x40), 0x20)), 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF5D576E7357A4501DDFE92F46681B20A0) {
				revert(0x0, 0x4)
			}

			r := mload(mload(0x40))
			s := mload(add(mload(0x40), 0x20))
			v := mload(add(mload(0x40), 0x40))
		}

		// Compare with ?
		address recovered = ecrecover(userOpHash, v, r, s);

		// packing authorizer(0 for valid signature, 1 to mark signature failure.
		// Otherwise, an address of an authorizer contract. This ERC defines “signature aggregator” as authorizer.),
		// validUntil(6 bytes) and validAfter(6 bytes)
		return 0;
	}
}
```

바로 다음에 서명을 압축하는 Aggregation 에 대한 인터페이스들이 나오지만, 현재는 이것을 구현하지 않을 것이기 때문에, `EntryPoint`의 `getNonce`를 구현하도록 하겠습니다. 문서에서는 key가 일반적인 경우에서는 사용되지 않아 대체로 0으로 사용됩니다. 이때 `sequence`의 slot을 계산하는 로직이 비효율적이기 때문에, 추후에 개선해볼 여지가 있겠습니다.

```solidity
// file Entrypoint.sol

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "./Constants.sol";
import "./IEntryPoint.sol";

contract EntryPoint is IEntryPoint {
	mapping (address => mapping(uint192 => uint64)) sequences;

	…

	function getNonce(address sender, uint192 key) external view returns (uint256 nonce) {
		uint64 sequence = sequences[sender][key];
		nonce = uint256(bytes32(abi.encodePacked(key, sequence)));
	}
}
```

이후에는 Bundler가 모은 UserOperation을 EntryPoint로 보내 실질적인 트랜잭션을 발생시키는 함수 `handleOps`를 구현해야겠으나, 앞서 작성했던 대로 현재 `Account` 컨트랙트에 부족한 점이 너무 많습니다. 특히나, 복원된 주소는 Account의 소유자여야 합니다. 명세에 나와있지 않은 부분이 있으니, 이를 먼저 구현하겠습니다.

```solidity
// file Account.sol

…
contract Account is IAccount {
	mapping(address => bool) public owners;

	constructor(address anOwner) {
		owners[anOwner] = true;
	}

	…

	function validateUserOp(UserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
		…
	
		if (userOp.signature.length != 65) return 1;

		…

		if(!owners[ecrecover(userOpHash, v, r, s)]) return 1;

		// packing authorizer(0 for valid signature, 1 to mark signature failure.
		// Otherwise, an address of an authorizer contract. This ERC defines “signature aggregator” as authorizer.),
		// validUntil(6 bytes) and validAfter(6 bytes)

		return 0;
	}
```

이렇게 공개키-비밀키 기반 계정을 `owners`에 등록하는 것으로, 하나의 `Account`를 컨트롤 하는 다양한 계정들을 둘 수 있습니다.

`validateUserOp` 함수를 통해서 revert를 발생시키면, 구현에 따라 이러한 오류를 별도로 처리해야 하기 때문에, 모든 실패할 경우에 그에 걸맞는 리턴 형태를 띄도록 한 것으로 보입니다. 여기에는 6바이트의 `validUntil`과 `validAfter`도 리턴값에 포함되어 패킹되어야 하기에 32바이트 중, 12바이트를 빼고 20바이트를 할애하여 0과 1을 담아야 하는 것 같은데, 이 패킹의 순서 또한 고민이 되는 부분입니다. 

<figure>
    <img src="./Frame.png" alt="Bundler가 UserOperation을 모아, EntryPoint 컨트랙트로 전달하면서, EntryPoint가 각 유저들의 Account 컨트랙트를 호출하는 개요">
    <figcaption>Bundler가 UserOperation을 모아, EntryPoint 컨트랙트로 전달하여 Account가 작동하는 개요도</figcaption>
</figure>

또한 이 부분에서 미리 사용해야할 가스비를 `EntryPoint`컨트랙트로 보내두어야 하고, 사용하고 남은 가스비는 다시 보내두어야 하는데, 컨트랙트가 컨트랙트를 호출하는 일은 최소한으로 할 수 있게끔 계산하는 것이 좋을 것이기에 좀 더 고민이 필요해 보입니다.

```solidity
// file EntryPoint.sol

	…
		function handleOps(UserOperation[] calldata ops, address payable beneficiary) external {		
			for(uint256 i; i < ops.length; ++i) {
			// TODO: sender is already deployed or sender is zero and valued initcode.
			// we need factory.
			IAccount(ops[i].sender).validateUserOp(ops[i], ops[i].opHash(address(this)), 0);
			}
		}
	…
```

문서를 좀 더 진행하면서, `handleOps`를 구현하는 도중, initCode와 sender에 관한 내용이 있었습니다. sender는 기 배포된 `Account`컨트랙트 주소를 의미하며, 이 값이 비어있거나 initCode가 존재하는 경우 이 코드를 이용하여 `Account` 컨트랙트를 배포하여야 합니다. 이를 위해 `Account`컨트랙트를 배포하는 로직이 필요하며, 오늘은 여기까지 진행하려고 합니다.

작성된 컨트랙트는 [own4337 on Github](https://github.com/Nipol/own4337)에 있으며, 잘못된 구현이 존재하는 경우 반영하도록 하겠습니다. 