exports.id=8948,exports.ids=[8948],exports.modules={1971:()=>{},2554:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,8671,23)),Promise.resolve().then(c.t.bind(c,6542,23)),Promise.resolve().then(c.t.bind(c,8248,23)),Promise.resolve().then(c.t.bind(c,9743,23)),Promise.resolve().then(c.t.bind(c,6231,23)),Promise.resolve().then(c.t.bind(c,959,23)),Promise.resolve().then(c.t.bind(c,2041,23)),Promise.resolve().then(c.t.bind(c,5094,23)),Promise.resolve().then(c.t.bind(c,7487,23))},2722:(a,b,c)=>{Promise.resolve().then(c.t.bind(c,8365,23)),Promise.resolve().then(c.t.bind(c,4596,23)),Promise.resolve().then(c.t.bind(c,6186,23)),Promise.resolve().then(c.t.bind(c,7805,23)),Promise.resolve().then(c.t.bind(c,7561,23)),Promise.resolve().then(c.t.bind(c,7569,23)),Promise.resolve().then(c.t.bind(c,2747,23)),Promise.resolve().then(c.t.bind(c,6676,23)),Promise.resolve().then(c.bind(c,7225))},3702:()=>{},3950:()=>{},6035:(a,b,c)=>{"use strict";c.r(b),c.d(b,{default:()=>f,metadata:()=>e});var d=c(5939);c(1971);let e={title:"SQB Business OS | Company Portal",description:"Tenant-scoped ERP portal for warehouse, production, services, and compliance."};function f({children:a}){return(0,d.jsx)("html",{lang:"en",children:(0,d.jsx)("body",{style:{margin:0,fontFamily:"Inter, Arial, sans-serif",background:"#eef4f8"},children:a})})}},8564:(a,b,c)=>{"use strict";c.r(b),c.d(b,{AuthExperience:()=>q});var d=c(8157),e=c(1768);let f={login:{eyebrow:"Sign in",title:"Continue with password and OTP",description:"Use your assigned portal credentials. We will confirm access with a one-time code."},otp:{eyebrow:"Verification",title:"Enter the one-time code",description:"The code is bound to this login attempt and expires automatically."},forgot:{eyebrow:"Password recovery",title:"Request a reset link",description:"We will queue a reset notification for the account identifier you enter."},terms:{eyebrow:"Required consent",title:"Accept the current platform documents",description:"Access stays blocked until both acknowledgements are recorded on your active session."},onboarding:{eyebrow:"Workspace setup",title:"Create your company workspace",description:"Provision your tenant, team, and starter access in one guided flow."}},g=["Company","Business type","Team","Plan"],h=[{key:"Wholesale",detail:"Distribute goods to retailers"},{key:"Retail",detail:"Sell direct to consumers"},{key:"Manufacturing",detail:"Produce and assemble goods"},{key:"Food production",detail:"Bakery, dairy, packaged food"},{key:"Services",detail:"Professional or field services"},{key:"Textiles",detail:"Garment and fabric production"},{key:"Other",detail:"Enter a business type not listed above"}];async function i(a,b){let c=await fetch(a,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(b)}),d={};try{d=await c.json()}catch{d={}}return{ok:c.ok,status:c.status,body:d}}function j(a){if(!a)return 0;let b=Math.ceil((new Date(a).getTime()-Date.now())/1e3);return b>0?b:0}function k(a){let b=Math.floor(a/60);return`${b}:${String(a%60).padStart(2,"0")}`}function l(){return(0,d.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 16 16",className:"auth-input-icon",children:(0,d.jsx)("path",{d:"M2.5 4.25h11a.75.75 0 0 1 .75.75v6a.75.75 0 0 1-.75.75h-11a.75.75 0 0 1-.75-.75V5a.75.75 0 0 1 .75-.75Zm0 1.2V11h11V5.45L8.38 8.9a.75.75 0 0 1-.76 0L2.5 5.45Zm.73-.95L8 7.65l4.77-3.15H3.23Z",fill:"currentColor"})})}function m(){return(0,d.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 16 16",className:"auth-input-icon",children:(0,d.jsx)("path",{d:"M5.25 6V4.75a2.75 2.75 0 1 1 5.5 0V6h.75A1.5 1.5 0 0 1 13 7.5v4A1.5 1.5 0 0 1 11.5 13h-7A1.5 1.5 0 0 1 3 11.5v-4A1.5 1.5 0 0 1 4.5 6h.75Zm1.5 0h2.5V4.75a1.25 1.25 0 1 0-2.5 0V6Zm-2.25 1.5v4h7v-4h-7Z",fill:"currentColor"})})}function n(){return(0,d.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 16 16",className:"auth-input-icon",children:(0,d.jsx)("path",{d:"M2.5 8h9.4m0 0L8.6 4.7m3.3 3.3-3.3 3.3",fill:"none",stroke:"currentColor",strokeWidth:"1.4",strokeLinecap:"round",strokeLinejoin:"round"})})}function o(){return(0,d.jsx)("svg",{"aria-hidden":"true",viewBox:"0 0 16 16",className:"auth-input-icon",children:(0,d.jsx)("path",{d:"M4.4 2.6h2.5l1.2 3-1.5 1A8.6 8.6 0 0 0 9.4 9.4l1-1.5 3 1.2v2.5a1.3 1.3 0 0 1-1.3 1.3A10.5 10.5 0 0 1 3.1 3.9 1.3 1.3 0 0 1 4.4 2.6Z",fill:"currentColor"})})}function p(){return(0,d.jsxs)("div",{className:"row",style:{gap:10,marginBottom:24},children:[(0,d.jsx)("div",{className:"logo-mark",style:{width:28,height:28,fontSize:13},children:"S"}),(0,d.jsxs)("div",{children:[(0,d.jsxs)("div",{className:"logo-word",style:{fontSize:15},children:["SQB ",(0,d.jsx)("span",{className:"dim",children:"Business OS"})]}),(0,d.jsx)("div",{className:"mono",style:{fontSize:10,color:"var(--muted)",letterSpacing:"0.08em"},children:"YOUR BUSINESS. YOUR BANK. ONE PLATFORM."})]})]})}function q({mode:a,portalLabel:b,portalName:c,heroTitle:q,heroAccentText:r,heroDescription:s,heroPoints:t,stats:u,loginIntent:v,challengeStorageKey:w,termsVersion:x,accentStart:y,accentEnd:z,accentGlow:A,actorName:B,onCreateWorkspace:C,onSelectLoginIntent:D,navigate:E,replace:F,mapRedirectPath:G}){let[H,I]=(0,e.useState)(""),[J,K]=(0,e.useState)(""),[L,M]=(0,e.useState)(""),[N,O]=(0,e.useState)(!1),[P,Q]=(0,e.useState)(!1),[R,S]=(0,e.useState)(null),[T,U]=(0,e.useState)(0),[V,W]=(0,e.useState)("Kamolot Savdo LLC"),[X,Y]=(0,e.useState)("301 452 776"),[Z,$]=(0,e.useState)("Tashkent"),[_,aa]=(0,e.useState)("Mirobod district, Tashkent 100170"),[ab,ac]=(0,e.useState)("Wholesale"),[ad,ae]=(0,e.useState)(""),[af,ag]=(0,e.useState)([{name:"Malika Karimova",role:"Company admin",email:"malika@kamolot.uz"},{name:"Bekzod Yusupov",role:"Operator",email:"bekzod@kamolot.uz"}]),[ah,ai]=(0,e.useState)(!1),[aj,ak]=(0,e.useState)(null),[al,am]=(0,e.useState)(null),[an,ao]=(0,e.useState)(0),ap=(0,e.useRef)([]),aq=f[a],ar="bank_staff"===v?{identifierLabel:"Work email or phone",identifierPlaceholder:"name@company.com",passwordPlaceholder:"Enter your password",bottomPrompt:"Need access restored?",bottomAction:"Request reset",forgotLead:"Enter your work email or phone. We'll send you a reset link.",forgotLabel:"Work email or phone",forgotPlaceholder:"name@company.com"}:{identifierLabel:"Email or phone",identifierPlaceholder:"name@company.com",passwordPlaceholder:"Enter your password",bottomPrompt:"New to SQB Business OS?",bottomAction:"Create workspace",forgotLead:"Enter your email or phone. We'll send you a reset link.",forgotLabel:"Email or phone",forgotPlaceholder:"name@company.com"},as=(0,e.useMemo)(()=>j(R?.expiresAt),[R,an]),at=(0,e.useMemo)(()=>j(R?.resendAvailableAt),[R,an]);async function au(a){a.preventDefault(),ai(!0),ak(null),am(null);try{let a=await i("/api/auth/login/password",{loginIntent:v,identifier:H,password:J});if(a.ok&&a.body.session){let b=a.body.session.requiresTermsAcceptance?"/terms":G(a.body.session.redirectPath);F(b);return}if(a.body.challenge){a.body.challenge,F("/otp");return}ak(a.body.message??"Unable to start the verification challenge.")}catch{ak("Authentication request failed. Please try again.")}finally{ai(!1)}}async function av(a){if(a.preventDefault(),!R)return void ak("Your verification challenge was not found. Start again from login.");ai(!0),ak(null),am(null);try{let a=await i("/api/auth/otp/verify",{challengeId:R.challengeId,code:aA.join("")});if(a.ok&&a.body.session){let b=a.body.session.requiresTermsAcceptance?"/terms":G(a.body.session.redirectPath);F(b);return}ak(a.body.message??"The code could not be verified.")}catch{ak("Verification failed. Please try again.")}finally{ai(!1)}}async function aw(){if(R&&!(at>0)){ai(!0),ak(null),am(null);try{let a=await i("/api/auth/otp/request",{challengeId:R.challengeId});if(a.body.challenge){a.body.challenge,S(a.body.challenge),am("A fresh verification code was issued.");return}ak(a.body.message??"Unable to resend the verification code.")}catch{ak("Could not resend the verification code.")}finally{ai(!1)}}}async function ax(a){a.preventDefault(),ai(!0),ak(null),am(null);try{let a=await i("/api/auth/password/reset/request",{identifier:H});if(a.ok)return void am(a.body.message??"If the account exists, reset instructions have been queued.");ak(a.body.message??"Unable to queue the reset request.")}catch{ak("Password reset request failed. Please try again.")}finally{ai(!1)}}async function ay(a){if(a.preventDefault(),!N||!P)return void ak("Both acknowledgements are required before access can continue.");ai(!0),ak(null),am(null);try{let a=await i("/api/auth/terms/accept",{documentType:"terms_of_service",acceptedVersion:x}),b=await i("/api/auth/terms/accept",{documentType:"privacy_notice",acceptedVersion:x}),c=b.body.session??a.body.session;if(!a.ok||!b.ok||!c)return void ak(b.body.message??a.body.message??"Unable to record consent.");F(G(c.redirectPath))}catch{ak("Consent submission failed. Please try again.")}finally{ai(!1)}}function az(){M(""),F("/login")}let aA=L.padEnd(6," ").slice(0,6).split("").map(a=>a.trim()),aB=af.map(a=>({name:a.name.trim(),role:a.role.trim(),email:a.email.trim().toLowerCase()})).filter(a=>a.name||a.role||a.email),aC=(0,d.jsxs)(d.Fragment,{children:[q," ",r?(0,d.jsx)("span",{children:r}):null]});function aD(a=T){if(0===a&&(!V.trim()||!X.trim()||!Z.trim()||!_.trim()))return"Please complete company name, TIN, region, and address.";if(1===a&&"Other"===ab&&!ad.trim())return"Please enter your business type.";if(2===a){if(aB.find(a=>!a.name||!a.role||!a.email))return"Each team row must include name, role, and email, or be removed.";let a=aB.find(a=>{var b;return b=a.email,!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b)});if(a)return`Invite email is invalid: ${a.email}`;let b=new Set;for(let a of aB){if(b.has(a.email))return`Duplicate invite email detected: ${a.email}`;b.add(a.email)}}return""}function aE(){let a=aD();if(a)return void ak(a);ak(null),U(a=>a+1)}async function aF(){let a=aD();if(a)return void ak(a);ai(!0),ak(null),am(null);try{let a=await i("/api/tenants/onboarding",{companyName:V,tin:X,region:Z,address:_,businessType:"Other"===ab?ad.trim()||"Other":ab,invites:aB,plan:"business_os_free"});if(a.ok&&a.body.session){let b=a.body.session.requiresTermsAcceptance?"/terms":G(a.body.session.redirectPath);F(b);return}ak(a.body.message??"Unable to create workspace.")}catch{ak("Workspace creation failed. Please try again.")}finally{ai(!1)}}function aG(){return"login"===a?(0,d.jsx)("form",{onSubmit:au,children:(0,d.jsxs)("div",{className:"col gap-12",children:[(0,d.jsxs)("div",{className:"field",children:[(0,d.jsx)("label",{children:ar.identifierLabel}),(0,d.jsxs)("div",{className:"input-wrap",children:[(0,d.jsx)("span",{className:"prefix",children:(0,d.jsx)(l,{})}),(0,d.jsx)("input",{className:"input with-prefix",autoComplete:"username",placeholder:ar.identifierPlaceholder,required:!0,value:H,onChange:a=>I(a.target.value)})]})]}),(0,d.jsxs)("div",{className:"field",children:[(0,d.jsx)("label",{children:"Password"}),(0,d.jsxs)("div",{className:"input-wrap",children:[(0,d.jsx)("span",{className:"prefix",children:(0,d.jsx)(m,{})}),(0,d.jsx)("input",{className:"input with-prefix with-suffix",type:"password",autoComplete:"current-password",placeholder:ar.passwordPlaceholder,required:!0,value:J,onChange:a=>K(a.target.value)}),(0,d.jsx)("button",{className:"auth-inline-link suffix",onClick:()=>E("/forgot"),type:"button",children:"Forgot?"})]})]}),(0,d.jsxs)("button",{className:"btn primary block",disabled:ah,type:"submit",children:[ah?"Starting verification...":"Continue"," ",(0,d.jsx)(n,{})]}),(0,d.jsxs)("div",{className:"row",style:{justifyContent:"center",gap:6,color:"var(--muted)",fontSize:12},children:[ar.bottomPrompt,"bank_staff"===v?(0,d.jsx)("button",{className:"auth-inline-link",onClick:()=>E("/forgot"),type:"button",children:ar.bottomAction}):(0,d.jsx)("button",{className:"auth-inline-link",onClick:()=>{if(C)return void C();E("/onboarding")},type:"button",children:ar.bottomAction})]})]})}):"otp"===a?(0,d.jsxs)("form",{onSubmit:av,children:[(0,d.jsxs)("div",{className:"row",style:{gap:10,marginBottom:14},children:[(0,d.jsx)("div",{className:"avatar warm",style:{background:"var(--ai-bg)",color:"var(--ai)"},children:(0,d.jsx)(o,{})}),(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{style:{fontWeight:500,color:"var(--ink)"},children:"Verify your phone"}),(0,d.jsxs)("div",{className:"muted",style:{fontSize:12},children:["We sent a 6-digit code to ",R?.maskedPhone??"Unavailable"]})]})]}),(0,d.jsx)("div",{className:"row",style:{gap:8,justifyContent:"space-between",marginTop:16},children:aA.map((a,b)=>(0,d.jsx)("input",{ref:a=>{ap.current[b]=a},className:"input mono",style:{width:46,height:52,fontSize:22,textAlign:"center",fontWeight:500},value:a,inputMode:"numeric",autoComplete:0===b?"one-time-code":"off",maxLength:1,onChange:a=>(function(a,b){let c=b.replace(/\D/g,"").slice(-1),d=L.padEnd(6," ").slice(0,6).split("");d[a]=c||"",M(d.join("")),c&&ap.current[a+1]&&ap.current[a+1]?.focus()})(b,a.target.value),onKeyDown:c=>{"Backspace"===c.key&&!a&&ap.current[b-1]&&ap.current[b-1]?.focus()}},b))}),(0,d.jsxs)("div",{className:"row mt-16",style:{justifyContent:"space-between",fontSize:12},children:[(0,d.jsxs)("span",{className:"muted",children:["Didn't get it?"," ",(0,d.jsx)("button",{className:"auth-inline-link",disabled:ah||!R||at>0,onClick:aw,type:"button",children:at>0?`Resend in ${k(at)}`:"Resend code"})]}),(0,d.jsx)("button",{className:"auth-back-link",onClick:az,type:"button",children:"Back"})]}),(0,d.jsxs)("div",{className:"auth-message",style:{display:"flex",justifyContent:"space-between",marginTop:12},children:[(0,d.jsxs)("span",{children:["Expires in: ",(0,d.jsx)("strong",{children:R?k(as):"0:00"})]}),(0,d.jsxs)("span",{children:["Attempts left: ",(0,d.jsx)("strong",{children:R?.attemptsRemaining??"-"})]})]}),(0,d.jsxs)("button",{className:"btn primary block mt-16",disabled:ah||!R||aA.some(a=>!a),type:"submit",children:[ah?"Verifying...":"Verify and sign in"," ",(0,d.jsx)(n,{})]})]}):"forgot"===a?(0,d.jsx)("form",{onSubmit:ax,children:al?(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("div",{className:"banner good",children:(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"title",children:"Check your email"}),(0,d.jsx)("div",{className:"desc",children:al})]})}),(0,d.jsx)("button",{className:"btn primary block mt-16",onClick:()=>F("/login"),type:"button",children:"Back to sign in"})]}):(0,d.jsxs)(d.Fragment,{children:[(0,d.jsx)("h2",{style:{margin:"0 0 4px",fontSize:16},children:"Reset password"}),(0,d.jsx)("p",{className:"muted",style:{fontSize:12,marginTop:0},children:ar.forgotLead}),(0,d.jsxs)("div",{className:"field mt-16",children:[(0,d.jsx)("label",{children:ar.forgotLabel}),(0,d.jsx)("input",{className:"input",autoComplete:"email",placeholder:ar.forgotPlaceholder,required:!0,value:H,onChange:a=>I(a.target.value)})]}),(0,d.jsxs)("div",{className:"row mt-16",style:{gap:8},children:[(0,d.jsx)("button",{className:"btn ghost",onClick:()=>F("/login"),type:"button",children:"Cancel"}),(0,d.jsx)("span",{className:"sp"}),(0,d.jsx)("button",{className:"btn primary",disabled:ah,type:"submit",children:ah?"Sending...":"Send reset link"})]})]})}):"onboarding"===a?(0,d.jsx)(d.Fragment,{children:(0,d.jsxs)("div",{className:"card",children:[(0,d.jsxs)("div",{className:"card-head",children:[(0,d.jsxs)("div",{className:"eyebrow",children:["Workspace setup - Step ",T+1," of 4"]}),(0,d.jsx)("span",{className:"sp"}),(0,d.jsx)("div",{className:"mono",style:{fontSize:11,color:"var(--muted)"},children:"~ 3 min"})]}),(0,d.jsx)("div",{style:{padding:"0 14px"},children:(0,d.jsx)("div",{className:"row",style:{gap:4,padding:"10px 0"},children:g.map((a,b)=>(0,d.jsxs)("div",{style:{flex:1,display:"flex",alignItems:"center",gap:6,fontSize:11,color:b<=T?"var(--ink)":"var(--muted)"},children:[(0,d.jsx)("span",{className:"mono",style:{width:18,height:18,borderRadius:"50%",display:"grid",placeItems:"center",background:b<T?"var(--ink)":b===T?"var(--ai-bg)":"var(--bg)",color:b<T?"var(--surface)":b===T?"var(--ai)":"var(--muted)",border:`1px solid ${b===T?"var(--ai-line)":"var(--line)"}`,fontSize:10},children:b<T?"✓":b+1}),(0,d.jsx)("span",{children:a}),b<g.length-1?(0,d.jsx)("span",{style:{flex:1,height:1,background:"var(--line)"}}):null]},a))})}),(0,d.jsxs)("div",{className:"card-body",children:[0===T?(0,d.jsxs)("div",{className:"col gap-12",children:[(0,d.jsxs)("div",{className:"field",children:[(0,d.jsx)("label",{children:"Company name"}),(0,d.jsx)("input",{className:"input",value:V,onChange:a=>W(a.target.value)})]}),(0,d.jsxs)("div",{className:"grid grid-2",children:[(0,d.jsxs)("div",{className:"field",children:[(0,d.jsx)("label",{children:"TIN / Tax ID"}),(0,d.jsx)("input",{className:"input mono",value:X,onChange:a=>Y(a.target.value)})]}),(0,d.jsxs)("div",{className:"field",children:[(0,d.jsx)("label",{children:"Region"}),(0,d.jsxs)("select",{className:"select",value:Z,onChange:a=>$(a.target.value),children:[(0,d.jsx)("option",{children:"Tashkent"}),(0,d.jsx)("option",{children:"Samarkand"}),(0,d.jsx)("option",{children:"Bukhara"})]})]})]}),(0,d.jsxs)("div",{className:"field",children:[(0,d.jsx)("label",{children:"Address"}),(0,d.jsx)("input",{className:"input",value:_,onChange:a=>aa(a.target.value)})]})]}):null,1===T?(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"label mb-8",children:"Primary business type - pick one"}),(0,d.jsx)("div",{className:"grid grid-3",style:{gap:8},children:h.map(a=>(0,d.jsxs)("div",{className:"hairline",onClick:()=>ac(a.key),style:{padding:12,borderRadius:6,cursor:"pointer",background:ab===a.key?"var(--ai-bg)":"var(--surface)",borderColor:ab===a.key?"var(--ai-line)":"var(--line)"},children:[(0,d.jsx)("div",{style:{fontWeight:500,color:"var(--ink)"},children:a.key}),(0,d.jsx)("div",{className:"muted",style:{fontSize:11,marginTop:2},children:a.detail})]},a.key))}),"Other"===ab?(0,d.jsxs)("div",{className:"field mt-16",children:[(0,d.jsx)("label",{children:"Enter business type"}),(0,d.jsx)("input",{className:"input",value:ad,onChange:a=>ae(a.target.value),placeholder:"e.g. Logistics, Agriculture, Construction"})]}):null]}):null,2===T?(0,d.jsxs)("div",{className:"col gap-12",children:[(0,d.jsx)("div",{className:"label",children:"Invite your team (optional)"}),af.map((a,b)=>(0,d.jsxs)("div",{className:"row hairline",style:{padding:10,borderRadius:6},children:[(0,d.jsx)("div",{className:"avatar sm green",children:a.name.split(" ").filter(Boolean).map(a=>a[0]).join("").slice(0,2)||"NA"}),(0,d.jsxs)("div",{style:{flex:1,display:"grid",gap:8},children:[(0,d.jsx)("input",{className:"input",value:a.name,onChange:a=>{ag(c=>c.map((c,d)=>d===b?{...c,name:a.target.value}:c))},placeholder:"Full name"}),(0,d.jsxs)("div",{className:"grid grid-2",children:[(0,d.jsx)("input",{className:"input mono",value:a.email,onChange:a=>{ag(c=>c.map((c,d)=>d===b?{...c,email:a.target.value}:c))},placeholder:"Email"}),(0,d.jsxs)("select",{className:"select",value:a.role,onChange:a=>{ag(c=>c.map((c,d)=>d===b?{...c,role:a.target.value}:c))},children:[(0,d.jsx)("option",{children:"Company admin"}),(0,d.jsx)("option",{children:"Operator"}),(0,d.jsx)("option",{children:"Accountant"}),(0,d.jsx)("option",{children:"Warehouse manager"})]})]})]}),(0,d.jsx)("button",{className:"icon-btn",onClick:()=>ag(a=>a.filter((a,c)=>c!==b)),type:"button",children:"\xd7"})]},`${a.email}-${b}`)),(0,d.jsx)("button",{className:"btn ghost sm",onClick:()=>ag(a=>[...a,{name:"",role:"Operator",email:""}]),type:"button",children:"Add another"})]}):null,3===T?(0,d.jsxs)("div",{children:[(0,d.jsxs)("div",{className:"ai-card",style:{padding:14,marginBottom:12},children:[(0,d.jsx)("span",{className:"ai-tag",children:"AI"}),(0,d.jsx)("div",{style:{fontWeight:500,color:"var(--ink)"},children:"Recommended for you: Business OS Free"}),(0,d.jsxs)("p",{className:"muted",style:{fontSize:12,marginTop:4},children:["As a verified SQB Bank customer (TIN ",X||"301 452 776","), you get the full platform at no cost."]})]}),(0,d.jsxs)("div",{className:"grid grid-2",style:{gap:8},children:[(0,d.jsxs)("div",{className:"hairline",style:{padding:14,borderRadius:6,borderColor:"var(--ink)",background:"var(--surface)",boxShadow:"0 0 0 1px var(--ink)"},children:[(0,d.jsxs)("div",{className:"row",children:[(0,d.jsx)("div",{style:{fontWeight:500,color:"var(--ink)"},children:"Business OS - Free"}),(0,d.jsx)("span",{className:"sp"}),(0,d.jsx)("span",{className:"pill good",children:"Selected"})]}),(0,d.jsxs)("div",{className:"num-md mt-4",children:["0 ",(0,d.jsx)("span",{className:"mono muted",style:{fontSize:11},children:"UZS / month"})]}),(0,d.jsxs)("ul",{className:"muted",style:{paddingLeft:16,fontSize:12,lineHeight:1.7},children:[(0,d.jsx)("li",{children:"Unlimited inventory and invoices"}),(0,d.jsx)("li",{children:"AI Copilot, OCR, and cash-flow analytics"}),(0,d.jsx)("li",{children:"24-hour loan decisions"}),(0,d.jsx)("li",{children:"Free for all SQB Bank SMB customers"})]})]}),(0,d.jsxs)("div",{className:"hairline",style:{padding:14,borderRadius:6,opacity:.7},children:[(0,d.jsx)("div",{style:{fontWeight:500,color:"var(--ink)"},children:"Premium (coming soon)"}),(0,d.jsx)("div",{className:"num-md mt-4 muted",children:"-"}),(0,d.jsxs)("ul",{className:"muted",style:{paddingLeft:16,fontSize:12,lineHeight:1.7},children:[(0,d.jsx)("li",{children:"Multi-entity consolidation"}),(0,d.jsx)("li",{children:"Advanced API access"}),(0,d.jsx)("li",{children:"Dedicated success manager"})]})]})]})]}):null]}),aj?(0,d.jsx)("div",{className:"muted",style:{fontSize:12,color:"var(--bad)",padding:"0 14px 12px"},children:aj}):null,(0,d.jsxs)("div",{className:"modal-foot",children:[(0,d.jsx)("button",{className:"btn ghost",onClick:()=>0===T?F("/login"):U(a=>a-1),type:"button",children:"Back"}),(0,d.jsx)("span",{className:"sp"}),T<3?(0,d.jsx)("button",{className:"btn primary",onClick:aE,type:"button",children:"Continue"}):(0,d.jsx)("button",{className:"btn primary",onClick:aF,disabled:ah,type:"button",children:ah?"Creating...":"Enter workspace"})]})]})}):(0,d.jsxs)("form",{onSubmit:ay,style:{display:"grid",gap:"16px"},children:[(0,d.jsxs)("div",{style:{padding:"14px",borderRadius:"var(--r-2)",background:"var(--surface-2)",border:"1px solid var(--line)"},children:[(0,d.jsx)("h3",{style:{margin:"0 0 4px",fontSize:"14px",color:"var(--ink)"},children:"Terms of service"}),(0,d.jsxs)("p",{style:{margin:0,color:"var(--muted)",fontSize:"13px"},children:["Covers platform access, acceptable use, tenant responsibilities, and audit requirements. Version ",x,"."]}),(0,d.jsxs)("label",{style:{display:"flex",gap:"8px",alignItems:"flex-start",marginTop:"12px",color:"var(--fg)",cursor:"pointer"},children:[(0,d.jsx)("input",{type:"checkbox",checked:N,onChange:a=>O(a.target.checked),style:{marginTop:"2px"}}),(0,d.jsx)("span",{style:{fontSize:"13px"},children:"I have reviewed and accept the current terms of service."})]})]}),(0,d.jsxs)("div",{style:{padding:"14px",borderRadius:"var(--r-2)",background:"var(--surface-2)",border:"1px solid var(--line)"},children:[(0,d.jsx)("h3",{style:{margin:"0 0 4px",fontSize:"14px",color:"var(--ink)"},children:"Privacy notice"}),(0,d.jsxs)("p",{style:{margin:0,color:"var(--muted)",fontSize:"13px"},children:["Explains how SQB processes identity, OTP, audit, and workspace data. Version ",x,"."]}),(0,d.jsxs)("label",{style:{display:"flex",gap:"8px",alignItems:"flex-start",marginTop:"12px",color:"var(--fg)",cursor:"pointer"},children:[(0,d.jsx)("input",{type:"checkbox",checked:P,onChange:a=>Q(a.target.checked),style:{marginTop:"2px"}}),(0,d.jsx)("span",{style:{fontSize:"13px"},children:"I have reviewed and accept the current privacy notice."})]})]}),(0,d.jsxs)("div",{className:"auth-message",children:["Signing as: ",(0,d.jsx)("strong",{style:{color:"var(--ink)"},children:B??c})]}),(0,d.jsx)("button",{className:"btn primary",disabled:ah,type:"submit",style:{width:"100%",marginTop:"8px"},children:ah?"Recording consent...":"Accept and continue"})]})}return(0,d.jsxs)("div",{style:{minHeight:"100vh",background:"var(--bg)","--accent-start":y,"--accent-end":z,"--accent-glow":A},children:[(0,d.jsx)("style",{dangerouslySetInnerHTML:{__html:`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --bg: #f6f5f1;
  --surface: #ffffff;
  --surface-2: #fbfaf6;
  --ink: #0e2a47;
  --ink-2: #1a2b42;
  --fg: #0b1220;
  --fg-2: #36404f;
  --muted: #6a7382;
  --muted-2: #8a909b;
  --line: #e4e2dd;
  --line-2: #edebe5;
  --hover: #f0ede6;
  --grid: #f1eee8;
  --good: #1f7a4d;
  --good-bg: #e8f2ec;
  --warn: #a66a10;
  --warn-bg: #fbf1dc;
  --bad: #b0351d;
  --bad-bg: #f7e4de;
  --info: #27557a;
  --info-bg: #e5eef5;
  --ai: #d18a2b;
  --ai-bg: #fbf3e3;
  --ai-line: #ecd8a8;
  --r-1: 4px;
  --r-2: 6px;
  --r-3: 8px;
  --shadow-1: 0 1px 0 rgba(14, 42, 71, 0.04), 0 1px 2px rgba(14, 42, 71, 0.04);
  --shadow-2: 0 1px 0 rgba(14, 42, 71, 0.05), 0 6px 16px rgba(14, 42, 71, 0.06);
  --shadow-3: 0 2px 0 rgba(14, 42, 71, 0.04), 0 18px 40px rgba(14, 42, 71, 0.12);
  --sans: 'IBM Plex Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  --nav-w: 232px;
  --topbar-h: 48px;
}

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  min-height: 100%;
  background: var(--bg);
}

