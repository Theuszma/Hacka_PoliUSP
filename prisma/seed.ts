/**
 * Dados de exemplo da rede piloto no ABC Paulista.
 * Todas as empresas, pessoas e números são fictícios.
 */
import { PrismaClient } from "@prisma/client";
import { flowMetrics } from "../src/lib/metrics";

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
    key: "ipiranga", name: "Metalúrgica Ipiranga", initials: "MI", sector: "Estamparia e pintura de peças metálicas",
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
    key: "rudge", name: "Ferragens Rudge Ramos", initials: "FR", sector: "Arruelas, calços e ferragens", size: "Micro", employees: 14,
    city: "São Bernardo do Campo", lat: -23.661, lng: -46.572, contact: { name: "Jorge Batista", email: "jorge@rudge.demo" },
    flows: [
      { name: "Óleo de estampagem", category: "fluido", unit: "L", monthlyQty: 200, unitCost: 16, lossRate: 0.4, destination: "classe1", destinationValue: -2.5, supplier: "Química ABC" },
    ],
    inputs: [
      { category: "aco", description: "Retalhos de chapa maiores que 100 mm", use: "Estampa arruelas e calços a partir dos retalhos", pricePaid: 3.4, virginPrice: 7.2, capacity: 5000, substitution: 0.9 },
    ],
  },
  {
    key: "lubri", name: "Lubrirrefino Diadema", initials: "LD", sector: "Rerrefino de óleos (licença ANP)", size: "Média", employees: 120,
    city: "Diadema", lat: -23.6862, lng: -46.6228, contact: { name: "Sônia Prado", email: "sonia@lubri.demo" },
    flows: [],
    inputs: [
      { category: "fluido", description: "Óleos e fluidos de corte usados", use: "Rerrefino: o óleo volta como base lubrificante", pricePaid: -0.8, virginPrice: 9, capacity: 4000, substitution: 0.7, licensed: true },
    ],
  },
  {
    key: "gerty", name: "Marcenaria Escola Vila Gerty", initials: "VG", sector: "Cooperativa de marcenaria", size: "Micro", employees: 9,
    city: "São Caetano do Sul", lat: -23.6229, lng: -46.5548, contact: { name: "Elaine Costa", email: "elaine@gerty.demo" },
    flows: [],
    inputs: [
      { category: "madeira", description: "Pallets e madeira de embalagem", use: "Transforma pallets em móveis; coleta semanal gratuita", pricePaid: 0, virginPrice: 3.2, capacity: 2500, substitution: 0.8 },
    ],
  },
  {
    key: "reciclape", name: "Recicla PE Mauá", initials: "RP", sector: "Reciclagem de plásticos", size: "Pequena", employees: 31,
    city: "Mauá", lat: -23.6677, lng: -46.4613, contact: { name: "Diego Nunes", email: "diego@reciclape.demo" },
    flows: [],
    inputs: [
      { category: "plastico", description: "Filme e sacaria de PEBD", use: "Transforma em pellets de PEBD reciclado", pricePaid: 0.9, virginPrice: 8.5, capacity: 6000, substitution: 0.75 },
    ],
  },
  {
    key: "taboao", name: "Estamparia Taboão", initials: "ET", sector: "Estamparia automotiva", size: "Média", employees: 145,
    city: "São Bernardo do Campo", lat: -23.712, lng: -46.59, contact: { name: "Paulo Ramos", email: "paulo@taboao.demo" },
    flows: [
      { name: "Bobina de aço 2,0 mm", category: "aco", unit: "kg", monthlyQty: 25000, unitCost: 7.0, lossRate: 0.15, destination: "sucata", destinationValue: 1.1, supplier: "Usina via distribuidor" },
      { name: "Papelão de embalagem", category: "papelao", unit: "kg", monthlyQty: 900, unitCost: 4.5, lossRate: 0.7, destination: "reciclagem", destinationValue: 0.4 },
    ],
    inputs: [],
  },
  {
    key: "autopecas", name: "Autopeças Santo André", initials: "AS", sector: "Usinagem de peças automotivas", size: "Pequena", employees: 62,
    city: "Santo André", lat: -23.6639, lng: -46.5383, contact: { name: "Marcos Lima", email: "marcos@autopecas.demo" },
    flows: [
      { name: "Pallets PBR", category: "madeira", unit: "kg", monthlyQty: 3000, unitCost: 2.8, lossRate: 0.5, destination: "aterro", destinationValue: -0.35 },
      { name: "Fluido de usinagem", category: "fluido", unit: "L", monthlyQty: 1200, unitCost: 17, lossRate: 0.3, destination: "classe1", destinationValue: -2.5, leverText: "Monitorar concentração e pH e instalar separador de óleo sujo", leverReduction: 0.45 },
      { name: "Filme stretch", category: "plastico", unit: "kg", monthlyQty: 500, unitCost: 12, lossRate: 0.85, destination: "aterro", destinationValue: -0.35 },
    ],
    inputs: [],
  },
  {
    key: "confeccoes", name: "Confecções Bom Retiro", initials: "CB", sector: "Confecção de roupas", size: "Pequena", employees: 47,
    city: "São Paulo", lat: -23.5269, lng: -46.6407, contact: { name: "Hana Kim", email: "hana@confeccoes.demo" },
    flows: [
      { name: "Tecido de algodão", category: "textil", unit: "kg", monthlyQty: 6000, unitCost: 32, lossRate: 0.2, destination: "aterro", destinationValue: -0.3, leverText: "Encaixe digital de moldes e reaproveitamento de retalhos", leverReduction: 0.3 },
    ],
    inputs: [],
  },
  {
    key: "plasticos", name: "Plásticos Diadema", initials: "PD", sector: "Injeção de peças plásticas", size: "Pequena", employees: 55,
    city: "Diadema", lat: -23.695, lng: -46.61, contact: { name: "Ricardo Sato", email: "ricardo@plasticos.demo" },
    flows: [
      { name: "Resina PP", category: "plastico", unit: "kg", monthlyQty: 20000, unitCost: 9.5, lossRate: 0.08, destination: "reuso", destinationValue: 0, leverText: "Ajustar parâmetros de injeção e manutenção preventiva dos moldes", leverReduction: 0.4 },
    ],
    inputs: [
      { category: "plastico", description: "Aparas limpas de PE e PP", use: "Mistura até 20% de reciclado em peças não estruturais", pricePaid: 1.2, virginPrice: 8.5, capacity: 1500, substitution: 0.8 },
    ],
  },
  {
    key: "panificadora", name: "Panificadora Industrial Santo André", initials: "PS", sector: "Pães e massas", size: "Pequena", employees: 70,
    city: "Santo André", lat: -23.6553, lng: -46.53, contact: { name: "Luiza Mendes", email: "luiza@panificadora.demo" },
    flows: [
      { name: "Farinha de trigo", category: "organico", unit: "kg", monthlyQty: 30000, unitCost: 3.1, lossRate: 0.06, destination: "aterro", destinationValue: -0.2 },
    ],
    inputs: [],
  },
  {
    key: "composta", name: "Composta ABC", initials: "CA", sector: "Compostagem e biogás", size: "Micro", employees: 12,
    city: "Mauá", lat: -23.6845, lng: -46.448, contact: { name: "Tiago Freitas", email: "tiago@composta.demo" },
    flows: [],
    inputs: [
      { category: "organico", description: "Resíduos orgânicos de indústria de alimentos", use: "Compostagem e biogás", pricePaid: 0, virginPrice: 0.4, capacity: 20000, substitution: 0.3 },
    ],
  },
];

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
];

