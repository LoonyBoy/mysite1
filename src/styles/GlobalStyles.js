import { createGlobalStyle } from 'styled-components'

export const GlobalStyles = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    font-family: 'Space Grotesk', monospace;
    font-weight: 400;
    line-height: 1.2;
    overflow-x: hidden;
    scroll-behavior: smooth;
    height: 100%;
    
    @media (max-width: 768px) {
      height: auto;
      overflow-y: visible;
    }
  }

  body {
    background: #000;
    color: #fff;
    cursor: none;
    min-height: 100vh;
    position: relative;
    
    @media (max-width: 768px) {
      cursor: auto;
      min-height: auto;
      touch-action: pan-y;
      position: static;
      overflow: visible;
    }
  }

  :root {
    --primary-red: #D14836;
    --black: #000000;
    --white: #ffffff;
    --gray: #333333;
    
    /* Новые переменные для меню */
    --hue: 27;
    --sat: 69%;
    --purple-primary: rgba(132, 0, 255, 1);
    --purple-glow: rgba(132, 0, 255, 0.2);
    --purple-border: rgba(132, 0, 255, 0.8);
    --border-color: #392e4e;
    --background-dark: #060010;
    color-scheme: light dark;
  }

  /* Основной курсор с улучшенной производительностью */
  .cursor {
    position: fixed;
    top: 0;
    left: 0;
    width: 20px;
    height: 20px;
    background: var(--primary-red);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9999;
    mix-blend-mode: difference;
    border: 0px solid transparent;
    will-change: transform;
    transform-origin: center center;
    
    /* Убираем все CSS transition для мгновенного отклика */
    transition: none;
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  /* След курсора */
  .cursor-trail {
    z-index: 9998;
    opacity: 0;
    mix-blend-mode: difference;
    transition: none;
    will-change: transform, opacity, scale;
    
    /* Эффект размытия для следа */
    filter: blur(1px);
    
    @media (max-width: 768px) {
      display: none;
    }
  }

  /* Состояние hover с плавным переходом */
  .cursor.hover {
    transform: scale(2);
    background: var(--white);
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                background-color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  .cursor-trail.hover {
    transform: scale(2);
    background: var(--white);
    filter: blur(2px);
    transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94),
                background-color 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* Навигационный курсор */
  .cursor.navigation {
    transform: scale(2);
    background: var(--primary-red);
    border-radius: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: bold;
    color: white;
    mix-blend-mode: normal;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  }

  /* Треугольный курсор с улучшенным эффектом */
  .cursor.triangle {
    transform: scale(1.2) translateX(-5px);
    background: transparent;
    border-radius: 0;
    width: 0;
    height: 0;
    border-right: 16px solid var(--primary-red);
    border-top: 12px solid transparent;
    border-bottom: 12px solid transparent;
    mix-blend-mode: normal;
    transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    /* Добавляем легкое свечение для треугольника */
    filter: drop-shadow(0 0 4px var(--primary-red));
  }

  /* Улучшенный эффект для анимации корабля */
  .cursor.triangle.with-trail {
    filter: drop-shadow(0 0 8px var(--primary-red));
    box-shadow: 0 0 15px var(--primary-red);
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    background: none;
    border: none;
    color: inherit;
    font-family: inherit;
    cursor: none;
  }

  ::selection {
    background: var(--primary-red);
    color: var(--white);
  }

  /* Мобильные оптимизации */
  @media (max-width: 768px) {
    html {
      font-size: 14px;
    }
    
    body {
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: optimizeLegibility;
    }
    
    * {
      -webkit-tap-highlight-color: rgba(209, 72, 54, 0.3);
    }
  }

  /* Режим производительности - отключает эффекты курсора */
  .performance-mode * {
    animation-duration: 0.1s !important;
    transition-duration: 0.1s !important;
  }

  .performance-mode .cursor,
  .performance-mode .cursor-trail {
    display: none;
  }

  /* Пауза анимаций */
  .paused * {
    animation-play-state: paused !important;
  }

  /* Touch-friendly elements */
  @media (max-width: 768px) {
    button, a, [data-hover] {
      min-height: 44px;
      min-width: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  /* iPhone safe areas */
  @supports (padding: max(0px)) {
    body {
      padding-left: max(0px, env(safe-area-inset-left));
      padding-right: max(0px, env(safe-area-inset-right));
    }
    
    .safe-area-content {
      padding-top: max(20px, env(safe-area-inset-top));
      padding-bottom: max(20px, env(safe-area-inset-bottom));
      padding-left: max(20px, env(safe-area-inset-left));
      padding-right: max(20px, env(safe-area-inset-right));
    }
    
    .particles-fullscreen,
    .background-fullscreen {
      margin: 0 !important;
      padding: 0 !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      
      @supports (height: 100dvh) {
        height: 100dvh !important;
      }
    }
  }

  /* Z-index для частиц */
  .particles-fullscreen {
    position: fixed !important;
    z-index: -1 !important;
    pointer-events: none !important;
  }

  .background-fullscreen {
    position: fixed !important;
    z-index: -2 !important;
    pointer-events: none !important;
  }
  
  /* Дополнительные стили для iOS */
  @media (max-width: 768px) {
    body {
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: none;
    }
  }

  /* Специальные стили для страницы LightLab на мобильных */
  .lightlab-mobile-scroll {
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch !important;
    touch-action: pan-y !important;
    overscroll-behavior: none !important;
    height: auto !important;
    min-height: auto !important;
    position: static !important;
  }
    
  .particles-fullscreen,
  .background-fullscreen {
    position: fixed !important;
    z-index: -1;
    pointer-events: none;
    
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    outline: none !important;
  }

  /* Оптимизация для высокой производительности курсора */
  .cursor,
  .cursor-trail {
    backface-visibility: hidden;
    transform-style: preserve-3d;
    -webkit-backface-visibility: hidden;
    -webkit-transform-style: preserve-3d;
  }

  /* Предотвращение размытия при быстром движении */
  .cursor {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: optimize-contrast;
    image-rendering: pixelated;
  }

  /* Улучшенная поддержка высоких DPI дисплеев */
}
`;