body {
  font-family: var(--sans);
  font-size: 13px;
  line-height: 1.45;
  color: var(--fg);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

button,
input,
select,
textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

a {
  color: inherit;
  text-decoration: none;
}

h1,
h2,
h3,
h4,
p {
  margin: 0;
}

.mono {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}

.eyebrow,
.section-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sp {
  flex: 1;
}

.gap-12 {
  gap: 12px;
}

.mt-16 {
  margin-top: 16px;
}

.mt-4 {
  margin-top: 4px;
}

.mb-8 {
  margin-bottom: 8px;
}

.muted {
  color: var(--muted);
}

.dim {
  color: var(--muted-2);
}

.num-md {
  font-size: 16px;
  font-weight: 500;
  color: var(--ink);
  font-variant-numeric: tabular-nums;
}

.logo-mark {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  background: var(--ink);
  color: var(--surface);
  display: grid;
  place-items: center;
  font-family: var(--mono);
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
}

.logo-word {
  font-weight: 600;
  letter-spacing: 0.02em;
  font-size: 13px;
  color: var(--ink);
}

.logo-word .dim {
  color: var(--muted);
  font-weight: 500;
}

.surface-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  padding: 2px;
}

.surface-switch button {
  padding: 5px 8px;
  font-size: 11px;
  border-radius: 4px;
  color: var(--muted);
  font-family: var(--mono);
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 0;
  background: transparent;
}

