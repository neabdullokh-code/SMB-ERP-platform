import { PageHeader, SectionCard, StatusBadge } from "@sqb/ui";

export function SettingsPage() {
  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      <PageHeader
        eyebrow="Settings"
        title="Tenant configuration and compliance controls"
        description="Sensitive changes such as role assignment, warehouse creation, and policy updates should be mediated by audited APIs rather than client-side state."
      />
      <SectionCard title="Implemented in scaffold" description="These controls now have a place in the architecture instead of floating in a single mock shell.">
        <ul style={{ margin: 0, paddingLeft: "1rem", color: "#10243d" }}>
          <li>Dedicated tenancy module in the API</li>
          <li>Cookie and middleware-based protected routing in the portal</li>
          <li>Versioned terms acceptance gate before workspace entry</li>
        </ul>
      </SectionCard>
      <SectionCard title="Next backend tasks" description="These should be completed against server-side policies.">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          <StatusBadge tone="neutral">Role assignment endpoints</StatusBadge>
          <StatusBadge tone="neutral">Tenant membership CRUD</StatusBadge>
          <StatusBadge tone="neutral">Secrets-backed OTP delivery</StatusBadge>
          <StatusBadge tone="neutral">Immutable audit trail persistence</StatusBadge>
        </div>
      </SectionCard>
    </div>
  );
}
