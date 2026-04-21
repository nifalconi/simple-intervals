# Skill: Add a new screen

Template ships two screens: Home and Settings. Add a third when the app genuinely needs a new destination (History, Detail, Entry form). Cap at 3 screens — if you want more, this isn't the right template (invariant: 2–3 screens max, see [CLOUD_RULES.md](../../CLOUD_RULES.md)).

## Steps

1. **Create `src/<ScreenName>.tsx`.** Pattern from [src/Home.tsx](../../src/Home.tsx):
   ```tsx
   import type { Theme } from "./constants.ts";

   interface <ScreenName>ScreenProps {
     theme: Theme;
     onClose: () => void;   // or onBack, onNavigate, etc.
     // ... your screen's specific props
   }

   export default function <ScreenName>Screen({ theme, onClose }: <ScreenName>ScreenProps) {
     const isDark = theme === "dark";
     const fg = isDark ? "#E9E4D7" : "#3A3A36";
     return (
       <div style={{
         height: "100%", display: "flex", flexDirection: "column",
         padding: "0 20px",
         fontFamily: '"Geist", -apple-system, system-ui, sans-serif',
         color: fg,
       }}>
         {/* your screen here */}
       </div>
     );
   }
   ```

2. **Extend the `Screen` type in [src/App.tsx](../../src/App.tsx).**
   ```tsx
   type Screen = "home" | "settings" | "<new>";
   ```

3. **Render the new screen in App's conditional.**
   Replace the ternary with an explicit branch:
   ```tsx
   {screen === "home" ? <HomeScreen ... onOpenSettings={() => setScreen("settings")} />
     : screen === "settings" ? <SettingsScreen ... onClose={() => setScreen("home")} />
     : <NewScreen ... onClose={() => setScreen("home")} />}
   ```

4. **Wire navigation into Home or Settings.** Add a button/tap target that calls `setScreen("<new>")`. Don't add a tab bar unless the fork genuinely needs one — a settings cog + back arrow is enough for 3 screens.

5. **Match the design language.** Use the same padding, card, typography primitives. See [.claude/rules/design-language.md](../rules/design-language.md).

6. **Build + test both navigation directions** (enter and leave the screen).

## Don't

- Don't add route-based navigation (react-router) unless the app needs deep-linking or browser back button. Most simple PWAs don't.
- Don't add a modal system. A screen is a screen.
- Don't exceed 3 screens. If you feel you need 4, the app's scope is too big — split into two apps.
