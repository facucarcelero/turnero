"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Radar, Percent, HeartHandshake } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { ConfirmButton } from "@/components/ui/confirm-button";
import { formatCurrency } from "@/lib/utils";
import {
  updateInsuranceProviderConnectorKey,
  upsertCopayRule,
  deleteCopayRule,
  upsertProviderAgreement,
  deleteProviderAgreement,
} from "@/lib/actions/coverage";
import type { CoverageConnectorStatus, ProviderAgreementStatus } from "@prisma/client";

type ProviderRow = { id: string; name: string; connectorKey: string | null };
type NameRow = { id: string; name: string };
type ConnectorRow = { key: string; label: string; connectorStatus: CoverageConnectorStatus };
type CopayRuleRow = {
  id: string;
  insuranceProviderId: string;
  insuranceProviderName: string;
  professionalId: string | null;
  professionalName: string | null;
  serviceId: string | null;
  serviceName: string | null;
  planName: string | null;
  copaymentAmount: string;
  active: boolean;
};
type ProviderAgreementRow = {
  id: string;
  professionalId: string;
  professionalName: string;
  insuranceProviderId: string;
  insuranceProviderName: string;
  status: ProviderAgreementStatus;
  rnpCode: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
};

const AGREEMENT_STATUS_LABEL: Record<ProviderAgreementStatus, string> = {
  ACTIVE: "Vigente",
  PENDING: "Pendiente",
  SUSPENDED: "Suspendido",
  TERMINATED: "Terminado",
  UNKNOWN: "Desconocido",
};

// NOT_AVAILABLE nunca se muestra como "activo"/verde: siempre amarillo,
// "verificación no disponible" (regla dura #3 del motor de cobertura).
const CONNECTOR_STATUS_BADGE: Record<CoverageConnectorStatus, { label: string; color: "amber" | "green" | "red" }> = {
  NOT_AVAILABLE: { label: "🟡 Verificación no disponible — manual", color: "amber" },
  AVAILABLE: { label: "🟢 Disponible", color: "green" },
  DEGRADED: { label: "🟠 Degradado", color: "red" },
};

export function CoberturasClient({
  providers,
  professionals,
  services,
  connectors,
  copayRules,
  providerAgreements,
}: {
  providers: ProviderRow[];
  professionals: NameRow[];
  services: NameRow[];
  connectors: ConnectorRow[];
  copayRules: CopayRuleRow[];
  providerAgreements: ProviderAgreementRow[];
}) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Coberturas</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Estado de las integraciones de verificación, reglas de coseguro y convenios por profesional. La verificación
          automática hoy no está disponible para ninguna cobertura: todo turno se sigue confirmando manualmente.
        </p>
      </div>

      <ConnectorsSection providers={providers} connectors={connectors} />
      <CopayRulesSection copayRules={copayRules} providers={providers} professionals={professionals} services={services} />
      <ProviderAgreementsSection agreements={providerAgreements} professionals={professionals} providers={providers} />
    </div>
  );
}

