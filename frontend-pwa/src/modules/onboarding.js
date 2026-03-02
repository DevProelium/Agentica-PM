import api from '../core/api.js';
import { setState } from '../core/store.js';
import { navigate } from '../core/router.js';

export async function runOnboarding() {
  const status = await api.onboardingStatus();
  if (status.completed) return;

  // PASO 1
  await showStep1();
  // PASO 2
  const agentData = await showStep2();
  // PASO 3
  const apiConfig = await showStep3();
  // PASO 4
  const skin = await showStep4();
  // PASO 5
  const agent = await createAgent(agentData, apiConfig, skin);
  await showStep5(agent);
  await api.completeOnboarding();
  setState({ agent });
  navigate('home');
}

// Cada showStepX() es un componente HTML con lógica de avance.
// Ejemplo:
async function showStep1() {
  return new Promise(resolve => {
    const el = document.createElement('div');
    el.innerHTML = `
      <div class="onboarding-step">
        <div class="logo-anim"></div>
        <h2>Bienvenido a Crisalida</h2>
        <p>Aquí crearás tu primer agente de IA.</p>
        <button id="start-btn">Comenzar</button>
      </div>
    `;
    document.body.appendChild(el);
    el.querySelector('#start-btn').onclick = () => {
      el.remove();
      resolve();
    };
  });
}

// ...showStep2, showStep3, showStep4, showStep5 similares
