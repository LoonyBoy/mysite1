import { useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import "./ProjectsScrollStack.css";

export const ProjectsScrollStack = ({
  projects = [],
  className = "",
  itemDistance = 100,
  itemScale = 0.03,
  itemStackDistance = 30,
  stackPosition = "20%",
  scaleEndPosition = "10%",
  baseScale = 0.85,
  rotationAmount = 0,
  blurAmount = 0,
}) => {
  const scrollerRef = useRef(null);
  const cardsRef = useRef([]);
  const lastTransformsRef = useRef(new Map());
  const isUpdatingRef = useRef(false);
  const lenisRef = useRef(null);
  const navigate = useNavigate();
  const animationFrameRef = useRef(null);

  const calculateProgress = useCallback((scrollTop, start, end) => {
    if (scrollTop < start) return 0;
    if (scrollTop > end) return 1;
    return (scrollTop - start) / (end - start);
  }, []);

  const parsePercentage = useCallback((value, containerHeight) => {
    if (typeof value === 'string' && value.includes('%')) {
      return (parseFloat(value) / 100) * containerHeight;
    }
    return parseFloat(value);
  }, []);

  const updateCardTransforms = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller || !cardsRef.current.length || isUpdatingRef.current) return;

    isUpdatingRef.current = true;

    const scrollTop = scroller.scrollTop;
    const containerHeight = scroller.clientHeight;
    const stackPositionPx = parsePercentage(stackPosition, containerHeight);
    const scaleEndPositionPx = parsePercentage(scaleEndPosition, containerHeight);
    const endElement = scroller.querySelector('.projects-scroll-end');
    const endElementTop = endElement ? endElement.offsetTop : 0;

    cardsRef.current.forEach((card, i) => {
      if (!card) return;

      const cardTop = card.offsetTop;
      const triggerStart = cardTop - stackPositionPx - (itemStackDistance * i);
      const triggerEnd = cardTop - scaleEndPositionPx;
      const pinStart = cardTop - stackPositionPx - (itemStackDistance * i);
      const pinEnd = endElementTop - containerHeight / 2;

      const scaleProgress = calculateProgress(scrollTop, triggerStart, triggerEnd);
      const targetScale = baseScale + (i * itemScale);
      const scale = 1 - scaleProgress * (1 - targetScale);
      const rotation = rotationAmount ? i * rotationAmount * scaleProgress : 0;

      let blur = 0;
      if (blurAmount) {
        let topCardIndex = 0;
        for (let j = 0; j < cardsRef.current.length; j++) {
          const jCardTop = cardsRef.current[j].offsetTop;
          const jTriggerStart = jCardTop - stackPositionPx - (itemStackDistance * j);
          if (scrollTop >= jTriggerStart) {
            topCardIndex = j;
          }
        }
        
        if (i < topCardIndex) {
          const depthInStack = topCardIndex - i;
          blur = Math.max(0, depthInStack * blurAmount);
        }
      }

      let translateY = 0;
      const isPinned = scrollTop >= pinStart && scrollTop <= pinEnd;
      
      if (isPinned) {
        translateY = scrollTop - cardTop + stackPositionPx + (itemStackDistance * i);
      } else if (scrollTop > pinEnd) {
        translateY = pinEnd - cardTop + stackPositionPx + (itemStackDistance * i);
      }

      const newTransform = {
        translateY: Math.round(translateY * 100) / 100,
        scale: Math.round(scale * 1000) / 1000,
        rotation: Math.round(rotation * 100) / 100,
        blur: Math.round(blur * 100) / 100
      };

      const lastTransform = lastTransformsRef.current.get(i);
      const hasChanged = !lastTransform ||
        Math.abs(lastTransform.translateY - newTransform.translateY) > 0.1 ||
        Math.abs(lastTransform.scale - newTransform.scale) > 0.001 ||
        Math.abs(lastTransform.rotation - newTransform.rotation) > 0.1 ||
        Math.abs(lastTransform.blur - newTransform.blur) > 0.1;

      if (hasChanged) {
        const transform = `translate3d(0, ${newTransform.translateY}px, 0) scale(${newTransform.scale}) rotate(${newTransform.rotation}deg)`;
        const filter = newTransform.blur > 0 ? `blur(${newTransform.blur}px)` : '';

        card.style.transform = transform;
        card.style.filter = filter;
        
        lastTransformsRef.current.set(i, newTransform);
      }
    });

    isUpdatingRef.current = false;
  }, [
    calculateProgress,
    parsePercentage,
    itemStackDistance,
    itemScale,
    baseScale,
    stackPosition,
    scaleEndPosition,
    rotationAmount,
    blurAmount,
  ]);

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateCardTransforms);
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initialize Lenis for smooth scrolling
    lenisRef.current = new Lenis({
      wrapper: scroller,
      content: scroller.firstElementChild,
      lerp: 0.1,
      duration: 1.2,
      smoothWheel: true,
      smoothTouch: true,
    });

    function raf(time) {
      lenisRef.current.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Initial transform update
    updateCardTransforms();

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      scroller.removeEventListener('scroll', handleScroll);
    };
  }, [updateCardTransforms]);

  const handleProjectClick = useCallback((project) => {
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
      z-index: 9999;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    document.body.appendChild(flash);
    
    requestAnimationFrame(() => {
      flash.style.opacity = '1';
      setTimeout(() => {
        flash.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(flash);
          if (project.route) {
            navigate(project.route);
          }
        }, 300);
      }, 150);
    });
  }, [navigate]);

  return (
    <div 
      ref={scrollerRef} 
      className={`projects-scroll-container ${className}`}
    >
      <div className="projects-scroll-content">
        {projects.map((project, index) => (
          <div
            key={project.id || index}
            ref={(el) => (cardsRef.current[index] = el)}
            className="projects-scroll-card"
          >
            <article className="project-card" onClick={() => handleProjectClick(project)}>
              <div className="project-card-content">
                <header className="project-card-header">
                  <h3 className="project-card-title">{project.title}</h3>
                  <p className="project-card-description">{project.description}</p>
                </header>
                <div className="project-card-tech">
                  {project.techStack.map((tech) => (
                    <span key={tech} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          </div>
        ))}
        <div className="projects-scroll-end" style={{ height: '100vh' }} />
      </div>
    </div>
  );
};

export default ProjectsScrollStack;