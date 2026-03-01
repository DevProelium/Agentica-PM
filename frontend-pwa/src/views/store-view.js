import api from '../core/api.js';
import { showToast } from '../core/app.js';
import { getState } from '../core/store.js';

export default async function StoreView() {
  let items = [];
  let container;

  async function render(c) {
    container = c;
    c.style.cssText = 'padding:64px 16px 80px;min-height:100dvh;';
    c.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <h2 style="font-size:1.2rem">Store</h2>
        <select id="cat-filter" style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
          color:#eaeaea;padding:6px 10px;border-radius:8px;font-size:13px">
          <option value="">All</option>
          <option value="skin">Skins</option>
          <option value="furniture">Furniture</option>
          <option value="food">Food</option>
          <option value="environment">Environments</option>
        </select>
      </div>
      <div id="store-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px"></div>
    `;

    c.querySelector('#cat-filter').addEventListener('change', async e => {
      await loadItems(e.target.value);
    });

    await loadItems();
  }

  async function loadItems(category = '') {
    try {
      items = await api.listStore(category ? { category } : undefined);
      renderItems();
    } catch (err) {
      showToast('Failed to load store', 'error');
    }
  }

  function renderItems() {
    const grid = container.querySelector('#store-grid');
    if (!grid) return;
    grid.innerHTML = items.map(item => `
      <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:14px;
        border:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:28px;text-align:center;margin-bottom:8px">${itemIcon(item.category)}</div>
        <p style="font-size:13px;font-weight:600;margin-bottom:2px">${item.name}</p>
        <p style="font-size:11px;color:#8892a4;margin-bottom:10px">${rarityLabel(item.rarity)}</p>
        <button data-id="${item.id}" class="buy-btn" style="
          width:100%;padding:8px;background:#e94560;border:none;border-radius:8px;
          color:#fff;cursor:pointer;font-size:12px;font-weight:600">
          ${item.price_coins ? `🪙 ${item.price_coins}` : `💎 ${item.price_gems}`}
        </button>
      </div>
    `).join('');

    grid.querySelectorAll('.buy-btn').forEach(btn => {
      btn.addEventListener('click', () => purchase(btn.dataset.id));
    });
  }

  async function purchase(itemId) {
    try {
      await api.purchase({ itemId });
      showToast('Purchased!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function itemIcon(cat) {
    const icons = { skin:'👗', furniture:'🛋️', food:'🍔', accessory:'💍', environment:'🌳' };
    return icons[cat] || '📦';
  }

  function rarityLabel(r) {
    const map = { common:'⚪ Common', rare:'🔵 Rare', epic:'🟣 Epic', legendary:'🟡 Legendary' };
    return map[r] || r;
  }

  return { render };
}
