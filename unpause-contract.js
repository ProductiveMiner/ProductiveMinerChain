const { ethers } = require('ethers');
const fs = require('fs');

async function main() {
  // Never log secrets
  const rawPk = process.env.OWNER_PRIVATE_KEY;
  if (!rawPk) {
    console.error('OWNER_PRIVATE_KEY env var is required.');
    process.exit(1);
  }

  const privateKey = rawPk.startsWith('0x') ? rawPk : `0x${rawPk}`;

  // Network and contract
  const RPC_URL = 'https://sepolia.infura.io/v3/3f2349b3beef4a0f86c7a8596fef5c00';
  const CONTRACT_ADDRESS = '0xf7b687854bA99B4Acafa509Fc42105B2a21369A7';
  const ABI = JSON.parse(fs.readFileSync('./frontend/src/contracts/MINEDToken.json', 'utf8')).abi;

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  console.log('🔗 Network:', (await provider.getNetwork()).name);
  console.log('👛 Using signer address:', wallet.address);

  // Verify owner
  const owner = await contract.owner();
  console.log('🏷️ Contract owner:', owner);
  if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
    console.error('❌ The provided private key does not match the contract owner. Aborting.');
    process.exit(1);
  }

  // Correct paused check from public variable
  const secBefore = await contract.securityState();
  const isPausedBefore = (BigInt(secBefore) & 1n) !== 0n;
  console.log('⏱️ Emergency paused (before):', isPausedBefore, 'securityState:', secBefore.toString());
  if (!isPausedBefore) {
    console.log('✅ Contract already unpaused.');
    return;
  }

  // Send tx
  console.log('🚀 Sending emergencyUnpause()...');
  const tx = await contract.emergencyUnpause();
  console.log('🧾 Tx hash:', tx.hash);
  const receipt = await tx.wait();
  console.log('✅ Confirmed in block:', receipt.blockNumber, 'status:', receipt.status);

  // Verify
  const secAfter = await contract.securityState();
  const isPausedAfter = (BigInt(secAfter) & 1n) !== 0n;
  console.log('⏱️ Emergency paused (after):', isPausedAfter, 'securityState:', secAfter.toString());
  if (isPausedAfter) {
    console.error('❌ Still paused after tx.');
    process.exit(1);
  }
  console.log('🎉 Successfully unpaused.');
}

main().catch((e) => {
  console.error('❌ Error:', e.message || e);
  process.exit(1);
});