function ConnectorsSection({ providers, connectors }: { providers: ProviderRow[]; connectors: ConnectorRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function connectorFor(key: string | null) {
    return connectors.find((c) => c.key === key) ?? connectors.find((c) => c.key === "DEFAULT")!;
  }

  function updateKey(providerId: string, connectorKey: string) {
    setPendingId(providerId);
    startTransition(async () => {
      const res = await updateInsuranceProviderConnectorKey(providerId, connectorKey || null);
      setPendingId(null);
      if (res.error) toast.error(res.error);
    });
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Radar className="size-4 text-[var(--brand)]" /> Estado de integraciones
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Ningún organismo (SSSalud, PAMI, IOMA, prepagas) publica hoy una API oficial para verificar cobertura por
          software. Ver COVERAGE_ENGINE.md.
        </p>
      </CardHeader>
      <CardBody className="p-0">
        {providers.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No hay obras sociales cargadas todavía. Cargalas primero en &quot;Obras sociales&quot;.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {providers.map((p) => {
              const connector = connectorFor(p.connectorKey);
              const badge = CONNECTOR_STATUS_BADGE[connector.connectorStatus];
              return (
                <li key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 flex-wrap">
                  <p className="text-sm font-medium text-slate-900 min-w-0 flex-1">{p.name}</p>
                  <Select
                    className="w-auto max-w-[220px]"
                    value={p.connectorKey ?? ""}
                    disabled={pendingId === p.id}
                    onChange={(e) => updateKey(p.id, e.target.value)}
                  >
                    <option value="">Sin conector asignado</option>
                    {connectors
                      .filter((c) => c.key !== "DEFAULT")
                      .map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.label}
                        </option>
                      ))}
                  </Select>
                  <Badge color={badge.color}>{badge.label}</Badge>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function CopayRulesSection({
  copayRules,
  providers,
  professionals,
  services,
}: {
  copayRules: CopayRuleRow[];
  providers: ProviderRow[];
  professionals: NameRow[];
  services: NameRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CopayRuleRow | undefined>(undefined);
  const [insuranceProviderId, setInsuranceProviderId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [planName, setPlanName] = useState("");
  const [amount, setAmount] = useState("");
  const [active, setActive] = useState(true);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(undefined);
    setInsuranceProviderId(providers[0]?.id ?? "");
    setProfessionalId("");
    setServiceId("");
    setPlanName("");
    setAmount("");
    setActive(true);
    setNotes("");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(r: CopayRuleRow) {
    setEditing(r);
    setInsuranceProviderId(r.insuranceProviderId);
    setProfessionalId(r.professionalId ?? "");
    setServiceId(r.serviceId ?? "");
    setPlanName(r.planName ?? "");
    setAmount(r.copaymentAmount);
    setActive(r.active);
    setNotes("");
    setError(null);
    setModalOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertCopayRule({
        id: editing?.id,
        insuranceProviderId,
        professionalId: professionalId || null,
        serviceId: serviceId || null,
        planName: planName.trim() || null,
        copaymentAmount: amount,
        active,
        notes: notes.trim() || null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(editing ? "Regla de coseguro actualizada" : "Regla de coseguro creada");
      setModalOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Percent className="size-4 text-[var(--brand)]" /> Reglas de coseguro
        </h2>
        <Button size="sm" onClick={openNew} disabled={providers.length === 0}>
          <Plus className="size-4" /> Nueva
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        {copayRules.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Sin reglas todavía. Sin ninguna regla, se usa el coseguro habitual cargado en cada obra social.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {copayRules.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {r.insuranceProviderName}
                    {r.professionalName && <span className="text-slate-400"> · {r.professionalName}</span>}
                    {r.serviceName && <span className="text-slate-400"> · {r.serviceName}</span>}
                  </p>
                  {r.planName && <p className="text-xs text-slate-400 mt-0.5">Plan: {r.planName}</p>}
                </div>
                <span className="text-sm font-medium text-slate-700">{formatCurrency(Number(r.copaymentAmount))}</span>
                {!r.active && <Badge color="slate">Inactiva</Badge>}
                <button
                  onClick={() => openEdit(r)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton action={() => deleteCopayRule(r.id)} successText="Regla eliminada" />
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar regla de coseguro" : "Nueva regla de coseguro"} size="sm">
        <div className="space-y-4">
          <div>
            <Label>Obra social</Label>
            <Select value={insuranceProviderId} onChange={(e) => setInsuranceProviderId(e.target.value)}>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Profesional (opcional)</Label>
              <Select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
                <option value="">Todos</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Servicio (opcional)</Label>
              <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Todos</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Plan (opcional)</Label>
            <Input placeholder="Ej: OSDE 210" value={planName} onChange={(e) => setPlanName(e.target.value)} />
          </div>
          <div>
            <Label>Monto del coseguro ($)</Label>
            <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="size-4 rounded border-slate-300 text-[var(--brand)] focus:ring-[var(--brand)]/30"
            />
            Activa
          </label>
          <FieldError>{error}</FieldError>
          <Button className="w-full" loading={pending} onClick={submit}>
            Guardar
          </Button>
        </div>
      </Modal>
    </Card>
  );
}

function ProviderAgreementsSection({
  agreements,
  professionals,
  providers,
}: {
  agreements: ProviderAgreementRow[];
  professionals: NameRow[];
  providers: ProviderRow[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderAgreementRow | undefined>(undefined);
  const [professionalId, setProfessionalId] = useState("");
  const [insuranceProviderId, setInsuranceProviderId] = useState("");
  const [status, setStatus] = useState<ProviderAgreementStatus>("UNKNOWN");
  const [rnpCode, setRnpCode] = useState("");
  const [effectiveFrom, setEffectiveFrom] = useState("");
  const [effectiveTo, setEffectiveTo] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openNew() {
    setEditing(undefined);
    setProfessionalId(professionals[0]?.id ?? "");
    setInsuranceProviderId(providers[0]?.id ?? "");
    setStatus("UNKNOWN");
    setRnpCode("");
    setEffectiveFrom("");
    setEffectiveTo("");
    setNotes("");
    setError(null);
    setModalOpen(true);
  }

  function openEdit(a: ProviderAgreementRow) {
    setEditing(a);
    setProfessionalId(a.professionalId);
    setInsuranceProviderId(a.insuranceProviderId);
    setStatus(a.status);
    setRnpCode(a.rnpCode ?? "");
    setEffectiveFrom(a.effectiveFrom ?? "");
    setEffectiveTo(a.effectiveTo ?? "");
    setNotes("");
    setError(null);
    setModalOpen(true);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await upsertProviderAgreement({
        id: editing?.id,
        professionalId,
        insuranceProviderId,
        status,
        rnpCode: rnpCode.trim() || null,
        effectiveFrom: effectiveFrom || null,
        effectiveTo: effectiveTo || null,
        notes: notes.trim() || null,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success(editing ? "Convenio actualizado" : "Convenio creado");
      setModalOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <HeartHandshake className="size-4 text-[var(--brand)]" /> Convenios por profesional
        </h2>
        <Button size="sm" onClick={openNew} disabled={professionals.length === 0 || providers.length === 0}>
          <Plus className="size-4" /> Nuevo
        </Button>
      </CardHeader>
      <CardBody className="p-0">
        {agreements.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Sin convenios cargados. Esto es independiente de qué coberturas acepta un profesional en el wizard de
            reserva.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {agreements.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {a.professionalName} <span className="text-slate-400">· {a.insuranceProviderName}</span>
                  </p>
                  {a.rnpCode && <p className="text-xs text-slate-400 mt-0.5">RNP: {a.rnpCode}</p>}
                </div>
                <Badge color={a.status === "ACTIVE" ? "green" : a.status === "TERMINATED" || a.status === "SUSPENDED" ? "red" : "slate"}>
                  {AGREEMENT_STATUS_LABEL[a.status]}
                </Badge>
                <button
                  onClick={() => openEdit(a)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  title="Editar"
                >
                  <Pencil className="size-4" />
                </button>
                <ConfirmButton action={() => deleteProviderAgreement(a.id)} successText="Convenio eliminado" />
              </li>
            ))}
          </ul>
        )}
      </CardBody>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar convenio" : "Nuevo convenio"} size="sm">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Profesional</Label>
              <Select value={professionalId} onChange={(e) => setProfessionalId(e.target.value)}>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Obra social</Label>
              <Select value={insuranceProviderId} onChange={(e) => setInsuranceProviderId(e.target.value)}>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
          <div>
            <Label>Estado del convenio</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProviderAgreementStatus)}>
              {Object.entries(AGREEMENT_STATUS_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Código RNP (opcional)</Label>
            <Input value={rnpCode} onChange={(e) => setRnpCode(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Vigente desde (opcional)</Label>
              <Input type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </div>
            <div>
              <Label>Vigente hasta (opcional)</Label>
              <Input type="date" value={effectiveTo} onChange={(e) => setEffectiveTo(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <FieldError>{error}</FieldError>
          <Button className="w-full" loading={pending} onClick={submit}>
            Guardar
          </Button>
        </div>
      </Modal>
    </Card>
  );
}
