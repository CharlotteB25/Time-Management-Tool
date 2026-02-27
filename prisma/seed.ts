import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");

// match production connection behaviour
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding database...");

  // ----------------------------
  // Categories
  // ----------------------------
  const categories = [
    // =========================
    // BOEKHOUDING
    // =========================
    {
      role: Role.ACCOUNTING,
      name: "Inkomende betalingen verwerken",
      sortOrder: 1,
    },
    {
      role: Role.ACCOUNTING,
      name: "Uitgaande betalingen & leveranciers",
      sortOrder: 2,
    },
    {
      role: Role.ACCOUNTING,
      name: "Facturatie (verkoop & service)",
      sortOrder: 3,
    },
    { role: Role.ACCOUNTING, name: "Peppol & e-facturatie", sortOrder: 4 },
    {
      role: Role.ACCOUNTING,
      name: "Leningen & financieringsdossiers",
      sortOrder: 5,
    },
    { role: Role.ACCOUNTING, name: "Leasingadministratie", sortOrder: 6 },
    { role: Role.ACCOUNTING, name: "BTW & fiscale aangiftes", sortOrder: 7 },
    {
      role: Role.ACCOUNTING,
      name: "Boekhoudkundige controles & afsluitingen",
      sortOrder: 8,
    },
    { role: Role.ACCOUNTING, name: "Interne administratie", sortOrder: 9 },
    { role: Role.ACCOUNTING, name: "Overige taken", sortOrder: 10 },

    // =========================
    // RECEPTIE
    // =========================
    { role: Role.RECEPTION, name: "E-mails verwerken", sortOrder: 1 },
    { role: Role.RECEPTION, name: "Telefonie & klantontvangst", sortOrder: 2 },
    { role: Role.RECEPTION, name: "Werkplaatsplanning", sortOrder: 3 },
    { role: Role.RECEPTION, name: "Voorraadbeheer & onderdelen", sortOrder: 4 },
    { role: Role.RECEPTION, name: "Garantiedossiers", sortOrder: 5 },
    { role: Role.RECEPTION, name: "Terugroepacties (recalls)", sortOrder: 6 },
    { role: Role.RECEPTION, name: "Schadedossiers & expertises", sortOrder: 7 },
    {
      role: Role.RECEPTION,
      name: "Inschrijving & administratieve opvolging",
      sortOrder: 8,
    },
    { role: Role.RECEPTION, name: "Leverancierscontact", sortOrder: 9 },
    { role: Role.RECEPTION, name: "Overige taken", sortOrder: 10 },

    // =========================
    // VERKOOP
    // =========================
    { role: Role.SALES, name: "E-mails & digitale communicatie", sortOrder: 1 },
    {
      role: Role.SALES,
      name: "Klantenontvangst & showroomgesprekken",
      sortOrder: 2,
    },
    { role: Role.SALES, name: "Offertes & prijsberekeningen", sortOrder: 3 },
    { role: Role.SALES, name: "Leads opvolgen", sortOrder: 4 },
    { role: Role.SALES, name: "Telefonische prospectie", sortOrder: 5 },
    {
      role: Role.SALES,
      name: "Voertuigpresentaties & testritten",
      sortOrder: 6,
    },
    { role: Role.SALES, name: "Verkoopdossiers & contracten", sortOrder: 7 },
    { role: Role.SALES, name: "Voertuigafleveringen", sortOrder: 8 },
    { role: Role.SALES, name: "Showroombeheer", sortOrder: 9 },
    { role: Role.SALES, name: "Social media & marketingacties", sortOrder: 10 },
    { role: Role.SALES, name: "Stockbeheer & voertuigcontrole", sortOrder: 11 },
    { role: Role.SALES, name: "Overige taken", sortOrder: 12 },

    { role: Role.MANAGEMENT, name: "Emails", sortOrder: 1 },
    { role: Role.MANAGEMENT, name: "GM Garanties", sortOrder: 2 },
    { role: Role.MANAGEMENT, name: "Facturatie", sortOrder: 3 },
    {
      role: Role.MANAGEMENT,
      name: "Werkplaats Management / Fiches",
      sortOrder: 4,
    },
    { role: Role.MANAGEMENT, name: "DG", sortOrder: 5 },
    { role: Role.MANAGEMENT, name: "Magazijn / Onderdelen", sortOrder: 6 },
    { role: Role.MANAGEMENT, name: "Opvolging Sandra en Val", sortOrder: 7 },
    { role: Role.MANAGEMENT, name: "Bestek / Expertises", sortOrder: 8 },
    { role: Role.MANAGEMENT, name: "Overige taken", sortOrder: 9 },
  ];

  for (const c of categories) {
    await prisma.taskCategory.upsert({
      where: {
        role_name: {
          role: c.role,
          name: c.name,
        },
      },
      update: {
        sortOrder: c.sortOrder,
        isActive: true,
      },
      create: c,
    });
  }

  console.log("✅ Categories seeded");

  // ----------------------------
  // Users
  // ----------------------------
  const users = [
    {
      name: "Stephanie",
      email: "stephanie@leie-autos.be",
      role: Role.ACCOUNTING,
    },
    { name: "Mieke", email: "mieke@leie-autos.be", role: Role.ACCOUNTING },
    { name: "Valentin", email: "valentin@leie-autos.be", role: Role.RECEPTION },
    { name: "Sandra", email: "sandra@leie-autos.be", role: Role.RECEPTION },
    { name: "Oussama", email: "ossama@leie-autos.be", role: Role.SALES },
    { name: "Silvio", email: "silvio@leie-autos.be", role: Role.SALES },
    { name: "Christophe", email: "kristoff@leie-autos.be", role: Role.SALES },
    { name: "Filiep", email: "filiep@leie-autos.be", role: Role.SALES },
    { name: "Manon", email: "manon@leie-autos.be", role: Role.MANAGEMENT },
    { name: "Admin", email: "admin@leie-autos.be", role: Role.ADMIN },
  ];

  const tempPassword = "ChangeMe123!";
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        isActive: true,
      },
      create: {
        ...u,
        passwordHash,
      },
    });
  }

  console.log("✅ Users seeded");
  console.log("🔐 Temporary password for all users:", tempPassword);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
