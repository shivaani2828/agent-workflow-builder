# Permission contract

Every table permission joins the row to `org_members` using `X-Hasura-User-Id`; this is mandatory for select, insert, update, and delete. Owner has all operations. Editor may mutate workflows, steps, triggers and create runs but cannot mutate `org_members`; viewer has select only. `workflow_runs` and `step_runs` inherit their scope through workflow relationships.

Example `workflows` select check:
```yaml
org:
  org_members:
    user_id: { _eq: X-Hasura-User-Id }
```

For insert/update of `workflow_steps` and `workflow_triggers`, permission presets/checks reject `db_write`, `notify`, and webhook triggers for non-owner roles. The Actions repeat critical authorization server-side; metadata permissions are never the sole control.
