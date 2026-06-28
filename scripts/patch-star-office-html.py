#!/usr/bin/env python3
"""
Patch mínimo al index.html de Star-Office-UI para que:
1. Cargue assets desde /star-office/ (en lugar de /static/, que es lo que Flask sirve)
2. Reemplace {{VERSION_TIMESTAMP}} por un valor numérico estable (cache-bust en restart)
3. Reescriba los fetch del contrato de datos para que apunten a /api/star-office/*
   en lugar de los endpoints del backend Flask original
4. Reescriba el botón "/set_state" para que use nuestro endpoint

NO toca nada más. El resto del HTML, CSS, JS, sprites, animaciones quedan TAL CUAL.
"""

import re
import sys
import time
from pathlib import Path

HTML = Path("/home/z/my-project/public/star-office/index.html")
if not HTML.exists():
    sys.exit(f"Not found: {HTML}")

original = HTML.read_text(encoding="utf-8")
patched = original
changes = []

# 1) Reemplazar /static/ por /star-office/ (todos los assets y el script de Phaser)
n = patched.count("/static/")
patched = patched.replace("/static/", "/star-office/")
changes.append(f"/static/ → /star-office/ ({n} ocurrencias)")

# 2) Reemplazar {{VERSION_TIMESTAMP}} por epoch actual (estable por build)
ts = str(int(time.time()))
n = patched.count("{{VERSION_TIMESTAMP}}")
patched = patched.replace("{{VERSION_TIMESTAMP}}", ts)
changes.append(f"{{{{VERSION_TIMESTAMP}}}} → {ts} ({n} ocurrencias)")

# 3) Reescribir los fetch del contrato de datos
# Order matters: more specific first

# /yesterday-memo → /api/star-office/yesterday-memo
old_memo = "fetch('/yesterday-memo?t=' + Date.now(), { cache: 'no-store' })"
new_memo = "fetch('/api/star-office/yesterday-memo?t=' + Date.now(), { cache: 'no-store' })"
if old_memo in patched:
    patched = patched.replace(old_memo, new_memo)
    changes.append("/yesterday-memo → /api/star-office/yesterday-memo (1)")
else:
    sys.exit("FAIL: no encontré el fetch /yesterday-memo")

# /agents → /api/star-office/agents
old_agents = "fetch('/agents?t=' + Date.now(), { cache: 'no-store' })"
new_agents = "fetch('/api/star-office/agents?t=' + Date.now(), { cache: 'no-store' })"
if old_agents in patched:
    patched = patched.replace(old_agents, new_agents)
    changes.append("/agents → /api/star-office/agents (1)")
else:
    sys.exit("FAIL: no encontré el fetch /agents")

# /status → /api/star-office/status
old_status = "fetch('/status', { cache: 'no-store' })"
new_status = "fetch('/api/star-office/status', { cache: 'no-store' })"
if old_status in patched:
    patched = patched.replace(old_status, new_status)
    changes.append("/status → /api/star-office/status (1)")
else:
    sys.exit("FAIL: no encontré el fetch /status")

# /set_state → /api/star-office/set_state (botones de test)
old_set = "fetch('/set_state', {"
new_set = "fetch('/api/star-office/set_state', {"
if old_set in patched:
    patched = patched.replace(old_set, new_set)
    changes.append("/set_state → /api/star-office/set_state (1)")
else:
    changes.append("/set_state NO ENCONTRADO (probablemente innecesario)")

# Sanity: no quedan placeholders Flask
if "{{" in patched or "}}" in patched:
    leftover = [l for l in patched.splitlines() if "{{" in l or "}}" in l][:5]
    sys.exit(f"FAIL: quedan placeholders Flask: {leftover}")

# Sanity: no quedan referencias a /static/
if "/static/" in patched:
    leftover = [l for l in patched.splitlines() if "/static/" in l][:5]
    sys.exit(f"FAIL: quedan referencias /static/: {leftover}")

# Sanity: las URLs /api/star-office/ están presentes
for ep in ["/api/star-office/yesterday-memo", "/api/star-office/agents", "/api/star-office/status"]:
    if ep not in patched:
        sys.exit(f"FAIL: no encontré {ep} en el resultado final")

# 4) Inyectar PostMessage bridge ANTES de </body> para que el parent
# pueda pedirle al office que se "enfoque" en un agente específico.
# Esto es la única modificación funcional (no de URLs) que hacemos al HTML.
# Se implementation mínimo: el office no responde, pero escucha y loguea.
# Una vez que Star-Office-UI agregue soporte nativo, este script se puede sacar.
BRIDGE_SCRIPT = """
<script>
// Botardo OS — PostMessage bridge (parent ↔ iframe)
// Permite que el parent (Mission Control) le pida al office que se enfoque
// en un agente específico. El office original no soporta esto, así que
// por ahora solo forzamos un fetchStatus() para refrescar el estado visual.
(function() {
  if (window.parent === window) return; // no estamos embebidos
  window.addEventListener('message', function(ev) {
    // Solo aceptar mensajes del parent directo (no de cualquier origen)
    if (ev.source !== window.parent) return;
    var data = ev.data || {};
    if (data.source !== 'botardo-os') return;
    if (data.type === 'focus-agent') {
      // Forzar refresco de estado para que el sprite del agente se mueva
      // a la posición correcta según su estado actual.
      try {
        if (typeof window.fetchStatus === 'function') window.fetchStatus();
        if (typeof window.fetchGuestAgents === 'function') window.fetchGuestAgents();
        // Avisar al parent que recibimos el mensaje (para feedback en UI)
        ev.source.postMessage({
          source: 'botardo-os-office',
          type: 'focus-agent-ack',
          agentSlug: data.agentSlug
        }, ev.origin);
      } catch (e) {
        console.warn('[botardo-os bridge] error:', e);
      }
    }
    if (data.type === 'ping') {
      ev.source.postMessage({
        source: 'botardo-os-office',
        type: 'pong'
      }, ev.origin);
    }
  });
  // Avisar al parent que estamos listos para recibir mensajes
  window.parent.postMessage({
    source: 'botardo-os-office',
    type: 'ready'
  }, '*');
})();
</script>
"""
if "botardo-os-office" not in patched:
    if "</body>" in patched:
        patched = patched.replace("</body>", BRIDGE_SCRIPT + "\n</body>", 1)
        changes.append("PostMessage bridge inyectado antes de </body> (1)")
    else:
        sys.exit("FAIL: no encontré </body> para inyectar el bridge")
else:
    changes.append("PostMessage bridge ya presente (skip)")

HTML.write_text(patched, encoding="utf-8")

print("✅ Patch aplicado correctamente a", HTML)
print()
for c in changes:
    print(f"  - {c}")
print()
print(f"Tamaño: {len(original)} → {len(patched)} bytes (delta {len(patched)-len(original):+d})")
