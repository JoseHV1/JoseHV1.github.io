import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Header from "./layout/Header";
import ScrollRail from "./layout/ScrollRail";
import StatusBar from "./layout/StatusBar";
import Automation from "./sections/Automation";
import Contact from "./sections/Contact";
import Hero from "./sections/Hero";
import Process from "./sections/Process";
import Stack from "./sections/Stack";
import Work from "./sections/Work";
import SceneBoundary from "./scene/SceneBoundary";
import { detectTier } from "./scene/quality";
import { useLenis } from "./hooks/useLenis";

const Scene = lazy(() => import("./scene/Scene"));

export default function App() {
  useLenis();
  const { i18n } = useTranslation();
  const [tier, setTier] = useState(detectTier);
  const immersive = tier !== "off";
  const disableScene = () => setTier("off");

  // Section heights change with the language and the tier; triggers must follow.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [i18n.language, tier]);

  // Web fonts change text metrics once loaded; recompute trigger windows.
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
  }, []);

  return (
    <div className="relative text-fg">
      {immersive ? (
        <SceneBoundary onFail={disableScene}>
          <Suspense fallback={null}>
            <Scene tier={tier} onFail={disableScene} onSlow={disableScene} />
          </Suspense>
        </SceneBoundary>
      ) : (
        <div aria-hidden="true" className="scene-fallback" />
      )}
      {immersive && <div className="scene-scrim" />}
      <div className="grain" />
      <Header />
      <StatusBar />
      <ScrollRail />
      <main className="relative z-10">
        <Hero />
        <Process />
        <Automation />
        <Stack />
        <Work />
        <Contact />
      </main>
    </div>
  );
}
