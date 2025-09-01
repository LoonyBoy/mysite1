import React, { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useNavigate } from 'react-router-dom'
import { useParticles } from '../components/GlobalParticleManager'
import CustomCursor from '../components/CustomCursor'
import { FaDatabase, FaFileExcel, FaGoogleDrive, FaInfoCircle, FaBell, FaProjectDiagram, FaTools } from 'react-icons/fa'
import ProjectModal from '../components/ProjectModal'

gsap.registerPlugin(ScrollTrigger)

// Reuse styling pattern from VoytenkoCasePage (kept consistent for brand cohesion)
const CaseContainer = styled.div`
	min-height: 100vh; min-height: 100dvh; background: transparent; position: relative; width: 100%; overflow-x: hidden; z-index: 0; color: #000;
	@media (max-width:768px){ min-height:auto; overflow-y:visible; -webkit-overflow-scrolling:touch; touch-action:pan-y; height:auto; }
`
const HeroSection = styled.section`
	height:100vh; height:100dvh; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:1.25rem; padding:4rem 2rem; text-align:center; position:relative; z-index:5;
	@media (max-width:768px){ padding:4rem 1rem; height:100svh; min-height:100svh; position:static; }
`
const CaseTitle = styled.h1`
	font-size:clamp(3rem,8vw,6rem); font-weight:400; line-height:1.1; letter-spacing:-0.03em; margin:0; color:#000; text-align:center; max-width:20ch; text-wrap:balance; margin-inline:auto; position:relative; z-index:2; opacity:1;
	@media (max-width:768px){ font-size:clamp(2rem,6vw,3rem); padding:0 1rem; line-height:1.15; width:100%; user-select:none; opacity:1 !important; }
`
const HeaderActions = styled.div`
	display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:0.25rem;
	@media (max-width:768px){ width:100%; &>a{width:100%; justify-content:center;} opacity:1 !important; }
`
const ContentSection = styled.section`
	min-height:100vh; padding:4rem 2rem; max-width:1000px; margin:0 auto; position:relative; z-index:2;
	@media (max-width:768px){ padding:2rem 1rem; min-height:auto; }
`
const Description = styled.div`
	font-family:inherit; font-size:1.075rem; line-height:1.7; color:#1a1a1a; margin-bottom:3rem; background:#fff; border:1px solid rgba(0,0,0,0.08); border-left:3px solid #6622CC; border-radius:0; padding:2rem 2.25rem; box-shadow:0 6px 24px rgba(0,0,0,0.08);
	h3{ font-size:1.2rem; font-weight:600; margin:0 0 0.75rem 0; color:#000; display:inline-block; padding-bottom:0.25rem; border-bottom:2px solid #6622CC; }
	h4{ font-size:1rem; font-weight:600; margin:1rem 0 0.5rem 0; color:#000; }
	.lead{ font-size:1.1rem; color:#111; margin-bottom:1.25rem; }
	@media (max-width:768px){ font-size:1rem; line-height:1.6; padding:1.5rem 1.25rem; margin:0 -0.5rem 3rem; h3{font-size:1.1rem;} }
`
const FeaturesTechGrid = styled.div`
	display:grid; grid-template-columns:1fr 1fr; gap:2rem 2.5rem; margin-top:0.75rem; align-items:start;
	@media (max-width:900px){ grid-template-columns:1fr; gap:1.5rem; }
`
const BulletList = styled.ul`
	list-style:none; margin:0.5rem 0 0; padding:0;
	li{ position:relative; padding-left:1.25rem; margin:0.4rem 0; }
	li::before{ content:''; position:absolute; left:0; top:0.7em; width:6px; height:6px; background:#6622CC; transform:translateY(-50%); }
`
const ResultCallout = styled.p`
	margin-top:1.25rem; padding:0.75rem 1rem; background:rgba(102,34,204,0.08); border-left:3px solid #6622CC; color:#000; font-weight:500;
`
// New visual result section
const ResultsBlock = styled.div`
	display:flex; flex-direction:column; gap:2rem; margin-top:2.5rem; margin-bottom:1rem;
`
const KpiGrid = styled.div`
	display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(180px,1fr));
`
const KpiCard = styled.div`
	background:#fff; border:1px solid rgba(0,0,0,0.08); padding:1rem 1.1rem; display:flex; flex-direction:column; gap:0.4rem; position:relative; overflow:hidden;
	&:before{content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(102,34,204,0.08),transparent); pointer-events:none;}
	h4{margin:0; font-size:0.8rem; font-weight:600; letter-spacing:0.05em; text-transform:uppercase; color:#444;}
	.value{font-size:1.65rem; font-weight:600; line-height:1; color:#000;}
	.sub{font-size:0.75rem; color:#555; line-height:1.2;}
`
const ResultNarrative = styled.div`
	font-size:0.9rem; line-height:1.55; background:#fff; border:1px solid rgba(0,0,0,0.08); padding:1.25rem 1.4rem; border-left:3px solid #6622CC; box-shadow:0 4px 16px rgba(0,0,0,0.06);
	b{color:#000;}
`
const CarouselSection = styled.section`
	margin-top:2.5rem; display:flex; flex-direction:column; align-items:center; gap:1rem;
`
const OptionsContainer = styled.div`
	display:flex; width:100%; max-width:1000px; height:380px; overflow:hidden; position:relative; outline:none;
	@media (max-width:768px){ flex-direction:column; height:auto; max-width:100%; overflow:visible; gap:12px; }
`
const OptionCard = styled.div`
	position:relative; display:flex; flex-direction:column; justify-content:flex-end; overflow:hidden; min-width:60px; margin:0; border:2px solid ${p=>p.$active?'#000':'#292929'}; border-radius:0; background-color:#18181b; background-image:url(${p=>p.$bg}); background-repeat:no-repeat; background-size:${p=>p.$active?'auto 100%':'auto 120%'}; background-position:center; cursor:pointer; box-shadow:${p=>p.$active?'0 20px 60px rgba(0,0,0,0.5)':'0 10px 30px rgba(0,0,0,0.3)'}; backface-visibility:hidden; will-change:flex-grow,box-shadow,background-size,background-position,transform,opacity; opacity:${p=>p.$animated?1:0}; transform:${p=>p.$animated?'translateX(0)':'translateX(-60px)'}; transition:all .7s ease-in-out; flex:${p=>p.$active?'7 1 0%':'1 1 0%'}; z-index:${p=>p.$active?10:1};
	@media (max-width:768px){ width:100%; min-width:100%; flex:none; height:${p=>p.$active?'min(60vh,420px)':'64px'}; transform:${p=>p.$animated?'translateY(0)':'translateY(40px)'}; background-size:${p=>p.$active?'100% auto':'120% auto'}; }
`
const Indicators = styled.div`display:flex; gap:8px; margin-top:8px; align-items:center; justify-content:center;`
const Dot = styled.button`width:8px;height:8px;border-radius:50%;border:1px solid #666;background:${p=>p.$active?'#6622CC':'transparent'};padding:0;cursor:pointer;outline:none;&:focus-visible{outline:2px dashed #6622CC; outline-offset:2px;}`
const CardShadow = styled.div`
	position:absolute; left:0; right:0; height:120px; pointer-events:none; transition:all .7s ease-in-out; bottom:0; background:linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.55) 30%,rgba(0,0,0,0.25) 70%,rgba(0,0,0,0) 100%); opacity:${p=>p.$active?1:0.001};
	@media (max-width:768px){ height:40%; background:linear-gradient(to top,rgba(0,0,0,0.8) 0%,rgba(0,0,0,0.6) 25%,rgba(0,0,0,0.25) 65%,rgba(0,0,0,0) 100%); }
`
const CardLabel = styled.div`position:absolute; left:0; right:0; bottom:20px; display:flex; align-items:center; gap:12px; height:48px; padding:0 14px; z-index:2; pointer-events:none; color:#fff; @media (max-width:768px){ bottom:8px; }`
const IconCircle = styled.div`width:44px;height:44px;display:flex;align-items:center;justify-content:center;background:rgba(32,32,32,0.85);backdrop-filter:blur(10px);border:2px solid #444;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.18);flex:0 0 44px;`
const LabelInfo = styled.div`.main{font-weight:700;font-size:1rem;transition:transform .7s ease-in-out,opacity .7s ease-in-out;} .sub{font-size:.95rem;color:#d1d5db;transition:transform .7s ease-in-out,opacity .7s ease-in-out;}`
const LightboxOverlay = styled.div`position:fixed; inset:0; background:rgba(0,0,0,0.88); z-index:2000; display:flex; align-items:center; justify-content:center; padding:2rem;`
const LightboxImage = styled.img`max-width:95vw; max-height:90vh; object-fit:contain; border:2px solid #000; border-radius:0; box-shadow:0 20px 80px rgba(0,0,0,0.6); background:#111;`
const LightboxClose = styled.button`position:fixed; top:1rem; right:1rem; padding:0.5rem 0.75rem; border:2px solid #fff; background:transparent; color:#fff; font-weight:600; letter-spacing:0.02em; border-radius:0; z-index:2100; cursor:pointer; &:hover{background:rgba(255,255,255,0.1);} &:focus-visible{outline:2px dashed #6622CC; outline-offset:2px;}`
const LightboxContent = styled.div`display:flex; flex-direction:column; align-items:center; gap:0.75rem; max-width:95vw;`
const LightboxHeader = styled.div`color:#fff; text-align:center; max-width:900px; padding:0 0.5rem; .title{font-weight:700; font-size:1.05rem;} .desc{font-size:0.95rem; color:#e5e7eb; margin-top:0.15rem;} @media (max-width:768px){ .title{font-size:1rem;} .desc{font-size:0.9rem;} }`
const Accordion = styled.div`display:flex; flex-direction:column; gap:0.5rem; margin-top:0.5rem;`
const AccordionItem = styled.div`border:1px solid rgba(0,0,0,0.08); background:#fff; border-radius:0;`
const AccordionHeader = styled.button`width:100%; text-align:left; display:flex; align-items:center; justify-content:space-between; gap:1rem; padding:0.9rem 1rem; background:transparent; border:0; border-bottom:1px solid rgba(0,0,0,0.06); cursor:pointer; color:#000; font-weight:600; letter-spacing:0.01em; &:hover{background:rgba(0,0,0,0.03);} &:focus-visible{outline:2px dashed #6622CC; outline-offset:2px;}`
const Chevron = styled.span`display:inline-block; width:10px; height:10px; border-right:2px solid currentColor; border-bottom:2px solid currentColor; transform:rotate(${p=>p.$open?'225deg':'45deg'}); transition:transform .2s ease;`
const AccordionPanel = styled.div`overflow:hidden; max-height:${p=>p.$open?'1000px':'0'}; opacity:${p=>p.$open?1:0}; transition:max-height .25s ease, opacity .25s ease; padding:${p=>p.$open?'0.75rem 1rem 1rem':'0 1rem'};`
const BackButton = styled.button`position:fixed; top:2rem; left:2rem; z-index:1000; padding:1rem 2rem; border:2px solid #000; background:rgba(255,255,255,0.9); backdrop-filter:blur(10px); color:#000; font-size:1rem; font-weight:400; letter-spacing:0.1em; text-transform:uppercase; transition:all .3s ease, opacity 1s ease; cursor:none; outline:none; user-select:none; opacity:${p=>p.visible?1:0}; pointer-events:${p=>p.visible && !p.$disabled?'auto':'none'}; border-radius:0; ${p=>p.$disabled?'background:transparent;color:#777;border-color:transparent;opacity:0.28;transform:none!important;':''} &:hover{background:${p=>p.$disabled?'transparent':'#000'}; color:${p=>p.$disabled?'#777':'#fff'}; transform:${p=>p.$disabled?'none':'translateY(-2px)'};} &:active{transform:translateY(0);} @media (max-width:768px){ top:1rem; left:1rem; padding:0.8rem 1.5rem; font-size:0.9rem; cursor:pointer; touch-action:manipulation; }`
const CtaButton = styled.a`display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:0; border:2px solid #6622CC; color:#6622CC; background:rgba(255,255,255,0.85); text-decoration:none; font-weight:500; letter-spacing:0.02em; transition:all .25s ease; cursor:none; will-change:transform,background,color,box-shadow; &:hover{background:#6622CC; color:#fff; transform:translateY(-2px); box-shadow:0 10px 24px rgba(102,34,204,0.25);} &:active{transform:translateY(0);} @media (max-width:768px){ background:#ffffff; }`
const WantButton = styled.button`display:inline-flex; align-items:center; gap:8px; padding:10px 18px; border-radius:0; border:2px solid #000; background:#000; color:#fff; font-weight:600; letter-spacing:0.04em; text-transform:uppercase; font-size:0.8rem; cursor:none; transition:all .25s ease; will-change:transform,background,color,box-shadow; box-shadow:0 8px 24px -6px rgba(0,0,0,0.35); &:hover{background:#6622CC; border-color:#6622CC; box-shadow:0 10px 30px -6px rgba(102,34,204,0.4); transform:translateY(-2px);} &:active{transform:translateY(0);} @media (max-width:768px){ width:100%; justify-content:center; }`

