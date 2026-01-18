/**
 * Crypto Helper Module using Web Crypto API.
 * 
 * Standards:
 * - PBKDF2 for key derivation (100,000 iterations, SHA-256)
 * - AES-GCM for encryption (256-bit key)
 * - SHA-256 for PIN hashing
 */

export const cryptoHelpers = {
    /**
     * Generates a random salt or IV.
     * @param {number} length - Number of bytes
     * @returns {Uint8Array}
     */
    randomBytes(length = 16) {
        return window.crypto.getRandomValues(new Uint8Array(length));
    },

    /**
     * Converts a buffer to a Hex string.
     * @param {ArrayBuffer} buffer 
     * @returns {string}
     */
    bufToHex(buffer) {
        return Array.from(new Uint8Array(buffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    /**
     * Converts a Hex string to a buffer.
     * @param {string} hex 
     * @returns {Uint8Array}
     */
    hexToBuf(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
        }
        return bytes;
    },

    /**
     * Hashes text (e.g., PIN + Salt) using SHA-256.
     * @param {string} text 
     * @returns {Promise<string>} Hex string of the hash
     */
    async sha256(text) {
        const encoder = new TextEncoder();
        const data = encoder.encode(text);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        return this.bufToHex(hashBuffer);
    },

    /**
     * Derives an AES-GCM key from a PIN and Salt using PBKDF2.
     * @param {string} pin 
     * @param {string} saltHex 
     * @returns {Promise<CryptoKey>}
     */
    async deriveKey(pin, saltHex) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            'raw',
            encoder.encode(pin),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        );

        const salt = this.hexToBuf(saltHex);

        return window.crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false, // Key is non-extractable
            ['encrypt', 'decrypt']
        );
    },

    /**
     * Encrypts a JSON object string.
     * @param {string} dataVal - The string data to encrypt (e.g. JSON string)
     * @param {CryptoKey} key 
     * @returns {Promise<{ iv: string, cipher: string }>}
     */
    async encryptData(dataVal, key) {
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(dataVal);
        const iv = this.randomBytes(12); // 96-bit IV for AES-GCM

        const encryptedContent = await window.crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            encodedData
        );

        return {
            iv: this.bufToHex(iv),
            cipher: this.bufToHex(encryptedContent)
        };
    },

    /**
     * Decrypts an encrypted object.
     * @param {string} cipherHex 
     * @param {string} ivHex 
     * @param {CryptoKey} key 
     * @returns {Promise<string>} Decrypted text
     */
    async decryptData(cipherHex, ivHex, key) {
        const cipher = this.hexToBuf(cipherHex);
        const iv = this.hexToBuf(ivHex);

        const decryptedContent = await window.crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: iv
            },
            key,
            cipher
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedContent);
    }
};
