(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const data = window.PORTFOLIO_DATA;
  const number = (v, digits=2) => Number.isFinite(v) ? new Intl.NumberFormat('pt-BR',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(v) : 'Não disponível';
  const money = (v,currency='BRL') => Number.isFinite(v) ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:currency || 'BRL'}).format(v) : 'Não disponível';
  const capital = (v,currency) => Number.isFinite(v) ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:currency || 'BRL',notation:'compact',maximumFractionDigits:2}).format(v) : 'Não disponível';
  const date = value => value && !Number.isNaN(Date.parse(value)) ? new Date(value).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}) : 'Data não informada';
  function el(tag,text,cls) {const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
  function metric(label,value) {const n=el('div');n.append(el('span',label),el('b',value));return n;}
  function safeLink(url) {try {const u=new URL(url);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}}
  function list(title,items,parent) {if(!items?.length)return;const box=el('div');box.append(el('h4',title));const ul=el('ul');items.forEach(s=>ul.append(el('li',s)));box.append(ul);parent.append(box);}
  function chart(a) {
    const host=$('chart');host.replaceChildren();host.append(el('h4','Histórico de fechamento · últimos 3 meses'));
    const points=a.history.filter(p=>Number.isFinite(p.close));
    if(points.length<2){host.append(el('p','Histórico ainda indisponível.'));return;}
    const W=800,H=220,P=32,prices=points.map(p=>p.close),lo=Math.min(...prices),hi=Math.max(...prices),range=hi-lo||1;
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`Histórico de ${a.ticker}: ${points.length} fechamentos, mínimo ${money(lo)}, máximo ${money(hi)}`);
    const line=document.createElementNS(ns,'polyline');line.setAttribute('points',points.map((p,i)=>`${P+i*(W-2*P)/(points.length-1)},${H-P-(p.close-lo)*(H-2*P)/range}`).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#3fd89a');line.setAttribute('stroke-width','3');svg.append(line);host.append(svg);
    host.append(el('p',`${points.length} pregões · mínimo ${money(lo)} · máximo ${money(hi)} · ${new Date(points[0].market_time).toLocaleDateString('pt-BR')} a ${new Date(points.at(-1).market_time).toLocaleDateString('pt-BR')}`,'m'));
    const details=el('details');details.append(el('summary','Consultar fechamentos'));const table=el('table');const head=el('tr');['Data','Fechamento','Volume'].forEach(s=>head.append(el('th',s)));table.append(head);
    [...points].reverse().forEach(p=>{const tr=el('tr');[new Date(p.market_time).toLocaleDateString('pt-BR'),money(p.close),number(p.volume,0)].forEach(s=>tr.append(el('td',s)));table.append(tr);});details.append(table);host.append(details);
  }
  function show(a) {
    [...$('tabs').children].forEach(b=>{const active=b.dataset.ticker===a.ticker;b.classList.toggle('on',active);b.setAttribute('aria-pressed',String(active));});
    const q=a.quote || {},currency=q.currency || 'BRL';
    const kpis=$('kpis');kpis.replaceChildren();
    [['Ativo',`${a.ticker} · ${a.company}`],['Cotação',money(a.price,currency)],['Variação diária',Number.isFinite(q.change_percent)?`${number(q.change_percent)}%`:'Não disponível'],['Preço médio da carteira',money(a.average_price)],['Quantidade',number(a.quantity,0)],['Resultado não realizado',money(a.unrealized_result)]].forEach(([k,v])=>kpis.append(metric(k,v)));
    $('quote-status').textContent=`Preço de ${date(a.market_time)} · coletado em ${date(a.fetched_at)}${a.fictitious?' · Quantidade e preço médio são fictícios.':''}`;
    const fields=$('market-fields');fields.replaceChildren();
    [['Variação em valor',q.change],['Abertura',q.open],['Máxima do dia',q.high],['Mínima do dia',q.low],['Fechamento anterior',q.previous_close],['Mínima em 52 semanas',q.week52_low],['Máxima em 52 semanas',q.week52_high]].forEach(([k,v])=>fields.append(metric(k,money(v,currency))));
    const cap=metric('Valor de mercado',capital(q.market_cap,currency));cap.title=money(q.market_cap,currency);fields.append(cap);
    fields.append(metric('Volume',number(q.volume,0)),metric('Valor investido',money(a.invested_value)),metric('Valor da posição',money(a.market_value)),metric('Retorno da posição',Number.isFinite(a.return_percent)?`${number(a.return_percent)}%`:'Não disponível'));
    chart(a);
    const ai=a.analysis,news=$('news');news.replaceChildren();news.append(el('h4','Notícias relevantes'));
    if(!a.news.length)news.append(el('p','Nenhuma notícia relevante encontrada até o momento.'));
    a.news.forEach(n=>{
      const card=el('article',undefined,'nw');card.append(el('h4',n.title),el('div',`${n.source_name} · publicado em ${date(n.published_at)}`,'m'));
      const analyzed=ai?.result?.news?.find(x=>x.id===n.id);
      if(analyzed){const labels={positive:'Positivo',neutral:'Neutro',negative:'Negativo',low:'baixo',medium:'médio',high:'alto',uncertain:'incerto'};card.append(el('p',`IA: ${labels[analyzed.sentiment]} · impacto ${labels[analyzed.impact]}${ai.stale?' · análise anterior':''}`),el('p',analyzed.summary),el('p',analyzed.reason,'m'));}
      else {card.append(el('p',n.summary || 'Fonte disponibiliza apenas a manchete.'),el('p','Análise de IA pendente.','m'));}
      const url=safeLink(n.url);if(url){const link=el('a','Ler na fonte');link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.className='source-link';card.append(link);}news.append(card);
    });
    const cons=$('cons');cons.replaceChildren();cons.append(el('b','Análise do ativo por IA'));
    if(ai){cons.append(el('p',`${ai.stale?'Análise anterior — dados foram atualizados.':'Análise disponível.'} Gerada em ${date(ai.generated_at)}`,'m'),el('p',ai.result.summary));const grid=el('div',undefined,'analysis-grid');list('Pontos positivos',ai.result.positives,grid);list('Riscos e atenção',ai.result.risks,grid);list('Limitações',ai.result.limitations,grid);cons.append(grid);}
    else cons.append(el('p','Análise pendente. Os indicadores e as notícias acima são reais; a síntese será exibida quando a etapa de IA estiver configurada e executada.'));
  }
  $('y').textContent=new Date().getFullYear();
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(e=>io.observe(e));
  if(!data?.assets?.length){$('dashboard-status').textContent='Dados indisponíveis. Execute atualizar_carteira.bat para gerar a dashboard.';return;}
  $('dashboard-status').textContent=`Dados reais · exportação de ${date(data.generated_at)} · ${data.assets.length} ativos. Atualização por coleta; a cotação pode ser defasada.`;
  data.assets.forEach(a=>{const b=el('button',a.ticker);b.type='button';b.dataset.ticker=a.ticker;b.onclick=()=>show(a);$('tabs').append(b);});show(data.assets[0]);
})();
