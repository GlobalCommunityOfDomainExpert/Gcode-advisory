import { useEffect } from "react";
import type { Preview } from "@storybook/nextjs-vite";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../src/app/globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const preview: Preview = {
  globalTypes: {
    scale: {
      description: "Root font size",
      toolbar: {
        title: "Scale",
        icon: "zoom",
        items: [
          { value: "app", title: "Signed-in app · 82%" },
          { value: "auth", title: "Auth / marketing · 90%" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { scale: "app" },
  decorators: [
    (Story, ctx) => {
      const size = ctx.globals.scale === "auth" ? "90%" : "82%"; // wireframe renders the signed-in app at 82%
      useEffect(() => {
        const html = document.documentElement;
        html.style.fontSize = size;
        // next/font variables must live on <html> so the base `html { font-family }` rule resolves
        html.classList.add(inter.variable, jetbrainsMono.variable);
      }, [size]);
      return <Story />;
    },
  ],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // 'todo' shows violations in the test UI only; switch to 'error' to fail CI
      test: "todo",
    },
  },
};

export default preview;
