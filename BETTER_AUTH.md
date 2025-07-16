dx-72247531:~/dx/better-auth/packages/better-auth/src{main}$ tree
.
├── __snapshots__
│   └── init.test.ts.snap
├── adapters
│   ├── create-adapter
│   │   ├── index.ts
│   │   ├── test
│   │   │   ├── __snapshots__
│   │   │   │   └── create-adapter.test.ts.snap
│   │   │   └── create-adapter.test.ts
│   │   └── types.ts
│   ├── drizzle-adapter
│   │   ├── drizzle-adapter.ts
│   │   ├── index.ts
│   │   └── test
│   │       ├── adapter.drizzle.mysql.test.ts
│   │       ├── adapter.drizzle.test.ts
│   │       ├── schema.mysql.ts
│   │       └── schema.ts
│   ├── index.ts
│   ├── kysely-adapter
│   │   ├── bun-sqlite-dialect.ts
│   │   ├── dialect.ts
│   │   ├── index.ts
│   │   ├── kysely-adapter.ts
│   │   ├── test
│   │   │   ├── normal
│   │   │   │   └── adapter.kysely.test.ts
│   │   │   ├── number-id
│   │   │   │   └── adapter.kysely.number-id.test.ts
│   │   │   ├── state.ts
│   │   │   └── state.txt
│   │   └── types.ts
│   ├── memory-adapter
│   │   ├── adapter.memory.test.ts
│   │   ├── index.ts
│   │   └── memory-adapter.ts
│   ├── mongodb-adapter
│   │   ├── adapter.mongo-db.test.ts
│   │   ├── index.ts
│   │   └── mongodb-adapter.ts
│   ├── prisma-adapter
│   │   ├── index.ts
│   │   ├── prisma-adapter.ts
│   │   └── test
│   │       ├── normal-tests
│   │       │   ├── adapter.prisma.test.ts
│   │       │   ├── get-adapter.ts
│   │       │   └── schema.prisma
│   │       ├── number-id-tests
│   │       │   ├── adapter.prisma.number-id.test.ts
│   │       │   ├── get-adapter.ts
│   │       │   └── schema.prisma
│   │       ├── push-schema.ts
│   │       ├── state.ts
│   │       ├── state.txt
│   │       └── test-options.ts
│   ├── test.ts
│   └── utils.ts
├── api
│   ├── call.test.ts
│   ├── call.ts
│   ├── index.ts
│   ├── middlewares
│   │   ├── index.ts
│   │   ├── origin-check.test.ts
│   │   └── origin-check.ts
│   ├── rate-limiter
│   │   ├── index.ts
│   │   └── rate-limiter.test.ts
│   ├── routes
│   │   ├── account.test.ts
│   │   ├── account.ts
│   │   ├── callback.ts
│   │   ├── email-verification.test.ts
│   │   ├── email-verification.ts
│   │   ├── error.ts
│   │   ├── index.ts
│   │   ├── ok.ts
│   │   ├── reset-password.test.ts
│   │   ├── reset-password.ts
│   │   ├── session-api.test.ts
│   │   ├── session.ts
│   │   ├── sign-in.test.ts
│   │   ├── sign-in.ts
│   │   ├── sign-out.test.ts
│   │   ├── sign-out.ts
│   │   ├── sign-up.test.ts
│   │   ├── sign-up.ts
│   │   ├── update-user.test.ts
│   │   └── update-user.ts
│   ├── to-auth-endpoints.test.ts
│   └── to-auth-endpoints.ts
├── auth.ts
├── client
│   ├── client.test.ts
│   ├── config.ts
│   ├── fetch-plugins.ts
│   ├── index.ts
│   ├── parser.ts
│   ├── path-to-object.ts
│   ├── plugins
│   │   ├── index.ts
│   │   └── infer-plugin.ts
│   ├── proxy.ts
│   ├── query.ts
│   ├── react
│   │   ├── index.ts
│   │   └── react-store.ts
│   ├── session-atom.ts
│   ├── solid
│   │   ├── index.ts
│   │   └── solid-store.ts
│   ├── svelte
│   │   └── index.ts
│   ├── test-plugin.ts
│   ├── types.ts
│   ├── url.test.ts
│   ├── vanilla.ts
│   └── vue
│       ├── index.ts
│       └── vue-store.ts
├── cookies
│   ├── check-cookies.ts
│   ├── cookie-utils.ts
│   ├── cookies.test.ts
│   └── index.ts
├── crypto
│   ├── buffer.ts
│   ├── hash.ts
│   ├── index.ts
│   ├── jwt.ts
│   ├── password.test.ts
│   ├── password.ts
│   └── random.ts
├── db
│   ├── db.test.ts
│   ├── field.ts
│   ├── get-migration.ts
│   ├── get-schema.ts
│   ├── get-tables.ts
│   ├── index.ts
│   ├── internal-adapter.test.ts
│   ├── internal-adapter.ts
│   ├── schema.ts
│   ├── to-zod.ts
│   ├── utils.ts
│   └── with-hooks.ts
├── error
│   ├── codes.ts
│   └── index.ts
├── index.ts
├── init.test.ts
├── init.ts
├── integrations
│   ├── next-js.ts
│   ├── node.ts
│   ├── react-start.ts
│   ├── solid-start.ts
│   └── svelte-kit.ts
├── oauth2
│   ├── create-authorization-url.ts
│   ├── index.ts
│   ├── link-account.ts
│   ├── refresh-access-token.ts
│   ├── state.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validate-authorization-code.ts
├── plugins
│   ├── access
│   │   ├── access.test.ts
│   │   ├── access.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── additional-fields
│   │   ├── additional-fields.test.ts
│   │   └── client.ts
│   ├── admin
│   │   ├── access
│   │   │   ├── index.ts
│   │   │   └── statement.ts
│   │   ├── admin.test.ts
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   ├── error-codes.ts
│   │   ├── has-permission.ts
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── anonymous
│   │   ├── anon.test.ts
│   │   ├── client.ts
│   │   └── index.ts
│   ├── api-key
│   │   ├── api-key.test.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── rate-limit.ts
│   │   ├── routes
│   │   │   ├── create-api-key.ts
│   │   │   ├── delete-all-expired-api-keys.ts
│   │   │   ├── delete-api-key.ts
│   │   │   ├── get-api-key.ts
│   │   │   ├── index.ts
│   │   │   ├── list-api-keys.ts
│   │   │   ├── update-api-key.ts
│   │   │   └── verify-api-key.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── bearer
│   │   ├── bearer.test.ts
│   │   └── index.ts
│   ├── captcha
│   │   ├── captcha.test.ts
│   │   ├── constants.ts
│   │   ├── error-codes.ts
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── verify-handlers
│   │       ├── cloudflare-turnstile.ts
│   │       ├── google-recaptcha.ts
│   │       ├── h-captcha.ts
│   │       └── index.ts
│   ├── custom-session
│   │   ├── client.ts
│   │   ├── custom-session.test.ts
│   │   └── index.ts
│   ├── email-otp
│   │   ├── client.ts
│   │   ├── email-otp.test.ts
│   │   └── index.ts
│   ├── generic-oauth
│   │   ├── client.ts
│   │   ├── generic-oauth.test.ts
│   │   └── index.ts
│   ├── haveibeenpwned
│   │   ├── haveibeenpwned.test.ts
│   │   └── index.ts
│   ├── index.ts
│   ├── jwt
│   │   ├── adapter.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── jwt.test.ts
│   │   ├── schema.ts
│   │   └── utils.ts
│   ├── magic-link
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── magic-link.test.ts
│   ├── mcp
│   │   ├── authorize.ts
│   │   └── index.ts
│   ├── multi-session
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── multi-session.test.ts
│   ├── oauth-proxy
│   │   ├── index.ts
│   │   └── oauth-proxy.test.ts
│   ├── oidc-provider
│   │   ├── authorize.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── oidc.test.ts
│   │   ├── schema.ts
│   │   ├── types.ts
│   │   └── ui.ts
│   ├── one-tap
│   │   ├── client.ts
│   │   └── index.ts
│   ├── one-time-token
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── one-time-token.test.ts
│   ├── open-api
│   │   ├── generator.ts
│   │   ├── index.ts
│   │   ├── logo.ts
│   │   └── open-api.test.ts
│   ├── organization
│   │   ├── access
│   │   │   ├── index.ts
│   │   │   └── statement.ts
│   │   ├── adapter.ts
│   │   ├── call.ts
│   │   ├── client.ts
│   │   ├── error-codes.ts
│   │   ├── has-permission.ts
│   │   ├── index.ts
│   │   ├── organization.test.ts
│   │   ├── organization.ts
│   │   ├── routes
│   │   │   ├── crud-invites.ts
│   │   │   ├── crud-members.ts
│   │   │   ├── crud-org.ts
│   │   │   └── crud-team.ts
│   │   ├── schema.ts
│   │   ├── team.test.ts
│   │   └── types.ts
│   ├── passkey
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── passkey.test.ts
│   ├── phone-number
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── phone-number-error.ts
│   │   └── phone-number.test.ts
│   ├── sso
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── sso.test.ts
│   ├── two-factor
│   │   ├── backup-codes
│   │   │   └── index.ts
│   │   ├── client.ts
│   │   ├── constant.ts
│   │   ├── error-code.ts
│   │   ├── index.ts
│   │   ├── otp
│   │   │   └── index.ts
│   │   ├── schema.ts
│   │   ├── totp
│   │   │   └── index.ts
│   │   ├── two-factor.test.ts
│   │   ├── types.ts
│   │   └── verify-two-factor.ts
│   └── username
│       ├── client.ts
│       ├── error-codes.ts
│       ├── index.ts
│       ├── schema.ts
│       └── username.test.ts
├── social-providers
│   ├── apple.ts
│   ├── discord.ts
│   ├── dropbox.ts
│   ├── facebook.ts
│   ├── github.ts
│   ├── gitlab.ts
│   ├── google.ts
│   ├── huggingface.ts
│   ├── index.ts
│   ├── kick.ts
│   ├── linkedin.ts
│   ├── microsoft-entra-id.ts
│   ├── reddit.ts
│   ├── roblox.ts
│   ├── social.test.ts
│   ├── spotify.ts
│   ├── tiktok.ts
│   ├── twitch.ts
│   ├── twitter.ts
│   ├── vk.ts
│   └── zoom.ts
├── test-utils
│   ├── headers.ts
│   └── test-instance.ts
├── types
│   ├── adapter.ts
│   ├── api.ts
│   ├── context.ts
│   ├── helper.ts
│   ├── index.ts
│   ├── models.ts
│   ├── options.ts
│   ├── plugins.ts
│   └── types.test.ts
└── utils
    ├── boolean.ts
    ├── callback-url.ts
    ├── clone.ts
    ├── constants.ts
    ├── date.ts
    ├── env.ts
    ├── get-request-ip.ts
    ├── hide-metadata.ts
    ├── id.ts
    ├── index.ts
    ├── json.ts
    ├── logger.test.ts
    ├── logger.ts
    ├── merger.ts
    ├── middleware-response.ts
    ├── misc.ts
    ├── password.ts
