/**
 * Dados de exemplo da rede piloto no ABC Paulista.
 * Todas as empresas, pessoas e números são fictícios.
 */
import { PrismaClient } from "@prisma/client";
import { flowMetrics } from "../src/lib/metrics";
import { hashPassword } from "../src/lib/password";
import { lastMonths } from "../src/lib/history";

const db = new PrismaClient();

type FlowSeed = {
  name: string; category: string; unit: string; monthlyQty: number; unitCost: number; lossRate: number;
  destination: string; destinationValue: number; supplier?: string; lot?: string; leverText?: string; leverReduction?: number;
};
type DemandSeed = {
  category: string; description: string; use: string; pricePaid: number; virginPrice: number;
  capacity: number; substitution: number; licensed?: boolean;
};
type CompanySeed = {
  key: string; name: string; initials: string; sector: string; size: string; employees: number; city: string;
  lat: number; lng: number; contact: { name: string; email: string }; flows: FlowSeed[]; inputs: DemandSeed[];
};

const companies: CompanySeed[] = [
  {
    key: "ipiranga", name: "Metalúrgica Ipiranga", initials: "MI", sector: "metalurgia",
    size: "Pequena", employees: 38, city: "São Bernardo do Campo", lat: -23.6914, lng: -46.5646,
    contact: { name: "Rosana Alves", email: "rosana@ipiranga.demo" },
    flows: [
      { name: "Chapa de aço SAE 1020", category: "aco", unit: "kg", monthlyQty: 18000, unitCost: 7.2, lossRate: 0.22, destination: "sucata", destinationValue: 1.1, supplier: "Distribuidora Aço Forte", lot: "CH-2611", leverText: "Otimizar o encaixe de peças na chapa (nesting) e revisar o formato da bobina", leverReduction: 0.3 },
      { name: "Óleo solúvel de corte", category: "fluido", unit: "L", monthlyQty: 800, unitCost: 18, lossRate: 0.35, destination: "classe1", destinationValue: -2.5, supplier: "Química ABC", lot: "OS-0988", leverText: "Filtrar e controlar a concentração com refratômetro para estender a vida do fluido", leverReduction: 0.5 },
      { name: "Tinta pó epóxi", category: "tinta", unit: "kg", monthlyQty: 500, unitCost: 38, lossRate: 0.18, destination: "classe1", destinationValue: -1.8, supplier: "Tintas Paulista", lot: "TP-4410", leverText: "Instalar recuperação de overspray na cabine (ciclone e filtro cartucho)", leverReduction: 0.65 },
      { name: "Pallets de madeira", category: "madeira", unit: "kg", monthlyQty: 1200, unitCost: 2.8, lossRate: 0.6, destination: "aterro", destinationValue: -0.35, supplier: "Pallets Riacho Grande", leverText: "Criar logística reversa de pallets com clientes e fornecedores", leverReduction: 0.4 },
      { name: "Filme stretch (PEBD)", category: "plastico", unit: "kg", monthlyQty: 300, unitCost: 12, lossRate: 0.9, destination: "aterro", destinationValue: -0.35, supplier: "Embalagens Mauá", leverText: "Trocar o filme por cintas reutilizáveis nas rotas internas", leverReduction: 0.5 },
    ],
    inputs: [
      { category: "aco", description: "Retalhos de chapa de 2 mm ou mais, com pelo menos 300 mm", use: "Peças pequenas da linha de calços", pricePaid: 4.3, virginPrice: 7.2, capacity: 2500, substitution: 0.9 },
      { category: "madeira", description: "Pallets PBR em bom estado ou reformados", use: "Expedição de peças", pricePaid: 1.0, virginPrice: 2.8, capacity: 800, substitution: 0.8 },
    ],
  },
  {
    key: "rudge", name: "Ferragens Rudge Ramos", initials: "FR", sector: "metalurgia", size: "Micro", employees: 14,
    city: "São Bernardo do Campo", lat: -23.661, lng: -46.572, contact: { name: "Jorge Batista", email: "jorge@rudge.demo" },
    flows: [
      { name: "Óleo de estampagem", category: "fluido", unit: "L", monthlyQty: 200, unitCost: 16, lossRate: 0.4, destination: "classe1", destinationValue: -2.5, supplier: "Química ABC" },
    ],
    inputs: [
      { category: "aco", description: "Retalhos de chapa maiores que 100 mm", use: "Estampa arruelas e calços a partir dos retalhos", pricePaid: 3.4, virginPrice: 7.2, capacity: 5000, substitution: 0.9 },
    ],
  },
  {
    key: "lubri", name: "Lubrirrefino Diadema", initials: "LD", sector: "ambiental", size: "Média", employees: 120,
    city: "Diadema", lat: -23.6862, lng: -46.6228, contact: { name: "Sônia Prado", email: "sonia@lubri.demo" },
    flows: [],
    inputs: [
      { category: "fluido", description: "Óleos e fluidos de corte usados", use: "Rerrefino: o óleo volta como base lubrificante", pricePaid: -0.8, virginPrice: 9, capacity: 4000, substitution: 0.7, licensed: true },
    ],
  },
  {
    key: "gerty", name: "Marcenaria Escola Vila Gerty", initials: "VG", sector: "moveleiro", size: "Micro", employees: 9,
    city: "São Caetano do Sul", lat: -23.6229, lng: -46.5548, contact: { name: "Elaine Costa", email: "elaine@gerty.demo" },
    flows: [],
    inputs: [
      { category: "madeira", description: "Pallets e madeira de embalagem", use: "Transforma pallets em móveis; coleta semanal gratuita", pricePaid: 0, virginPrice: 3.2, capacity: 2500, substitution: 0.8 },
    ],
  },
  {
    key: "reciclape", name: "Recicla PE Mauá", initials: "RP", sector: "ambiental", size: "Pequena", employees: 31,
    city: "Mauá", lat: -23.6677, lng: -46.4613, contact: { name: "Diego Nunes", email: "diego@reciclape.demo" },
    flows: [],
    inputs: [
      { category: "plastico", description: "Filme e sacaria de PEBD", use: "Transforma em pellets de PEBD reciclado", pricePaid: 0.9, virginPrice: 8.5, capacity: 6000, substitution: 0.75 },
    ],
  },
  {
    key: "taboao", name: "Estamparia Taboão", initials: "ET", sector: "metalurgia", size: "Média", employees: 145,
    city: "São Bernardo do Campo", lat: -23.712, lng: -46.59, contact: { name: "Paulo Ramos", email: "paulo@taboao.demo" },
    flows: [
      { name: "Bobina de aço 2,0 mm", category: "aco", unit: "kg", monthlyQty: 25000, unitCost: 7.0, lossRate: 0.15, destination: "sucata", destinationValue: 1.1, supplier: "Usina via distribuidor" },
      { name: "Papelão de embalagem", category: "papelao", unit: "kg", monthlyQty: 900, unitCost: 4.5, lossRate: 0.7, destination: "reciclagem", destinationValue: 0.4 },
    ],
    inputs: [],
  },
  {
    key: "autopecas", name: "Autopeças Santo André", initials: "AS", sector: "usinagem", size: "Pequena", employees: 62,
    city: "Santo André", lat: -23.6639, lng: -46.5383, contact: { name: "Marcos Lima", email: "marcos@autopecas.demo" },
    flows: [
      { name: "Pallets PBR", category: "madeira", unit: "kg", monthlyQty: 3000, unitCost: 2.8, lossRate: 0.5, destination: "aterro", destinationValue: -0.35 },
      { name: "Fluido de usinagem", category: "fluido", unit: "L", monthlyQty: 1200, unitCost: 17, lossRate: 0.3, destination: "classe1", destinationValue: -2.5, leverText: "Monitorar concentração e pH e instalar separador de óleo sujo", leverReduction: 0.45 },
      { name: "Filme stretch", category: "plastico", unit: "kg", monthlyQty: 500, unitCost: 12, lossRate: 0.85, destination: "aterro", destinationValue: -0.35 },
    ],
    inputs: [],
  },
  {
    key: "confeccoes", name: "Confecções Bom Retiro", initials: "CB", sector: "textil", size: "Pequena", employees: 47,
    city: "São Paulo", lat: -23.5269, lng: -46.6407, contact: { name: "Hana Kim", email: "hana@confeccoes.demo" },
    flows: [
      { name: "Tecido de algodão", category: "textil", unit: "kg", monthlyQty: 6000, unitCost: 32, lossRate: 0.2, destination: "aterro", destinationValue: -0.3, leverText: "Encaixe digital de moldes e reaproveitamento de retalhos", leverReduction: 0.3 },
    ],
    inputs: [],
  },
  {
    key: "plasticos", name: "Plásticos Diadema", initials: "PD", sector: "plasticos", size: "Pequena", employees: 55,
    city: "Diadema", lat: -23.695, lng: -46.61, contact: { name: "Ricardo Sato", email: "ricardo@plasticos.demo" },
    flows: [
      { name: "Resina PP", category: "plastico", unit: "kg", monthlyQty: 20000, unitCost: 9.5, lossRate: 0.08, destination: "reuso", destinationValue: 0, leverText: "Ajustar parâmetros de injeção e manutenção preventiva dos moldes", leverReduction: 0.4 },
    ],
    inputs: [
      { category: "plastico", description: "Aparas limpas de PE e PP", use: "Mistura até 20% de reciclado em peças não estruturais", pricePaid: 1.2, virginPrice: 8.5, capacity: 1500, substitution: 0.8 },
    ],
  },
  {
    key: "panificadora", name: "Panificadora Industrial Santo André", initials: "PS", sector: "alimentos", size: "Pequena", employees: 70,
    city: "Santo André", lat: -23.6553, lng: -46.53, contact: { name: "Luiza Mendes", email: "luiza@panificadora.demo" },
    flows: [
      { name: "Farinha de trigo", category: "organico", unit: "kg", monthlyQty: 30000, unitCost: 3.1, lossRate: 0.06, destination: "aterro", destinationValue: -0.2 },
    ],
    inputs: [],
  },
  {
    key: "composta", name: "Composta ABC", initials: "CA", sector: "ambiental", size: "Micro", employees: 12,
    city: "Mauá", lat: -23.6845, lng: -46.448, contact: { name: "Tiago Freitas", email: "tiago@composta.demo" },
    flows: [],
    inputs: [
      { category: "organico", description: "Resíduos orgânicos de indústria de alimentos", use: "Compostagem e biogás", pricePaid: 0, virginPrice: 0.4, capacity: 20000, substitution: 0.3 },
    ],
  },
  {
    key: "fundicao", name: "Fundição Mauá", initials: "FM", sector: "metalurgia", size: "Pequena", employees: 44,
    city: "Mauá", lat: -23.6625, lng: -46.4702, contact: { name: "Renato Oliveira", email: "renato@fundicao.demo" },
    flows: [
      { name: "Lingote de alumínio A356", category: "aluminio", unit: "kg", monthlyQty: 9000, unitCost: 21, lossRate: 0.09, destination: "sucata", destinationValue: 6.5, supplier: "Alumínio Paulista", lot: "AL-3310", leverText: "Separar cavaco por liga e secar antes de refundir", leverReduction: 0.35 },
      { name: "Óleo hidráulico", category: "fluido", unit: "L", monthlyQty: 300, unitCost: 22, lossRate: 0.25, destination: "classe1", destinationValue: -2.5 },
    ],
    inputs: [
      { category: "aluminio", description: "Cavaco e retalho de alumínio limpo", use: "Refusão para peças fundidas", pricePaid: 7.5, virginPrice: 21, capacity: 1500, substitution: 0.95 },
    ],
  },
  {
    key: "usinagem", name: "Usinagem de Precisão Diadema", initials: "UP", sector: "usinagem", size: "Micro", employees: 18,
    city: "Diadema", lat: -23.6815, lng: -46.6052, contact: { name: "Wagner Teixeira", email: "wagner@usinagem.demo" },
    flows: [
      { name: "Barra de aço 1045", category: "aco", unit: "kg", monthlyQty: 6000, unitCost: 8.4, lossRate: 0.28, destination: "sucata", destinationValue: 1.1, supplier: "Aços Diadema", leverText: "Comprar barras no comprimento de corte e otimizar o sobremetal", leverReduction: 0.25 },
      { name: "Fluido de corte sintético", category: "fluido", unit: "L", monthlyQty: 400, unitCost: 19, lossRate: 0.3, destination: "classe1", destinationValue: -2.5, leverText: "Controle diário de concentração e skimmer de óleo sujo", leverReduction: 0.45 },
    ],
    inputs: [],
  },
  {
    key: "moveis", name: "Móveis Planejados São Caetano", initials: "MP", sector: "moveleiro", size: "Pequena", employees: 33,
    city: "São Caetano do Sul", lat: -23.6178, lng: -46.5695, contact: { name: "Cláudia Ferraz", email: "claudia@moveis.demo" },
    flows: [
      { name: "Chapa de MDF 18 mm", category: "madeira", unit: "kg", monthlyQty: 14000, unitCost: 3.9, lossRate: 0.16, destination: "aterro", destinationValue: -0.35, supplier: "Madeireira Grande ABC", leverText: "Plano de corte otimizado por software e estoque de sobras", leverReduction: 0.35 },
      { name: "Verniz PU", category: "tinta", unit: "kg", monthlyQty: 260, unitCost: 46, lossRate: 0.68, destination: "classe1", destinationValue: -1.8, leverText: "Pistola HVLP e treinamento de aplicação", leverReduction: 0.4 },
    ],
    inputs: [],
  },
  {
    key: "embalagens", name: "Embalagens Ribeirão Pires", initials: "ER", sector: "plasticos", size: "Pequena", employees: 51,
    city: "Ribeirão Pires", lat: -23.7108, lng: -46.4128, contact: { name: "Simone Barros", email: "simone@embalagens.demo" },
    flows: [
      { name: "Bobina de PEBD", category: "plastico", unit: "kg", monthlyQty: 16000, unitCost: 10.5, lossRate: 0.07, destination: "reciclagem", destinationValue: 1.0, leverText: "Ajustar o setup das extrusoras para reduzir aparas de troca de bobina", leverReduction: 0.3 },
      { name: "Tubete de papelão", category: "papelao", unit: "kg", monthlyQty: 2200, unitCost: 4.1, lossRate: 0.35, destination: "aterro", destinationValue: -0.3 },
    ],
    inputs: [
      { category: "plastico", description: "Filme stretch e sacaria de PEBD limpos", use: "Reprocessa em sacos de lixo industriais", pricePaid: 1.1, virginPrice: 8.5, capacity: 3000, substitution: 0.8 },
    ],
  },
  {
    key: "malharia", name: "Malharia Vila Prudente", initials: "MV", sector: "textil", size: "Micro", employees: 22,
    city: "São Paulo", lat: -23.5844, lng: -46.5806, contact: { name: "Rosa Nakamura", email: "rosa@malharia.demo" },
    flows: [
      { name: "Fio de algodão penteado", category: "textil", unit: "kg", monthlyQty: 3500, unitCost: 36, lossRate: 0.12, destination: "aterro", destinationValue: -0.3, leverText: "Revisar a regulagem dos teares e reaproveitar pontas de fio", leverReduction: 0.3 },
    ],
    inputs: [],
  },
  {
    key: "fiacao", name: "Fiação Circular Guarulhos", initials: "FC", sector: "ambiental", size: "Pequena", employees: 40,
    city: "Guarulhos", lat: -23.4628, lng: -46.5333, contact: { name: "André Paiva", email: "andre@fiacao.demo" },
    flows: [],
    inputs: [
      { category: "textil", description: "Retalhos e pontas de fio de algodão", use: "Desfibra e transforma em fio reciclado", pricePaid: 0.8, virginPrice: 30, capacity: 4000, substitution: 0.6 },
    ],
  },
  {
    key: "laticinios", name: "Laticínios Serra do Mar", initials: "LS", sector: "alimentos", size: "Média", employees: 160,
    city: "Rio Grande da Serra", lat: -23.7442, lng: -46.3977, contact: { name: "Eduardo Lins", email: "eduardo@laticinios.demo" },
    flows: [
      { name: "Leite cru", category: "organico", unit: "kg", monthlyQty: 120000, unitCost: 2.6, lossRate: 0.03, destination: "aterro", destinationValue: -0.15, leverText: "Recuperar soro e enxágue para ração ou biogás", leverReduction: 0.4 },
      { name: "Caixas de papelão", category: "papelao", unit: "kg", monthlyQty: 3000, unitCost: 4.4, lossRate: 0.2, destination: "reciclagem", destinationValue: 0.4 },
    ],
    inputs: [],
  },
  {
    key: "papel", name: "Papel Reciclado ABC", initials: "PR", sector: "ambiental", size: "Pequena", employees: 28,
    city: "Santo André", lat: -23.6458, lng: -46.5125, contact: { name: "Fábio Santana", email: "fabio@papel.demo" },
    flows: [],
    inputs: [
      { category: "papelao", description: "Papelão ondulado e tubetes", use: "Aparas para papel kraft reciclado", pricePaid: 0.65, virginPrice: 4.2, capacity: 8000, substitution: 0.7 },
    ],
  },
  {
    key: "tintas", name: "Tintas Regeneradas Diadema", initials: "TR", sector: "ambiental", size: "Micro", employees: 15,
    city: "Diadema", lat: -23.6998, lng: -46.6189, contact: { name: "Patrícia Gomes", email: "patricia@tintas.demo" },
    flows: [],
    inputs: [
      { category: "tinta", description: "Sobras de tinta pó e verniz", use: "Reprocessa em tinta de fundo para uso industrial", pricePaid: -0.6, virginPrice: 30, capacity: 600, substitution: 0.5, licensed: true },
    ],
  },
];

