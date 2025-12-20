"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { collection, doc, limit, onSnapshot, query, where } from "firebase/firestore";

import type { CctCap } from "../../app/lib/cct/caps.catalog";
import { CCT_CAPS_CATALOG } from "../../app/lib/cct/caps.catalog";
import { useCct } from "../../app/providers/CctClientProvider";
import { useAuthContext } from "../components/AuthenticationComp/AuthContext";
import { FbDB } from "../../app/lib/services/firebase";

// UIs (internos del core)
import AdminPanel from "../factory/AdminPanel";
import FUIPanel from "../factory/FuiPanel";

import CampaignsCenter from "./CampaignCenter";
import MetaTab from "./MetaTab";
import FMsTab from "./FMsTab";
import EnvWizard from "./EnvWizard";
import PaymentsAdmin from "./PaymentsAdmin";
import Settings from "./Setting";
import StylesTab from "./StylesTab";
import FDVTest from "./fdv";

import StyleDesigner from "../components/StyleDesigner/StyleDesigner";
import ControlAccessRoles from "../components/ControlAccessRoles/ControlAccessRoles";

type CarState = {
  loading: boolean;
  roleId: string | null;
  roleCaps: Record<string, boolean>;
};

function capLabel(cap: CctCap): string {
  return CCT_CAPS_CATALOG.find((c) => c.key === cap)?.labelKey ?? cap;
}

function useCar(): CarState {
  const { user } = useAuthContext();
  const [state, setState] = useState<CarState>({
    loading: true,
    roleId: null,
    roleCaps: {},
  });

  useEffect(() => {
    const emailLower = (user?.email || "").trim().toLowerCase();
    if (!emailLower) {
      setState({ loading: false, roleId: null, roleCaps: {} });
      return;
    }

    const q = query(
      collection(FbDB, "Providers", "CAR", "Users"),
      where("emailLower", "==", emailLower),
      limit(1),
    );

    let unsubRole: (() => void) | null = null;

    const unsubUser = onSnapshot(
      q,
      (snap) => {
        if (unsubRole) {
          unsubRole();
          unsubRole = null;
        }

        if (snap.empty) {
          setState({ loading: false, roleId: null, roleCaps: {} });
          return;
        }

        const userDoc = snap.docs[0]!.data() as any;
        const roleId = String(userDoc?.roleId || "").trim();
        if (!roleId) {
          setState({ loading: false, roleId: null, roleCaps: {} });
          return;
        }

        const roleRef = doc(FbDB, "Providers", "CAR", "Roles", roleId);
        unsubRole = onSnapshot(roleRef, (d) => {
          const data = (d.data() as any) || {};
          const caps = data.caps && typeof data.caps === "object" ? data.caps : {};
          setState({
            loading: false,
            roleId,
            roleCaps: caps as Record<string, boolean>,
          });
        });
      },
      () => setState({ loading: false, roleId: null, roleCaps: {} }),
    );

    return () => {
      unsubUser();
      if (unsubRole) unsubRole();
    };
  }, [user?.email]);

  return state;
}

type TabDef = {
  id: string;
  cap: CctCap; // CCT decide si existe el tab
  title?: string;
  render: (locale: string) => React.ReactNode;
};

/**
 * Mapeo caps → tabs (sin inventar caps).
 * - FUIPanel cae bajo adminPanel (misma cap) para no agregar key nueva.
 */
