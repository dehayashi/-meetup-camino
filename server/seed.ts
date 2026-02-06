import { db } from "./db";
import { pilgrimProfiles, activities, activityParticipants, chatMessages, ratings } from "@shared/schema";
import { sql } from "drizzle-orm";

export async function seedDatabase() {
  try {
    const [existing] = await db.select({ count: sql<number>`count(*)::int` }).from(activities);
    if (existing.count > 0) return;

    const seedUserId1 = "seed-user-maria";
    const seedUserId2 = "seed-user-hans";
    const seedUserId3 = "seed-user-jean";
    const seedUserId4 = "seed-user-yuki";

    await db.insert(pilgrimProfiles).values([
      {
        userId: seedUserId1,
        displayName: "Maria Silva",
        language: "pt",
        nationality: "Brasil",
        bio: "Peregrina pela segunda vez. Adoro conhecer pessoas novas no Caminho!",
        travelStartDate: "2026-03-01",
        travelEndDate: "2026-04-15",
        cities: ["Porto", "Santiago de Compostela", "Sarria", "Le\u00f3n"],
        prefTransport: 4,
        prefMeals: 5,
        prefHiking: 3,
        prefLodging: 4,
      },
      {
        userId: seedUserId2,
        displayName: "Hans Mueller",
        language: "de",
        nationality: "Alemanha",
        bio: "Primeira viagem ao Caminho. Procurando companhia para dividir custos e experi\u00eancias.",
        travelStartDate: "2026-03-05",
        travelEndDate: "2026-04-10",
        cities: ["Saint-Jean-Pied-de-Port", "Pamplona", "Burgos", "Le\u00f3n", "Santiago de Compostela"],
        prefTransport: 3,
        prefMeals: 4,
        prefHiking: 5,
        prefLodging: 3,
      },
      {
        userId: seedUserId3,
        displayName: "Jean Dupont",
        language: "fr",
        nationality: "Fran\u00e7a",
        bio: "Peregrino experiente, j\u00e1 fiz o Caminho 3 vezes. Posso dar dicas!",
        travelStartDate: "2026-02-28",
        travelEndDate: "2026-04-01",
        cities: ["Saint-Jean-Pied-de-Port", "Pamplona", "Logro\u00f1o", "Burgos", "Le\u00f3n", "Santiago de Compostela"],
        prefTransport: 2,
        prefMeals: 5,
        prefHiking: 5,
        prefLodging: 2,
      },
      {
        userId: seedUserId4,
        displayName: "Yuki Tanaka",
        language: "ja",
        nationality: "Jap\u00e3o",
        bio: "Viajante solo em busca de paz e novas amizades.",
        travelStartDate: "2026-03-10",
        travelEndDate: "2026-04-20",
        cities: ["Porto", "Santiago de Compostela", "Fisterra"],
        prefTransport: 5,
        prefMeals: 4,
        prefHiking: 4,
        prefLodging: 5,
      },
    ]).onConflictDoNothing();

    const today = new Date();
    const fmt = (d: Date) => d.toISOString().split("T")[0];
    const addDays = (d: Date, n: number) => new Date(d.getTime() + n * 86400000);

    const [a1] = await db.insert(activities).values([
      {
        creatorId: seedUserId1,
        title: "Dividir t\u00e1xi Porto \u2192 Ponte de Lima",
        description: "Procurando 2-3 pessoas para dividir um t\u00e1xi de Porto at\u00e9 Ponte de Lima. Sa\u00edda \u00e0s 9h da esta\u00e7\u00e3o S\u00e3o Bento.",
        type: "transport",
        city: "Porto",
        date: fmt(addDays(today, 2)),
        time: "09:00",
        spots: 4,
        lat: 41.1457,
        lng: -8.6105,
      },
    ]).returning();

    const [a2] = await db.insert(activities).values([
      {
        creatorId: seedUserId2,
        title: "Jantar em grupo em Pamplona",
        description: "Reservei mesa em um restaurante t\u00edpico basco. Quem topa?",
        type: "meal",
        city: "Pamplona",
        date: fmt(addDays(today, 3)),
        time: "20:00",
        spots: 6,
        lat: 42.8125,
        lng: -1.6458,
      },
    ]).returning();

    const [a3] = await db.insert(activities).values([
      {
        creatorId: seedUserId3,
        title: "Caminhada Le\u00f3n \u2192 Astorga",
        description: "Etapa cl\u00e1ssica de 50km. Vamos fazer em 2 dias com pernoite em Hospital de \u00d3rbigo.",
        type: "hike",
        city: "Le\u00f3n",
        date: fmt(addDays(today, 5)),
        time: "07:00",
        spots: 5,
        lat: 42.5987,
        lng: -5.5671,
      },
    ]).returning();

    const [a4] = await db.insert(activities).values([
      {
        creatorId: seedUserId4,
        title: "Albergue compartilhado em Santiago",
        description: "Encontrei um albergue com quartos privados por bom pre\u00e7o. Vamos dividir?",
        type: "lodging",
        city: "Santiago de Compostela",
        date: fmt(addDays(today, 10)),
        spots: 3,
        lat: 42.8782,
        lng: -8.5448,
      },
    ]).returning();

    const [a5] = await db.insert(activities).values([
      {
        creatorId: seedUserId1,
        title: "Caf\u00e9 da manh\u00e3 em Sarria",
        description: "Vamos tomar um bom caf\u00e9 antes de come\u00e7ar a \u00faltima etapa at\u00e9 Santiago!",
        type: "meal",
        city: "Sarria",
        date: fmt(addDays(today, 7)),
        time: "07:30",
        spots: 4,
        lat: 42.7799,
        lng: -7.4148,
      },
    ]).returning();

    await db.insert(activityParticipants).values([
      { activityId: a1.id, userId: seedUserId2 },
      { activityId: a2.id, userId: seedUserId1 },
      { activityId: a2.id, userId: seedUserId3 },
      { activityId: a3.id, userId: seedUserId1 },
      { activityId: a3.id, userId: seedUserId2 },
      { activityId: a5.id, userId: seedUserId4 },
    ]).onConflictDoNothing();

    await db.insert(chatMessages).values([
      { activityId: a1.id, userId: seedUserId1, content: "Ol\u00e1! Algu\u00e9m mais quer dividir o t\u00e1xi?" },
      { activityId: a1.id, userId: seedUserId2, content: "Eu quero! Estou no hostel perto da esta\u00e7\u00e3o." },
      { activityId: a2.id, userId: seedUserId2, content: "O restaurante se chama Casa Otano, algu\u00e9m conhece?" },
      { activityId: a2.id, userId: seedUserId3, content: "Conhe\u00e7o! \u00c9 excelente, recomendo o cordero." },
      { activityId: a3.id, userId: seedUserId3, content: "Vou levar snacks extras para o caminho." },
    ]).onConflictDoNothing();

    await db.insert(ratings).values([
      { activityId: a2.id, userId: seedUserId1, score: 5, comment: "Jantar incr\u00edvel, \u00f3tima companhia!" },
      { activityId: a3.id, userId: seedUserId1, score: 4, comment: "Caminhada desafiadora mas maravilhosa." },
    ]).onConflictDoNothing();

    console.log("Seed data inserted successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