.surface-switch button.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-1);
}

.auth-bg {
  min-height: 100vh;
  background: var(--bg);
  display: grid;
  place-items: center;
  padding: 40px 20px;
}

.auth-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  width: min(1000px, 92vw);
  align-items: center;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--ink);
  color: var(--surface);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--mono);
  flex: 0 0 28px;
}

.avatar.sm {
  width: 22px;
  height: 22px;
  font-size: 10px;
  flex-basis: 22px;
}

.avatar.green {
  background: #2e5b3e;
}

.hairline {
  border: 1px solid var(--line);
}

.label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.icon-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--r-2);
  display: grid;
  place-items: center;
  color: var(--muted);
  border: 0;
  background: transparent;
}

.icon-btn:hover {
  background: var(--hover);
  color: var(--ink);
}

.shell-page {
  display: grid;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 14px;
  margin-bottom: 2px;
  border-bottom: 1px solid var(--line);
}

.page-head h1 {
  margin-top: 4px;
  font-size: 20px;
  font-weight: 600;
  color: var(--ink);
  letter-spacing: -0.01em;
}

.page-head .sub {
  margin-top: 4px;
  color: var(--muted);
  font-size: 12.5px;
}

.page-head-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  padding: 6px 11px;
  background: var(--surface);
  color: var(--ink);
  white-space: nowrap;
  transition:
    background 80ms ease,
    color 80ms ease,
    border-color 80ms ease;
}

