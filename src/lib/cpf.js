/**
 * Brazilian CPF utilities.
 *
 * Format: NNN.NNN.NNN-DD
 *   NNN.NNN.NNN  9 digits  – sequential number
 *   DD           2 digits  – check digits
 *
 * Example: 123.456.789-09
 */

/**
 * Applies the CPF mask progressively as the user types.
 * @param {string} raw - raw or partially-masked input
 * @returns {string} masked value
 */
export const maskCPF = (raw) => {
    const d = String(raw ?? '').replace(/\D/g, '').slice(0, 11);
    let r = d.slice(0, 3);
    if (d.length > 3) r += `.${d.slice(3, 6)}`;
    if (d.length > 6) r += `.${d.slice(6, 9)}`;
    if (d.length > 9) r += `-${d.slice(9, 11)}`;
    return r;
};

/**
 * Returns true when the value is a fully-formed CPF (11 digits + separators).
 * @param {string} value
 * @returns {boolean}
 */
export const isCompleteCPF = (value) =>
    /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(String(value ?? ''));

/**
 * Strips CPF mask, returning only digits.
 * @param {string} value
 * @returns {string}
 */
export const stripCPF = (value) =>
    String(value ?? '').replace(/\D/g, '');
