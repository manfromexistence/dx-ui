---
sidebar_position: 3
keywords:
  - ForesightJS
  - JS.Foresight
  - Prefetching
  - Next.js
  - NextJS
  - Routing
  - Router
  - React
description: Integration details to add ForesightJS to your Next.js projects
last_updated:
  date: 2025-06-23
  author: Bart Spaans
---

# Next.js

## Next.js default prefetching

Next.js's default prefetching method prefetches when links enter the viewport, this is a great user experience but can lead to unnecessary data transfer for bigger websites. For example by scrolling down the [Next.js homepage](https://nextjs.org/) it triggers **~1.59MB** of prefetch requests as every single link on the page gets prefetched, regardless of user intent.

To avoid this, we can wrap the `Link` component and add ForesightJS. The official Next.js [prefetching docs](https://nextjs.org/docs/app/guides/prefetching#extending-or-ejecting-link) mention ForesightJS as an example for custom prefetching strategies.

## ForesightLink Component

Below is an example of creating an wrapper around the Next.js `Link` component that prefetches with ForesightJS. Since ForesightJS does nothing on touch devices we use the return of the `register()` function to use the default Next.js prefetch mode. This implementation uses the `useForesight` react hook which can be found [here](/docs/integrations/react/useForesight).

```tsx
"use client"
import type { LinkProps } from "next/link"
import Link from "next/link"
import { type ForesightRegisterOptions } from "js.foresight"
import useForesight from "../hooks/useForesight"
import { useRouter } from "next/navigation"

interface ForesightLinkProps
  extends Omit<LinkProps, "prefetch">,
    Omit<ForesightRegisterOptions, "element" | "callback"> {
  children: React.ReactNode
  className?: string
}

export function ForesightLink({
  children,
  className,
  hitSlop = 0,
  unregisterOnCallback = true,
  name = "",
  ...props
}: ForesightLinkProps) {
  const router = useRouter() // import from "next/navigation" not "next/router"

  const { elementRef, registerResults } = useForesight<HTMLAnchorElement>({
    callback: () => router.prefetch(props.href.toString()),
    hitSlop: hitSlop,
    name: name,
    unregisterOnCallback: unregisterOnCallback,
  })

  return (
    <Link
      {...props}
      prefetch={registerResults?.isTouchDevice ?? false}
      ref={elementRef}
      className={className}
    >
      {children}
    </Link>
  )
}
```

## Basic Usage

```tsx
import ForesightLink from "./ForesightLink"
export default function Navigation() {
  return (
    <ForesightLink
      href="/home"
      className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
      name="nav-home"
    >
      Home
    </ForesightLink>
  )
}
```

:::caution
If you dont see the correct prefetching behaviour make sure you are in production. Next.js only prefetches in production and not in development
:::