.btn:hover {
  background: var(--hover);
}

.btn.primary {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--surface);
}

.btn.primary:hover {
  background: var(--ink-2);
}

.btn.block {
  display: flex;
  width: 100%;
  justify-content: center;
}

.btn.ghost {
  border-color: transparent;
  background: transparent;
  color: var(--fg-2);
}

.btn.ai {
  border-color: var(--ai-line);
  background: var(--ai-bg);
  color: var(--ai);
}

.grid {
  display: grid;
  gap: 12px;
}

.grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.grid-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.grid-4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}

.card,
.panel,
.table-card,
.focus-card {
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--surface);
  box-shadow: var(--shadow-1);
}

.panel-title,
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
}

.card-body,
.panel-body {
  padding: 14px;
}

.card-head {
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12.5px;
  color: var(--ink);
  font-weight: 500;
}

.focus-card {
  border-left: 2px solid var(--ai);
}

.ai-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-left: 2px solid var(--ai);
  border-radius: var(--r-2);
  position: relative;
}

.ai-tag {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ai);
  background: var(--ai-bg);
  border: 1px solid var(--ai-line);
  padding: 1px 6px;
  border-radius: 10px;
}

.story-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr 1fr;
  gap: 12px;
}

.story-card {
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: linear-gradient(180deg, #ffffff, #f8f6f1);
  padding: 14px;
}

.story-card.emphasis {
  background:
    radial-gradient(circle at top right, rgba(209, 138, 43, 0.16), transparent 42%),
    linear-gradient(180deg, #ffffff, #fbf3e3);
}

.story-card strong {
  display: block;
  margin: 10px 0 6px;
  color: var(--ink);
  font-size: 28px;
  letter-spacing: -0.03em;
}

.action-stack,
.info-list,
.feed-list {
  display: grid;
  gap: 8px;
}

.action-item,
.attention-item,
.feed-item,
.inventory-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--surface);
  padding: 12px;
}

