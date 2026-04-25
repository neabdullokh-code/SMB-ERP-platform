// Auth screens: Login, OTP, Forgot, Onboarding

function AuthHeader() {
  return (
    <div className="row" style={{gap:10, marginBottom: 24}}>
      <div className="logo-mark" style={{width:28, height:28, fontSize:13}}>S</div>
      <div>
        <div className="logo-word" style={{fontSize:15}}>SQB <span className="dim">Business OS</span></div>
        <div className="mono" style={{fontSize:10, color:"var(--muted)", letterSpacing:"0.08em"}}>YOUR BUSINESS. YOUR BANK. ONE PLATFORM.</div>
      </div>
    </div>
  );
}

function LoginPage({ go }) {
  const [role, setRole] = useStateS("smb");
  const [id, setId] = useStateS("jasur@kamolot.uz");
  const [pw, setPw] = useStateS("••••••••••");
  return (
    <div className="auth-bg">
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, width:"min(1000px, 92vw)", alignItems:"center"}}>
        <div>
          <AuthHeader/>
          <div style={{fontSize:32, fontWeight:500, color:"var(--ink)", letterSpacing:"-0.02em", lineHeight:1.15, maxWidth:420}}>
            Run your business. Unlock financing. <span style={{color:"var(--ai)"}}>One platform.</span>
          </div>
          <p className="muted" style={{marginTop:16, maxWidth:380, fontSize:13}}>
            The free ERP platform from SQB Bank for small and medium businesses in Uzbekistan.
            Inventory, finance, and 24-hour loan decisions — all in one place.
          </p>
          <div className="row" style={{gap:24, marginTop:32, fontSize:12}}>
            <div><div className="num-md">12 400+</div><div className="muted">SMBs on platform</div></div>
            <div><div className="num-md">24h</div><div className="muted">Avg. credit decision</div></div>
            <div><div className="num-md">UZS 1.8T</div><div className="muted">Financed in 2025</div></div>
          </div>
        </div>

        <div className="auth-card">
          <div className="eyebrow mb-8">Sign in</div>
          <div className="surface-switch" style={{margin:0, marginBottom:16}}>
            <button className={role==="smb" ? "active" : ""}  onClick={() => setRole("smb")}>SMB CUSTOMER</button>
            <button className={role==="bank"? "active" : ""} onClick={() => setRole("bank")}>BANK STAFF</button>
          </div>
          <div className="col gap-12">
            <Field label="Email or phone">
              <div className="input-wrap">
                <span className="prefix"><Icon.Mail size={13}/></span>
                <input className="input with-prefix" value={id} onChange={e=>setId(e.target.value)}/>
              </div>
            </Field>
            <Field label="Password">
              <div className="input-wrap">
                <span className="prefix"><Icon.Lock size={13}/></span>
                <input className="input with-prefix" type="password" value={pw} onChange={e=>setPw(e.target.value)}/>
                <a className="suffix" style={{cursor:"pointer", color:"var(--ink)"}} onClick={() => go("/forgot")}>Forgot?</a>
              </div>
            </Field>
            <Button variant="primary" className="block" onClick={() => go("/otp")}>
              Continue <Icon.Arrow size={14}/>
            </Button>
            <div className="row" style={{justifyContent:"center", gap:6, color:"var(--muted)", fontSize:12}}>
              New to SQB Business OS? <a style={{color:"var(--ink)", cursor:"pointer"}} onClick={()=>go("/onboarding")}>Create workspace</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OtpPage({ go }) {
  const [code, setCode] = useStateS(["","","","","",""]);
  const refs = useRef([]);
  const onChar = (i, v) => {
    const n = [...code]; n[i] = v.replace(/\D/g,"").slice(-1); setCode(n);
    if (v && refs.current[i+1]) refs.current[i+1].focus();
  };
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthHeader/>
        <div className="row" style={{gap:10, marginBottom:14}}>
          <div className="avatar warm" style={{background:"var(--ai-bg)", color:"var(--ai)"}}><Icon.Phone size={14}/></div>
          <div>
            <div style={{fontWeight:500, color:"var(--ink)"}}>Verify your phone</div>
            <div className="muted" style={{fontSize:12}}>We sent a 6-digit code to +998 90 *** 14 82</div>
          </div>
        </div>
        <div className="row" style={{gap:8, justifyContent:"space-between", marginTop:16}}>
          {code.map((c,i) => (
            <input key={i} ref={el => refs.current[i] = el}
              className="input mono"
              style={{width:46, height:52, fontSize:22, textAlign:"center", fontWeight:500}}
              value={c} maxLength={1}
              onChange={(e)=>onChar(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === "Backspace" && !c && refs.current[i-1]) refs.current[i-1].focus(); }}/>
          ))}
        </div>
        <div className="row mt-16" style={{justifyContent:"space-between", fontSize:12}}>
          <span className="muted">Didn't get it? <a style={{color:"var(--ink)", cursor:"pointer"}}>Resend in 0:42</a></span>
          <a className="muted" style={{cursor:"pointer"}} onClick={() => go("/login")}>← Back</a>
        </div>
        <Button variant="primary" className="block mt-16" onClick={() => go("/smb/home")}>
          Verify and sign in <Icon.Arrow size={14}/>
        </Button>
      </div>
    </div>
  );
}

