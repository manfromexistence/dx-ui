# TanStack Router Guide

## As a script tag

Add the script tag to your `<RootDocument>` component at `app/routes/__root`.

Refer to the [CDN Guide](https://github.com/aidenybai/react-scan/blob/main/docs/installation/cdn.md) for the available URLs.

```jsx
// app/routes/__root
import { Meta, Scripts } from "@tanstack/start";
// ...

function RootDocument({ children }) {
  return (
    <html>
      <head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        <Meta />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// ...
```

> [!CAUTION]
> This only works for React 19

## As a module import

Add the following code to your `<RootDocument>` component at `app/routes/__root`:

```jsx
// app/routes/__root

// react-scan must be imported before React and TanStack Start
import { scan } from "react-scan";
import { Meta, Scripts } from "@tanstack/start";
import { useEffect } from "react";

// ...

function RootDocument({ children }) {
  useEffect(() => {
    // Make sure to run this only after hydration
    scan({
      enabled: true,
    });
  }, []);
  return (
    <html>
      <head>
        <Meta />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
```

> [!CAUTION]
> React Scan must be imported before React (and other React renderers like React DOM) in your entire project, as it needs to hijack React DevTools before React gets to access it.

Alternatively you can also do the following code in `app/client`:

```jsx
// app/client
import { scan } from "react-scan"; // must be imported before React and React DOM
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/start";
import { createRouter } from "./router";

scan({
  enabled: true,
});

const router = createRouter();

hydrateRoot(document, <StartClient router={router} />);
```

> [!CAUTION]
> This only works for React 19

If you want react-scan to also run in production, use the react-scan/all-environments import path

```diff
- import { scan } from "react-scan";
+ import { scan } from "react-scan/all-environments";
```