.action-item {
  align-items: center;
}

.action-copy,
.feed-copy,
.inventory-copy {
  display: grid;
  gap: 4px;
}

.action-title,
.feed-title,
.inventory-copy strong {
  color: var(--ink);
  font-weight: 500;
}

.action-note,
.feed-copy p,
.inventory-copy p,
.muted-copy {
  color: var(--muted);
  font-size: 12px;
}

.action-icon,
.feed-icon,
.mini-mark {
  display: inline-grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--mono);
  font-size: 11px;
}

.action-icon.ai,
.mini-mark.ai {
  background: var(--ai-bg);
  color: var(--ai);
}

.trend-chart {
  padding: 18px;
  border-radius: var(--r-2);
  background:
    linear-gradient(180deg, rgba(233, 238, 243, 0.6), rgba(246, 241, 232, 0.45));
}

.trend-bars {
  display: flex;
  align-items: end;
  gap: 10px;
  height: 180px;
}

.trend-bars span {
  flex: 1;
  border-radius: 12px 12px 4px 4px;
  background: linear-gradient(180deg, rgba(14, 42, 71, 0.85), rgba(209, 138, 43, 0.55));
}

.trend-labels {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
}

.pill,
.status-pill,
.score-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 2px 8px;
  font-family: var(--mono);
  font-size: 11px;
}

