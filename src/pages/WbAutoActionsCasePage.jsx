import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
// (Иконки карусели удалены вместе с каруселью)

gsap.registerPlugin(ScrollTrigger)

const CaseContainer = styled.div`min-height:100vh;min-height:100dvh;background:transparent;position:relative;width:100%;overflow-x:hidden;z-index:0;color:#000;@media(max-width:768px){min-height:auto;overflow-y:visible;-webkit-overflow-scrolling:touch;touch-action:pan-y;height:auto;}`
const HeroSection = styled.section`height:100vh;height:100dvh;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:1.25rem;padding:4rem 2rem;text-align:center;position:relative;z-index:5;@media(max-width:768px){padding:4rem 1rem;height:100svh;min-height:100svh;position:static;}`
const CaseTitle = styled.h1`font-size:clamp(3rem,8vw,6rem);font-weight:400;line-height:1.1;letter-spacing:-0.03em;margin:0;color:#000;text-align:center;max-width:20ch;text-wrap:balance;margin-inline:auto;position:relative;z-index:2;opacity:1;@media(max-width:768px){font-size:clamp(2rem,6vw,3rem);padding:0 1rem;line-height:1.15;width:100%;user-select:none;opacity:1!important;}`
const HeaderActions = styled.div`display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:0.25rem;@media(max-width:768px){width:100%;&>a{width:100%;justify-content:center;}opacity:1!important;}`
const ContentSection = styled.section`min-height:100vh;padding:4rem 2rem;max-width:1000px;margin:0 auto;position:relative;z-index:2;@media(max-width:768px){padding:2rem 1rem;min-height:auto;}`
const Description = styled.div`font-family:inherit;font-size:1.075rem;line-height:1.7;color:#1a1a1a;margin-bottom:3rem;background:#fff;border:1px solid rgba(0,0,0,0.08);border-left:3px solid #d18f00;padding:2rem 2.25rem;box-shadow:0 6px 24px rgba(0,0,0,0.08);h3{font-size:1.2rem;font-weight:600;margin:0 0 .75rem;color:#000;display:inline-block;padding-bottom:.25rem;border-bottom:2px solid #d18f00;}h4{font-size:1rem;font-weight:600;margin:1rem 0 .5rem;color:#000;}.lead{font-size:1.1rem;color:#111;margin-bottom:1.25rem;}@media(max-width:768px){font-size:1rem;line-height:1.6;padding:1.5rem 1.25rem;margin:0 -.5rem 3rem;h3{font-size:1.1rem;}}`
const FeaturesTechGrid = styled.div`display:grid;grid-template-columns:1fr 1fr;gap:2rem 2.5rem;margin-top:.75rem;align-items:start;@media(max-width:900px){grid-template-columns:1fr;gap:1.5rem;}`
const BulletList = styled.ul`list-style:none;margin:.5rem 0 0;padding:0;li{position:relative;padding-left:1.25rem;margin:.4rem 0;}li::before{content:'';position:absolute;left:0;top:.7em;width:6px;height:6px;background:#d18f00;transform:translateY(-50%);}`
// Results / KPI styling (analogous to KlamBot case, adapted color)
const ResultsBlock = styled.div`display:flex;flex-direction:column;gap:2rem;margin-top:2.5rem;margin-bottom:1rem;`
const KpiGrid = styled.div`display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));`
const KpiCard = styled.div`
	background:#fff;border:1px solid rgba(0,0,0,0.08);padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.4rem;position:relative;overflow:hidden;
	&:before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(209,143,0,0.12),transparent);pointer-events:none;}
	h4{margin:0;font-size:.75rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#5a3a00;}
	.value{font-size:1.5rem;font-weight:600;line-height:1;color:#000;}
	.sub{font-size:.7rem;color:#444;line-height:1.15;}
`
const ResultNarrative = styled.div`font-size:.9rem;line-height:1.55;background:#fff;border:1px solid rgba(0,0,0,0.08);padding:1.15rem 1.35rem;border-left:3px solid #d18f00;box-shadow:0 4px 16px rgba(0,0,0,0.06);b{color:#000;}`
const AdvantageList = styled.ul`list-style:none;margin:.25rem 0 0;padding:0;display:grid;gap:.45rem;li{position:relative;padding-left:1.15rem;font-size:.9rem;line-height:1.35;}li:before{content:'';position:absolute;left:0;top:.65em;width:6px;height:6px;background:#d18f00;transform:translateY(-50%);}`
const Accordion = styled.div`display:flex;flex-direction:column;gap:.5rem;margin-top:.5rem;`
const AccordionItem = styled.div`border:1px solid rgba(0,0,0,0.08);background:#fff;border-radius:0;`
const AccordionHeader = styled.button`width:100%;text-align:left;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.9rem 1rem;background:transparent;border:0;border-bottom:1px solid rgba(0,0,0,0.06);cursor:pointer;color:#000;font-weight:600;letter-spacing:.01em;&:hover{background:rgba(0,0,0,0.03);} &:focus-visible{outline:2px dashed #d18f00;outline-offset:2px;}`
const Chevron = styled.span`display:inline-block;width:10px;height:10px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(${p=>p.$open?'225deg':'45deg'});transition:transform .2s ease;`
const AccordionPanel = styled.div`overflow:hidden;max-height:${p=>p.$open?'1000px':'0'};opacity:${p=>p.$open?1:0};transition:max-height .25s ease,opacity .25s ease;padding:${p=>p.$open?'.75rem 1rem 1rem':'0 1rem'};`
const BackButton = styled.button`position:fixed;top:2rem;left:2rem;z-index:1000;padding:1rem 2rem;border:2px solid #000;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);color:#000;font-size:1rem;font-weight:400;letter-spacing:.1em;text-transform:uppercase;transition:all .3s ease,opacity 1s ease;cursor:none;outline:none;user-select:none;opacity:${p=>p.visible?1:0};pointer-events:${p=>p.visible && !p.$disabled?'auto':'none'};border-radius:0;${p=>p.$disabled?'background:transparent;color:#777;border-color:transparent;opacity:.28;transform:none!important;':''}&:hover{background:${p=>p.$disabled?'transparent':'#000'};color:${p=>p.$disabled?'#777':'#fff'};transform:${p=>p.$disabled?'none':'translateY(-2px)'};} &:active{transform:translateY(0);} @media(max-width:768px){top:1rem;left:1rem;padding:.8rem 1.5rem;font-size:.9rem;cursor:pointer;touch-action:manipulation;}`
const CtaButton = styled.a`display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:0;border:2px solid #d18f00;color:#d18f00;background:rgba(255,255,255,0.85);text-decoration:none;font-weight:500;letter-spacing:.02em;transition:all .25s ease;cursor:none;will-change:transform,background,color,box-shadow;&:hover{background:#d18f00;color:#fff;transform:translateY(-2px);box-shadow:0 10px 24px rgba(209,143,0,0.25);} &:active{transform:translateY(0);} @media(max-width:768px){background:#ffffff;}`

