# MDL Component Types — quick reference

This is a working reference, not exhaustive. For any component type not listed
here (or for the full attribute list of one that is), call
`mcp__vault-developer-mcp__search_developer_docs` with the component type name, or
run `node .agents/scripts/vault_api.js metadata-components <Componenttype>` against
the target vault.

Each entry below shows: the type name (as used in MDL), its class (`metadata`
or `code`), commonly-set attributes, and a minimal example.

---

## Picklist (class: metadata)

Drop-down value lists. Attributes: `label`, `active`, with `Picklistentry`
sub-components for each value.

```
RECREATE Picklist color__c (
   label('Color'),
   active(true),
   Picklistentry red__c   ( value('Red'),   order(1), active(true) ),
   Picklistentry blue__c  ( value('Blue'),  order(2), active(true) ),
   Picklistentry green__c ( value('Green'), order(3), active(true) )
);
```

---

## Object (class: metadata)

Vault custom objects. Heavy in attributes (lots of `Field`, `Index`,
`Layoutprofile`, `Pagelayout` subcomponents). For real changes, retrieve the
existing object first via `vault_api.js mdl-get Object.{name}` and edit it,
rather than authoring from scratch.

`ALTER` is the safer command for incremental edits:

```
ALTER Object product__v (
   MODIFY Field dosage_form__c (
      relationship_criteria([type__c = 'dosage__c' AND authority_status__c = 'in_use__c'])
   )
);
```

---

## Recordtrigger (class: code)

Java SDK record trigger. The `source_code` attribute embeds the compiled
trigger XML.

```
RECREATE Recordtrigger my_custom_trigger_name__c (
   active(true),
   source_code(<VeevaData> ... </VeevaData>)
);
```

For SDK code components, the recommended path is VPK deploy — the
`veeva-vault-deployer` skill handles that. Use MDL `RECREATE Recordtrigger`
only when you are hot-patching a single, already-compiled trigger.

---

## Aitooltype (class: code)

Defines a custom AI tool type — the runtime + configuration handler shape.
Pairs with Java SDK classes annotated with `@AiToolTypeRuntimeHandlerInfo`.

Key attributes: `label`, `active`, `tool_class` (the Java FQCN of the
runtime handler), `configuration_class` (FQCN of the config handler),
`dynamic_tool_spec` (boolean — true if the tool generates its input schema at
runtime via `onGenerateInput`).

---

## Aitool (class: code)

An *instance* of an `Aitooltype`. This is what gets bound to an agent.
The `configuration` attribute holds an XML blob whose schema is defined by
the parent `Aitooltype`.

```
RECREATE Aitool dynamic_tool__c (
   label('Dynamic Tool'),
   active(true),
   configuration({<vault:configuration xmlns:vault="VeevaVault">
       <vault:input type="String" name="testKey__v">""</vault:input>
   </vault:configuration>}),
   description('This tool does nothing.'),
   input(),
   tool_type('Aitooltype.dynamic_tool_type__v')
);
```

---

## Aicontexttype (class: code)

Defines a custom AI context type — runtime + config handler classes that
produce context (records, documents, prompts) for an agent action. Sister
to `Aitooltype`.

Key attributes: `label`, `active`, `context_class` (Java FQCN of runtime),
`configuration_class` (Java FQCN of config handler).

---

## Doclifecycle / Objectlifecycle (class: metadata)

Document and object lifecycles. These are large, XML-heavy components (states,
roles, permissions, entry/user actions). For non-trivial edits, retrieve via
`vault_api.js mdl-get Doclifecycle.{name}` and patch — do not author by
hand. Some XML attributes (`entry_action`, `user_action`,
`security_settings`) cannot reliably be edited via MDL; the Admin UI is the
recommended path for those.

---

## Picklistentry, Field, Pagelayout, Layoutprofile, etc.

These are **subcomponents**, not top-level component types. They appear inside
their parent's MDL block. You don't address them directly in
`/api/mdl/execute` — you `ALTER` the parent and use `ADD`, `MODIFY`, or
`DROP` clauses inside.

```
ALTER Picklist color__c (
   ADD Picklistentry orange__c ( value('Orange'), order(4), active(true) ),
   MODIFY Picklistentry red__c ( value('Crimson') ),
   DROP Picklistentry green__c
);
```

---

## How to discover unknown component types

If the user references a component type not in this list:

1. Call `mcp__vault-developer-mcp__search_developer_docs` with
   `query="<Componenttype> component reference"` — the dev portal has a page
   per component type with the full attribute table and supported operations.
2. Run `node .agents/scripts/vault_api.js metadata-components <Componenttype>` against
   the target vault to get the live schema (reflects any vault-specific custom
   subcomponents). Use `vault_api.js api-version` for the latest `--api` value.
3. Check the **Supported Operations** table — some component types do **not**
   support `Drop`, `Rename`, or `Generate Recreate`. If "Generate Recreate" is
   unsupported, `vault_api.js mdl-get <Componenttype.name>` will error; use
   `vault_api.js describe <Componenttype.name>` (JSON describe) instead.