.status-pill {
  border: 1px solid transparent;
}

.status-pill.good,
.score-pill.good {
  background: var(--good-bg);
  color: var(--good);
}

.status-pill.warn,
.score-pill.warn {
  background: var(--warn-bg);
  color: var(--warn);
}

.status-pill.bad,
.score-pill.bad {
  background: var(--bad-bg);
  color: var(--bad);
}

.status-pill.ai {
  border-color: var(--ai-line);
  background: var(--ai-bg);
  color: var(--ai);
}

.score-pill {
  border-radius: var(--r-2);
  padding: 2px 6px 2px 3px;
  border: 1px solid var(--line);
}

.score-pill .num {
  border-radius: 4px;
  padding: 0 4px;
  background: currentColor;
  color: var(--surface);
}

.banner {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: var(--r-2);
  padding: 10px 12px;
}

.banner.warn {
  background: var(--warn-bg);
  color: var(--warn);
}

.banner.bad {
  background: var(--bad-bg);
  color: var(--bad);
}

.banner.info {
  background: var(--info-bg);
  color: var(--info);
}

.banner.ai {
  border: 1px solid var(--ai-line);
  background: var(--ai-bg);
  color: var(--fg);
}

.banner.good {
  background: var(--good-bg);
  color: var(--good);
}

