export const formatAddress = (locationData) => {
  if (!locationData) return 'Não informado';
  
  let address;
  if (typeof locationData === 'string') {
    try {
      address = JSON.parse(locationData);
    } catch (e) {
      // If JSON parse fails, treat as a plain string
      return locationData;
    }
  } else if (typeof locationData === 'object' && locationData !== null) {
    address = locationData;
  } else {
    return locationData; // Return as is if not string or object
  }
  
  if (typeof address !== 'object' || address === null) return 'Não informado';
    
  // Build parts array
  const parts = [];
  
  if (address.logradouro) parts.push(address.logradouro);
  if (address.number) parts.push(address.number);
  if (address.complement) parts.push(address.complement);
  if (address.neighborhood) parts.push(address.neighborhood);
  
  // Combine city and state
  const cityState = [];
  if (address.city) cityState.push(address.city);
  if (address.state) cityState.push(address.state);
  if (cityState.length > 0) parts.push(cityState.join(' - '));
  
  // Format CEP
  if (address.cep) {
      // Simple CEP format XXXXX-XXX
      const cleanCep = address.cep.replace(/\D/g, '');
      if (cleanCep.length === 8) {
           parts.push(cleanCep.replace(/^(\d{5})(\d{3})/, '$1-$2'));
      } else {
           parts.push(address.cep);
      }
  }
  
  return parts.join(', ');
};