const DEFAULT_TABS: TabDef[] = [
  {
    id: "adminPanel",
    cap: "adminPanel",
    title: "Admin Panel",
    render: (locale) => <AdminPanel locale={locale} />,
  },
  {
    id: "fui",
    cap: "adminPanel",
    title: "Factory UI (FUI)",
    render: (locale) => <FUIPanel locale={locale} />,
  },
  {
    id: "campaigncenter",
    cap: "campaigncenter",
    title: "Campaign Center",
    render: () => <CampaignsCenter />,
  },
  {
    id: "seo",
    cap: "seo",
    title: "SEO / Metadata",
    render: () => <MetaTab />,
  },
  {
    id: "multilenguaje",
    cap: "multilenguaje",
    title: "i18n / FM",
    render: () => <FMsTab />,
  },
  {
    id: "styledesigner",
    cap: "styledesigner",
    title: "StyleDesigner",
    render: () => <StyleDesigner />,
  },
  {
    id: "styles",
    cap: "styledesigner",
    title: "Styles Tab",
    render: () => <StylesTab />,
  },
  {
    id: "settings",
    cap: "settings",
    title: "Settings",
    render: () => <Settings />,
  },
  {
    id: "env",
    cap: "settings",
    title: "Env Wizard",
    render: () => <EnvWizard />,
  },
  {
    id: "payments",
    cap: "paypal",
    title: "Payments",
    render: () => <PaymentsAdmin />,
  },
  {
    id: "car",
    cap: "car",
    title: "Control de Acceso (CAR)",
    render: () => <ControlAccessRoles />,
  },
  {
    id: "fdv",
    cap: "adminPanel",
    title: "FDV Test",
    render: () => <FDVTest />,
  },
];

export default function AdminCorePanel({
  locale,
  tabs = DEFAULT_TABS,
  queryKey = "tab",
}: {
  locale: string;
  tabs?: TabDef[];
  queryKey?: string;
}) {
  const { loading: cctLoading, hasCap, lastError } = useCct();
  const { user, loading: authLoading } = useAuthContext();
  const car = useCar();

  const sp = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const allowedTabs = useMemo(() => tabs.filter((t) => hasCap(t.cap)), [tabs, hasCap]);

  const tabFromUrl = (sp.get(queryKey) || "").trim();
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const first = allowedTabs[0]?.id || "";
    const desired = allowedTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl : first;
    setActive(desired);
  }, [allowedTabs, tabFromUrl]);

  const activeTab = useMemo(
    () => allowedTabs.find((t) => t.id === active) || null,
    [allowedTabs, active],
  );

  function canEnter(cap: CctCap): boolean {
    if (!hasCap(cap)) return false;
    if (car.loading) return false;
    if (!car.roleId) return false;

    // Admin/Superadmin => todo (siempre sujeto a CCT)
    if (car.roleId === "admin" || car.roleId === "superadmin") return true;

    return car.roleCaps?.[cap] === true;
  }

  function switchTab(id: string) {
    setActive(id);
    router.replace(`${pathname}?${queryKey}=${encodeURIComponent(id)}`);
  }

  if (cctLoading || authLoading) {
    return <div className="p-4 text-sm opacity-70">Cargando…</div>;
  }

  if (lastError) {
    return (
      <div className="p-4 text-sm">
        <div className="font-semibold">CCT inválido / no disponible</div>
        <div className="opacity-70">error: {lastError}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-sm">
        <div className="font-semibold">Necesitas iniciar sesión</div>
        <div className="opacity-70">Esta zona es administrativa.</div>
      </div>
    );
  }

  if (allowedTabs.length === 0) {
    return (
      <div className="p-4 text-sm">
        <div className="font-semibold">Sin módulos habilitados</div>
        <div className="opacity-70">El token no trae caps para mostrar tabs.</div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 border-b pb-3 mb-4">
        {allowedTabs.map((t) => {
          const enabled = canEnter(t.cap);
          const isActive = t.id === active;
          const label = t.title || capLabel(t.cap);

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => enabled && switchTab(t.id)}
              className={[
                "px-3 py-1.5 rounded-md text-sm border",
                isActive ? "bg-black text-white" : "bg-transparent",
                enabled ? "opacity-100" : "opacity-40 cursor-not-allowed",
              ].join(" ")}
              title={enabled ? label : "Bloqueado por CAR (rol sin permiso para esta cap)"}
            >
              {label}
            </button>
          );
        })}
      </div>

      {!activeTab ? null : canEnter(activeTab.cap) ? (
        <div>{activeTab.render(locale)}</div>
      ) : (
        <div className="p-4 border rounded-md text-sm">
          <div className="font-semibold">Acceso denegado</div>
          <div className="opacity-70">
            Tu rol CAR no tiene permiso para: <b>{capLabel(activeTab.cap)}</b>
          </div>
        </div>
      )}
    </div>
  );
}
