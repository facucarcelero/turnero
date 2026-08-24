import { NextResponse } from "next/server";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const professionalId = searchParams.get("professionalId");
  const serviceIdsParam = searchParams.get("serviceIds") ?? searchParams.get("serviceId");
  const date = searchParams.get("date");

  const serviceIds = serviceIdsParam?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  if (!professionalId || serviceIds.length === 0 || !date) {
    return NextResponse.json({ error: "Faltan parámetros." }, { status: 400 });
  }

  const slots = await getAvailableSlots(professionalId, serviceIds, date);
  return NextResponse.json({ slots });
}
