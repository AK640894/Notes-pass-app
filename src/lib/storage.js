import { cryptoHelpers } from './crypto';

const STORAGE_KEYS = {
    AUTH: 'pna_auth', // Stores { salt, authHash }
    DATA: 'pna_data', // Stores encrypted notes array
};

export const storage = {
    /**
     * Checks if the app is already set up with a PIN.
     * @returns {boolean}
     */
    isSetup() {
        return !!localStorage.getItem(STORAGE_KEYS.AUTH);
    },

    /**
     * Saving the PIN setup (Salt + Hash). 
     * WARNING: This overwrites existing setup.
     * @param {string} pin 
     */
    async setupPin(pin) {
        const salt = cryptoHelpers.randomBytes(16);
        const saltHex = cryptoHelpers.bufToHex(salt);
        const hash = await cryptoHelpers.sha256(pin + saltHex);

        const authData = {
            salt: saltHex,
            authHash: hash
        };

        localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData));
        // Initialize empty data if not present
        if (!localStorage.getItem(STORAGE_KEYS.DATA)) {
            localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify([]));
        }
    },

    /**
     * Validates the entered PIN against the stored hash.
     * @param {string} pin 
     * @returns {Promise<{isValid: boolean, salt: string|null}>}
     */
    async validatePin(pin) {
        const authDataStr = localStorage.getItem(STORAGE_KEYS.AUTH);
        if (!authDataStr) return { isValid: false, salt: null };

        const { salt, authHash } = JSON.parse(authDataStr);
        const checkHash = await cryptoHelpers.sha256(pin + salt);

        if (checkHash === authHash) {
            return { isValid: true, salt };
        }
        return { isValid: false, salt: null };
    },

    /**
     * Save a note.
     * Encrypts the specific note content before updating storage.
     * To prevent data loss, we read ALL, update ONE, save ALL.
     * Ideally, for larger datasets, we'd store each note separately, but 
     * for this simple app, a single JSON blob is fine.
     * 
     * @param {CryptoKey} key - The AES-GCM key derived from PIN
     * @param {Array} currentNotes - The decrypted notes currently in memory state
     */
    async saveNotes(currentNotes, key) {
        // We actually store the encrypted blob of the ENTIRE notes array
        // Or we can store an array of encrypted note objects.
        // Let's store an array of encrypted note objects for slightly better structure.

        const encryptedNotes = await Promise.all(currentNotes.map(async (note) => {
            // We encrypt the sensitive parts: title and content. 
            // ID and timestamp can remain plain for sorting/indexing if needed, 
            // but requirements say "Encrypt stored notes". "Never store ... notes in plain text".
            // Safest to encrypt the whole object payload.

            const jsonStr = JSON.stringify(note);
            const { iv, cipher } = await cryptoHelpers.encryptData(jsonStr, key);
            return { id: note.id, iv, cipher };
        }));

        localStorage.setItem(STORAGE_KEYS.DATA, JSON.stringify(encryptedNotes));
    },

    /**
     * Load and decrypt all notes.
     * @param {CryptoKey} key 
     * @returns {Promise<Array>} Decrypted notes
     */
    async loadNotes(key) {
        const dataStr = localStorage.getItem(STORAGE_KEYS.DATA);
        if (!dataStr) return [];

        const encryptedNotes = JSON.parse(dataStr);

        const notes = await Promise.all(encryptedNotes.map(async (encNote) => {
            try {
                const jsonStr = await cryptoHelpers.decryptData(encNote.cipher, encNote.iv, key);
                return JSON.parse(jsonStr);
            } catch (e) {
                console.error("Failed to decrypt note", encNote.id, e);
                return null;
            }
        }));

        return notes.filter(n => n !== null);
    },

    /**
     * Updates the PIN and re-encrypts all data with the new key.
     * @param {string} oldPin 
     * @param {string} newPin 
     * @returns {Promise<{success: boolean, newKey: CryptoKey, error?: string}>}
     */
    async updatePin(oldPin, newPin) {
        // 1. Validate Old PIN
        const { isValid, salt } = await this.validatePin(oldPin);
        if (!isValid) return { success: false, error: 'Incorrect old PIN' };

        // 2. Derive Old Key and Load Data
        const oldKey = await cryptoHelpers.deriveKey(oldPin, salt);
        const currentNotes = await this.loadNotes(oldKey);

        // 3. Setup New PIN (New Salt, New Hash)
        await this.setupPin(newPin);

        // 4. Derive New Key
        const { salt: newSalt } = await this.validatePin(newPin);
        // Note: validatePin just reads the salt we just wrote
        const newKey = await cryptoHelpers.deriveKey(newPin, newSalt);

        // 5. Re-encrypt Data with New Key
        await this.saveNotes(currentNotes, newKey);

        return { success: true, newKey };
    }
};
