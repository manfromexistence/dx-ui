---
sidebar_position: 1
keywords:
  - ForesightJS
  - JS.Foresight
  - ForesightManager
  - configuration
  - mouse prediction
  - tab prediction
description: Configuration documenation for the ForesightJS library
last_updated:
  date: 2025-06-04
  author: Bart Spaans
---

# Configuration

ForesightJS provides two levels of configuration:

1. **Global Configuration**: Applied to the entire ForesightManager through initialization
2. **Element-Specific Configuration**: Applied when registering individual elements

## Global Configuration

Global settings are specified when initializing the ForesightManager. This should be done once at your application's entry point.

_If you want the default global options you dont need to initialize the ForesightManager._

```javascript
import { ForesightManager } from "foresightjs"

// Initialize the manager once at the top of your app if you want custom global settings
// ALL SETTINGS ARE OPTIONAL
ForesightManager.initialize({
  enableMousePrediction: true,
  positionHistorySize: 8,
  trajectoryPredictionTime: 80,
  defaultHitSlop: 10,
  debug: false,
  debuggerSettings: {
    isControlPanelDefaultMinimized: false,
    showNameTags: true,
    sortElementList: "visibility",
  },
  enableTabPrediction: true,
  tabOffset: 3,
  enableScrollPrediction: true,
  scrollMargin: 150,
  onAnyCallbackFired: (elementData: ForesightElementData, managerData: ForesightManagerData) => {
    console.log(`Callback hit from: ${elementData.name}`)
    console.log(`Total tab hits: ${managerData.globalCallbackHits.tab}`)
    console.log(`total mouse hits ${managerData.globalCallbackHits.mouse}`)
  },
})
```

### Available Global Settings

**Typescript Type:** `ForesightManagerSettings`

:::note
All numeric settings are clamped to their specified Min/Max values to prevent invalid configurations.
:::

| Setting                    | Type                   | Default                                  | Min/Max | Description                                                                                                                |
| -------------------------- | ---------------------- | ---------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------- |
| `debug`                    | `boolean`              | `false`                                  | -       | When true, enables visual debugging overlays showing hit areas, trajectories, and a control panel                          |
| `enableMousePrediction`    | `boolean`              | `true`                                   | -       | Toggles whether trajectory prediction is active. If `false`, only direct hovers will trigger the callback for mouse users. |
| `positionHistorySize`      | `number`               | 8                                        | 0/30    | Number of mouse positions to keep in history for velocity calculations                                                     |
| `trajectoryPredictionTime` | `number`               | 120                                      | 10/200  | How far ahead (in milliseconds) to predict the mouse trajectory                                                            |
| `defaultHitSlop`           | `number` \| `Rect`     | `{top: 0, left: 0, right: 0, bottom: 0}` | 0/2000  | Default fully invisible "slop" around elements for all registered elements. Basically increases the hover hitbox           |
| `enableTabPrediction`      | `boolean`              | `true`                                   | -       | Toggles whether keyboard prediction is on                                                                                  |
| `tabOffset`                | `number`               | 2                                        | 0/20    | Tab stops away from an element to trigger callback                                                                         |
| `enableScrollPrediction`   | `boolean`              | `true`                                   | -       | Toggles whether scroll prediction is on on                                                                                 |
| `scrollMargin`             | `number`               | 150                                      | 30/300  | Sets the pixel distance to check from the mouse position in the scroll direction callback                                  |
| `onAnyCallbackFired`       | `function` (see below) | `()=>{}`                                 | -       | see below                                                                                                                  |

#### onAnyCallbackFired Details

This global callback executes after every individual element callback fires, regardless of which element triggered it. Unlike element-specific callbacks that handle individual interactions, this function provides a centralized way to respond to all prediction events across your application. The `managerData` includes all [static properties](/docs/getting_started/Static_Properties#foresightmanagerinstancegetmanagerdata)

```typescript
// gesture
(elementData: ForesightElementData, managerData: ForesightManagerData) => void
```

#### Global debugger settings

| Setting                          | Type              | Default      | Description                                                                                                                                                                                  |
| -------------------------------- | ----------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isControlPanelDefaultMinimized` | `boolean`         | `false`      | When true the debug control panel will be minimized on page load                                                                                                                             |
| `showNameTags`                   | `boolean`         | `true`       | Shows the `name` (or `id` if no `name` is given) above the element                                                                                                                           |
| `sortElementList`                | `SortElementList` | `visibility` | Controls elements sorting in control panel: `visibility` sorts by if the element is in viewport, `documentOrder` sorts by HTML structure order, `insertionOrder` sorts by registration order |

## Element-Specific Configuration

When registering elements with the ForesightManager, you can provide configuration specific to each element:

```javascript
const myElement = document.getElementById("my-element")

const { unregister, isTouchDevice } = ForesightManager.instance.register({
  element: myElement, // The element to monitor
  callback: () => {
    console.log("prefetching")
  }, // Function that executes when interaction is predicted or occurs
  hitSlop: { top: 10, left: 50, right: 50, bottom: 100 }, // Fully invisible "slop" around the element. Basically increases the hover hitbox
  name: "My button name", // A descriptive name, useful in debug mode
  unregisterOnCallback: false, // Should the callback be ran more than ones?
})

// its best practice to unregister the element if you are done with it (return of an useEffect in React for example)
unregister(element)
```

### Element Registration Parameters

**Typescript Type:** `ForesightRegisterOptions` or `ForesightRegisterOptionsWithoutElement` if you want to omit the `element`

| Parameter              | Type           | Required | Description                                                                     | Default                             |
| ---------------------- | -------------- | -------- | ------------------------------------------------------------------------------- | ----------------------------------- |
| `element`              | HTMLElement    | Yes      | The DOM element to monitor                                                      |                                     |
| `callback`             | function       | Yes      | Function that executes when interaction is predicted or occurs                  |                                     |
| `hitSlop`              | number \| Rect | No       | Fully invisible "slop" around the element. Basically increases the hover hitbox | 0 or defaultHitSlop from initialize |
| `name`                 | string         | No       | A name for the name tag in debugmode above the element.                         | element.id or "" if there is no id  |
| `unregisterOnCallback` | bool           | No       | Should the callback be ran more than ones?                                      | true                                |

### Return Value of register()

The `ForesightManager.instance.register()` method returns an object with the following properties:

**Typescript Type:** `ForesightRegisterResult`

| Property              | Type     | Description                                                                                                                                                                                 |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `isTouchDevice`       | boolean  | Indicates whether the current device is a touch device. Elements will not be registered on touch devices.                                                                                   |
| `isLimitedConnection` | boolean  | Is true when the user is on a 2g connection or has data-saver enabled. Elements will not be registered when connection is limited.                                                          |
| `isRegistered`        | boolean  | If either `isTouchDevice` or `isLimitedConnection` is `true` this will become `false`. Usefull for implementing alternative prefetching logic.                                              |
| `unregister`          | function | A function that can be called to remove the element from tracking when no longer needed. When `unregisterOnCallback` is true this will be done automatically ones the callback is ran ones. |
