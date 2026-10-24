"use server";

import institutions from "aishe-institutions-list/data/institutions.json";

function normalizeText(text: string) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function searchColleges(query: string, limit = 20) {
  if (!query || query.length < 2) return [];
  
  const normalizedQuery = normalizeText(query);
  const queryWords = normalizedQuery.split(' ').filter(w => w.length > 0);
  
  const results = (institutions as any[]).filter(inst => {
    const normalizedName = normalizeText(inst.name || '');
    const normalizedState = normalizeText(inst.state || '');
    const normalizedDistrict = inst.district ? normalizeText(inst.district) : '';
    const aisheCode = inst.aishe_code?.toLowerCase() || '';
    
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanAisheCode = aisheCode.replace(/[^a-z0-9]/g, '');
    if (aisheCode.includes(query.toLowerCase()) || cleanAisheCode.includes(cleanQuery)) return true;
    
    return queryWords.every(word => 
      normalizedName.includes(word) ||
      normalizedState.includes(word) ||
      normalizedDistrict.includes(word)
    );
  });
  
  const seen = new Set();
  const uniqueResults = results.filter(inst => {
    const key = `${normalizeText(inst.name || '')}_${normalizeText(inst.state || '')}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  return uniqueResults.slice(0, limit);
}
