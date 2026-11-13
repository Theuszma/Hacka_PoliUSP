/** Municípios atendidos no piloto, com coordenadas do centro. */
export const CITIES = [
  { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
  { name: "São Bernardo do Campo", lat: -23.6914, lng: -46.5646 },
  { name: "Santo André", lat: -23.6639, lng: -46.5383 },
  { name: "São Caetano do Sul", lat: -23.6229, lng: -46.5548 },
  { name: "Diadema", lat: -23.6862, lng: -46.6228 },
  { name: "Mauá", lat: -23.6677, lng: -46.4613 },
  { name: "Ribeirão Pires", lat: -23.7108, lng: -46.4128 },
  { name: "Guarulhos", lat: -23.4538, lng: -46.5333 },
  { name: "Osasco", lat: -23.5329, lng: -46.7917 },
  { name: "Barueri", lat: -23.5057, lng: -46.879 },
  { name: "Cotia", lat: -23.6022, lng: -46.919 },
  { name: "Taboão da Serra", lat: -23.6019, lng: -46.7526 },
  { name: "Embu das Artes", lat: -23.6489, lng: -46.8522 },
  { name: "Mogi das Cruzes", lat: -23.5208, lng: -46.1854 },
  { name: "Suzano", lat: -23.5425, lng: -46.3108 },
  { name: "Jundiaí", lat: -23.1857, lng: -46.8978 },
  { name: "Campinas", lat: -22.9056, lng: -47.0608 },
  { name: "Sorocaba", lat: -23.5015, lng: -47.4526 },
  { name: "São José dos Campos", lat: -23.1896, lng: -45.8841 },
] as const;

/**
 * Coordenada aproximada dentro do município, com deslocamento determinístico a partir do nome
 * para que empresas da mesma cidade não fiquem sobrepostas no mapa.
 */
export function locate(cityName: string, seed: string): { city: string; lat: number; lng: number } {
  const c = CITIES.find((x) => x.name === cityName) ?? CITIES[0];
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const a = ((h >>> 0) % 360) * (Math.PI / 180);
  const r = (((h >>> 8) % 100) / 100) * 0.025; // até ~2,5 km
  return { city: c.name, lat: c.lat + Math.sin(a) * r, lng: c.lng + Math.cos(a) * r };
}
