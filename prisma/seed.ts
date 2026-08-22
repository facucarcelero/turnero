import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function main() {
  console.log("Sembrando base de datos...");

  await prisma.clinic.deleteMany();
  await prisma.clinic.create({
    data: {
      name: "Clínica Vitalis",
      tagline: "Ginecología y Obstetricia",
      primaryColor: "#0d9488",
      address: "Av. Siempre Viva 1234, Ciudad",
      phone: "+54 9 11 1234-5678",
      whatsapp: "5491112345678",
      email: "contacto@clinicavitalis.com",
      instagram: "@clinicavitalis",
      slotDurationMin: 15,
      minNoticeHours: 2,
      maxAdvanceDays: 60,
      allowCancelation: true,
      cancelNoticeHours: 24,
      currency: "ARS",
      welcomeMessage:
        "Reservá tu turno online en simples pasos, las 24 horas del día.",
    },
  });

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  await prisma.adminUser.deleteMany();
  await prisma.adminUser.create({
    data: {
      name: "Administradora",
      email: "admin@clinica.com",
      passwordHash: adminPassword,
      role: "OWNER",
    },
  });

  await prisma.appointment.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.service.deleteMany();
  await prisma.professional.deleteMany();

  const dra = await prisma.professional.create({
    data: {
      name: "Dra. Ana Gómez",
      specialty: "Ginecología y Obstetricia",
      bio: "Médica especialista en salud de la mujer, con más de 15 años de experiencia.",
      color: "#0d9488",
      order: 0,
    },
  });

  const servicesData = [
    { name: "Primera consulta", durationMin: 45, price: 25000, color: "#0d9488" },
    { name: "Consulta ginecológica", durationMin: 30, price: 20000, color: "#0891b2" },
    { name: "Control de embarazo", durationMin: 30, price: 20000, color: "#7c3aed" },
    { name: "Papanicolaou (PAP)", durationMin: 20, price: 15000, color: "#db2777" },
    { name: "Ecografía ginecológica", durationMin: 30, price: 22000, color: "#2563eb" },
    { name: "Colocación de DIU", durationMin: 45, price: 30000, color: "#ea580c" },
  ];

  const services = [];
  for (const [i, s] of servicesData.entries()) {
    const service = await prisma.service.create({
      data: {
        ...s,
        order: i,
        professionals: { connect: [{ id: dra.id }] },
      },
    });
    services.push(service);
  }

  const workingHoursData = [
    { weekday: 1, startTime: "09:00", endTime: "13:00" },
    { weekday: 1, startTime: "15:00", endTime: "19:00" },
    { weekday: 2, startTime: "09:00", endTime: "13:00" },
    { weekday: 2, startTime: "15:00", endTime: "19:00" },
    { weekday: 3, startTime: "09:00", endTime: "13:00" },
    { weekday: 4, startTime: "09:00", endTime: "13:00" },
    { weekday: 4, startTime: "15:00", endTime: "19:00" },
    { weekday: 5, startTime: "09:00", endTime: "13:00" },
    { weekday: 6, startTime: "09:00", endTime: "12:00" },
  ];

  for (const wh of workingHoursData) {
    await prisma.workingHour.create({
      data: { ...wh, professionalId: dra.id },
    });
  }

  const patientsData = [
    { firstName: "María", lastName: "López", phone: "5491122334455", dni: "30111222", email: "maria.lopez@mail.com" },
    { firstName: "Julieta", lastName: "Fernández", phone: "5491133445566", dni: "28222333", email: "julieta.f@mail.com" },
    { firstName: "Carla", lastName: "Rodríguez", phone: "5491144556677", dni: "35333444", email: "carla.r@mail.com" },
  ];

  const patients = [];
  for (const p of patientsData) {
    patients.push(await prisma.patient.create({ data: p }));
  }

  const today = new Date();
  const dates = [0, 0, 1, 2, -1].map((offset) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offset);
    return toDateStr(d);
  });

  const demoAppointments = [
    { date: dates[0], startTime: "09:00", endTime: "09:45", service: services[0], patient: patients[0], status: "CONFIRMED" as const },
    { date: dates[1], startTime: "10:00", endTime: "10:30", service: services[1], patient: patients[1], status: "PENDING" as const },
    { date: dates[2], startTime: "15:30", endTime: "16:00", service: services[2], patient: patients[2], status: "CONFIRMED" as const },
    { date: dates[3], startTime: "11:00", endTime: "11:30", service: services[3], patient: patients[0], status: "PENDING" as const },
    { date: dates[4], startTime: "09:30", endTime: "10:00", service: services[1], patient: patients[1], status: "COMPLETED" as const },
  ];

  for (const a of demoAppointments) {
    await prisma.appointment.create({
      data: {
        date: a.date,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        source: "ONLINE",
        serviceId: a.service.id,
        patientId: a.patient.id,
        professionalId: dra.id,
      },
    });
  }

  console.log("Listo. Usuario admin: admin@clinica.com / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