const WbAutoActionsCasePage = () => {
	const navigate=useNavigate()
	const titleRef=useRef(null); const heroRef=useRef(null); const actionsRef=useRef(null); const backButtonRef=useRef(null)
	const { setTransitionContext } = useParticles()
	const [isBackButtonVisible,setIsBackButtonVisible]=React.useState(false)
	// Карусель удалена – связанные состояния убраны
	// (оставлены только аккордеоны и результаты)
	const [accOpen,setAccOpen]=React.useState({ actions:false, analytics:false, exports:false, tech:false })
	const toggleAcc=k=>setAccOpen(s=>({...s,[k]:!s[k]}))
	// Слайды карусели удалены

		useEffect(()=>{ 
			// Общий стиль кейса: белый фон + чёрные частицы
			setTransitionContext('lightlab-case'); 
			const prefersReduced=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; 
			const t=setTimeout(()=>{ 
				setIsBackButtonVisible(true); 
				if(!prefersReduced && backButtonRef.current){ gsap.fromTo(backButtonRef.current,{opacity:0,y:-10},{opacity:1,y:0,duration:.8,ease:'power2.out'}) } 
			},800); 
			const items=[titleRef.current,actionsRef.current].filter(Boolean); if(items.length) gsap.set(items,{opacity:1,y:0,scale:1,clearProps:'transform'}); 
			return ()=>{ clearTimeout(t); ScrollTrigger.getAll().forEach(st=>st.kill()) } 
		},[setTransitionContext])
	// Хуки анимации/лайтбокса карусели удалены

		const handleBack=()=>{ setTransitionContext('lightlab-case->projects'); navigate('/menu') }
	// Обработчик клавиатуры для карусели удалён

	return <CaseContainer>
		<CustomCursor color="#d18f00" />
		{isBackButtonVisible && <BackButton ref={backButtonRef} onClick={handleBack} visible={isBackButtonVisible} $disabled={false} aria-disabled={false}>← Назад в меню</BackButton>}
		<HeroSection ref={heroRef}>
			<CaseTitle ref={titleRef}>WB Авто‑акции</CaseTitle>
			<HeaderActions ref={actionsRef}>
				<CtaButton href="#" aria-disabled>Внутренний инструмент</CtaButton>
			</HeaderActions>
		</HeroSection>
		<ContentSection>
			<Description>
				<p className="lead">Сервис для автоматизации участия товаров в акциях Wildberries: сбор данных, расчёт маржи, подбор подходящих SKU и экспорт в Google Sheets.</p>
				<FeaturesTechGrid>
					<div>
						<h3>Функционал</h3>
						<Accordion>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.actions} aria-controls="panel-actions" onClick={()=>toggleAcc('actions')}>Авто‑акции<Chevron aria-hidden $open={accOpen.actions} /></AccordionHeader>
								<AccordionPanel id="panel-actions" role="region" $open={accOpen.actions}>
									<BulletList>
										<li>Загрузка каталога по API (постранично, retry + backoff).</li>
										<li>Фильтрация товаров по параметрам акции.</li>
										<li>Расчёт цены участия и потенциальной скидки.</li>
										<li>Подсветка товаров с низкой маржой.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.analytics} aria-controls="panel-analytics" onClick={()=>toggleAcc('analytics')}>Аналитика<Chevron aria-hidden $open={accOpen.analytics} /></AccordionHeader>
								<AccordionPanel id="panel-analytics" role="region" $open={accOpen.analytics}>
									<BulletList>
										<li>Маржинальность: себестоимость + комиссия WB + логистика.</li>
										<li>Агрегаты по бренду / категории.</li>
										<li>Группировка проблемных SKU.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.exports} aria-controls="panel-exports" onClick={()=>toggleAcc('exports')}>Экспорт<Chevron aria-hidden $open={accOpen.exports} /></AccordionHeader>
								<AccordionPanel id="panel-exports" role="region" $open={accOpen.exports}>
									<BulletList>
										<li>Выгрузка отобранных SKU в Google Sheets.</li>
										<li>Авто‑обновление ранее сформированных листов.</li>
										<li>Формирование отчётов (Pandas) и сохранение CSV.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
						</Accordion>
					</div>
					<div>
						<h3>Технически</h3>
						<Accordion>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.tech} aria-controls="panel-tech" onClick={()=>toggleAcc('tech')}>Стек<Chevron aria-hidden $open={accOpen.tech} /></AccordionHeader>
								<AccordionPanel id="panel-tech" role="region" $open={accOpen.tech}>
									<BulletList>
										<li>Python + Requests (сессии, повтор с экспон. задержкой).</li>
										<li>Pandas для расчётов и агрегаций.</li>
										<li>Google Sheets API (batchUpdate, valueAppend).</li>
										<li>Кеширование ответов и дедупликация запросов.</li>
										<li>Rate limiting и мониторинг ошибок.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
						</Accordion>
					</div>
				</FeaturesTechGrid>
				<ResultsBlock>
					<KpiGrid>
						<KpiCard>
							<h4>Скорость</h4>
							<div className="value">15 минут</div>
							<div className="sub">Вместо 2–4 ч / 100–300 SKU</div>
						</KpiCard>
						<KpiCard>
							<h4>Ошибки маржи</h4>
							<div className="value">0%</div>
							<div className="sub">Вместо ~5–10% ручных</div>
						</KpiCard>
						<KpiCard>
							<h4>Автоматизация</h4>
							<div className="value">6+</div>
							<div className="sub">Каталог, акции, маржа, остатки, экспорт, причины и другие</div>
						</KpiCard>
						<KpiCard>
							<h4>Контроль</h4>
							<div className="value">100%</div>
							<div className="sub">Каждый SKU: пригодность / причина</div>
						</KpiCard>
						<KpiCard>
							<h4>Актуальность</h4>
							<div className="value">В реальном времени</div>
							<div className="sub">Остатки и акции по API</div>
						</KpiCard>
					</KpiGrid>
					<ResultNarrative>
						<b>Назначение.</b> Внутренняя система для автоматизации подбора и участия товаров в акциях Wildberries: выгрузка каталога (комиссии, остатки, характеристики), расчёт экономик до/после участия, фильтрация по порогам маржи и синхронизация в Google Sheets.<br/><br/>
						<b>Ключевая логика.</b> Расчёт маржи (FBS комиссии, логистика, налоги), определение пригодности (поля «Подходит? / Почему не подходит? / Добавлен»), обновление остатков из разных API эндпоинтов, фильтрация по конфигурируемым порогам и полуавтоматическое добавление SKU в акцию.
					</ResultNarrative>
					<ResultNarrative>
						<b>Бизнес‑эффекты.</b>
						<AdvantageList>
							<li>Снижение ручной рутины (авто выгрузка, расчёт, фильтр).</li>
							<li>Быстрая переоценка при изменении условий акции.</li>
							<li>Сокращение ошибок расчёта маржи: с ~5–10% до &lt;0%.</li>
							<li>Отсев убыточных SKU до подачи заявки.</li>
							<li>Меньше нулевых остатков в итоговом списке.</li>
							<li>Прозрачность и аудит: CSV + Sheets.</li>
							<li>Масштабируемость: новые акции без переписывания ядра.</li>
							<li>Причины непригодности → точечные корректировки.</li>
						</AdvantageList>
					</ResultNarrative>
					<ResultNarrative>
						<b>Доп. метрики для мониторинга.</b> % отклонённых из‑за маржи, время от появления акции до готового списка, конверсия «Подходит → Добавлен → Продажи», выручка и валовая прибыль по участвующим vs неучаствующим.<b>Итог:</b> скорость + контроль прибыльности + предсказуемость.
					</ResultNarrative>
				</ResultsBlock>
			</Description>
			{/* Карусель удалена по запросу */}
		</ContentSection>
	</CaseContainer>
}

export default WbAutoActionsCasePage
