'use client'
import { useState } from 'react'

type Step = { id: string; type: string; label: string; status?: string }
const initial: Step[] = [
  { id: '1', type: 'llm_call', label: 'Classify customer request' },
  { id: '2', type: 'conditional_branch', label: 'Is escalation needed?' },
  { id: '3', type: 'http_request', label: 'Create support ticket' },
  { id: '4', type: 'approval_gate', label: 'Approve customer response' }
]
export default function Home() {
  const [steps, setSteps] = useState(initial); const [running, setRunning] = useState(false); const [paused, setPaused] = useState(false); const [role, setRole] = useState('editor')
  const run = async () => { if (role === 'viewer') return; setRunning(true); setPaused(false); for (let i=0;i<steps.length;i++) { setSteps(s=>s.map((x,n)=>n===i?{...x,status:'running'}:x)); await new Promise(r=>setTimeout(r,650)); if (steps[i].type==='approval_gate') { setSteps(s=>s.map((x,n)=>n===i?{...x,status:'paused'}:x)); setPaused(true); return }; setSteps(s=>s.map((x,n)=>n===i?{...x,status:'complete'}:x)) }; setRunning(false) }
  const approve = () => { if (role==='viewer') return; setSteps(s=>s.map(x=>x.status==='paused'?{...x,status:'complete'}:x)); setPaused(false); setRunning(false) }
  const add = () => setSteps([...steps,{id:crypto.randomUUID(),type:'notify',label:'Send Slack notification'}])
  return <main><aside><h1>flowforge</h1><p className="muted">AI automation workspace</p><nav>Workflows<br/><span>Runs</span><br/><span>Members</span></nav><div className="quota"><small>MONTHLY USAGE</small><strong>72 / 500 calls</strong><i><b/></i></div></aside><section><header><div><p className="eyebrow">ACME SUPPORT / WORKFLOWS</p><h2>Customer escalation triage</h2><p className="muted">Webhook enabled · Last run just now</p></div><div className="role"><label>Demo role</label><select value={role} onChange={e=>setRole(e.target.value)}><option>owner</option><option>editor</option><option>viewer</option></select></div><button disabled={role==='viewer'||running} onClick={run}>{running?'Running…':'▶ Run workflow'}</button></header><div className="grid"><div className="canvas"><div className="canvas-head"><h3>Workflow steps</h3><button className="ghost" onClick={add}>+ Add step</button></div>{steps.map((step,i)=><article className={'step '+(step.status||'')} key={step.id}><em>{i+1}</em><div><code>{step.type}</code><strong>{step.label}</strong></div><span>{step.status==='running'?'Executing':step.status==='paused'?'Awaiting approval':step.status==='complete'?'Complete':'Ready'}</span></article>)}</div><div className="panel"><h3>Live run status</h3><div className="live"><b className={running?'pulse':''}/>{paused?'Paused · awaiting approval':running?'Streaming step updates':'Ready to run'}</div>{paused&&<><p>An approver in this organization must release this step.</p><button disabled={role==='viewer'} onClick={approve}>Approve & resume</button></>}<hr/><h4>Triggers</h4><p>Manual</p><p>Webhook <code>/v1/triggerWorkflowRun</code></p><p>Database event: <code>tickets.insert</code></p></div></div><footer>Demo UI. Connect Nhost using the included metadata and functions for authenticated, live GraphQL execution.</footer></section></main>
}
