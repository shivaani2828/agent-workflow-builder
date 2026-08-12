# Flowforge — AI Agent Workflow Builder

Submission-ready implementation scaffold for the Nhost + Hasura assignment. It contains a runnable Next.js workflow builder, PostgreSQL migration, Hasura Action definitions, and Nhost Function handlers for initiating and approving runs.

## Run the UI

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The UI is a visual local demo until Nhost environment values are supplied. It intentionally lets you switch roles to verify viewers cannot run or approve. Copy `.env.example` to `.env.local` before connecting a project.

## Backend setup

1. Create an Nhost project and install the Hasura CLI.
2. Point the CLI at the project, then apply `hasura/migrations` and `hasura/metadata`.
3. Deploy each folder under `functions/` as an Nhost Function and set `NHOST_GRAPHQL_URL`, `NHOST_ADMIN_SECRET`, and (optionally) `GROQ_API_KEY`.
4. Configure relationship names used by the functions: organization → org_members, workflow → organization/steps, run → workflow, and step_run → workflow_run.
5. Set `NHOST_FUNCTIONS_URL` in Hasura metadata then apply the Actions. Configure an event trigger on the watched table to call `triggerWorkflowRun`; webhook clients call the Action endpoint with an authenticated JWT.

`llm_call` uses Groq if `GROQ_API_KEY` is present; otherwise it uses a disclosed 500 ms stub. `http_request` retries once. Production should move the executor to a queue/worker for long runs.

## GraphQL operations

```graphql
query OrgWorkflows($org: uuid!) { workflows(where:{org_id:{_eq:$org}}) { id name workflow_steps(order_by:{position:asc}) { id type config } workflow_triggers { id type config } workflow_runs(limit:1,order_by:{started_at:desc}) { id status } } }
subscription LiveSteps($run: uuid!) { step_runs(where:{workflow_run_id:{_eq:$run}},order_by:{created_at:asc}) { id status attempts output error approved_at } }
mutation Run($id: uuid!) { triggerWorkflowRun(workflow_id:$id) { run_id status } }
mutation Approve($id: uuid!) { approveStep(step_run_id:$id) { run_id status } }
```

## Design write-up

The schema puts organization ownership at the root and derives every workflow artifact's scope through it. `workflow_steps` is ordered and carries JSON configuration so the executor can evolve without schema churn. Separate `workflow_runs` and `step_runs` make progress append-friendly and subscription-friendly. The `organization_usage` view supplies the aggregate required by the assignment.

Layer one is enforced in Hasura permissions: every operation is constrained through an `org_members` existence check for `X-Hasura-User-Id`; no client-provided org ID grants access. Owner/editor/viewer limits then determine allowed operations. Layer two protects dangerous nodes: metadata rejects their creation for non-owners, and Action handlers independently inspect membership before triggering or approving. This prevents direct GraphQL ID guessing from bypassing UI controls.

An approval gate creates a paused `step_run` and changes its parent run to `paused`. The subscription immediately surfaces that state. `approveStep` reloads the step's organization and authenticated membership, rejects viewers/cross-org callers, stamps the approver and resumes the run. In a production deployment, the executor enqueue/resume boundary should be backed by a durable worker queue.

## Final walkthrough checklist

Seed Org A and Org B with distinct members. Build the four-node flow shown in the UI; run it manually and invoke its event/webhook trigger. Watch the subscription arrive at `paused`, approve as an Org A owner/editor, then try the same query/mutations as Org B. Hasura's row permissions and the handler's membership checks reject them.

## Remaining delivery work

Deployment requires credentials and ownership of an Nhost/Vercel account, which are deliberately not committed. After provisioning those, record the walkthrough and add the public URL and recording link here.
