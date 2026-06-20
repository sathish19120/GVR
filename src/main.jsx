<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#3B6D11" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="GVR" />
    <meta name="description" content="Green Village Rice — Fresh farm-to-home Sona Masoori rice delivered across Hyderabad." />
    <title>Green Village Rice</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="preconnect" href="https://sgmtsvfybmunpnxgsdxz.supabase.co" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    <style>
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { font-size: 16px; -webkit-text-size-adjust: 100%; height: -webkit-fill-available; }
      body { font-family: 'Inter', system-ui, sans-serif; background: #F4F6F3; min-height: 100vh; }
      #root { min-height: 100vh; }

      /* Initial loading screen shown before JS loads */
      #splash {
        position: fixed; inset: 0;
        background: #F4F6F3;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        z-index: 9999; transition: opacity 0.4s;
      }
      #splash.hidden { opacity: 0; pointer-events: none; }
      .splash-icon {
        width: 64px; height: 64px; border-radius: 16px;
        background: #3B6D11; display: flex; align-items: center;
        justify-content: center; font-size: 32px;
        margin-bottom: 16px;
        box-shadow: 0 4px 14px rgba(59,109,17,0.35);
      }
      .splash-title { color: #3B6D11; font-weight: 700; font-size: 16px; margin-bottom: 6px; }
      .splash-sub   { color: #6B7280; font-size: 13px; margin-bottom: 24px; }
      .splash-dots  { display: flex; gap: 6px; }
      .splash-dot   { width: 8px; height: 8px; border-radius: 50%; background: #3B6D11; animation: splashBounce 1.2s ease-in-out infinite; }
      .splash-dot:nth-child(2) { animation-delay: 0.2s; }
      .splash-dot:nth-child(3) { animation-delay: 0.4s; }
      @keyframes splashBounce {
        0%,80%,100% { transform: scale(0.6); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }
      input, select, textarea, button {
        font-family: inherit; font-size: 16px !important;
        -webkit-tap-highlight-color: transparent; touch-action: manipulation;
      }
      ::-webkit-scrollbar { width: 4px; height: 4px; }
      ::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
    </style>
  </head>
  <body>
    <!-- Splash screen shown instantly before React loads -->
    <div id="splash">
      <div class="splash-icon">🌾</div>
      <p class="splash-title">Green Village Rice</p>
      <p class="splash-sub">గ్రీన్ విలేజ్ రైస్</p>
      <div class="splash-dots">
        <div class="splash-dot"></div>
        <div class="splash-dot"></div>
        <div class="splash-dot"></div>
      </div>
    </div>

    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
    <script>
      // Hide splash once React mounts
      window.addEventListener('load', () => {
        setTimeout(() => {
          const splash = document.getElementById('splash')
          if (splash) {
            splash.classList.add('hidden')
            setTimeout(() => splash.remove(), 400)
          }
        }, 300)
      })
    </script>
  </body>
</html>