.banner .title {
  font-weight: 500;
  color: inherit;
}

.banner .desc {
  margin-top: 2px;
  font-size: 12px;
  color: inherit;
  opacity: 0.9;
}

.metric-note {
  color: var(--muted);
  font-size: 12px;
}

.table-toolbar .spacer,
.panel-title .spacer,
.page-head .spacer {
  flex: 1;
}

.table-chip-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  padding: 4px 8px;
  background: var(--surface);
  color: var(--fg-2);
}

.chip.active {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--surface);
}

.field {
  display: grid;
  gap: 4px;
}

.field label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.input,
.select {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  min-height: 36px;
  padding: 8px 10px;
  background: var(--surface);
  color: var(--fg);
  outline: none;
  line-height: 1.25;
}

.input:focus,
.select:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgba(14, 42, 71, 0.08);
}

.input::placeholder {
  color: var(--muted-2);
  opacity: 1;
}

.input-wrap {
  position: relative;
}

.input-wrap .prefix,
.input-wrap .suffix {
  position: absolute;
  top: 0;
  height: 100%;
  display: inline-flex;
  align-items: center;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
}

.input-wrap .prefix {
  left: 12px;
}

.input-wrap .suffix {
  right: 12px;
}

.input.with-prefix {
  padding-left: 38px;
}

.input.mono {
  font-family: var(--mono);
  font-variant-numeric: tabular-nums;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table thead th {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-2);
  text-align: left;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.table tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--line-2);
  color: var(--fg);
}

.table tbody tr:last-child td {
  border-bottom: 0;
}

.table tbody tr:hover td {
  background: var(--hover);
}

.text-right {
  text-align: right;
}

.auth-layout {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 40px 20px;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--accent-glow) 14%, transparent) 0, transparent 36%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.45), rgba(246, 245, 241, 0.9));
}

.auth-layout::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid) 1px, transparent 1px);
  background-size: 32px 32px;
  opacity: 0.2;
  pointer-events: none;
}

.auth-shell {
  display: grid;
  grid-template-columns: 1.05fr minmax(360px, 420px);
  gap: 60px;
  width: min(1000px, 92vw);
  align-items: center;
  position: relative;
  z-index: 1;
}

.auth-copy {
  display: grid;
  gap: 18px;
}

