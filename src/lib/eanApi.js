/**
 * Fetches product information from the EAN Pictures API based on barcode.
 * 
 * Addresses constraints:
 * - HTTP API accessed from potential HTTPS environment (Mixed Content)
 * - Retry logic for flaky connections
 * - Multiple endpoints aggregation
 * - Data validation
 */

const PROXY_URL = "https://corsproxy.io/?";
const BASE_URL = "http://www.eanpictures.com.br:9000/api";

/**
 * Helper to fetch with timeout and retry logic
 */
async function fetchWithRetry(url, options = {}, retries = 2, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  // Use a CORS proxy to handle Mixed Content (HTTP API called from HTTPS source)
  // and CORS headers.
  const proxyUrl = `${PROXY_URL}${encodeURIComponent(url)}`;

  try {
    const response = await fetch(proxyUrl, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    
    if (!response.ok) {
      // If 404, don't retry, just return null/error immediately
      if (response.status === 404) throw new Error("Not Found");
      throw new Error(`HTTP Error: ${response.status}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(id);
    if (retries > 0 && error.name !== 'AbortError' && error.message !== "Not Found") {
      console.log(`Retrying ${url}... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1, timeout);
    }
    throw error;
  }
}

export async function fetchProductByEAN(barcode) {
  // 1. Validation
  if (!barcode) return null;
  
  // Remove any non-numeric characters just in case
  const cleanBarcode = barcode.replace(/\D/g, '');

  // EAN-8 is 8 digits, EAN-13 is 13, UPC-A is 12. GTIN-14 is 14.
  // Loose validation: 8 to 14 digits.
  if (!/^\d{8,14}$/.test(cleanBarcode)) {
    throw new Error("Formato de código de barras inválido. O código deve conter entre 8 e 14 dígitos numéricos.");
  }

  // 2. Define the 3 requested endpoints
  // We use Promise.allSettled to get as much data as possible even if one fails
  const endpoints = [
    { key: 'main', url: `${BASE_URL}/desc/${cleanBarcode}`, type: 'json' },
    { key: 'desc', url: `${BASE_URL}/descricao/${cleanBarcode}`, type: 'text' }, // Often returns plain text description
    { key: 'img',  url: `${BASE_URL}/gtin/${cleanBarcode}`, type: 'text' }      // Often returns an image URL string
  ];

  try {
    const results = await Promise.allSettled(
      endpoints.map(async (ep) => {
        try {
          const res = await fetchWithRetry(ep.url);
          if (ep.type === 'json') return { key: ep.key, data: await res.json() };
          return { key: ep.key, data: await res.text() };
        } catch (err) {
          console.warn(`Failed to fetch ${ep.key}:`, err);
          return { key: ep.key, error: err };
        }
      })
    );

    // 3. Aggregate Data
    const data = {};
    
    results.forEach(result => {
      if (result.status === 'fulfilled' && !result.value.error) {
        data[result.value.key] = result.value.data;
      }
    });

    // If we got absolutely nothing valid
    if (Object.keys(data).length === 0) {
      throw new Error("Produto não encontrado na base de dados.");
    }

    // 4. Normalize Return Object
    // 'main' endpoint usually returns { nome: "...", ... }
    // 'desc' endpoint usually returns a string description
    // 'img' endpoint usually returns a string URL
    
    const mainData = data.main || {};
    
    // Intelligent fallback for name
    const name = mainData.nome || mainData.name || (typeof data.desc === 'string' && data.desc.length < 50 ? data.desc : '') || "Produto sem nome";
    
    // Intelligent fallback for characteristics
    // If 'desc' is a long string, use it. If 'main' has description, use that.
    let characteristics = "";
    if (typeof data.desc === 'string' && data.desc.length > 5) {
        characteristics = data.desc;
    } else if (mainData.descricao || mainData.description) {
        characteristics = mainData.descricao || mainData.description;
    }

    // Intelligent fallback for image
    // 'img' might be the URL directly, or mainData might have 'img' or 'imagem' field
    let image = "";
    if (typeof data.img === 'string' && data.img.startsWith('http')) {
        image = data.img;
    } else if (mainData.img || mainData.imagem) {
        image = mainData.img || mainData.imagem;
    }

    return {
      name: name.trim(),
      characteristics: characteristics.trim(),
      image: image.trim(),
      raw: data // keep raw data for debugging if needed
    };

  } catch (error) {
    console.error("Error in fetchProductByEAN:", error);
    throw error;
  }
}