const KlamBotCasePage = () => {
	const navigate = useNavigate()
	const titleRef = useRef(null)
	const heroRef = useRef(null)
	const actionsRef = useRef(null)
	const backButtonRef = useRef(null)
	const { setTransitionContext } = useParticles()
	const [isBackButtonVisible, setIsBackButtonVisible] = React.useState(false)
	const [isBackButtonEnabled, setIsBackButtonEnabled] = React.useState(true)
	const [activeIndex, setActiveIndex] = React.useState(0)
	const [animatedOptions, setAnimatedOptions] = React.useState([])
	const [lightboxIndex, setLightboxIndex] = React.useState(null)
	const scrollYRef = useRef(0)
	const cardRefs = useRef([])
	// Флаг для отслеживания интерактивных изменений карусели
	const hasUserInteractedRef = React.useRef(false)
	const [accOpen, setAccOpen] = React.useState({ flow:false, sheets:false, alerts:false, tech:false })
	const toggleAcc = (k)=>setAccOpen(s=>({...s,[k]:!s[k]}))
	const [isProjectModalOpen, setIsProjectModalOpen] = React.useState(false)

	const carouselOptions = React.useMemo(()=>[
		{ title:'Схема автоматизации', description:'Описание работы бота', image:'/images/klambot.webp', icon:<FaInfoCircle size={20} color="#fff"/> }
	],[])

		useEffect(()=>{
			// Используем тот же контекст, что и LightLab/Voytenko для белого фона + чёрных частиц
			setTransitionContext('lightlab-case')
		const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
		const mobile = window.innerWidth <= 768
		if (mobile) {
			setIsBackButtonEnabled(false)
			setTimeout(()=> setIsBackButtonEnabled(true), 3000)
		} else {
			setIsBackButtonEnabled(true)
		}
		const timer=setTimeout(()=>{ setIsBackButtonVisible(true); if(!prefersReduced && backButtonRef.current){ gsap.fromTo(backButtonRef.current,{opacity:0,y:-10},{opacity:1,y:0,duration:0.8,ease:'power2.out'}) } },800)
		const items=[titleRef.current,actionsRef.current].filter(Boolean); if(items.length) gsap.set(items,{opacity:1,y:0,scale:1,clearProps:'transform'})
		return ()=>{ clearTimeout(timer); ScrollTrigger.getAll().forEach(t=>t.kill()) }
	},[setTransitionContext])

	useEffect(()=>{ const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; if(prefersReduced){ setAnimatedOptions(carouselOptions.map((_,i)=>i)); return } const timers=[]; for(let i=0;i<carouselOptions.length;i++){ timers.push(setTimeout(()=> setAnimatedOptions(p=>Array.from(new Set([...p,i]))),180*i)) } return ()=> timers.forEach(t=>clearTimeout(t)) },[carouselOptions])

	useEffect(()=>{ if(lightboxIndex===null) return; const onKey=e=>{ if(e.key==='Escape') setLightboxIndex(null) }; const prev={ overflow:document.body.style.overflow, position:document.body.style.position, top:document.body.style.top, width:document.body.style.width, scrollBehavior:document.documentElement.style.scrollBehavior }; scrollYRef.current=window.scrollY||0; document.body.style.position='fixed'; document.body.style.top=`-${scrollYRef.current}px`; document.body.style.width='100%'; document.body.style.overflow='hidden'; window.addEventListener('keydown',onKey); return ()=>{ const lockedTop=document.body.style.top; const y=lockedTop?Math.abs(parseInt(lockedTop,10)):scrollYRef.current; document.body.style.overflow=prev.overflow; document.body.style.position=prev.position; document.body.style.top=prev.top; document.body.style.width=prev.width; window.removeEventListener('keydown',onKey); document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0,y); document.documentElement.style.scrollBehavior=prev.scrollBehavior } },[lightboxIndex])

	useEffect(()=>{ 
		if(typeof window==='undefined') return; 
		const isMobile=window.innerWidth<=768; 
		if(!isMobile) return; 
		// Скроллим к карусели только если пользователь взаимодействовал с ней
		if(!hasUserInteractedRef.current) return;
		const el=cardRefs.current[activeIndex]; 
		if(!el) return; 
		el.scrollIntoView({behavior:'smooth', block:'nearest'}) 
	},[activeIndex])

		const handleBack=()=>{ if(lightboxIndex!==null) return; if(!isBackButtonEnabled) return; setTransitionContext('lightlab-case->projects'); navigate('/menu') }
	const handleKeyDown=e=>{ 
		if(!carouselOptions.length) return; 
		const last=carouselOptions.length-1; 
		if(['ArrowRight','ArrowDown'].includes(e.key)){ 
			e.preventDefault(); 
			hasUserInteractedRef.current = true; // Пользователь взаимодействовал с каруселью
			setActiveIndex(i=> i>=last?0:i+1) 
		} else if(['ArrowLeft','ArrowUp'].includes(e.key)){ 
			e.preventDefault(); 
			hasUserInteractedRef.current = true; // Пользователь взаимодействовал с каруселью
			setActiveIndex(i=> i<=0?last:i-1) 
		} else if(e.key==='Home'){ 
			e.preventDefault(); 
			hasUserInteractedRef.current = true; // Пользователь взаимодействовал с каруселью
			setActiveIndex(0) 
		} else if(e.key==='End'){ 
			e.preventDefault(); 
			hasUserInteractedRef.current = true; // Пользователь взаимодействовал с каруселью
			setActiveIndex(last) 
		} else if(e.key==='Enter' || e.key===' '){ 
			e.preventDefault(); 
			setLightboxIndex(activeIndex) 
		} 
	}

	return <CaseContainer>
		<CustomCursor color="#6622CC" />
		{isBackButtonVisible && <BackButton ref={backButtonRef} onClick={handleBack} visible={isBackButtonVisible} $disabled={lightboxIndex!==null || !isBackButtonEnabled} aria-disabled={lightboxIndex!==null || !isBackButtonEnabled}>← Назад в меню</BackButton>}
		<HeroSection ref={heroRef}>
			<CaseTitle ref={titleRef}>Telegram‑бот KLAMbot</CaseTitle>
			<HeaderActions ref={actionsRef}>
				<CtaButton href="#" aria-disabled>Приватный бот</CtaButton>
				<WantButton type="button" onClick={()=>{ setIsProjectModalOpen(true) }}>
					Хочу такой!
				</WantButton>
			</HeaderActions>
		</HeroSection>
		<ContentSection>
			<Description>
				<p className="lead">Бот для визуализации статусов объектов (альбомов) и автоматизации документооборота. Интеграция с Google Sheets: чтение/обновление строк, цветовые статусы, уведомления в telegram, отправка писем.</p>
				<p>
					<b>История.</b> В проектной компании ООО «СибТехПроект» руководители проектов раньше вручную заносили в общую Google‑таблицу статусы каждого альбома: писали дату перехода этапа, перекрашивали цвет ячеек под новый статус, формировали и отправляли письма о готовности. Это занимало время, возникали задержки и ошибки в написании. С появлением KLAMbot процесс стал событийным: достаточно одной короткой записи в общем рабочем чате (или команды боту) — и автоматически фиксируется новый статус в Google Sheets, проставляется цвет, метка времени, формируется история изменений и рассылаются уведомления заинтересованным коллегам. Человеческий фактор и дублирование действий убраны, актуальность данных стала «почти realtime».
				</p>
				<FeaturesTechGrid>
					<div>
						<h3>Функционал</h3>
						<Accordion>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.flow} aria-controls="panel-flow" onClick={()=>toggleAcc('flow')}>Основные сценарии<Chevron aria-hidden $open={accOpen.flow} /></AccordionHeader>
								<AccordionPanel id="panel-flow" role="region" $open={accOpen.flow}>
									<BulletList>
										<li>Список объектов с быстрым фильтром по статусу.</li>
										<li>Просмотр карточки объекта + история изменений.</li>
										<li>Команды для изменения этапа / добавления комментария.</li>
										<li>Поиск по названию и частичным совпадениям.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.sheets} aria-controls="panel-sheets" onClick={()=>toggleAcc('sheets')}>Интеграция Sheets<Chevron aria-hidden $open={accOpen.sheets} /></AccordionHeader>
								<AccordionPanel id="panel-sheets" role="region" $open={accOpen.sheets}>
									<BulletList>
										<li>Чтение/запись в Google Sheets через batchUpdate.</li>
										<li>Кеширование диапазонов для экономии квоты API.</li>
										<li>Маппинг цветовых статусов в hex → emoji индикацию в чате.</li>
										<li>Оптимистичное обновление UI, затем валидация ответа API.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
							<AccordionItem>
								<AccordionHeader aria-expanded={accOpen.alerts} aria-controls="panel-alerts" onClick={()=>toggleAcc('alerts')}>Уведомления<Chevron aria-hidden $open={accOpen.alerts} /></AccordionHeader>
								<AccordionPanel id="panel-alerts" role="region" $open={accOpen.alerts}>
									<BulletList>
										<li>Email оповещения ответственным (aiosmtplib).</li>
										<li>Push в отдельный Telegram канал по ключевым событиям.</li>
										<li>Антиспам: дедупликация идентичных уведомлений.</li>
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
										<li>Python Telegram Bot v20 (async).</li>
										<li>Google Sheets API + service account.</li>
										<li>In‑memory caching + rate limiter.</li>
										<li>Цветовое кодирование статусов (RGB → label).</li>
										<li>Email (SMTP) уведомления.</li>
									</BulletList>
								</AccordionPanel>
							</AccordionItem>
						</Accordion>
					</div>
				</FeaturesTechGrid>
				<ResultsBlock>
					<KpiGrid>
						<KpiCard>
							<h4>Экономия / альбом</h4>
							<div className="value">≈45%</div>
							<div className="sub">Сокращение чистого времени операций</div>
						</KpiCard>
						<KpiCard>
							<h4>Риск потери данных</h4>
							<div className="value">6× ↓</div>
							<div className="sub">30% → 5% вероятность</div>
						</KpiCard>
						<KpiCard>
							<h4>Операций заменено</h4>
							<div className="value">10+</div>
							<div className="sub">Цвет, даты, письма, выгрузка, напоминания</div>
						</KpiCard>
						<KpiCard>
							<h4>Направлений</h4>
							<div className="value">5</div>
							<div className="sub">Один бот обслуживает сразу</div>
						</KpiCard>
						<KpiCard>
							<h4>Триггер</h4>
							<div className="value">1 чат</div>
							<div className="sub">Одно сообщение → все фиксации</div>
						</KpiCard>
					</KpiGrid>
					{/* Charts removed per request */}
					<ResultNarrative>
						<b>Ключевой эффект.</b> Один бот обслуживает 5 направлений и реагирует не только на команды, но и на письма: вместо множественных ручных действий (поиск ссылки, раскраска ячейки, дата, письмо, отметка выгрузки, напоминания) остаётся одно сообщение в общий чат — система фиксирует статус, ставит цвет, сохраняет время, обновляет вспомогательные вкладки, рассылает уведомления и снижает риск утери данных в 6 раз. Средняя экономия времени по полному циклу стадий ~45% на альбом и +126 мин в день при 10 альбомах. Самая «длинная» операция (выгрузка) стала прозрачной: бот фиксирует факт и время, убирая когнитивную нагрузку РП.
					</ResultNarrative>
				</ResultsBlock>
			</Description>
			<CarouselSection>
				<OptionsContainer role="listbox" aria-label="Слайды кейса" tabIndex={0} onKeyDown={handleKeyDown}>
					{carouselOptions.map((opt,i)=>(
						<OptionCard key={i} $bg={opt.image} $active={activeIndex===i} $animated={animatedOptions.includes(i)} role="option" aria-selected={activeIndex===i} onMouseEnter={()=>{ if(window.innerWidth>768) { hasUserInteractedRef.current = true; setActiveIndex(i) } }} onClick={()=>{ if(activeIndex===i) { setLightboxIndex(i) } else { hasUserInteractedRef.current = true; setActiveIndex(i) } }} ref={el=>{ cardRefs.current[i]=el }}>
							<CardShadow $active={activeIndex===i} />
							<CardLabel>
								<IconCircle>{opt.icon}</IconCircle>
								<LabelInfo>
									<div className="main" style={{opacity:activeIndex===i?1:0, transform:activeIndex===i?'translateX(0)':'translateX(25px)'}}>{opt.title}</div>
									<div className="sub" style={{opacity:activeIndex===i?1:0, transform:activeIndex===i?'translateX(0)':'translateX(25px)'}}>{opt.description}</div>
								</LabelInfo>
							</CardLabel>
						</OptionCard>
					))}
				</OptionsContainer>
				{carouselOptions.length>1 && (
				<Indicators role="tablist" aria-label="Переход по слайдам">
					{carouselOptions.map((_,i)=>(<Dot key={i} $active={activeIndex===i} aria-label={`Слайд ${i+1}`} aria-selected={activeIndex===i} role="tab" onClick={()=>{ hasUserInteractedRef.current = true; setActiveIndex(i) }} />))}
				</Indicators>
				)}
				{lightboxIndex!==null && <LightboxOverlay onClick={()=>setLightboxIndex(null)} role="dialog" aria-modal="true">
					<LightboxClose onClick={e=>{e.stopPropagation(); setLightboxIndex(null)}}>Закрыть</LightboxClose>
					<LightboxContent onClick={e=>e.stopPropagation()}>
						<LightboxHeader>
							<div className="title">{carouselOptions[lightboxIndex].title}</div>
							<div className="desc">{carouselOptions[lightboxIndex].description}</div>
						</LightboxHeader>
						<LightboxImage src={carouselOptions[lightboxIndex].image} alt={carouselOptions[lightboxIndex].title} />
					</LightboxContent>
				</LightboxOverlay>}
			</CarouselSection>
		</ContentSection>
	{isProjectModalOpen && (
		<ProjectModal
			isOpen={isProjectModalOpen}
			startAnimation={true}
			prefill={{ step:'contact', hideBack:true, description:'Хочу такой же Telegram‑бот для автоматизации статусов (как KLAMbot).'}}
			onClose={()=> setIsProjectModalOpen(false)}
		/>
	)}
	</CaseContainer>
}

export default KlamBotCasePage
