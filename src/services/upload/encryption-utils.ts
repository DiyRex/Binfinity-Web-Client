// services/upload/encryption-utils.ts

/**
 * Fix PEM header mismatch
 */
function fixPEMHeaderMismatch(pemContent: string): string {
    // The server is using "RSA PUBLIC KEY" for a key that's actually in PKIX format
    // We need to replace the header to match the actual content format
    if (pemContent.includes('-----BEGIN RSA PUBLIC KEY-----')) {
      // Fix the header mismatch - replace RSA PUBLIC KEY with PUBLIC KEY
      return pemContent
        .replace('-----BEGIN RSA PUBLIC KEY-----', '-----BEGIN PUBLIC KEY-----')
        .replace('-----END RSA PUBLIC KEY-----', '-----END PUBLIC KEY-----');
    }
    return pemContent;
  }
  
  /**
   * Import RSA public key for encryption
   */
  async function importRSAPublicKey(publicKeyPem: string): Promise<CryptoKey> {
    // Remove PEM headers and decode base64
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = publicKeyPem
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');
    
    // Base64 decode the string to get the binary data
    const binaryDerString = atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }
    
    // Import the key
    return window.crypto.subtle.importKey(
      'spki',
      binaryDer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      false,
      ['encrypt']
    );
  }
  
  /**
   * Encrypt a chunk with hybrid encryption (AES + RSA)
   */
  export async function encryptChunk(publicKeyBase64: string, chunkData: ArrayBuffer): Promise<ArrayBuffer> {
    try {
      // Step 1: Decode the base64 public key
      const pemContent = atob(publicKeyBase64);
      console.log('Original PEM key format:', pemContent.substring(0, 50) + '...');
      
      // Step 2: Fix the PEM header if needed
      const fixedPemContent = fixPEMHeaderMismatch(pemContent);
      console.log('Fixed PEM key format:', fixedPemContent.substring(0, 50) + '...');
      
      // Step 3: Import the RSA public key
      const publicKey = await importRSAPublicKey(fixedPemContent);
      
      // Step 4: Generate a random symmetric key for AES-256-CBC
      const symmetricKey = window.crypto.getRandomValues(new Uint8Array(32)); // 256-bit key
      const iv = window.crypto.getRandomValues(new Uint8Array(16)); // 16-byte IV
      
      // Step 5: Import the symmetric key for use with AES
      const aesKey = await window.crypto.subtle.importKey(
        'raw',
        symmetricKey,
        { name: 'AES-CBC', length: 256 },
        false,
        ['encrypt']
      );
      
      // Step 6: Encrypt the data with AES
      const encryptedData = await window.crypto.subtle.encrypt(
        { name: 'AES-CBC', iv },
        aesKey,
        chunkData
      );
      
      // Step 7: Combine the symmetric key and IV
      const keyAndIv = new Uint8Array(symmetricKey.length + iv.length);
      keyAndIv.set(symmetricKey, 0);
      keyAndIv.set(iv, symmetricKey.length);
      
      // Step 8: Encrypt the combined key and IV with RSA
      const encryptedKeyAndIv = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        publicKey,
        keyAndIv
      );
      
      // Step 9: Create the final payload
      // Format: [4-byte length of encrypted key][encrypted key][encrypted data]
      const encryptedKeyLength = new Uint8Array(4);
      const encryptedKeyLengthView = new DataView(encryptedKeyLength.buffer);
      encryptedKeyLengthView.setUint32(0, encryptedKeyAndIv.byteLength, false); // Big-endian
      
      // Step 10: Combine everything
      const result = new Uint8Array(
        4 + encryptedKeyAndIv.byteLength + encryptedData.byteLength
      );
      
      result.set(encryptedKeyLength, 0);
      result.set(new Uint8Array(encryptedKeyAndIv), 4);
      result.set(new Uint8Array(encryptedData), 4 + encryptedKeyAndIv.byteLength);
      
      return result.buffer;
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt chunk');
    }
  }