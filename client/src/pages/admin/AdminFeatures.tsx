import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useFetch, useMutate } from "@/hooks/useApi";
import type { FeatureKey, IFeatureStatus } from "@/types";
import { useNavigate } from "react-router-dom";

interface ToggleInput {
  key: FeatureKey;
  enabled: boolean;
}

export function AdminFeatures() {
  const queryClient = useQueryClient();

  const { data: features = [], isLoading } = useFetch<IFeatureStatus[]>(
    ["admin", "features"],
    "/admin/features",
  );

  const toggle = useMutate<IFeatureStatus[], ToggleInput>(
    "/admin/features",
    "put",
  );

  const handleToggle = async (feature: IFeatureStatus) => {
    try {
      await toggle.mutateAsync({
        key: feature.key,
        enabled: !feature.enabled,
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "features"] }),
        queryClient.invalidateQueries({ queryKey: ["features"] }),
      ]);
    } catch {
      alert("Failed to update feature");
    }
  };

  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    queryClient.removeQueries({ queryKey: ["admin", "session"] });
    navigate("/", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading features...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
      >
        Log out
      </button>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck size={22} className="text-indigo-600" />
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Feature Management
            </h1>
            <p className="text-xs text-slate-500">
              Enable or disable features. Changes take effect immediately.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {features.map((feature) => {
            const isSaving =
              toggle.isPending && toggle.variables?.key === feature.key;

            return (
              <div
                key={feature.key}
                className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {feature.label}
                  </p>
                  <p className="text-xs text-slate-500">
                    {feature.description}
                  </p>
                  <code className="text-[10px] text-slate-400">
                    {feature.key}
                  </code>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={feature.enabled}
                  disabled={isSaving}
                  onClick={() => handleToggle(feature)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
                    feature.enabled ? "bg-indigo-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      feature.enabled ? "left-5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default AdminFeatures;