.auth-brand {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.auth-brand-copy {
  display: grid;
  gap: 4px;
}

.auth-logo-mark {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  background: var(--ink);
  color: var(--surface);
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
}

.auth-brand-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.auth-portal-pill {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--fg-2);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.auth-brand-tagline {
  color: var(--muted);
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.auth-title {
  max-width: 460px;
  color: var(--ink);
  font-size: 32px;
  font-weight: 500;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.auth-title span {
  color: var(--ai);
}

.auth-summary {
  max-width: 380px;
  color: var(--muted);
  font-size: 13px;
}

.auth-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  padding-top: 10px;
}

.auth-stat strong {
  display: block;
  color: var(--ink);
  font-size: 20px;
}

.auth-stat span {
  color: var(--muted);
  font-size: 12px;
}

.auth-card {
  border: 1px solid var(--line);
  border-radius: var(--r-3);
  background: var(--surface);
  padding: 28px;
  box-shadow: var(--shadow-3);
}

.auth-card-copy {
  display: grid;
  gap: 4px;
  margin: 10px 0 16px;
}

.auth-card-copy h2 {
  margin: 0;
  font-size: 16px;
  color: var(--ink);
}

.auth-card-copy p {
  color: var(--muted);
  font-size: 12px;
}

.auth-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px;
  margin: 0 0 16px;
  padding: 2px;
  border: 1px solid var(--line);
  border-radius: var(--r-2);
  background: var(--bg);
}

.auth-switch button {
  border: 0;
  border-radius: 4px;
  padding: 6px 8px;
  background: transparent;
  color: var(--muted);
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.auth-switch button.active {
  background: var(--surface);
  color: var(--ink);
  box-shadow: var(--shadow-1);
}

.auth-form {
  display: grid;
  gap: 16px;
}

.auth-message {
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
}

.auth-message.strong {
  color: var(--ai);
}

.otp-box {
  display: grid;
  gap: 12px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}

.auth-input-icon {
  width: 14px;
  height: 14px;
  color: var(--muted);
  display: block;
}

.input-wrap .auth-input-icon {
  color: var(--muted);
}

.input.with-suffix {
  padding-right: 78px;
}

.auth-inline-link {
  border: 0;
  background: transparent;
  color: var(--ink);
  padding: 0;
  font-size: 12px;
}

.auth-inline-link:hover {
  color: var(--ink-2);
}

.auth-inline-link:disabled {
  color: var(--muted);
  cursor: not-allowed;
}

.auth-back-link {
  border: 0;
  background: transparent;
  color: var(--muted);
  padding: 0;
  font-size: 12px;
}

.auth-back-link:hover {
  color: var(--ink);
}

.auth-footer-note {
  text-align: center;
  color: var(--muted);
  font-size: 12px;
}

.modal-foot {
  padding: 12px 16px;
  border-top: 1px solid var(--line);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.placeholder-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 12px;
}

.placeholder-actions {
  display: grid;
  gap: 8px;
}

.placeholder-actions .action-item {
  cursor: default;
}

.empty-state {
  display: grid;
  gap: 10px;
  place-items: center;
  padding: 48px 20px;
  border: 1px dashed var(--line);
  border-radius: var(--r-2);
  background: var(--surface-2);
  text-align: center;
}

.empty-state h3 {
  color: var(--ink);
  font-size: 18px;
}

.empty-state p {
  max-width: 48ch;
  color: var(--muted);
}

@media (max-width: 1200px) {
  .grid-4,
  .story-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .placeholder-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .auth-grid,
  .auth-shell,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .auth-copy {
    order: 2;
  }

  .auth-card {
    order: 1;
  }
}

@media (max-width: 780px) {
  .grid-2,
  .grid-3,
  .grid-4 {
    grid-template-columns: 1fr;
  }

  .page-head,
  .page-head-actions,
  .action-item,
  .attention-item,
  .feed-item,
  .inventory-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .page-head-actions {
    width: 100%;
    margin-left: 0;
    justify-content: flex-start;
  }
}
`}}),"login"===a?(0,d.jsx)("section",{className:"auth-bg",children:(0,d.jsxs)("div",{className:"auth-grid",children:[(0,d.jsxs)("div",{children:[(0,d.jsx)(p,{}),(0,d.jsx)("div",{className:"auth-title",style:{maxWidth:420},children:aC}),(0,d.jsx)("p",{className:"muted",style:{marginTop:16,maxWidth:380,fontSize:13},children:s}),(0,d.jsx)("div",{className:"row",style:{gap:24,marginTop:32,fontSize:12},children:u.map(a=>(0,d.jsxs)("div",{children:[(0,d.jsx)("div",{className:"num-md",children:a.value}),(0,d.jsx)("div",{className:"muted",children:a.label})]},a.label))})]}),(0,d.jsxs)("div",{className:"auth-card",children:[(0,d.jsx)("div",{className:"eyebrow mb-8",children:aq.eyebrow}),(0,d.jsxs)("div",{className:"surface-switch",style:{margin:0,marginBottom:16},children:[(0,d.jsx)("button",{type:"button",className:"smb_customer"===v?"active":"",onClick:()=>{"smb_customer"!==v&&D?.("smb_customer")},children:"SMB customer"}),(0,d.jsx)("button",{type:"button",className:"bank_staff"===v?"active":"",onClick:()=>{"bank_staff"!==v&&D?.("bank_staff")},children:"Bank staff"})]}),aj?(0,d.jsx)("div",{className:"banner bad",style:{marginBottom:16},children:aj}):null,al?(0,d.jsx)("div",{className:"banner info",style:{marginBottom:16},children:al}):null,aG()]})]})}):"otp"===a||"forgot"===a?(0,d.jsx)("section",{className:"auth-bg",children:(0,d.jsxs)("div",{className:"auth-card",children:[(0,d.jsx)(p,{}),"otp"!==a||R?null:(0,d.jsx)("div",{className:"auth-message",style:{marginBottom:16},children:"Your verification challenge is missing or expired. Return to login to start a new session."}),aj?(0,d.jsx)("div",{className:"banner bad",style:{marginBottom:16},children:aj}):null,al&&"forgot"!==a?(0,d.jsx)("div",{className:"banner info",style:{marginBottom:16},children:al}):null,aG()]})}):"onboarding"===a?(0,d.jsx)("section",{className:"auth-bg",style:{alignItems:"flex-start",paddingTop:60},children:(0,d.jsxs)("div",{style:{width:"min(620px, 94vw)"},children:[(0,d.jsx)(p,{}),aG()]})}):(0,d.jsx)("section",{className:"auth-layout",children:(0,d.jsxs)("div",{className:"auth-shell",children:[(0,d.jsxs)("div",{className:"auth-copy",children:[(0,d.jsxs)("div",{className:"auth-brand",children:[(0,d.jsx)("div",{className:"auth-logo-mark",children:"S"}),(0,d.jsxs)("div",{className:"auth-brand-copy",children:[(0,d.jsxs)("div",{className:"auth-brand-row",children:[(0,d.jsxs)("div",{className:"logo-word",style:{fontSize:"15px",fontWeight:600,color:"var(--ink)"},children:["SQB ",(0,d.jsx)("span",{style:{color:"var(--muted)",fontWeight:500},children:"Business OS"})]}),(0,d.jsx)("span",{className:"auth-portal-pill",children:b})]}),(0,d.jsx)("div",{className:"auth-brand-tagline",children:"Your business. Your bank. One platform."})]})]}),(0,d.jsx)("h1",{className:"auth-title",children:aC}),(0,d.jsx)("p",{className:"auth-summary",children:s}),(0,d.jsx)("div",{className:"auth-stats",children:u.map(a=>(0,d.jsxs)("div",{className:"auth-stat",children:[(0,d.jsx)("strong",{children:a.value}),(0,d.jsx)("span",{children:a.label})]},a.label))})]}),(0,d.jsxs)("div",{className:"auth-card",children:[(0,d.jsxs)("div",{className:"auth-card-copy",children:[(0,d.jsx)("div",{className:"eyebrow",children:aq.eyebrow}),(0,d.jsx)("h2",{children:aq.title}),(0,d.jsx)("p",{children:aq.description})]}),aj?(0,d.jsx)("div",{className:"banner bad",style:{marginBottom:16},children:aj}):null,al?(0,d.jsx)("div",{className:"banner info",style:{marginBottom:16},children:al}):null,aG()]})]})})]})}}};