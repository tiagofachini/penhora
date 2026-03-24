/**
 * CNJ DataJud API Integration Utility
 * Handles fetching court list and searching for process details.
 */

const PROXY_URL = "https://corsproxy.io/?";
const API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==";

// Fallback list in case the wiki endpoint is down or format changes
const FALLBACK_COURTS = [
    { name: "Tribunal de Justiça de São Paulo (TJSP)", endpoint: "api_publica_tjsp" },
    { name: "Tribunal de Justiça do Rio de Janeiro (TJRJ)", endpoint: "api_publica_tjrj" },
    { name: "Tribunal de Justiça de Minas Gerais (TJMG)", endpoint: "api_publica_tjmg" },
    { name: "Tribunal de Justiça do Paraná (TJPR)", endpoint: "api_publica_tjpr" },
    { name: "Tribunal de Justiça do Rio Grande do Sul (TJRS)", endpoint: "api_publica_tjrs" },
    { name: "Tribunal Regional do Trabalho da 2ª Região (TRT2)", endpoint: "api_publica_trt2" },
    { name: "Tribunal Regional do Trabalho da 15ª Região (TRT15)", endpoint: "api_publica_trt15" },
    { name: "Tribunal Regional Federal da 3ª Região (TRF3)", endpoint: "api_publica_trf3" },
];

/**
 * Fetches the list of available court endpoints.
 */
export async function fetchCourts() {
  try {
    // Attempt to fetch from the wiki/api endpoint
    const response = await fetch(`${PROXY_URL}${encodeURIComponent("https://datajud-wiki.cnj.jus.br/api-publica/endpoints")}`);
    
    if (!response.ok) throw new Error("Failed to fetch courts list");
    
    const data = await response.json();
    
    // Map the API response to our internal structure
    // Assuming response is array of { name: "...", endpoint: "..." } or similar
    // If data structure is different, we rely on fallback or simple mapping
    if (Array.isArray(data)) {
        return data.map(court => ({
            name: court.name || court.descricao || court.sigla,
            endpoint: court.endPoint || court.api || court.sigla?.toLowerCase()
        })).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return FALLBACK_COURTS;
  } catch (error) {
    console.warn("Using fallback court list due to API error:", error);
    return FALLBACK_COURTS;
  }
}

/**
 * Searches for a process in a specific court's DataJud API.
 * @param {string} courtEndpoint - The suffix for the API (e.g., 'api_publica_tjsp')
 * @param {string} processNumber - The 20-digit CNJ process number
 */
export async function fetchProcessDetails(courtEndpoint, processNumber) {
    const cleanNumber = processNumber.replace(/\D/g, '');
    
    // Normalize endpoint URL
    // Some endpoints might already be full URLs, others just suffixes
    let url = courtEndpoint;
    if (!url.startsWith('http')) {
        // Standard DataJud Public API pattern
        // Try to detect if the endpoint string needs 'api_publica_' prefix if missing
        const suffix = url.startsWith('api_publica_') ? url : `api_publica_${url.toLowerCase()}`;
        url = `https://api-publica.datajud.cnj.jus.br/${suffix}/api/processos/_search`;
    } else {
        // Ensure it ends with _search if it's a base URL
        if (!url.endsWith('_search')) {
            url = `${url}/api/processos/_search`;
        }
    }

    // Prepare the DataJud ElasticSearch query
    const payload = {
        query: {
            match: {
                numeroProcesso: cleanNumber
            }
        }
    };

    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`, {
            method: 'POST',
            headers: {
                'Authorization': `APIKey ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // DataJud returns standard ElasticSearch response: { hits: { hits: [ ... ] } }
        if (!data.hits || !data.hits.hits || data.hits.hits.length === 0) {
            return null;
        }

        // Get the most relevant hit (usually the first one)
        const processSource = data.hits.hits[0]._source;
        
        // Parse Parties (Polos)
        // Polo 'AT' = Ativo (Autor/Exequente)
        // Polo 'PA' = Passivo (Réu/Executado)
        const polos = processSource.movimentos ? [] : (processSource.polos || []); // Sometimes structure varies
        
        let exequente = "";
        let executado = "";

        // Iterate through poles to find parties
        if (processSource.polos) {
            processSource.polos.forEach(polo => {
                const partiesNames = polo.partes.map(p => p.pessoa.nome).join(', ');
                
                if (polo.polo === 'AT') {
                    exequente = partiesNames;
                } else if (polo.polo === 'PA') {
                    executado = partiesNames;
                }
            });
        }

        return {
            found: true,
            processNumber: processSource.numeroProcesso,
            exequente: exequente || "Não identificado",
            executado: executado || "Não identificado",
            subject: processSource.assuntos && processSource.assuntos.length > 0 ? processSource.assuntos[0].nome : "",
            class: processSource.classe ? processSource.classe.nome : "",
            lastUpdate: processSource.dataHoraUltimaAtualizacao
        };

    } catch (error) {
        console.error("Error fetching DataJud data:", error);
        throw error;
    }
}