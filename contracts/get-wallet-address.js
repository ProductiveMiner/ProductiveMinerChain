const crypto = require('crypto');

// Your private key (without 0x prefix)
const privateKey = 'a15dec5cc97edd84d76be0c5e9c8e8a6014abd8acbaa204a39099f21c7c3dd92';

// Convert private key to buffer
const privateKeyBuffer = Buffer.from(privateKey, 'hex');

// Generate public key
const ecdh = crypto.createECDH('secp256k1');
ecdh.setPrivateKey(privateKeyBuffer);
const publicKey = ecdh.getPublicKey();

// Remove the first byte (compression flag) and take the last 20 bytes
const addressBuffer = crypto.createHash('sha256').update(publicKey.slice(1)).digest();
const addressBuffer2 = crypto.createHash('ripemd160').update(addressBuffer).digest();

// Convert to hex and add checksum
const address = '0x' + addressBuffer2.toString('hex');

console.log('Wallet Address:', address);
console.log('');
console.log('📋 Next Steps:');
console.log('1. Copy this address: ' + address);
console.log('2. Visit https://sepoliafaucet.com/');
console.log('3. Paste your address and request Sepolia testnet ETH');
console.log('4. Wait for the ETH to arrive (usually 1-2 minutes)');
console.log('5. Run: ./deploy-docker.sh');