dx-72247531:~/dx/better-auth/packages/better-auth/src{main}$ tree
.
├── __snapshots__
│   └── init.test.ts.snap
├── adapters
│   ├── create-adapter
│   │   ├── index.ts
│   │   ├── test
│   │   │   ├── __snapshots__
│   │   │   │   └── create-adapter.test.ts.snap
│   │   │   └── create-adapter.test.ts
│   │   └── types.ts
│   ├── drizzle-adapter
│   │   ├── drizzle-adapter.ts
│   │   ├── index.ts
│   │   └── test
│   │       ├── adapter.drizzle.mysql.test.ts
│   │       ├── adapter.drizzle.test.ts
│   │       ├── schema.mysql.ts
│   │       └── schema.ts
│   ├── index.ts
│   ├── kysely-adapter
│   │   ├── bun-sqlite-dialect.ts
│   │   ├── dialect.ts
│   │   ├── index.ts
│   │   ├── kysely-adapter.ts
│   │   ├── test
│   │   │   ├── normal
│   │   │   │   └── adapter.kysely.test.ts
│   │   │   ├── number-id
│   │   │   │   └── adapter.kysely.number-id.test.ts
│   │   │   ├── state.ts
│   │   │   └── state.txt
│   │   └── types.ts
│   ├── memory-adapter
│   │   ├── adapter.memory.test.ts
│   │   ├── index.ts
│   │   └── memory-adapter.ts
│   ├── mongodb-adapter
│   │   ├── adapter.mongo-db.test.ts
│   │   ├── index.ts
│   │   └── mongodb-adapter.ts
│   ├── prisma-adapter
│   │   ├── index.ts
│   │   ├── prisma-adapter.ts
│   │   └── test
│   │       ├── normal-tests
│   │       │   ├── adapter.prisma.test.ts
│   │       │   ├── get-adapter.ts
│   │       │   └── schema.prisma
│   │       ├── number-id-tests
│   │       │   ├── adapter.prisma.number-id.test.ts
│   │       │   ├── get-adapter.ts
│   │       │   └── schema.prisma
│   │       ├── push-schema.ts
│   │       ├── state.ts
│   │       ├── state.txt
│   │       └── test-options.ts
│   ├── test.ts
│   └── utils.ts
├── api
│   ├── call.test.ts
│   ├── call.ts
│   ├── index.ts
│   ├── middlewares
│   │   ├── index.ts
│   │   ├── origin-check.test.ts
│   │   └── origin-check.ts
│   ├── rate-limiter
│   │   ├── index.ts
│   │   └── rate-limiter.test.ts
│   ├── routes
│   │   ├── account.test.ts
│   │   ├── account.ts
│   │   ├── callback.ts
│   │   ├── email-verification.test.ts
│   │   ├── email-verification.ts
│   │   ├── error.ts
│   │   ├── index.ts
│   │   ├── ok.ts
│   │   ├── reset-password.test.ts
│   │   ├── reset-password.ts
│   │   ├── session-api.test.ts
│   │   ├── session.ts
│   │   ├── sign-in.test.ts
│   │   ├── sign-in.ts
│   │   ├── sign-out.test.ts
│   │   ├── sign-out.ts
│   │   ├── sign-up.test.ts
│   │   ├── sign-up.ts
│   │   ├── update-user.test.ts
│   │   └── update-user.ts
│   ├── to-auth-endpoints.test.ts
│   └── to-auth-endpoints.ts
├── auth.ts
├── client
│   ├── client.test.ts
│   ├── config.ts
│   ├── fetch-plugins.ts
│   ├── index.ts
│   ├── parser.ts
│   ├── path-to-object.ts
│   ├── plugins
│   │   ├── index.ts
│   │   └── infer-plugin.ts
│   ├── proxy.ts
│   ├── query.ts
│   ├── react
│   │   ├── index.ts
│   │   └── react-store.ts
│   ├── session-atom.ts
│   ├── solid
│   │   ├── index.ts
│   │   └── solid-store.ts
│   ├── svelte
│   │   └── index.ts
│   ├── test-plugin.ts
│   ├── types.ts
│   ├── url.test.ts
│   ├── vanilla.ts
│   └── vue
│       ├── index.ts
│       └── vue-store.ts
├── cookies
│   ├── check-cookies.ts
│   ├── cookie-utils.ts
│   ├── cookies.test.ts
│   └── index.ts
├── crypto
│   ├── buffer.ts
│   ├── hash.ts
│   ├── index.ts
│   ├── jwt.ts
│   ├── password.test.ts
│   ├── password.ts
│   └── random.ts
├── db
│   ├── db.test.ts
│   ├── field.ts
│   ├── get-migration.ts
│   ├── get-schema.ts
│   ├── get-tables.ts
│   ├── index.ts
│   ├── internal-adapter.test.ts
│   ├── internal-adapter.ts
│   ├── schema.ts
│   ├── to-zod.ts
│   ├── utils.ts
│   └── with-hooks.ts
├── error
│   ├── codes.ts
│   └── index.ts
├── index.ts
├── init.test.ts
├── init.ts
├── integrations
│   ├── next-js.ts
│   ├── node.ts
│   ├── react-start.ts
│   ├── solid-start.ts
│   └── svelte-kit.ts
├── oauth2
│   ├── create-authorization-url.ts
│   ├── index.ts
│   ├── link-account.ts
│   ├── refresh-access-token.ts
│   ├── state.ts
│   ├── types.ts
│   ├── utils.ts
│   └── validate-authorization-code.ts
├── plugins
│   ├── access
│   │   ├── access.test.ts
│   │   ├── access.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── additional-fields
│   │   ├── additional-fields.test.ts
│   │   └── client.ts
│   ├── admin
│   │   ├── access
│   │   │   ├── index.ts
│   │   │   └── statement.ts
│   │   ├── admin.test.ts
│   │   ├── admin.ts
│   │   ├── client.ts
│   │   ├── error-codes.ts
│   │   ├── has-permission.ts
│   │   ├── index.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── anonymous
│   │   ├── anon.test.ts
│   │   ├── client.ts
│   │   └── index.ts
│   ├── api-key
│   │   ├── api-key.test.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── rate-limit.ts
│   │   ├── routes
│   │   │   ├── create-api-key.ts
│   │   │   ├── delete-all-expired-api-keys.ts
│   │   │   ├── delete-api-key.ts
│   │   │   ├── get-api-key.ts
│   │   │   ├── index.ts
│   │   │   ├── list-api-keys.ts
│   │   │   ├── update-api-key.ts
│   │   │   └── verify-api-key.ts
│   │   ├── schema.ts
│   │   └── types.ts
│   ├── bearer
│   │   ├── bearer.test.ts
│   │   └── index.ts
│   ├── captcha
│   │   ├── captcha.test.ts
│   │   ├── constants.ts
│   │   ├── error-codes.ts
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── verify-handlers
│   │       ├── cloudflare-turnstile.ts
│   │       ├── google-recaptcha.ts
│   │       ├── h-captcha.ts
│   │       └── index.ts
│   ├── custom-session
│   │   ├── client.ts
│   │   ├── custom-session.test.ts
│   │   └── index.ts
│   ├── email-otp
│   │   ├── client.ts
│   │   ├── email-otp.test.ts
│   │   └── index.ts
│   ├── generic-oauth
│   │   ├── client.ts
│   │   ├── generic-oauth.test.ts
│   │   └── index.ts
│   ├── haveibeenpwned
│   │   ├── haveibeenpwned.test.ts
│   │   └── index.ts
│   ├── index.ts
│   ├── jwt
│   │   ├── adapter.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── jwt.test.ts
│   │   ├── schema.ts
│   │   └── utils.ts
│   ├── magic-link
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── magic-link.test.ts
│   ├── mcp
│   │   ├── authorize.ts
│   │   └── index.ts
│   ├── multi-session
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── multi-session.test.ts
│   ├── oauth-proxy
│   │   ├── index.ts
│   │   └── oauth-proxy.test.ts
│   ├── oidc-provider
│   │   ├── authorize.ts
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── oidc.test.ts
│   │   ├── schema.ts
│   │   ├── types.ts
│   │   └── ui.ts
│   ├── one-tap
│   │   ├── client.ts
│   │   └── index.ts
│   ├── one-time-token
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── one-time-token.test.ts
│   ├── open-api
│   │   ├── generator.ts
│   │   ├── index.ts
│   │   ├── logo.ts
│   │   └── open-api.test.ts
│   ├── organization
│   │   ├── access
│   │   │   ├── index.ts
│   │   │   └── statement.ts
│   │   ├── adapter.ts
│   │   ├── call.ts
│   │   ├── client.ts
│   │   ├── error-codes.ts
│   │   ├── has-permission.ts
│   │   ├── index.ts
│   │   ├── organization.test.ts
│   │   ├── organization.ts
│   │   ├── routes
│   │   │   ├── crud-invites.ts
│   │   │   ├── crud-members.ts
│   │   │   ├── crud-org.ts
│   │   │   └── crud-team.ts
│   │   ├── schema.ts
│   │   ├── team.test.ts
│   │   └── types.ts
│   ├── passkey
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── passkey.test.ts
│   ├── phone-number
│   │   ├── client.ts
│   │   ├── index.ts
│   │   ├── phone-number-error.ts
│   │   └── phone-number.test.ts
│   ├── sso
│   │   ├── client.ts
│   │   ├── index.ts
│   │   └── sso.test.ts
│   ├── two-factor
│   │   ├── backup-codes
│   │   │   └── index.ts
│   │   ├── client.ts
│   │   ├── constant.ts
│   │   ├── error-code.ts
│   │   ├── index.ts
│   │   ├── otp
│   │   │   └── index.ts
│   │   ├── schema.ts
│   │   ├── totp
│   │   │   └── index.ts
│   │   ├── two-factor.test.ts
│   │   ├── types.ts
│   │   └── verify-two-factor.ts
│   └── username
│       ├── client.ts
│       ├── error-codes.ts
│       ├── index.ts
│       ├── schema.ts
│       └── username.test.ts
├── social-providers
│   ├── apple.ts
│   ├── discord.ts
│   ├── dropbox.ts
│   ├── facebook.ts
│   ├── github.ts
│   ├── gitlab.ts
│   ├── google.ts
│   ├── huggingface.ts
│   ├── index.ts
│   ├── kick.ts
│   ├── linkedin.ts
│   ├── microsoft-entra-id.ts
│   ├── reddit.ts
│   ├── roblox.ts
│   ├── social.test.ts
│   ├── spotify.ts
│   ├── tiktok.ts
│   ├── twitch.ts
│   ├── twitter.ts
│   ├── vk.ts
│   └── zoom.ts
├── test-utils
│   ├── headers.ts
│   └── test-instance.ts
├── types
│   ├── adapter.ts
│   ├── api.ts
│   ├── context.ts
│   ├── helper.ts
│   ├── index.ts
│   ├── models.ts
│   ├── options.ts
│   ├── plugins.ts
│   └── types.test.ts
└── utils
    ├── boolean.ts
    ├── callback-url.ts
    ├── clone.ts
    ├── constants.ts
    ├── date.ts
    ├── env.ts
    ├── get-request-ip.ts
    ├── hide-metadata.ts
    ├── id.ts
    ├── index.ts
    ├── json.ts
    ├── logger.test.ts
    ├── logger.ts
    ├── merger.ts
    ├── middleware-response.ts
    ├── misc.ts
    ├── password.ts
    ├── plugin-helper.ts
    ├── shim.ts
    ├── time.ts
    ├── url.ts
    └── wildcard.ts

72 directories, 321 files