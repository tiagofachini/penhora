/**
 * CNJ process number utilities.
 *
 * Format: NNNNNNN-DD.AAAA.J.TT.OOOO
 *   NNNNNNN  7 digits  – sequential number
 *   DD       2 digits  – check digits
 *   AAAA     4 digits  – year
 *   J        1 digit   – justice segment
 *   TT       2 digits  – tribunal
 *   OOOO     4 digits  – origin court
 *
 * Example: 0001234-56.2023.8.26.0001
 */

/**
 * Applies the CNJ mask progressively as the user types.
 * Strips any non-digit characters first, then re-applies separators.
 * @param {string} raw - raw or partially-masked input
 * @returns {string} masked value
 */
export const maskCNJ = (raw) => {
    const d = String(raw ?? '').replace(/\D/g, '').slice(0, 20);
    let r = d.slice(0, 7);                             // NNNNNNN
    if (d.length > 7)  r += `-${d.slice(7, 9)}`;      // -DD
    if (d.length > 9)  r += `.${d.slice(9, 13)}`;     // .AAAA
    if (d.length > 13) r += `.${d.slice(13, 14)}`;    // .J
    if (d.length > 14) r += `.${d.slice(14, 16)}`;    // .TT
    if (d.length > 16) r += `.${d.slice(16, 20)}`;    // .OOOO
    return r;
};

/**
 * Returns true when the value is a fully-formed CNJ number (20 digits + separators).
 * @param {string} value
 * @returns {boolean}
 */
export const isCompleteCNJ = (value) =>
    /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(String(value ?? ''));
