const API = 'https://pokeapi.co/api/v2'
const LIMIT = 1025
const pokedex = document.getElementById('pokedex')
const search = document.getElementById('search')
const modal = document.getElementById('modal')
const modalBody = document.getElementById('modal-body')
const closeBtn = document.getElementById('close')
const themeToggle = document.getElementById('theme-toggle')

const typeColors = {
  normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'
}


const detailsCache = new Map()

function pad(n){return `#${String(n).padStart(3,'0')}`}

const generations = [
  {id:'all',label:'Todas',min:1,max:1025},
  {id:'gen1',label:'Geração I',min:1,max:151},
  {id:'gen2',label:'Geração II',min:152,max:251},
  {id:'gen3',label:'Geração III',min:252,max:386},
  {id:'gen4',label:'Geração IV',min:387,max:493},
  {id:'gen5',label:'Geração V',min:494,max:649},
  {id:'gen6',label:'Geração VI',min:650,max:721},
  {id:'gen7',label:'Geração VII',min:722,max:809},
  {id:'gen8',label:'Geração VIII',min:810,max:898},
  {id:'gen9',label:'Geração IX',min:899,max:1025}
]

let activeGen = generations[0]

function renderGenBar(){
  const bar = document.getElementById('gen-bar')
  bar.innerHTML = ''
  generations.forEach(g=>{
    const b = document.createElement('button')
    b.className = 'gen-btn'
    b.textContent = g.label
    b.dataset.min = g.min
    b.dataset.max = g.max
    b.dataset.id = g.id
    if(g.id === activeGen.id) b.classList.add('active')
    b.addEventListener('click',()=>{
      activeGen = g
      Array.from(bar.children).forEach(ch=>ch.classList.remove('active'))
      b.classList.add('active')
      applyFilters()
    })
    bar.appendChild(b)
  })
}

function applyFilters(){
  const q = (search.value||'').toLowerCase().trim()
  Array.from(document.querySelectorAll('.card')).forEach(card=>{
    const name = card.dataset.name
    const id = Number(card.dataset.id)
    const matchesQuery = !q || name.includes(q) || String(id).startsWith(q)
    const inGen = (activeGen.id === 'all') || (id >= activeGen.min && id <= activeGen.max)
    card.style.display = (matchesQuery && inGen) ? '' : 'none'
  })
}

async function loadList(){
  pokedex.innerHTML = '<div class="loading">Carregando lista de Pokémon…</div>'
  const res = await fetch(`${API}/pokemon?limit=${LIMIT}`)
  const data = await res.json()
  pokedex.innerHTML = ''
  data.results.forEach((r)=>{
    const id = r.url.split('/').filter(Boolean).pop()
    renderCardLite({name:r.name,id,detailUrl:r.url})
  })
}

function renderCardLite(p){
  const el = document.createElement('div')
  el.className = 'card'
  el.dataset.name = p.name
  el.dataset.id = p.id
  const image = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`
  el.innerHTML = `
    <div class="number">${pad(p.id)}</div>
    <img class="thumb" src="${image}" alt="${p.name}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png'" />
    <div class="name">${p.name}</div>
  `
  el.addEventListener('click',()=>openDetails(p))
  pokedex.appendChild(el)
}

async function openDetails(p){
  const id = p.id
  if(detailsCache.has(id)) return showModal(detailsCache.get(id))
  modalBody.innerHTML = '<div class="loading">Carregando detalhes…</div>'
  modal.classList.remove('hidden')
  try{
    const res = await fetch(`${API}/pokemon/${id}`)
    const data = await res.json()
    detailsCache.set(id,data)
    showModal(data)
  }catch(err){
    modalBody.innerHTML = '<p style="color:#a00">Falha ao carregar detalhes.</p>'
    console.error(err)
  }
}

function showModal(p){
  const types = p.types
  const img = p.sprites.other['official-artwork'].front_default||p.sprites.front_default
  const height = (p.height * 0.1).toFixed(1)
  const weight = (p.weight * 0.1).toFixed(1)
  
  modalBody.innerHTML = `
    <div class="meta">
      <img class="thumb-lg" src="${img}" alt="${p.name}" style="filter:drop-shadow(0 10px 25px rgba(255,107,107,0.3))" />
      <div>
        <h2 style="text-transform:capitalize;margin:0;font-size:1.8rem;color:var(--text-primary)">${p.name}</h2>
        <p style="margin:.5rem 0;color:var(--accent-1);font-weight:700">${pad(p.id)}</p>
        <div style="display:flex;gap:.4rem;margin:.75rem 0;flex-wrap:wrap">
          ${types.map(t=>`<span class="type" style="background:${typeColors[t.type.name] || '#777'}">${t.type.name}</span>`).join('')}
        </div>
      </div>
    </div>
    <div style="background:rgba(0,0,0,0.1);padding:1rem;border-radius:12px;margin:1rem 0">
      <p style="margin:0.5rem 0;color:var(--text-secondary)"><strong>Abilities:</strong> ${p.abilities.map(a=>`<span style="color:var(--accent-2)">${a.ability.name}</span>`).join(', ')}</p>
      <p style="margin:0.5rem 0;color:var(--text-secondary)"><strong>Height:</strong> ${height}m</p>
      <p style="margin:0.5rem 0;color:var(--text-secondary)"><strong>Weight:</strong> ${weight}kg</p>
    </div>
    <div class="stats">
      ${p.stats.map(s=>{
        const pct = Math.min(100, (s.base_stat/255)*100)
        return `<div class="stat"><span>${s.stat.name}</span><div style="flex:1;margin-left:.5rem;background:rgba(0,0,0,0.2);border-radius:4px;overflow:hidden;height:6px"><div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--accent-1),var(--accent-2));"></div></div><strong>${s.base_stat}</strong></div>`
      }).join('')}
    </div>
  `
}

closeBtn.addEventListener('click',()=>modal.classList.add('hidden'))
modal.addEventListener('click',e=>{if(e.target===modal)modal.classList.add('hidden')})

search.addEventListener('input',e=>{
  const q = e.target.value.toLowerCase().trim()
  Array.from(document.querySelectorAll('.card')).forEach(card=>{
    const name = card.dataset.name
    const id = String(card.dataset.id)
    card.style.display = (name.includes(q) || id.startsWith(q)) ? '' : 'none'
  })
})

loadList().then(()=>{
  renderGenBar()
}).catch(err=>{
  pokedex.innerHTML = '<p style="padding:1rem;color:#a00">Falha ao carregar lista — verifique sua conexão.</p>'
  console.error(err)
})

// Theme toggle
function initTheme(){
  const saved = localStorage.getItem('theme')
  const isDark = saved ? saved === 'dark' : !window.matchMedia('(prefers-color-scheme: light)').matches
  if(!isDark) document.documentElement.classList.add('light-mode')
  updateThemeBtn()
}

function updateThemeBtn(){
  const isLight = document.documentElement.classList.contains('light-mode')
  themeToggle.textContent = isLight ? '🌙' : '☀️'
}

themeToggle.addEventListener('click',()=>{
  const html = document.documentElement
  html.classList.toggle('light-mode')
  localStorage.setItem('theme', html.classList.contains('light-mode') ? 'light' : 'dark')
  updateThemeBtn()
})

initTheme()

