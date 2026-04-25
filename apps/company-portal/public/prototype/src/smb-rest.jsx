// SMB — secondary screens: production, services, finance, reports, team, settings

function Placeholder({ title, kpis, children, headerActions }) {
  return (
    <div className="page">
      <div className="page-head">
        <div><h1>{title}</h1></div>
        <span className="sp"/>
        {headerActions || (
          <>
            <Button variant="ghost" icon={<Icon.Download size={13}/>}>Export</Button>
            <Button variant="primary" icon={<Icon.Plus size={13}/>}>New</Button>
          </>
        )}
      </div>
      {kpis && <div className="grid grid-4 mb-16">{kpis}</div>}
      {children}
    </div>
  );
}

function ProductionBOMs() {
  const BOMs = [
    { id:"BOM-01", n:"Sunflower oil 5L (repack)",   o:"120/day", c:"42 500 UZS", s:"Active" },
    { id:"BOM-02", n:"Mixed pantry bundle",          o:"60/day",  c:"86 200 UZS", s:"Active" },
    { id:"BOM-03", n:"Rice 5kg from bulk Devzira",   o:"200/day", c:"58 000 UZS", s:"Active" },
    { id:"BOM-04", n:"Snack mixed box, 12 items",    o:"25/day",  c:"124 000 UZS", s:"Paused" },
  ];
  return (
    <Placeholder title="Production · Bills of materials"
      kpis={<>
        <Kpi label="Active BOMs" value="14"/>
        <Kpi label="Output today" value="412" unit="units"/>
        <Kpi label="Scrap rate" value="1.8%" delta="−0.3" trend="up"/>
        <Kpi label="Material cost" value="38.2" unit="M UZS"/>
      </>}>
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <div className="input-wrap" style={{width:240}}><span className="prefix"><Icon.Search size={13}/></span><input className="input with-prefix" placeholder="Search BOMs"/></div>
          <span className="sp"/>
          <Button size="sm" variant="ghost" icon={<Icon.Filter size={12}/>}>Filter</Button>
        </div>
        <table className="tbl">
          <thead><tr><th>Code</th><th>Recipe</th><th>Output</th><th>Unit cost</th><th>Status</th><th/></tr></thead>
          <tbody>{BOMs.map(b =>
            <tr key={b.id}>
              <td className="id">{b.id}</td>
              <td style={{color:"var(--ink)", fontWeight:500}}>{b.n}</td>
              <td className="mono">{b.o}</td>
              <td className="num">{b.c}</td>
              <td><Pill tone={b.s==="Active"?"good":"warn"}>{b.s}</Pill></td>
              <td className="row-actions"><Icon.ChevRight size={13} className="muted"/></td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

function ServicesKanban() {
  const cols = [
    { n:"Requested",    tone:"info",  items:[{c:"Oriental Trade",   t:"Delivery · Tashkent", a:"JA"},{c:"Retail Centre", t:"Pickup", a:"BY"}]},
    { n:"Approved",     tone:"warn",  items:[{c:"Zamon Foods",      t:"Cold chain delivery", a:"MK"}]},
    { n:"In progress",  tone:"ai",    items:[{c:"Kamolot branch #2",t:"Internal transfer", a:"BY"},{c:"Nur Auto Parts", t:"Inventory audit", a:"JA"}]},
    { n:"Completed",    tone:"good",  items:[{c:"Chorsu Market",    t:"Delivery", a:"BY"},{c:"Ferghana Agro",   t:"Pickup", a:"MK"}]},
  ];
  return (
    <Placeholder title="Services · Work orders">
      <div className="grid grid-4" style={{gap:12}}>
        {cols.map((col, i) => (
          <div key={i} className="card card-pad-0">
            <div className="panel-title"><Pill tone={col.tone} dot={false}>{col.n}</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>{col.items.length}</span></div>
            <div style={{padding:8}}>
              {col.items.map((w, j) => (
                <div key={j} className="hairline" style={{padding:10, borderRadius:6, marginBottom:8}}>
                  <div style={{fontSize:12.5, color:"var(--ink)", fontWeight:500}}>{w.c}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{w.t}</div>
                  <div className="row mt-8">
                    <div className="avatar sm green">{w.a}</div>
                    <span className="sp"/>
                    <span className="mono muted" style={{fontSize:10}}>WO-{1000 + i*10 + j}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Placeholder>
  );
}

function FinancePage({ kind }) {
  const titles = { ledger:"General ledger", invoices:"Invoices · Receivables", bills:"Bills · Payables", cash:"Cash flow" };
  if (kind === "cash") {
    return (
      <Placeholder title="Cash flow"
        kpis={<>
          <Kpi label="Inflow · March" value="312" unit="M UZS" delta="+18%" trend="up"/>
          <Kpi label="Outflow · March" value="248" unit="M UZS" delta="+9%" trend="down"/>
          <Kpi label="Net" value="+64" unit="M UZS" delta="Healthy" trend="up"/>
          <Kpi label="Days cash on hand" value="38" delta="Target: 45" trend="down"/>
        </>}>
        <div className="card card-pad-0">
          <div className="panel-title">Monthly net cash flow · last 6 months</div>
          <div style={{padding:8}}>
            <StackedBar width={900} height={240}
              data={[[155,120],[180,140],[199,170],[172,185],[220,190],[248,212]]}
              categories={REVENUE_LABELS}
              colors={["var(--ink)","var(--ai)"]}/>
            <div className="row gap-16 mono muted" style={{fontSize:10, padding:"6px 16px"}}>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ink)", marginRight:6}}/>Inflow</span>
              <span><span style={{display:"inline-block", width:8, height:8, background:"var(--ai)", marginRight:6}}/>Outflow</span>
            </div>
          </div>
        </div>
      </Placeholder>
    );
  }
  if (kind === "invoices") {
    const INVS = [
      { id:"INV-1482", c:"Oriental Trade LLC", d:"12 Mar", due:"26 Mar", amt:14_500_000, s:"Paid"},
      { id:"INV-1481", c:"Zamon Foods",        d:"11 Mar", due:"25 Mar", amt:28_200_000, s:"Sent"},
      { id:"INV-1480", c:"Retail Centre",      d:"09 Mar", due:"23 Mar", amt:8_400_000,  s:"Overdue"},
      { id:"INV-1479", c:"Chorsu Market Co.",  d:"08 Mar", due:"22 Mar", amt:18_100_000, s:"Sent"},
      { id:"INV-1478", c:"Nur Auto Parts",     d:"06 Mar", due:"20 Mar", amt:6_240_000,  s:"Paid"},
      { id:"INV-1477", c:"Ferghana Agro",      d:"04 Mar", due:"18 Mar", amt:32_500_000, s:"Overdue"},
    ];
    return (
      <Placeholder title="Invoices · Receivables">
        <div className="card card-pad-0">
          <div className="tbl-toolbar">
            <span className="chip" style={{background:"var(--ink)", color:"var(--surface)", borderColor:"var(--ink)"}}>All <span className="mono" style={{opacity:0.7, marginLeft:4}}>24</span></span>
            <span className="chip">Sent <span className="mono" style={{marginLeft:4}}>12</span></span>
            <span className="chip">Overdue <span className="mono" style={{marginLeft:4, color:"var(--bad)"}}>3</span></span>
            <span className="chip">Paid <span className="mono" style={{marginLeft:4}}>9</span></span>
            <span className="sp"/>
            <Button size="sm" variant="primary" icon={<Icon.Plus size={12}/>}>New invoice</Button>
          </div>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Due</th><th className="tr">Amount</th><th>Status</th><th/></tr></thead>
            <tbody>{INVS.map(i =>
              <tr key={i.id}>
                <td className="id">{i.id}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{i.c}</td>
                <td className="dim mono">{i.d}</td>
                <td className="dim mono">{i.due}</td>
                <td className="num">{fmtUZS(i.amt)}</td>
                <td><Pill tone={i.s==="Paid"?"good":i.s==="Overdue"?"bad":"info"}>{i.s}</Pill></td>
                <td className="row-actions">{i.s !== "Paid" && <Button size="sm" variant="ghost">Send reminder</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </Placeholder>
    );
  }
  if (kind === "bills") {
    const BILLS = [
      { id:"BILL-0451", v:"Samarkand Oil Co.",  d:"18 Mar", due:"01 Apr", amt:45_700_000, s:"Due"},
      { id:"BILL-0449", v:"Makfa Distribution", d:"12 Mar", due:"26 Mar", amt:18_200_000, s:"Due"},
      { id:"BILL-0448", v:"Akbar Tea Imports",  d:"08 Mar", due:"22 Mar", amt:12_400_000, s:"Paid"},
      { id:"BILL-0445", v:"Samarkand Oil Co.",  d:"03 Mar", due:"17 Mar", amt:42_000_000, s:"Paid"},
    ];
    return (
      <Placeholder title="Bills · Payables">
        <div className="card card-pad-0">
          <table className="tbl">
            <thead><tr><th>Bill</th><th>Vendor</th><th>Date</th><th>Due</th><th className="tr">Amount</th><th>Status</th><th/></tr></thead>
            <tbody>{BILLS.map(i =>
              <tr key={i.id}>
                <td className="id">{i.id}</td>
                <td style={{fontWeight:500, color:"var(--ink)"}}>{i.v}</td>
                <td className="dim mono">{i.d}</td>
                <td className="dim mono">{i.due}</td>
                <td className="num">{fmtUZS(i.amt)}</td>
                <td><Pill tone={i.s==="Paid"?"good":"warn"}>{i.s}</Pill></td>
                <td className="row-actions">{i.s !== "Paid" && <Button size="sm" variant="primary">Mark paid</Button>}</td>
              </tr>)}</tbody>
          </table>
        </div>
      </Placeholder>
    );
  }
  // ledger
  const ACCT = [
    { c:"1001", n:"Cash · SQB current", b:64_200_000 },
    { c:"1100", n:"Accounts receivable", b:86_400_000 },
    { c:"1200", n:"Inventory", b:412_700_000 },
    { c:"2001", n:"Accounts payable", b:-78_200_000 },
    { c:"2100", n:"VAT payable", b:-14_200_000 },
    { c:"3001", n:"Retained earnings", b:-402_800_000 },
    { c:"4000", n:"Sales revenue", b:-278_400_000 },
    { c:"5000", n:"Cost of goods sold", b:192_100_000 },
  ];
  return (
    <Placeholder title="General ledger">
      <div className="card card-pad-0">
        <table className="tbl">
          <thead><tr><th>Code</th><th>Account</th><th className="tr">Balance</th></tr></thead>
          <tbody>{ACCT.map(a =>
            <tr key={a.c}>
              <td className="id">{a.c}</td>
              <td style={{color:"var(--ink)"}}>{a.n}</td>
              <td className="num" style={{color: a.b < 0 ? "var(--bad)" : "var(--ink)"}}>{fmtUZS(a.b)} UZS</td>
            </tr>)}</tbody>
        </table>
      </div>
    </Placeholder>
  );
}

function ReportsPage() {
  const REPORTS = [
    { n:"Profit & Loss",       d:"Monthly P&L statement", i:"Chart" },
    { n:"Balance sheet",       d:"Assets, liabilities, equity", i:"Ledger" },
    { n:"Cash flow statement", d:"Direct and indirect view", i:"Coin" },
    { n:"Inventory report",    d:"Valuation, turnover, aging", i:"Box" },
    { n:"Tax return pack",     d:"VAT, CIT · STI ready", i:"Shield" },
    { n:"Payroll summary",     d:"Monthly payroll register", i:"Users" },
  ];
  return (
    <Placeholder title="Reports">
      <div className="grid grid-3" style={{gap:12}}>
        {REPORTS.map((r, i) => {
          const IC = Icon[r.i];
          return (
            <div key={i} className="card" style={{padding:14}}>
              <div className="row"><IC size={16} style={{color:"var(--ai)"}}/><span className="sp"/><span className="mono muted" style={{fontSize:10}}>PDF · XLSX</span></div>
              <div style={{fontSize:14, fontWeight:500, color:"var(--ink)", marginTop:8}}>{r.n}</div>
              <div className="muted mt-4" style={{fontSize:12}}>{r.d}</div>
              <div className="row mt-12"><Button size="sm" variant="ghost">Preview</Button><Button size="sm" variant="primary" icon={<Icon.Download size={12}/>}>Generate</Button></div>
            </div>
          );
        })}
      </div>
    </Placeholder>
  );
}

function TeamPage() {
  const ROLE_FALLBACKS = [
    { role:"owner", label:"Owner", defaultPermissionGroups:["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"] },
    { role:"company_admin", label:"Company admin", defaultPermissionGroups:["tenant_governance","finance_operations","inventory_operations","production_operations","service_operations","audit_compliance"] },
    { role:"manager", label:"Manager", defaultPermissionGroups:["finance_operations","inventory_operations","production_operations","service_operations"] },
    { role:"operator", label:"Operator", defaultPermissionGroups:["inventory_operations","production_operations","service_operations"] },
  ];
  const GROUP_FALLBACKS = [
    { key:"tenant_governance", label:"Tenant governance", summary:"Workspace ownership, settings, and access policy.", permissions:["tenant.read","tenant.manage"] },
    { key:"finance_operations", label:"Finance operations", summary:"Ledger, invoices, bills, and money workflows.", permissions:["finance.read","finance.manage"] },
    { key:"inventory_operations", label:"Inventory operations", summary:"Stock movement and warehouse work.", permissions:["inventory.manage"] },
    { key:"production_operations", label:"Production operations", summary:"Manufacturing and BOM execution.", permissions:["production.manage"] },
    { key:"service_operations", label:"Service operations", summary:"Service order and workflow execution.", permissions:["service_order.manage"] },
    { key:"audit_compliance", label:"Audit and compliance", summary:"Audit evidence and compliance review.", permissions:["audit.read"] },
  ];
  const AVATAR_TONES = ["warm","cool","green","plum","warm","cool","green"];
  const [workspace, setWorkspace] = React.useState({ tenant:null, actor:null, users:[], invites:[], accessCatalog:null });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [errorStatus, setErrorStatus] = React.useState(null);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [manageOpen, setManageOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [selectedMember, setSelectedMember] = React.useState(null);
  const [inviteForm, setInviteForm] = React.useState({ name:"", email:"", role:"operator", permissionGroups:["inventory_operations","production_operations","service_operations"] });
  const [memberForm, setMemberForm] = React.useState({ role:"operator", permissionGroups:["inventory_operations","production_operations","service_operations"] });

  const roles = (workspace.accessCatalog && workspace.accessCatalog.workspaceRoles) || ROLE_FALLBACKS;
  const permissionGroups = (workspace.accessCatalog && workspace.accessCatalog.permissionGroups) || GROUP_FALLBACKS;
  const canManageTeam = Boolean(workspace.actor && Array.isArray(workspace.actor.permissions) && workspace.actor.permissions.includes("tenant.manage"));
  const activeUsers = workspace.users || [];
  const pendingInvites = (workspace.invites || []).filter((invite) => invite.status === "pending");

  const roleLabel = (role) => {
    const match = roles.find((entry) => entry.role === role);
    return match ? match.label : String(role || "").replace(/_/g, " ");
  };

  const defaultsForRole = (role) => {
    const match = roles.find((entry) => entry.role === role);
    return match && Array.isArray(match.defaultPermissionGroups) ? [...match.defaultPermissionGroups] : [];
  };

  const permissionGroupMeta = (key) => permissionGroups.find((group) => group.key === key);

  const effectivePermissions = (groups) => {
    const keys = Array.from(new Set(groups || []));
    return Array.from(new Set(keys.flatMap((key) => {
      const group = permissionGroupMeta(key);
      return group && Array.isArray(group.permissions) ? group.permissions : [];
    })));
  };

  const permissionLabel = (permission) => String(permission || "")
    .replace(/\./g, " ")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

  const relativeTime = (value) => {
    if (!value) return "never";
    const diff = Date.now() - new Date(value).getTime();
    if (!Number.isFinite(diff) || diff < 60 * 1000) return "now";
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
  };

  const applyWorkspacePayload = (body) => {
    setWorkspace({
      tenant: body && body.tenant ? body.tenant : null,
      actor: body && body.actor ? body.actor : null,
      users: body && Array.isArray(body.users) ? body.users : [],
      invites: body && Array.isArray(body.invites) ? body.invites : [],
      accessCatalog: body && body.accessCatalog ? body.accessCatalog : null,
    });
  };

  const loadWorkspace = async () => {
    setLoading(true);
    const result = await tenantRequest("/me", null, "GET");
    setLoading(false);
    if (!result.ok) {
      setErrorStatus(result.status);
      setError((result.body && result.body.message) || "Unable to load team workspace.");
      return;
    }
    setErrorStatus(null);
    setError("");
    applyWorkspacePayload(result.body);
  };

  React.useEffect(() => {
    loadWorkspace();
  }, []);

  const updateGroupSelection = (current, groupKey, checked) => {
    const next = new Set(current || []);
    if (checked) next.add(groupKey); else next.delete(groupKey);
    return Array.from(next);
  };

  const openInvite = () => {
    const role = "operator";
    setInviteForm({ name:"", email:"", role, permissionGroups: defaultsForRole(role) });
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    setSaving(true);
    const result = await tenantRequest("/invites", inviteForm, "POST");
    setSaving(false);
    if (!result.ok) {
      setError((result.body && result.body.message) || "Unable to create invite.");
      return;
    }
    setError("");
    setInviteOpen(false);
    applyWorkspacePayload({ ...workspace, ...result.body, accessCatalog: workspace.accessCatalog });
  };

  const openManage = (member) => {
    setSelectedMember(member);
    setMemberForm({
      role: member.workspaceRole || "operator",
      permissionGroups: Array.isArray(member.permissionGroups) && member.permissionGroups.length
        ? [...member.permissionGroups]
        : defaultsForRole(member.workspaceRole || "operator")
    });
    setManageOpen(true);
  };

  const submitMemberUpdate = async () => {
    if (!selectedMember) return;
    setSaving(true);
    const result = await tenantRequest(`/members/${selectedMember.id}`, memberForm, "PATCH");
    setSaving(false);
    if (!result.ok) {
      setError((result.body && result.body.message) || "Unable to update team member.");
      return;
    }
    setError("");
    setManageOpen(false);
    setSelectedMember(null);
    applyWorkspacePayload({ ...workspace, ...result.body, accessCatalog: workspace.accessCatalog });
  };

  const revokeInvite = async (inviteId) => {
    setSaving(true);
    const result = await tenantRequest(`/invites/${inviteId}/revoke`, {}, "POST");
    setSaving(false);
    if (!result.ok) {
      setError((result.body && result.body.message) || "Unable to revoke invite.");
      return;
    }
    setError("");
    applyWorkspacePayload({ ...workspace, ...result.body, accessCatalog: workspace.accessCatalog });
  };

  const exportWorkspace = () => {
    setExporting(true);
    try {
      const rows = [
        ["name", "email", "role", "status", "last_active", "permission_groups"]
      ];

      activeUsers.forEach((member) => {
        rows.push([
          member.name || "",
          member.email || "",
          roleLabel(member.workspaceRole || member.role),
          "active",
          relativeTime(member.lastActiveAt),
          Array.isArray(member.permissionGroups) ? member.permissionGroups.join("|") : ""
        ]);
      });

      pendingInvites.forEach((invite) => {
        rows.push([
          invite.name || "",
          invite.email || "",
          roleLabel(invite.role),
          invite.status || "pending",
          relativeTime(invite.invitedAt),
          Array.isArray(invite.permissionGroups) ? invite.permissionGroups.join("|") : ""
        ]);
      });

      const csv = rows
        .map((row) => row.map((value) => `"${String(value || "").replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const slug = ((workspace.tenant && workspace.tenant.tenantSlug) || "workspace-team").replace(/[^a-z0-9-]/gi, "-").toLowerCase();
      link.href = url;
      link.download = `${slug}-team.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } finally {
      window.setTimeout(() => setExporting(false), 250);
    }
  };

  return (
    <Placeholder
      title="Team"
      headerActions={
        <>
          <Button variant="ghost" icon={<Icon.Download size={13}/>} onClick={exportWorkspace} disabled={loading || exporting || !!errorStatus}>
            {exporting ? "Exporting..." : "Export"}
          </Button>
          <Button variant="primary" icon={<Icon.UserPlus size={13}/>} onClick={openInvite} disabled={!canManageTeam}>
            Invite member
          </Button>
        </>
      }
    >
      <div className="card card-pad-0">
        <div className="tbl-toolbar">
          <span className="sp"/>
        </div>
        {error && <div className="muted" style={{fontSize:12, color:"var(--bad)", padding:"0 12px 12px"}}>{errorStatus === 403 ? "You do not have access to the Team workspace." : error}</div>}
        <table className="tbl">
          <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Last active</th><th/></tr></thead>
          <tbody>
            {loading && (
              <tr><td colSpan="5" className="dim mono">Loading team members…</td></tr>
            )}
            {!loading && errorStatus === 403 && (
              <tr><td colSpan="5" className="dim mono">Access denied.</td></tr>
            )}
            {!loading && activeUsers.map((member, index) => (
              <tr key={member.id}>
                <td>
                  <div className="row gap-8">
                    <div className={`avatar sm ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>{member.name.split(" ").filter(Boolean).map((word) => word[0]).join("").slice(0, 2)}</div>
                    <span style={{color:"var(--ink)", fontWeight:500}}>{member.name}</span>
                  </div>
                </td>
                <td><Pill tone={(member.workspaceRole || member.role) === "owner" ? "solid-ink" : "info"} dot={false}>{roleLabel(member.workspaceRole || member.role)}</Pill></td>
                <td className="dim mono">{member.email || "—"}</td>
                <td className="dim mono">{relativeTime(member.lastActiveAt)}</td>
                <td className="row-actions">
                  {canManageTeam && <Button size="sm" variant="ghost" onClick={() => openManage(member)}>Manage</Button>}
                </td>
              </tr>
            ))}
            {!loading && !errorStatus && activeUsers.length === 0 && (
              <tr><td colSpan="5" className="dim mono">No team members found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {errorStatus !== 403 && pendingInvites.length > 0 && (
        <div className="card card-pad-0 mt-16">
          <div className="panel-title">Pending invites <span className="sp"/><span className="mono muted" style={{fontSize:10}}>{pendingInvites.length}</span></div>
          <table className="tbl">
            <thead><tr><th>Name</th><th>Role</th><th>Email</th><th>Invited</th><th/></tr></thead>
            <tbody>{pendingInvites.map((invite, index) => (
              <tr key={invite.id}>
                <td>
                  <div className="row gap-8">
                    <div className={`avatar sm ${AVATAR_TONES[index % AVATAR_TONES.length]}`}>{invite.name.split(" ").filter(Boolean).map((word) => word[0]).join("").slice(0, 2) || "IN"}</div>
                    <span style={{color:"var(--ink)", fontWeight:500}}>{invite.name}</span>
                  </div>
                </td>
                <td><Pill tone="warn" dot={false}>{roleLabel(invite.role)}</Pill></td>
                <td className="dim mono">{invite.email}</td>
                <td className="dim mono">{relativeTime(invite.invitedAt)}</td>
                <td className="row-actions">
                  {canManageTeam && <Button size="sm" variant="ghost" onClick={() => revokeInvite(invite.id)}>Revoke</Button>}
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite member"
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitInvite} disabled={saving || !inviteForm.name || !inviteForm.email}>
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </>
        }
      >
        <div className="col gap-12">
          <Field label="Full name"><input className="input" value={inviteForm.name} onChange={(e) => setInviteForm({ ...inviteForm, name:e.target.value })}/></Field>
          <Field label="Email"><input className="input mono" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email:e.target.value })}/></Field>
          <Field label="Role">
            <select className="select" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role:e.target.value, permissionGroups: defaultsForRole(e.target.value) })}>
              {roles.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}
            </select>
          </Field>
          <div className="label">Permission groups</div>
          <div className="col gap-8">
            {permissionGroups.map((group) => (
              <label key={group.key} className="row hairline" style={{padding:10, borderRadius:6, cursor:"pointer", alignItems:"flex-start", gap:10}}>
                <input
                  type="checkbox"
                  checked={inviteForm.permissionGroups.includes(group.key)}
                  onChange={(e) => setInviteForm({ ...inviteForm, permissionGroups: updateGroupSelection(inviteForm.permissionGroups, group.key, e.target.checked) })}
                />
                <div style={{flex:1}}>
                  <div style={{fontWeight:500, color:"var(--ink)"}}>{group.label}</div>
                  <div className="muted" style={{fontSize:11, marginTop:2}}>{group.summary}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <Drawer
        open={manageOpen}
        onClose={() => { setManageOpen(false); setSelectedMember(null); }}
        title={selectedMember ? `Manage ${selectedMember.name}` : "Manage member"}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setManageOpen(false); setSelectedMember(null); }}>Cancel</Button>
            <span className="sp"/>
            <Button variant="primary" onClick={submitMemberUpdate} disabled={saving || !selectedMember}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </>
        }
      >
        {selectedMember && (
          <div className="col gap-12">
            <div className="hairline" style={{padding:10, borderRadius:6}}>
              <div style={{fontWeight:500, color:"var(--ink)"}}>{selectedMember.name}</div>
              <div className="muted mono" style={{fontSize:11, marginTop:3}}>{selectedMember.email || "No email"}</div>
            </div>
            <Field label="Role">
              <select className="select" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role:e.target.value, permissionGroups: defaultsForRole(e.target.value) })}>
                {roles.map((role) => <option key={role.role} value={role.role}>{role.label}</option>)}
              </select>
            </Field>
            <div className="row">
              <div className="label">Permission groups</div>
              <span className="sp"/>
              <Button size="sm" variant="ghost" onClick={() => setMemberForm({ ...memberForm, permissionGroups: defaultsForRole(memberForm.role) })}>Reset defaults</Button>
            </div>
            <div className="col gap-8">
              {permissionGroups.map((group) => (
                <label key={group.key} className="row hairline" style={{padding:10, borderRadius:6, cursor:"pointer", alignItems:"flex-start", gap:10}}>
                  <input
                    type="checkbox"
                    checked={memberForm.permissionGroups.includes(group.key)}
                    onChange={(e) => setMemberForm({ ...memberForm, permissionGroups: updateGroupSelection(memberForm.permissionGroups, group.key, e.target.checked) })}
                  />
                  <div style={{flex:1}}>
                    <div style={{fontWeight:500, color:"var(--ink)"}}>{group.label}</div>
                    <div className="muted" style={{fontSize:11, marginTop:2}}>{group.summary}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="label">Effective permissions</div>
            <div className="row" style={{gap:6, flexWrap:"wrap"}}>
              {effectivePermissions(memberForm.permissionGroups).map((permission) => (
                <Pill key={permission} tone="info" dot={false}>{permissionLabel(permission)}</Pill>
              ))}
              {effectivePermissions(memberForm.permissionGroups).length === 0 && <span className="muted" style={{fontSize:12}}>No effective permissions selected.</span>}
            </div>
          </div>
        )}
      </Drawer>
    </Placeholder>
  );
}

function SmbSettings() {
  return (
    <Placeholder title="Settings">
      <div className="grid" style={{gridTemplateColumns:"1fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Company profile</h2>
          <div className="col gap-8 mt-8">
            <Field label="Company name"><input className="input" defaultValue="Kamolot Savdo LLC"/></Field>
            <Field label="TIN"><input className="input mono" defaultValue="301 452 776"/></Field>
            <Field label="Address"><input className="input" defaultValue="Mirobod district, Tashkent 100170"/></Field>
            <Field label="Phone"><input className="input mono" defaultValue="+998 71 200 44 82"/></Field>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Bank account</h2>
          <div className="col gap-8 mt-8">
            <Field label="Primary account"><input className="input mono" defaultValue="20208 000 100 100 001 · SQB"/></Field>
            <Field label="Currency"><select className="select"><option>UZS</option><option>USD</option><option>EUR</option></select></Field>
          </div>
          <div className="divider"/>
          <h2>Locale & notifications</h2>
          <div className="col gap-8 mt-8">
            <div className="row"><span>Language</span><span className="sp"/><select className="select" style={{width:120}}><option>English</option><option>O'zbek</option><option>Русский</option></select></div>
            <div className="row"><span>Email alerts</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
            <div className="row"><span>SMS alerts</span><span className="sp"/><Toggle on={false} onChange={()=>{}}/></div>
            <div className="row"><span>AI Copilot suggestions</span><span className="sp"/><Toggle on={true} onChange={()=>{}}/></div>
          </div>
        </div></div>
      </div>
    </Placeholder>
  );
}

/* -------- Production order detail, Services WO detail (simple) -------- */
function ProductionOrder({ go }) {
  return (
    <Placeholder title="Production order PO-0451">
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Inputs</h2>
          <table className="tbl compact"><thead><tr><th>SKU</th><th>Material</th><th className="tr">Required</th><th className="tr">Used</th></tr></thead>
            <tbody>
              <tr><td className="id">KS-0102</td><td>Cooking oil 5L bulk</td><td className="num">120</td><td className="num">118</td></tr>
              <tr><td className="id">KS-0104</td><td>Sugar refined</td><td className="num">40</td><td className="num">40</td></tr>
              <tr><td className="id">KS-0210</td><td>Rice Devzira</td><td className="num">80</td><td className="num">80</td></tr>
            </tbody>
          </table>
          <h2 className="mt-16">Output</h2>
          <div className="row hairline" style={{padding:10, borderRadius:6}}>
            <div style={{flex:1}}><div style={{fontWeight:500, color:"var(--ink)"}}>Pantry bundle · medium</div><div className="muted" style={{fontSize:11}}>Planned 60 · completed 58 · scrap 2</div></div>
            <Pill tone="good">In progress</Pill>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Status</h2>
          <div className="col gap-8">
            <div className="row"><span className="muted">Assignee</span><span className="sp"/><div className="avatar sm green">BY</div> Bekzod Y.</div>
            <div className="row"><span className="muted">Started</span><span className="sp"/>18 Mar · 08:30</div>
            <div className="row"><span className="muted">Est. complete</span><span className="sp"/>18 Mar · 17:00</div>
          </div>
          <div className="progress mt-16"><span style={{width:"72%"}}/></div>
          <div className="muted mt-4" style={{fontSize:11}}>72% of planned output</div>
        </div></div>
      </div>
    </Placeholder>
  );
}

function ServiceOrderDetail() {
  return (
    <Placeholder title="Work order WO-1041">
      <div className="grid" style={{gridTemplateColumns:"2fr 1fr", gap:12}}>
        <div className="card"><div className="card-body">
          <h2>Oriental Trade LLC · Delivery · Tashkent</h2>
          <p className="muted">Requested 18 March · 09:14 by Malika Karimova</p>
          <div className="divider"/>
          <div className="col gap-8">
            <div className="row"><span className="muted">Destination</span><span className="sp"/>Chilonzor district, Tashkent</div>
            <div className="row"><span className="muted">Items</span><span className="sp"/>12 units · 3 SKUs</div>
            <div className="row"><span className="muted">Value</span><span className="sp"/><span className="mono">14 500 000 UZS</span></div>
          </div>
        </div></div>
        <div className="card"><div className="card-body">
          <h2>Approvals</h2>
          <div className="col gap-8">
            <div className="row"><Pill tone="good">Requested</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>M. Karimova</span></div>
            <div className="row"><Pill tone="warn">Awaiting approval</Pill><span className="sp"/><span className="mono muted" style={{fontSize:11}}>Owner</span></div>
          </div>
          <div className="row mt-16"><Button variant="ghost" className="block">Decline</Button><Button variant="primary" className="block">Approve</Button></div>
        </div></div>
      </div>
    </Placeholder>
  );
}

Object.assign(window, { ProductionBOMs, ProductionOrder, ServicesKanban, ServiceOrderDetail, FinancePage, ReportsPage, TeamPage, SmbSettings });