/** Destino original (antes das trocas), guardado antes de o roteiro atualizar o cadastro. */
const ORIGINAL: Record<string, { destination: string; destinationValue: number }> = Object.fromEntries(
  companies.flatMap((c) => c.flows.map((f) => [`${c.key}:${f.category}`, { destination: f.destination, destinationValue: f.destinationValue }])),
);

const engineers = [
  { name: "Ana Ribeiro", email: "ana@poli.demo", kind: "STUDENT", course: "Eng. Metalúrgica e de Materiais · Poli, 4º ano", bio: "Iniciação científica em conformação de chapas. Quer aplicar nesting em fábricas pequenas.", skills: "aço, nesting, conformação, alumínio", hoursPerWeek: 8, rating: 4.9 },
  { name: "Carlos Menezes", email: "carlos@mentor.demo", kind: "MENTOR", course: "Eng. Mecânico · 18 anos em estamparia", bio: "Ex-gerente industrial. Mentora estudantes em projetos de ferramentaria e estampagem.", skills: "aço, estamparia, ferramentaria, conformação", hoursPerWeek: 4, rating: 5.0, lat: -23.68, lng: -46.56 },
  { name: "Júlia Tanaka", email: "julia@poli.demo", kind: "STUDENT", course: "Eng. Química · Poli, 5º ano", bio: "Estágio em tratamento de efluentes. Interesse em fluidos de corte e rerrefino.", skills: "fluidos, química, efluentes, óleo", hoursPerWeek: 10, rating: 4.8 },
  { name: "Beatriz Lima", email: "beatriz@poli.demo", kind: "STUDENT", course: "Eng. Ambiental · Poli, 5º ano", bio: "Faz inventário de gases de efeito estufa e planos de gerenciamento de resíduos.", skills: "resíduos, pintura, PGRS, inventário GEE", hoursPerWeek: 6, rating: 4.7 },
  { name: "Rafael Souza", email: "rafael@poli.demo", kind: "STUDENT", course: "Eng. de Produção · Poli, 3º ano", bio: "Membro da Poli Júnior. Lean, layout e logística de embalagens.", skills: "lean, logística, embalagem, layout", hoursPerWeek: 12, rating: 4.6 },
  { name: "Marina Okada", email: "marina@mentor.demo", kind: "MENTOR", course: "Eng. Química · especialista em pintura industrial", bio: "15 anos em linhas de pintura eletrostática.", skills: "pintura, processos, tinta", hoursPerWeek: 3, rating: 4.9, lat: -23.65, lng: -46.53 },
  { name: "Lucas Ferreira", email: "lucas@poli.demo", kind: "STUDENT", course: "Eng. Mecatrônica · Poli, 4º ano", bio: "Sensores de baixo custo para medir consumo e refugo em tempo real.", skills: "IoT, sensores, rastreabilidade", hoursPerWeek: 8, rating: 4.5 },
  { name: "Camila Rocha", email: "camila@poli.demo", kind: "STUDENT", course: "Eng. de Produção · Poli, 4º ano", bio: "Trabalhou com confecção familiar; estuda encaixe digital de moldes.", skills: "têxtil, corte, modelagem, lean", hoursPerWeek: 6, rating: 4.7 },
  { name: "Pedro Alves", email: "pedro@poli.demo", kind: "STUDENT", course: "Eng. Química · Poli, 4º ano", bio: "Pesquisa biogás a partir de resíduos de alimentos.", skills: "alimentos, biogás, compostagem", hoursPerWeek: 8, rating: 4.8 },
  { name: "Thiago Moura", email: "thiago@poli.demo", kind: "STUDENT", course: "Eng. de Materiais · Poli, 3º ano", bio: "Caracterização de polímeros reciclados.", skills: "plásticos, injeção, embalagem", hoursPerWeek: 10, rating: 4.6 },
  { name: "Gabriel Nunes", email: "gabriel@poli.demo", kind: "STUDENT", course: "Eng. Mecânica · Poli, 4º ano", bio: "Estágio em usinagem CNC. Quer reduzir sobremetal e setup em oficinas pequenas.", skills: "aço, usinagem, ferramentaria, lean", hoursPerWeek: 8, rating: 4.7 },
  { name: "Larissa Mendes", email: "larissa@poli.demo", kind: "STUDENT", course: "Eng. Ambiental · Poli, 4º ano", bio: "Monitora de gestão de resíduos. Já montou PGRS para duas empresas juniores.", skills: "resíduos, PGRS, compostagem, biogás", hoursPerWeek: 6, rating: 4.8 },
  { name: "Henrique Sato", email: "henrique@mentor.demo", kind: "MENTOR", course: "Eng. de Materiais · 20 anos em transformação de plásticos", bio: "Foi gerente de processo em indústria de embalagens flexíveis.", skills: "plásticos, injeção, embalagem, processos", hoursPerWeek: 3, rating: 5.0, lat: -23.67, lng: -46.46 },
  { name: "Fernanda Costa", email: "fernanda@poli.demo", kind: "STUDENT", course: "Eng. Química · Poli, 3º ano", bio: "Pesquisa tintas de baixo VOC e aplicação eletrostática.", skills: "tinta, pintura, química, processos", hoursPerWeek: 8, rating: 4.6 },
  { name: "Vitor Araújo", email: "vitor@poli.demo", kind: "STUDENT", course: "Eng. de Produção · Poli, 5º ano", bio: "Consultor na Poli Júnior: planejamento de produção e logística reversa.", skills: "lean, logística, embalagem, rastreabilidade", hoursPerWeek: 10, rating: 4.7 },
  { name: "Sofia Martins", email: "sofia@each.demo", kind: "STUDENT", course: "Têxtil e Moda · EACH-USP, 4º ano", bio: "Modelagem e encaixe digital; pesquisa reaproveitamento de retalhos.", skills: "têxtil, corte, modelagem", hoursPerWeek: 6, rating: 4.8 },
];

