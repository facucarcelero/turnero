import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get("professionalId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");

  if (!professionalId || !serviceId || !date) {
    return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  }

  const slots = await getAvailableSlots(professionalId, serviceId, date);
  return NextResponse.json({ slots });
}