function ForgotPage({ go }) {
  const [sent, setSent] = useStateS(false);
  return (
    <div className="auth-bg">
      <div className="auth-card">
        <AuthHeader/>
        {!sent ? (
          <>
            <h2 style={{margin:"0 0 4px", fontSize:16}}>Reset password</h2>
            <p className="muted" style={{fontSize:12, marginTop:0}}>Enter your email or phone. We'll send you a reset link.</p>
            <Field label="Email or phone">
              <input className="input" defaultValue="jasur@kamolot.uz"/>
            </Field>
            <div className="row mt-16" style={{gap:8}}>
              <Button variant="ghost" onClick={() => go("/login")}>Cancel</Button>
              <span className="sp"/>
              <Button variant="primary" onClick={() => setSent(true)}>Send reset link</Button>
            </div>
          </>
        ) : (
          <>
            <Banner tone="good" title="Check your email">
              A reset link was sent to jasur@kamolot.uz. It expires in 30 minutes.
            </Banner>
            <Button variant="primary" className="block mt-16" onClick={() => go("/login")}>Back to sign in</Button>
          </>
        )}
      </div>
    </div>
  );
}

function OnboardingPage({ go }) {
  const [step, setStep] = useStateS(0);
  const steps = ["Company", "Business type", "Team", "Plan"];
  return (
    <div className="auth-bg" style={{alignItems:"flex-start", paddingTop:60}}>
      <div style={{width:"min(620px, 94vw)"}}>
        <AuthHeader/>
        <div className="card">
          <div className="card-head">
            <div className="eyebrow">Workspace setup · Step {step+1} of 4</div>
            <span className="sp"/>
            <div className="mono" style={{fontSize:11, color:"var(--muted)"}}>~ 3 min</div>
          </div>
          <div style={{padding:"0 14px"}}>
            <div className="row" style={{gap:4, padding:"10px 0"}}>
              {steps.map((s,i) => (
                <div key={s} style={{flex:1, display:"flex", alignItems:"center", gap:6, fontSize:11, color: i <= step ? "var(--ink)" : "var(--muted)"}}>
                  <span className="mono" style={{
                    width:18, height:18, borderRadius:"50%", display:"grid", placeItems:"center",
                    background: i < step ? "var(--ink)" : i === step ? "var(--ai-bg)" : "var(--bg)",
                    color: i < step ? "var(--surface)" : i === step ? "var(--ai)" : "var(--muted)",
                    border: `1px solid ${i===step ? "var(--ai-line)" : "var(--line)"}`,
                    fontSize: 10,
                  }}>{i < step ? "✓" : i+1}</span>
                  <span>{s}</span>
                  {i < steps.length - 1 && <span style={{flex:1, height:1, background:"var(--line)"}}/>}
                </div>
              ))}
            </div>
          </div>
          <div className="card-body">
            {step === 0 && (
              <div className="col gap-12">
                <Field label="Company name"><input className="input" defaultValue="Kamolot Savdo LLC"/></Field>
                <div className="grid grid-2">
                  <Field label="TIN / Tax ID"><input className="input mono" defaultValue="301 452 776"/></Field>
                  <Field label="Region">
                    <select className="select"><option>Tashkent</option><option>Samarkand</option><option>Bukhara</option></select>
                  </Field>
                </div>
                <Field label="Address"><input className="input" defaultValue="Mirobod district, Tashkent 100170"/></Field>
              </div>
            )}
            {step === 1 && (
              <div>
                <div className="label mb-8">Primary business type — pick one</div>
                <div className="grid grid-3" style={{gap:8}}>
                  {[
                    {k:"Wholesale", d:"Distribute goods to retailers"},
                    {k:"Retail",    d:"Sell direct to consumers"},
                    {k:"Manufacturing", d:"Produce & assemble goods"},
                    {k:"Food production", d:"Bakery, dairy, packaged food"},
                    {k:"Services",  d:"Professional or field services"},
                    {k:"Textiles",  d:"Garment & fabric production"},
                  ].map((b,i) => (
                    <div key={i} className="hairline" style={{padding:12, borderRadius:6, cursor:"pointer", background: i===0 ? "var(--ai-bg)" : "var(--surface)", borderColor: i===0 ? "var(--ai-line)": "var(--line)"}}>
                      <div style={{fontWeight:500, color:"var(--ink)"}}>{b.k}</div>
                      <div className="muted" style={{fontSize:11, marginTop:2}}>{b.d}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="col gap-12">
                <div className="label">Invite your team (optional)</div>
                {[
                  {n:"Malika Karimova", r:"Company admin", e:"malika@kamolot.uz"},
                  {n:"Bekzod Yusupov",  r:"Operator",     e:"bekzod@kamolot.uz"},
                ].map((p,i) => (
                  <div key={i} className="row hairline" style={{padding:10, borderRadius:6}}>
                    <div className="avatar sm green">{p.n.split(" ").map(w=>w[0]).join("")}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13, color:"var(--ink)"}}>{p.n}</div>
                      <div className="muted mono" style={{fontSize:11}}>{p.e}</div>
                    </div>
                    <div className="pill">{p.r}</div>
                    <button className="icon-btn"><Icon.X size={13}/></button>
                  </div>
                ))}
                <Button variant="ghost" size="sm" icon={<Icon.Plus size={13}/>}>Add another</Button>
              </div>
            )}
            {step === 3 && (
              <div>
                <div className="ai-card" style={{padding:14, marginBottom:12}}>
                  <span className="ai-tag"><Icon.Sparkle size={10}/> AI</span>
                  <div style={{fontWeight:500, color:"var(--ink)"}}>Recommended for you: Business OS Free</div>
                  <p className="muted" style={{fontSize:12, marginTop:4}}>
                    As a verified SQB Bank customer (TIN 301 452 776), you get the full platform at no cost.
                  </p>
                </div>
                <div className="grid grid-2" style={{gap:8}}>
                  <div className="hairline" style={{padding:14, borderRadius:6, borderColor:"var(--ink)", background:"var(--surface)", boxShadow:"0 0 0 1px var(--ink)"}}>
                    <div className="row"><div style={{fontWeight:500, color:"var(--ink)"}}>Business OS — Free</div><span className="sp"/><Pill tone="good" dot={false}>Selected</Pill></div>
                    <div className="num-md mt-4">0 <span className="mono muted" style={{fontSize:11}}>UZS / month</span></div>
                    <ul className="muted" style={{paddingLeft:16, fontSize:12, lineHeight:1.7}}>
                      <li>Unlimited inventory & invoices</li>
                      <li>AI Copilot · OCR · cash-flow analytics</li>
                      <li>24-hour loan decisions</li>
                      <li>Free for all SQB Bank SMB customers</li>
                    </ul>
                  </div>
                  <div className="hairline" style={{padding:14, borderRadius:6, opacity:0.7}}>
                    <div style={{fontWeight:500, color:"var(--ink)"}}>Premium (coming soon)</div>
                    <div className="num-md mt-4 muted">—</div>
                    <ul className="muted" style={{paddingLeft:16, fontSize:12, lineHeight:1.7}}>
                      <li>Multi-entity consolidation</li>
                      <li>Advanced API access</li>
                      <li>Dedicated success manager</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-foot">
            <Button variant="ghost" onClick={() => step === 0 ? go("/login") : setStep(step-1)}>
              <Icon.ChevLeft size={13}/> Back
            </Button>
            <span className="sp"/>
            {step < 3 ? (
              <Button variant="primary" onClick={() => setStep(step+1)}>Continue <Icon.Arrow size={13}/></Button>
            ) : (
              <Button variant="primary" onClick={() => go("/smb/home")}>Enter workspace <Icon.Arrow size={13}/></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginPage, OtpPage, ForgotPage, OnboardingPage });