/* ------------------------------------------------------------------
 * História da rede: cada evento muda o estado de um insumo a partir de um mês.
 * O histórico mensal é gerado a partir desse roteiro, então gráficos, trocas,
 * demandas e notificações contam a mesma história.
 * ------------------------------------------------------------------ */

const DAY = 86400000;
const monthsAgoDate = (m: number, extraDays = 0) => new Date(Date.now() - (m * 30 + extraDays) * DAY);

type Change = { company: string; category: string; monthsAgo: number; lossFactor?: number; destination?: string; destinationValue?: number };


async function main() {
  await db.notification.deleteMany();
  await db.session.deleteMany();
  await db.requestUpdate.deleteMany();
  await db.supportRequest.deleteMany();
  await db.exchange.deleteMany();
  await db.monthlyRecord.deleteMany();
  await db.inputDemand.deleteMany();
  await db.materialFlow.deleteMany();
  await db.engineer.deleteMany();
  await db.user.deleteMany();
  await db.company.deleteMany();

  const passwordHash = await hashPassword("elo2026");
  const months = lastMonths(12);
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  // Mudanças ao longo do ano: o que aconteceu com cada insumo e quando
  const changes: Change[] = [
    // Taboão começou a vender retalho para a Ferragens Rudge há 10 meses
    { company: "taboao", category: "aco", monthsAgo: 10, destination: "simbiose", destinationValue: 3.4 },
    // Autopeças: pallets para a Marcenaria Vila Gerty (7 meses) e filme para a Recicla PE (4 meses)
    { company: "autopecas", category: "madeira", monthsAgo: 7, destination: "simbiose", destinationValue: 0 },
    { company: "autopecas", category: "plastico", monthsAgo: 4, destination: "simbiose", destinationValue: 0.9 },
    // Autopeças: controle de fluido com a Júlia começou a fazer efeito no último mês
    { company: "autopecas", category: "fluido", monthsAgo: 0, lossFactor: 0.85 },
    // Ipiranga: logística reversa de pallets com o Vitor, concluída há 5 meses
    { company: "ipiranga", category: "madeira", monthsAgo: 5, lossFactor: 0.6 / 0.85 },
    // Estamparia Taboão: nesting com a Ana, concluído há 3 meses
    { company: "taboao", category: "aco", monthsAgo: 3, lossFactor: 0.15 / 0.21 },
    // Panificadora: planejamento de produção com o Pedro (2 meses) e sobras para a Composta ABC (1 mês)
    { company: "panificadora", category: "organico", monthsAgo: 2, lossFactor: 0.6 },
    { company: "panificadora", category: "organico", monthsAgo: 1, destination: "simbiose", destinationValue: 0 },
    // Embalagens Ribeirão Pires: tubetes para a Papel Reciclado ABC há 6 meses
    { company: "embalagens", category: "papelao", monthsAgo: 6, destination: "simbiose", destinationValue: 0.65 },
    // Ipiranga: vazamento na bomba de fluido no último mês (o motor de cálculo deve alertar)
    { company: "ipiranga", category: "fluido", monthsAgo: 0, lossFactor: 0.35 / 0.27 },
    // Fundição Mauá: troca de óleo hidráulico usado com a Lubrirrefino há 8 meses
    { company: "fundicao", category: "fluido", monthsAgo: 8, destination: "simbiose", destinationValue: -0.8 },
  ];

  // Ajusta o cadastro para o estado atual (fim da história)
  for (const c of companies) {
    for (const f of c.flows) {
      for (const ch of changes.filter((x) => x.company === c.key && x.category === f.category)) {
        if (ch.destination) { f.destination = ch.destination; f.destinationValue = ch.destinationValue ?? 0; }
      }
      // a perda cadastrada é a atual; os fatores reconstroem o passado
      if (c.key === "panificadora") f.lossRate = 0.036;
      if (c.key === "autopecas" && f.category === "fluido") f.lossRate = 0.3 * 0.85;
    }
  }

  const ids: Record<string, { id: string; userId: string; flows: Record<string, string>; inputs: Record<string, string> }> = {};
  for (const c of companies) {
    const company = await db.company.create({
      data: {
        name: c.name, initials: c.initials, sector: c.sector, size: c.size, employees: c.employees, city: c.city, lat: c.lat, lng: c.lng,
        onboardedAt: monthsAgoDate(12, 10), createdAt: monthsAgoDate(12, 12),
      },
    });
    const user = await db.user.create({ data: { name: c.contact.name, email: c.contact.email, role: "COMPANY", companyId: company.id, passwordHash, isDemo: true, createdAt: monthsAgoDate(12, 12) } });
    const flows: Record<string, string> = {};
    for (const f of c.flows) {
      const mine = changes.filter((x) => x.company === c.key && x.category === f.category);
      const records = months.map((month, i) => {
        const ago = months.length - 1 - i;
        const last = ago === 0;
        // desfaz as melhorias que ainda não tinham acontecido naquele mês
        let lossRate = f.lossRate;
        let destination = f.destination;
        let destinationValue = f.destinationValue;
        for (const ch of mine) {
          if (ago >= ch.monthsAgo + (ch.monthsAgo === 0 ? 1 : 0) && ch.lossFactor) lossRate = lossRate / ch.lossFactor;
          if (ago > ch.monthsAgo && ch.destination) {
            const base = c.flows.find((x) => x.category === f.category)!;
            destination = ORIGINAL[`${c.key}:${f.category}`]?.destination ?? base.destination;
            destinationValue = ORIGINAL[`${c.key}:${f.category}`]?.destinationValue ?? base.destinationValue;
          }
        }
        const season = 1 + 0.07 * Math.sin((i / 12) * 2 * Math.PI);
        return {
          month,
          monthlyQty: last ? f.monthlyQty : Math.round(f.monthlyQty * season * (0.93 + rand() * 0.14)),
          unitCost: last ? f.unitCost : +(f.unitCost * (0.93 + (i / 12) * 0.07)).toFixed(2),
          lossRate: last ? f.lossRate : Math.min(1, +(lossRate * (0.94 + rand() * 0.12)).toFixed(4)),
          destination,
          destinationValue,
        };
      });
      flows[f.category] = (await db.materialFlow.create({ data: { ...f, companyId: company.id, createdAt: monthsAgoDate(12, 10), records: { create: records } } })).id;
    }
    const inputs: Record<string, string> = {};
    for (const d of c.inputs) inputs[d.category] = (await db.inputDemand.create({ data: { ...d, licensed: d.licensed ?? false, companyId: company.id, createdAt: monthsAgoDate(12, 9) } })).id;
    ids[c.key] = { id: company.id, userId: user.id, flows, inputs };
  }

  const eng: Record<string, { id: string; userId: string }> = {};
  for (const e of engineers) {
    const { name, email, lat, lng, ...profile } = e as typeof e & { lat?: number; lng?: number };
    const user = await db.user.create({ data: { name, email, role: "ENGINEER", passwordHash, isDemo: true, createdAt: monthsAgoDate(11) } });
    const created = await db.engineer.create({
      data: { ...profile, userId: user.id, lat: lat ?? -23.5613, lng: lng ?? -46.7307 }, // padrão: Cidade Universitária
    });
    eng[name.split(" ")[0]] = { id: created.id, userId: user.id };
  }

  /* ---------------- Trocas de resíduo ---------------- */
  const exchange = async (from: string, cat: string, to: string, inputCat: string, quantity: number, price: number, status: string, monthsAgo: number, initiator = from) => {
    const createdAt = monthsAgoDate(monthsAgo, 6);
    return db.exchange.create({
      data: {
        flowId: ids[from].flows[cat], demandId: ids[to].inputs[inputCat], fromId: ids[from].id, toId: ids[to].id, initiatorId: ids[initiator].id,
        quantity, price, status, createdAt, updatedAt: status === "PROPOSED" ? createdAt : monthsAgoDate(monthsAgo),
      },
    });
  };
  await exchange("taboao", "aco", "rudge", "aco", 3750, 3.4, "ACCEPTED", 10);
  await exchange("autopecas", "madeira", "gerty", "madeira", 1500, 0, "ACCEPTED", 7);
  await exchange("autopecas", "plastico", "reciclape", "plastico", 425, 0.9, "ACCEPTED", 4);
  await exchange("panificadora", "organico", "composta", "organico", 1100, 0, "ACCEPTED", 1, "composta");
  await exchange("embalagens", "papelao", "papel", "papelao", 770, 0.65, "ACCEPTED", 6);
  await exchange("fundicao", "fluido", "lubri", "fluido", 75, -0.8, "ACCEPTED", 8);
  await exchange("ipiranga", "fluido", "lubri", "fluido", 280, -0.8, "DECLINED", 2);
  await exchange("usinagem", "aco", "ipiranga", "aco", 1600, 4.3, "DECLINED", 3, "ipiranga");
  // Propostas abertas: a Ipiranga tem uma para responder; a Malharia aguarda a Fiação
  await exchange("taboao", "aco", "ipiranga", "aco", 2500, 4.3, "PROPOSED", 0);
  await exchange("malharia", "textil", "fiacao", "textil", 420, 0.8, "PROPOSED", 0);

  /* ---------------- Demandas de engenharia ---------------- */
  const lossOf = async (companyKey: string, cat: string) => flowMetrics(await db.materialFlow.findUniqueOrThrow({ where: { id: ids[companyKey].flows[cat] } })).loss;
  type U = { kind?: string; who?: string; company?: string; body: string; at: Date };
  const request = async (r: {
    company: string; title: string; category: string; hours: number; status: string; briefing: string; at: Date;
    assignee?: string; invited?: string; outcome?: string; saved?: number; lossOverride?: number; updates?: U[];
    reviewer?: string; reviewedAt?: Date;
  }) => {
    const updates: U[] = [{ kind: "EVENT", body: "Demanda publicada na rede", at: r.at }, ...(r.updates ?? [])];
    const last = updates[updates.length - 1].at;
    return db.supportRequest.create({
      data: {
        companyId: ids[r.company].id, title: r.title, category: r.category, estimatedHours: r.hours, status: r.status, briefing: r.briefing,
        monthlyLoss: r.lossOverride ?? (ids[r.company].flows[r.category] ? await lossOf(r.company, r.category) : 0),
        assigneeId: r.assignee ? eng[r.assignee].id : null, invitedId: r.invited ? eng[r.invited].id : null,
        reviewerId: r.reviewer ? eng[r.reviewer].id : null, reviewedAt: r.reviewedAt ?? null,
        outcome: r.outcome, savedPerMonth: r.saved, createdAt: r.at, updatedAt: last,
        updates: {
          create: updates.map((u) => ({
            kind: u.kind ?? "MESSAGE", body: u.body, createdAt: u.at,
            authorId: u.who ? eng[u.who].userId : u.company ? ids[u.company].userId : null,
          })),
        },
      },
    });
  };

  // Concluídas (resultado já aparece no histórico das empresas)
  await request({
    company: "ipiranga", title: "Pallets descartados depois de uma viagem", category: "madeira", hours: 16, status: "DONE", at: monthsAgoDate(7),
    assignee: "Vitor", lossOverride: 1900, saved: 640, reviewer: "Carlos", reviewedAt: monthsAgoDate(5),
    briefing: "85% dos pallets que recebemos vão para o aterro depois de uma única entrega. Queremos um sistema de retorno com clientes e fornecedores.",
    outcome: "Acordo de logística reversa com os 4 maiores clientes e etiqueta de controle por pallet. Perda caiu de 85% para 60%.",
    updates: [
      { kind: "EVENT", body: "Vitor Araújo assumiu a demanda", at: monthsAgoDate(7, -2) },
      { who: "Vitor", body: "Mapeei o fluxo: 70% dos pallets saem para 4 clientes. Proponho um acordo de devolução na próxima entrega.", at: monthsAgoDate(6, 20) },
      { company: "ipiranga", body: "Três clientes toparam. O quarto pediu para cobrarmos caução.", at: monthsAgoDate(6, 5) },
      { kind: "EVENT", body: "Entregue para revisão de um(a) mentor(a) · economia estimada de R$ 700/mês", at: monthsAgoDate(5, 4) },
      { who: "Carlos", body: "Bom trabalho. A caução do quarto cliente ainda não está garantida, então validei a economia dos três acordos fechados.", at: monthsAgoDate(5, 1) },
      { kind: "EVENT", body: "Validada por Carlos Menezes (economia ajustada) · economia de R$ 640/mês", at: monthsAgoDate(5) },
    ],
  });
  await request({
    company: "taboao", title: "Nesting de peças na bobina de 2,0 mm", category: "aco", hours: 24, status: "DONE", at: monthsAgoDate(5),
    assignee: "Ana", lossOverride: 7350, saved: 4200, reviewer: "Carlos", reviewedAt: monthsAgoDate(3),
    briefing: "21% da bobina vira retalho. Queremos revisar o encaixe das peças e a largura da bobina comprada.",
    outcome: "Novo plano de nesting e troca da largura da bobina de 1.200 para 1.000 mm. Perda caiu de 21% para 15%; retalhos seguem para a Ferragens Rudge.",
    updates: [
      { kind: "EVENT", body: "Ana Ribeiro assumiu a demanda", at: monthsAgoDate(5, -1) },
      { who: "Ana", body: "Simulei 3 layouts no software da Poli. O melhor reduz o retalho em 6 pontos, sem mudar ferramenta.", at: monthsAgoDate(4, 10) },
      { company: "taboao", body: "Rodamos o layout novo em um lote piloto. Bateu com a simulação.", at: monthsAgoDate(3, 15) },
      { kind: "EVENT", body: "Entregue para revisão de um(a) mentor(a) · economia estimada de R$ 4.200/mês", at: monthsAgoDate(3, 3) },
      { who: "Carlos", body: "Conferi o lote piloto e o novo layout de nesting. Economia consistente com a medição.", at: monthsAgoDate(3, 1) },
      { kind: "EVENT", body: "Validada por Carlos Menezes · economia de R$ 4.200/mês", at: monthsAgoDate(3) },
    ],
  });
  await request({
    company: "panificadora", title: "Sobras de massa e farinha vencida", category: "organico", hours: 12, status: "DONE", at: monthsAgoDate(3),
    assignee: "Pedro", lossOverride: 5800, saved: 3100, reviewer: "Henrique", reviewedAt: monthsAgoDate(2),
    briefing: "6% da farinha vira sobra. Queremos reduzir e dar um destino melhor que o aterro.",
    outcome: "Planejamento de produção por dia da semana e envio das sobras para a Composta ABC.",
    updates: [
      { kind: "EVENT", body: "Pedro Alves assumiu a demanda", at: monthsAgoDate(3, -1) },
      { who: "Pedro", body: "As sobras se concentram na segunda e na sexta. Sugiro ajustar a massa desses dias e oferecer o excedente para compostagem.", at: monthsAgoDate(2, 20) },
      { kind: "EVENT", body: "Entregue para revisão de um(a) mentor(a) · economia estimada de R$ 3.100/mês", at: monthsAgoDate(2, 2) },
      { kind: "EVENT", body: "Validada por Henrique Sato · economia de R$ 3.100/mês", at: monthsAgoDate(2) },
    ],
  });

  // Em andamento
  await request({
    company: "autopecas", title: "Fluido de usinagem trocado a cada 3 semanas", category: "fluido", hours: 14, status: "IN_PROGRESS", at: monthsAgoDate(1, 10),
    assignee: "Júlia",
    briefing: "O fluido apodrece rápido e o descarte Classe I custa caro. Precisamos de um plano de controle.",
    updates: [
      { kind: "EVENT", body: "Júlia Tanaka assumiu a demanda", at: monthsAgoDate(1, 9) },
      { who: "Júlia", body: "Medi concentração e pH nas 4 máquinas. Duas estão abaixo de 3%, o que favorece bactérias. Proponho refratômetro diário e um skimmer para óleo sujo.", at: monthsAgoDate(1, 2) },
      { company: "autopecas", body: "Ótimo. Já compramos o refratômetro e começamos na segunda.", at: monthsAgoDate(0, 25) },
      { who: "Júlia", body: "Primeiro mês com controle: a troca passou de 3 para 5 semanas. Vou acompanhar mais um ciclo antes de fechar.", at: monthsAgoDate(0, 3) },
    ],
  });
  await request({
    company: "ipiranga", title: "Overspray de tinta pó na cabine", category: "tinta", hours: 20, status: "IN_PROGRESS", at: monthsAgoDate(0, 18),
    assignee: "Marina",
    briefing: "18% da tinta pó não adere à peça e vai para descarte Classe I. Queremos avaliar recuperação de overspray.",
    updates: [
      { kind: "EVENT", body: "Marina Okada assumiu a demanda", at: monthsAgoDate(0, 17) },
      { who: "Marina", body: "Visitei a cabine. O filtro está saturado e a pistola está a 40 cm da peça. Com ciclone e ajuste de distância dá para recuperar boa parte do pó.", at: monthsAgoDate(0, 9) },
      { company: "ipiranga", body: "Quanto custa o ciclone? Precisamos levar para a diretoria.", at: monthsAgoDate(0, 8) },
      { who: "Marina", body: "Pedi três orçamentos, entre R$ 18 e 26 mil. O retorno fica abaixo de 10 meses. Mando o comparativo até sexta.", at: monthsAgoDate(0, 1) },
    ],
  });

  // Entregue por estudante, aguardando revisão de mentor(a)
  await request({
    company: "usinagem", title: "Sobremetal alto nas barras de aço 1045", category: "aco", hours: 14, status: "REVIEW", at: monthsAgoDate(1, 5),
    assignee: "Gabriel", saved: 1800,
    briefing: "28% da barra vira cavaco ou ponta. Queremos comprar no comprimento certo e reduzir o sobremetal sem perder qualidade.",
    outcome: "Mapeei os 12 itens de maior giro: 7 podem ser comprados em barras de 3 m em vez de 6 m, e o sobremetal no diâmetro pode cair de 3 para 1,5 mm. Perda estimada passa de 28% para 21%.",
    updates: [
      { kind: "EVENT", body: "Gabriel Nunes assumiu a demanda", at: monthsAgoDate(1, 4) },
      { who: "Gabriel", body: "Levantei o histórico de cortes dos últimos 3 meses. As pontas de barra respondem por metade da perda.", at: monthsAgoDate(0, 20) },
      { company: "usinagem", body: "O fornecedor topa entregar em 3 m sem custo extra a partir de 500 kg.", at: monthsAgoDate(0, 9) },
      { kind: "EVENT", body: "Entregue para revisão de um(a) mentor(a) · economia estimada de R$ 1.800/mês", at: monthsAgoDate(0, 2) },
    ],
  });

  // Abertas
  await request({
    company: "confeccoes", title: "Retalho de tecido: 1,2 t/mês indo para aterro", category: "textil", hours: 16, status: "OPEN", at: monthsAgoDate(0, 2), invited: "Sofia",
    briefing: "Perdemos 20% do tecido de algodão no corte. Queremos avaliar encaixe digital de moldes e alguém que compre os retalhos.",
    updates: [{ kind: "EVENT", body: "Sofia Martins foi convidado(a)", at: monthsAgoDate(0, 2) }],
  });
  await request({
    company: "plasticos", title: "Refugo de injeção em 8% das peças", category: "plastico", hours: 20, status: "OPEN", at: monthsAgoDate(0, 5),
    briefing: "O refugo é moído e reaproveitado, mas perde propriedades. Queremos achar a causa (parâmetros, molde ou umidade da resina).",
  });
  await request({
    company: "fundicao", title: "Cavaco de alumínio contaminado com óleo", category: "aluminio", hours: 18, status: "OPEN", at: monthsAgoDate(0, 1), invited: "Ana",
    briefing: "O cavaco sai misturado com óleo e de ligas diferentes, então vendemos como sucata barata. Queremos separar e secar para refundir aqui mesmo.",
    updates: [{ kind: "EVENT", body: "Ana Ribeiro foi convidado(a)", at: monthsAgoDate(0, 1) }],
  });
  await request({
    company: "moveis", title: "Sobras de MDF no corte de chapas", category: "madeira", hours: 16, status: "OPEN", at: monthsAgoDate(0, 4),
    briefing: "16% do MDF vira sobra e vai para o aterro. Queremos um plano de corte melhor e um destino para as sobras.",
  });

  /* ---------------- Notificações ---------------- */
  const h = 3600000;
  await db.notification.createMany({
    data: [
      { userId: ids.ipiranga.userId, title: "Estamparia Taboão propôs uma troca", body: "Bobina de aço 2,0 mm: 2.500 kg/mês", href: "/app/marketplace", createdAt: new Date(Date.now() - 3 * h) },
      { userId: ids.ipiranga.userId, title: "Alerta: perda de óleo solúvel fora do padrão", body: "35% neste mês contra 27% nos meses anteriores", href: "/app", createdAt: new Date(Date.now() - 1 * h) },
      { userId: ids.ipiranga.userId, title: "Nova mensagem de Marina Okada", body: "Pedi três orçamentos, entre R$ 18 e 26 mil…", href: "/app/demandas", createdAt: new Date(Date.now() - 22 * h) },
      { userId: ids.ipiranga.userId, title: "Lubrirrefino Diadema recusou sua proposta", body: "Óleo solúvel de corte", href: "/app/marketplace", createdAt: monthsAgoDate(2), readAt: monthsAgoDate(2) },
      { userId: ids.ipiranga.userId, title: "Demanda concluída", body: "Pallets descartados depois de uma viagem", href: "/app/demandas", createdAt: monthsAgoDate(5), readAt: monthsAgoDate(5) },
      { userId: eng.Carlos.userId, title: "Gabriel Nunes entregou uma demanda para revisão", body: "Sobremetal alto nas barras de aço 1045", href: "/eng/revisoes", createdAt: new Date(Date.now() - 2 * 24 * h) },
      { userId: eng.Ana.userId, title: "Fundição Mauá convidou você", body: "Cavaco de alumínio contaminado com óleo", href: "/eng", createdAt: new Date(Date.now() - 20 * h) },
      { userId: eng.Ana.userId, title: "Estamparia Taboão validou sua economia", body: "R$ 4.200/mês com o novo nesting", href: "/eng/perfil", createdAt: monthsAgoDate(3), readAt: monthsAgoDate(3) },
    ],
  });

  console.log(`Seed concluído: ${companies.length} empresas, ${engineers.length} engenheiros.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
