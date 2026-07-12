# M4 - Frontend Forms & Workflows

## Mission

Own the user-facing workflows: setup forms, asset registration, directory, allocation/transfer, maintenance, and audit screens.

## Source Docs

- `docs/business/02_SRS_and_Features.md`
- `docs/design/03_UX_and_Use_Cases.md`
- `docs/design/11_UI_UX_Guidelines.md`
- `docs/api/06_API_Design.md`
- `docs/project_management/12_Project_Timeline_and_Tasks.md`

## Deliverables

- Build Admin setup forms for departments and categories.
- Build asset registration form with Zod validation and upload flow.
- Build asset directory table with filters, search, pagination, and row actions.
- Build allocation and transfer modal workflows.
- Build maintenance request form and approval queue.
- Build audit cycle management view.
- Add user-facing validation and toast behavior for failed mutations.

## Interfaces To Share

- Required form fields and validation schemas for M2.
- Workflow edge cases and expected RPC errors for M1/M2.
- Shared component needs for M3.

## Done Criteria

- Forms validate before submit and show clear errors.
- Tables support useful search/filter/pagination behavior.
- Allocation conflict and booking overlap states are handled gracefully.
- Maintenance and audit workflows can be demonstrated end to end.
