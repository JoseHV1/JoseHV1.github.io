import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useReveal(options = {}) {
  const ref = useRef(null);
  const { selector = ".reveal", stagger = 0.08, y = 24, once = true } = options;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets = root.querySelectorAll(selector);
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger,
          scrollTrigger: {
            trigger: root,
            start: "top 80%",
            once,
          },
        }
      );
    }, root);

    return () => ctx.revert();
  }, [selector, stagger, y, once]);

  return ref;
}
