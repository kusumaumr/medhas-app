// backend/services/openfda.js
const axios = require('axios');

class OpenFDAService {
  constructor() {
    this.baseURL = process.env.OPENFDA_API_URL || 'https://api.fda.gov';
  }

  async searchDrug(query) {
    try {
      const response = await axios.get(`${this.baseURL}/drug/label.json`, {
        params: {
          search: `openfda.brand_name:"${query}" OR openfda.generic_name:"${query}"`,
          limit: 1
        }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        const drug = response.data.results[0];
        return {
          name: drug.openfda?.brand_name?.[0] || drug.openfda?.generic_name?.[0] || query,
          brandName: drug.openfda?.brand_name?.[0],
          genericName: drug.openfda?.generic_name?.[0],
          sideEffects: drug.adverse_reactions || drug.warnings || [],
          warnings: drug.warnings || drug.precautions || [],
          dosage: drug.dosage_and_administration,
          description: drug.description || drug.indications_and_usage
        };
      }
      return { name: query };
    } catch (error) {
      console.error('OpenFDA API error:', error.message);
      return { name: query };
    }
  }

  async checkInteractions(medications) {
    try {
      // Note: OpenFDA doesn't have a direct drug interaction API
      // This is a placeholder - you might want to use a different API for interactions
      console.log('Checking interactions for:', medications);
      
      // For demo purposes, return mock data
      return [];
      
      // Actual implementation would use a drug interaction API like:
      // - RxNorm API
      // - DrugBank API
      // - IBM Micromedex
    } catch (error) {
      console.error('Interaction check error:', error.message);
      return [];
    }
  }

  async searchMedications(query) {
    try {
      const response = await axios.get(`${this.baseURL}/drug/label.json`, {
        params: {
          search: query,
          limit: 10
        }
      });
      return response.data.results || [];
    } catch (error) {
      console.error('OpenFDA API error:', error.message);
      return [];
    }
  }

  async getMedicationDetails(ndc) {
    try {
      const response = await axios.get(`${this.baseURL}/drug/label.json`, {
        params: {
          search: `openfda.product_ndc:"${ndc}"`,
          limit: 1
        }
      });
      return response.data.results ? response.data.results[0] : null;
    } catch (error) {
      console.error('OpenFDA API error:', error.message);
      return null;
    }
  }
}

module.exports = new OpenFDAService();