import api from '../core/api.js';
import { getState, setState } from '../core/store.js';
import { showToast } from '../core/app.js';

export default async function AgentsView() {
  let agents = [];
  let container;

  async function render(c) {
    container = c;
    c.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';

    agents = await api.listAgents().catch(() => []);
    renderList();
  }

  function renderList() {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h2 style="font-size:1.2rem">My Agents</h2>
        <button id="new-agent" style="padding:8px 16px;background:#e94560;border:none;border-radius:8px;
          color:#fff;cursor:pointer;font-size:13px">+ New</button>
      </div>
      <div id="agents-list" style="display:flex;flex-direction:column;gap:10px"></div>
      <div id="create-form" style="display:none;margin-top:20px"></div>
    `;

    const list = container.querySelector('#agents-list');
    list.innerHTML = agents.map(a => `
      <div class="agent-card" data-id="${a.id}" style="
        padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;
        border:1px solid ${getState('agent')?.id === a.id ? '#e94560' : 'rgba(255,255,255,0.06)'};
        cursor:pointer;display:flex;align-items:center;gap:12px">
        <span style="font-size:36px">🤖</span>
        <div>
          <p style="font-weight:600">${a.name}</p>
          <p style="font-size:12px;color:#8892a4">${a.personality} · Level ${a.level} · ${a.model_provider}</p>
        </div>
        ${getState('agent')?.id === a.id ? '<span style="margin-left:auto;color:#e94560;font-size:12px">Active</span>' : ''}
      </div>
    `).join('');

    container.querySelectorAll('.agent-card').forEach(card => {
      card.addEventListener('click', () => {
        const agent = agents.find(a => a.id === card.dataset.id);
        setState({ agent });
        showToast(`Switched to ${agent.name}`, 'success');
        renderList();
      });
    });

    container.querySelector('#new-agent').addEventListener('click', renderCreateForm);
  }

  function renderCreateForm() {
    const form = container.querySelector('#create-form');
    form.style.display = 'block';
    form.innerHTML = `
      <h3 style="margin-bottom:12px">Create Agent</h3>
      <div style="display:flex;flex-direction:column;gap:10px">
        ${field('name', 'Agent Name', 'text')}
        ${field('personality', 'Personality (e.g. friendly, curious)', 'text')}
        <select name="modelProvider" style="${selectStyle()}">
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
          <option value="ollama">Ollama (local)</option>
          <option value="lmstudio">LM Studio (local)</option>
        </select>
        ${field('modelName', 'Model (e.g. gpt-4o-mini)', 'text')}
        ${field('apiKey', 'API Key (optional for local)', 'password')}
        <textarea name="systemPrompt" placeholder="Custom system prompt (optional)"
          style="${selectStyle()}height:80px;resize:vertical"></textarea>
        <button id="submit-create" style="padding:12px;background:#e94560;border:none;border-radius:8px;color:#fff;cursor:pointer;font-weight:600">Create Agent</button>
      </div>
    `;

    form.querySelector('#submit-create').addEventListener('click', async () => {
      const data = {
        name:          form.querySelector('[name=name]').value,
        personality:   form.querySelector('[name=personality]').value,
        modelProvider: form.querySelector('[name=modelProvider]').value,
        modelName:     form.querySelector('[name=modelName]').value,
        apiKey:        form.querySelector('[name=apiKey]').value,
        systemPrompt:  form.querySelector('[name=systemPrompt]').value,
      };
      try {
        const agent = await api.createAgent(data);
        agents.unshift(agent);
        setState({ agent, agents });
        form.style.display = 'none';
        showToast(`${agent.name} created!`, 'success');
        renderList();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  function field(name, placeholder, type) {
    return `<input name="${name}" type="${type}" placeholder="${placeholder}"
      style="padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
      border-radius:8px;color:#eaeaea;font-size:13px;outline:none" />`;
  }

  function selectStyle() {
    return 'padding:10px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#eaeaea;font-size:13px;outline:none;width:100%;';
  }

  return { render };
}