async function main() {
  await db.requestUpdate.deleteMany();
  await db.supportRequest.deleteMany();
  await db.exchange.deleteMany();
  await db.inputDemand.deleteMany();
  await db.materialFlow.deleteMany();
  await db.engineer.deleteMany();
  await db.user.deleteMany();
  await db.company.deleteMany();

  const ids: Record<string, { id: string; userId: string; flows: Record<string, string>; inputs: Record<string, string> }> = {};
  for (const c of companies) {
    const company = await db.company.create({
      data: { name: c.name, initials: c.initials, sector: c.sector, size: c.size, employees: c.employees, city: c.city, lat: c.lat, lng: c.lng },
    });
    const user = await db.user.create({ data: { name: c.contact.name, email: c.contact.email, role: "COMPANY", companyId: company.id } });
    const flows: Record<string, string> = {};
    for (const f of c.flows) flows[f.category] = (await db.materialFlow.create({ data: { ...f, companyId: company.id } })).id;
    const inputs: Record<string, string> = {};
    for (const d of c.inputs) inputs[d.category] = (await db.inputDemand.create({ data: { ...d, licensed: d.licensed ?? false, companyId: company.id } })).id;
    ids[c.key] = { id: company.id, userId: user.id, flows, inputs };
  }

  const eng: Record<string, string> = {};
  for (const e of engineers) {
    const { name, email, lat, lng, ...profile } = e as typeof e & { lat?: number; lng?: number };
    const user = await db.user.create({ data: { name, email, role: "ENGINEER" } });
    const created = await db.engineer.create({
      data: { ...profile, userId: user.id, lat: lat ?? -23.5613, lng: lng ?? -46.7307 }, // padrão: Cidade Universitária
    });
    eng[name.split(" ")[0]] = created.id;
  }

  // Trocas de resíduo já em andamento na rede
  await db.exchange.create({ data: { flowId: ids.autopecas.flows.madeira, demandId: ids.gerty.inputs.madeira, fromId: ids.autopecas.id, initiatorId: ids.autopecas.id, toId: ids.gerty.id, quantity: 1500, price: 0, status: "ACCEPTED" } });
  await db.exchange.create({ data: { flowId: ids.taboao.flows.aco, demandId: ids.rudge.inputs.aco, fromId: ids.taboao.id, initiatorId: ids.taboao.id, toId: ids.rudge.id, quantity: 3750, price: 3.4, status: "ACCEPTED" } });
  await db.exchange.create({ data: { flowId: ids.autopecas.flows.plastico, demandId: ids.reciclape.inputs.plastico, fromId: ids.autopecas.id, initiatorId: ids.autopecas.id, toId: ids.reciclape.id, quantity: 425, price: 0.9, status: "ACCEPTED" } });
  // Proposta recebida pela Metalúrgica Ipiranga (aparece na caixa de entrada dela)
  await db.exchange.create({ data: { flowId: ids.taboao.flows.aco, demandId: ids.ipiranga.inputs.aco, fromId: ids.taboao.id, initiatorId: ids.taboao.id, toId: ids.ipiranga.id, quantity: 2500, price: 4.3, status: "PROPOSED" } });

  const lossOf = async (companyKey: string, cat: string) => {
    const flow = await db.materialFlow.findUniqueOrThrow({ where: { id: ids[companyKey].flows[cat] } });
    return flowMetrics(flow).loss;
  };
  const day = 86400000;

  await db.supportRequest.create({
    data: {
      companyId: ids.confeccoes.id, title: "Retalho de tecido: 1,2 t/mês indo para aterro", category: "textil", estimatedHours: 16,
      monthlyLoss: await lossOf("confeccoes", "textil"), createdAt: new Date(Date.now() - 2 * day),
      briefing: "Perdemos 20% do tecido de algodão no corte. Queremos avaliar encaixe digital de moldes e alguém que compre os retalhos.",
      updates: { create: [{ kind: "EVENT", body: "Demanda publicada na rede", createdAt: new Date(Date.now() - 2 * day) }] },
    },
  });
  await db.supportRequest.create({
    data: {
      companyId: ids.plasticos.id, title: "Refugo de injeção em 8% das peças", category: "plastico", estimatedHours: 20,
      monthlyLoss: await lossOf("plasticos", "plastico"), createdAt: new Date(Date.now() - 5 * day),
      briefing: "O refugo é moído e reaproveitado, mas perde propriedades. Queremos achar a causa (parâmetros, molde ou umidade da resina).",
      updates: { create: [{ kind: "EVENT", body: "Demanda publicada na rede", createdAt: new Date(Date.now() - 5 * day) }] },
    },
  });
  const juliaUser = await db.user.findUniqueOrThrow({ where: { email: "julia@poli.demo" } });
  await db.supportRequest.create({
    data: {
      companyId: ids.autopecas.id, title: "Fluido de usinagem trocado a cada 3 semanas", category: "fluido", estimatedHours: 14, status: "IN_PROGRESS",
      monthlyLoss: await lossOf("autopecas", "fluido"), assigneeId: eng["Júlia"], createdAt: new Date(Date.now() - 9 * day),
      briefing: "O fluido apodrece rápido e o descarte Classe I custa caro. Precisamos de um plano de controle.",
      updates: {
        create: [
          { kind: "EVENT", body: "Demanda publicada na rede", createdAt: new Date(Date.now() - 9 * day) },
          { kind: "EVENT", body: "Júlia Tanaka assumiu a demanda", createdAt: new Date(Date.now() - 8 * day) },
          { kind: "MESSAGE", authorId: juliaUser.id, body: "Medi concentração e pH nas 4 máquinas. Duas estão com concentração abaixo de 3%, o que favorece bactérias. Proponho refratômetro diário e um skimmer para óleo sujo.", createdAt: new Date(Date.now() - 3 * day) },
          { kind: "MESSAGE", authorId: ids.autopecas.userId, body: "Ótimo. Já compramos o refratômetro, começa segunda.", createdAt: new Date(Date.now() - 2 * day) },
        ],
      },
    },
  });
  await db.supportRequest.create({
    data: {
      companyId: ids.panificadora.id, title: "Sobras de massa e farinha vencida", category: "organico", estimatedHours: 12, status: "DONE",
      monthlyLoss: await lossOf("panificadora", "organico"), assigneeId: eng["Pedro"], createdAt: new Date(Date.now() - 40 * day),
      outcome: "Ajuste no planejamento de produção por dia da semana e envio das sobras para a Composta ABC.", savedPerMonth: 3100,
      briefing: "6% da farinha vira sobra. Queremos reduzir e dar um destino melhor que o aterro.",
      updates: {
        create: [
          { kind: "EVENT", body: "Demanda publicada na rede", createdAt: new Date(Date.now() - 40 * day) },
          { kind: "EVENT", body: "Pedro Alves assumiu a demanda", createdAt: new Date(Date.now() - 39 * day) },
          { kind: "EVENT", body: "Demanda concluída · economia validada de R$ 3.100/mês", createdAt: new Date(Date.now() - 12 * day) },
        ],
      },
    },
  });

  console.log(`Seed concluído: ${companies.length} empresas, ${engineers.length} engenheiros.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
