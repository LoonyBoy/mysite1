import React from 'react'

// Full lazy-loaded Services modal content extracted from MenuPage
const ServicesContent = (props) => {
  const {
    servicesStep, windowScroll, servicesModalRef,
    PricingHeader, HeadingsRow, HeadingTab, servicesCategory, switchCategory,
    tabWebRef, tabBotsRef, tabAutoRef, indicatorRef,
    MobileServicesNavigation, NavButton, servicesNavWebRef, servicesNavBotsRef, servicesNavAutoRef, handleServicesNavButtonClick,
    ServicesTierNavigation, TierNavButton, servicesTier, servicesTierBasicRef, servicesTierOptimalRef, servicesTierPremiumRef,
    ProjectsTopTitle, ServicesModalWrap, PricingGrid, servicesGridRef, isMobileFlag,
    servicesAutomation, servicesWeb, servicesBots, PricingCard, PricingTop, PricingHead, DesktopOnly, HeadingPrice,
    MobileOnly, MobilePriceUnderTitle, MobilePriceText, MobileConfirmButton, SelectButton,
    findServiceById, categoryLabelByServiceId, setPrefill, setIsProjectModalOpen, setSelectedSubscriptionLabel,
    PlanCTA, SubscriptionIntro, IntroTitleRow, IntroBody,
    TERM_HINTS, FeatureList, FeatureItem, FAQAccordionGreen,
    CardSectionTitle, SectionBlock, Bullets, RightCol, ConfirmSlot, ConfirmButton, Divider,
    SubscriptionSplit, StepNote, MobilePlansWrap, PlanTabs, PlanTabButton, PlanCard, PlanHeader, StickyCTABar,
    inlineNextFor, setInlineNextFor, setSelectedServiceId, setServicesStep, setServicesTier, prefetchSubscriptionAssets,
    selectedServiceId, mobilePlan, setMobilePlan, handleServicesTierButtonClick, handleTermToggle, ComparisonTable
  } = props

  if (!ServicesModalWrap) return null

  try {
  return (
    <ServicesModalWrap className="services-modal" ref={servicesModalRef} $windowScroll={windowScroll}>
      <ProjectsTopTitle>{servicesStep === 'subscription' ? 'Подписка' : 'Пакеты услуг'}</ProjectsTopTitle>
      <PricingHeader>
        {servicesStep === 'pick' && (
          <HeadingsRow style={{ marginBottom: 8, position: 'relative', display: 'none' }} className="desktop-only" ref={tabWebRef?.current ? undefined : undefined /* keep signature */}>
            <HeadingTab ref={tabWebRef} data-active={servicesCategory === 'web'} onClick={(e) => { e.stopPropagation(); switchCategory('web') }}>Сайты / Веб‑приложения</HeadingTab>
            <HeadingTab ref={tabBotsRef} data-active={servicesCategory === 'bots'} onClick={(e) => { e.stopPropagation(); switchCategory('bots') }}>Боты</HeadingTab>
            <HeadingTab ref={tabAutoRef} data-active={servicesCategory === 'automation'} onClick={(e) => { e.stopPropagation(); switchCategory('automation') }}>Программы / Софт</HeadingTab>
            <div ref={indicatorRef} />
          </HeadingsRow>
        )}
        {servicesStep === 'pick' && (
          <MobileServicesNavigation data-testid="mobile-services-nav">
            <NavButton ref={servicesNavWebRef} className={servicesCategory === 'web' ? 'active' : ''} onClick={(e) => handleServicesNavButtonClick('web', e)} data-testid="services-nav-button-web">Сайты</NavButton>
            <NavButton ref={servicesNavBotsRef} className={servicesCategory === 'bots' ? 'active' : ''} onClick={(e) => handleServicesNavButtonClick('bots', e)} data-testid="services-nav-button-bots">Боты</NavButton>
            <NavButton ref={servicesNavAutoRef} className={servicesCategory === 'automation' ? 'active' : ''} onClick={(e) => handleServicesNavButtonClick('automation', e)} data-testid="services-nav-button-auto">Софт</NavButton>
          </MobileServicesNavigation>
        )}
        {servicesStep === 'pick' && (
          <ServicesTierNavigation data-testid="mobile-services-tier-nav">
            <TierNavButton ref={servicesTierBasicRef} className={servicesTier === 'basic' ? 'active' : ''} onClick={(e) => handleServicesTierButtonClick('basic', e)} data-testid="services-tier-button-basic">Базовый</TierNavButton>
            <TierNavButton ref={servicesTierOptimalRef} className={servicesTier === 'optimal' ? 'active' : ''} onClick={(e) => handleServicesTierButtonClick('optimal', e)} data-testid="services-tier-button-optimal">Стандарт</TierNavButton>
            <TierNavButton ref={servicesTierPremiumRef} className={servicesTier === 'premium' ? 'active' : ''} onClick={(e) => handleServicesTierButtonClick('premium', e)} data-testid="services-tier-button-premium">Премиум</TierNavButton>
          </ServicesTierNavigation>
        )}
      </PricingHeader>

      {servicesStep === 'pick' ? (
        <>
          <div style={{ width: '100%', display: 'grid', gap: 8, margin: '8px 0' }}>
            <div style={{ textAlign: 'center', color: '#fff', opacity: 0.9, fontSize: 14 }}>Шаг 1 из 2 — выберите услугу.</div>
          </div>
          <PricingGrid ref={servicesGridRef} $center={isMobileFlag} $narrow={isMobileFlag} $single={!isMobileFlag && (servicesCategory === 'automation')}>
            {(() => {
              const list = servicesCategory === 'automation' ? servicesAutomation : (servicesCategory === 'web' ? servicesWeb : servicesBots)
              const sel = servicesTier === 'basic' ? 0 : servicesTier === 'optimal' ? 1 : 2
              const accentRGB = '52,211,153'
              const renderCard = (s, isFeatured) => (
                <PricingCard key={s.id} className={isFeatured ? 'featured' : 'tier-hidden'} $accentRGB={accentRGB} onClick={(e) => {
                  e.preventDefault(); e.stopPropagation();
                  if (inlineNextFor === s.id) { setSelectedServiceId(s.id); setServicesStep('subscription'); return }
                  const tier = s.id.includes('premium') ? 'premium' : (s.id.includes('optimal') ? 'optimal' : 'basic')
                  setServicesTier(tier); prefetchSubscriptionAssets(); setInlineNextFor(s.id)
                }}>
                  <PricingTop>
                    <PricingHead>
                      <h4>{s.title}</h4>
                      <DesktopOnly>
                        <HeadingPrice>
                          {s.price === 'Custom' ? (<span className="amount">По договоренности</span>) : (<><span className="amount">{s.price}</span><span className="period"> / проект</span></>)}
                        </HeadingPrice>
                      </DesktopOnly>
                      <MobileOnly>
                        <MobilePriceUnderTitle>
                          <MobilePriceText>
                            {s.price === 'Custom' ? (<span className="amount">По договоренности</span>) : (<><span className="amount">{s.price}</span><span className="period"> / проект</span></>)}
                          </MobilePriceText>
                          <MobileConfirmButton type="button" className={inlineNextFor === s.id ? 'is-next' : ''} aria-label={inlineNextFor === s.id ? 'Далее' : 'Выбрать'} onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (inlineNextFor === s.id) { setSelectedServiceId(s.id); setServicesStep('subscription'); return }
                            const tier = s.id.includes('premium') ? 'premium' : s.id.includes('optimal') ? 'optimal' : 'basic'
                            setServicesTier(tier); prefetchSubscriptionAssets(); setInlineNextFor(s.id)
                          }}>
                            <span className="icon">✓</span><span className="label">Далее</span>
                          </MobileConfirmButton>
                        </MobilePriceUnderTitle>
                      </MobileOnly>
                      <p>{s.desc}</p>
                      {s.timeline && (<div style={{ textAlign: 'left', marginTop: 6 }}><p style={{ margin: 0, opacity: 0.8 }}>{s.timeline}</p></div>)}
                    </PricingHead>
                    <RightCol>
                      <DesktopOnly>
                        <ConfirmSlot>
                          <ConfirmButton type="button" className={inlineNextFor === s.id ? 'is-next' : ''} aria-label={inlineNextFor === s.id ? 'Далее' : 'Выбрать'} onClick={(e) => {
                            e.preventDefault(); e.stopPropagation();
                            if (inlineNextFor === s.id) { setSelectedServiceId(s.id); setServicesStep('subscription'); return }
                            const tier = s.id.includes('premium') ? 'premium' : s.id.includes('optimal') ? 'optimal' : 'basic'
                            setServicesTier(tier); prefetchSubscriptionAssets(); setInlineNextFor(s.id)
                          }}>
                            <span className="icon">✓</span><span className="label">Далее</span>
                          </ConfirmButton>
                        </ConfirmSlot>
                      </DesktopOnly>
                    </RightCol>
                  </PricingTop>
                  <Divider />
                  <CardSectionTitle>Для кого подходит</CardSectionTitle>
                  <SectionBlock $minHeight={96}>
                    <Bullets>
                      {(() => {
                        const audMap = {
                          basic: ['Для запуска рекламы и быстрых продаж с лендинга', 'Для стартапов, которым нужен сайт', 'Для экспертов и личных проектов, чтобы выделиться без лишних затрат'],
                          optimal: ['Для компаний, которым нужен полноценный сайт с разделами и сервисами', 'Для бизнеса, который хочет принимать платежи и собирать заявки онлайн', 'Для проектов, где важен удобный личный кабинет и автоматизация процессов'],
                          premium: ['Для IT-стартапов и SaaS-проектов, где важна сложная логика и масштабируемость', 'Для сервисов с высокой нагрузкой, реальным временем и интеграциями', 'Для бизнеса, где сайт — это не «визитка», а основной инструмент заработка'],
                          'bot-basic': ['Для компаний и экспертов, которые хотят быстро запустить простой бот', 'Для бизнеса, которому нужен автоматический сбор заявок и лидов', 'Для проектов, где важна оперативная поддержка клиентов'],
                          'bot-optimal': ['Для бизнеса, который хочет продавать и принимать оплату прямо в мессенджере', 'Для компаний, где важно автоматизировать записи, заказы и работу с клиентами', 'Для сервисов, которым нужен личный кабинет и управление данными пользователей'],
                          'bot-premium': ['Для бизнеса и стартапов, которым нужен полноценный сервис внутри Telegram (Mini App)', 'Для проектов, где бот — это не чат с кнопками, а мобильное приложение прямо в мессенджере', 'Для компаний, которым важна сложная логика, интеграции и масштабируемость'],
                          'auto-custom': ['Интеграции и автоматизация', 'ETL/отчёты', 'Индивидуальные задачи']
                        }
                        const items = audMap[s.id] || []
                        return items.map(v => (<li key={v}>{v}</li>))
                      })()}
                    </Bullets>
                  </SectionBlock>
                  <Divider />
                  <CardSectionTitle>Что входит</CardSectionTitle>
                  <SectionBlock $minHeight={96}>
                    <Bullets>
                      {s.features.map(f => {
                        const norm = (st) => st.toLowerCase().replace(/\u2011/g, '-')
                        const key = Object.keys(TERM_HINTS || {}).find(k => norm(f).includes(k))
                        const text = key ? (
                          <span className="term" tabIndex={0} role="button" aria-label="Подсказка" data-hint={TERM_HINTS[key]} onClick={handleTermToggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleTermToggle(e) } }}>{f}</span>
                        ) : f
                        return (<li key={f}>{text}</li>)
                      })}
                    </Bullets>
                  </SectionBlock>
                  <Divider />
                  <CardSectionTitle>Технологии</CardSectionTitle>
                  <SectionBlock>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ margin: 0, opacity: 0.7 }}>{s.tech}</p>
                    </div>
                  </SectionBlock>
                  {s.notes?.length && (<p style={{ opacity: 0.7, marginTop: 6 }}>{s.notes.join(' • ')}</p>)}
                </PricingCard>
              )
              if (isMobileFlag || list.length === 1) {
                const s = list[sel] || list[0]; if (!s) return null; return renderCard(s, true)
              }
              return list.map((s, idx) => renderCard(s, idx === sel))
            })()}
          </PricingGrid>
        </>
      ) : (
        <>
          <SubscriptionSplit>
            <div>
              <SubscriptionIntro>
                <IntroTitleRow><span style={{ fontSize: 16 }}>✨</span><h4>Что такое подписка?</h4></IntroTitleRow>
                <IntroBody>
                  <p>Подписка — это простой и прозрачный способ получать поддержку и развитие продукта без лишней рутины. Вы заранее понимаете объём работ и скорость реакции, а задачи выполняются регулярно и приоритетно. Это чаще выгоднее разовых работ и найма, гибко масштабируется под рост и сопровождается отчётами.</p>
                </IntroBody>
              </SubscriptionIntro>
              <p style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '24px 0 8px', opacity: 0.9 }}>Вопрос‑ответ</p>
              <FAQAccordionGreen>
                {/* FAQ entries kept as-is */}
                {['Что если у меня уже есть хостинг и домен?','А если не хватит часов?','Накапливаются ли часы, если их не использовать?','Как быстро происходит реакция на инциденты?','Как происходит старт работ и оплата?','Какие гарантии качества и сроков?','Что если понадобится задача вне подписки?'].map(q => (
                  <details key={q}><summary>{q}</summary><div className="faq-content"><div className="faq-content-inner"><div className="faq-answer"><p/></div></div></div></details>
                ))}
              </FAQAccordionGreen>
            </div>
            <div>
              <StepNote>Шаг 2 из 2 — выберите подписку под задачу.</StepNote>
              <MobileOnly>
                <MobilePlansWrap>
                  {(() => {
                    const active = mobilePlan
                    const flat = {
                      none: { title: 'Без подписки', price: null, feats: [['Развертывание проекта на сервере','✓'],['Хостинг+SSL','—'],['Отчёт посещаемости','—'],['Часы работы','—'],['Создание резервных копий','—'],['Обновление зависимостей/библиотек','—'],['Реакция на инциденты','—'],['Приоритетная помощь в работе','—'],['Личные консультации и рекомендации','—']] },
                      basic: { title: 'Basic', price: '30 000 ₽/мес', feats: [['Развертывание проекта на сервере','✓'],['Хостинг+SSL','✓'],['Отчёт посещаемости','✓'],['Часы работы','10 ч/мес'],['Создание резервных копий','1×/мес'],['Обновление зависимостей/библиотек','1×/мес'],['Реакция на инциденты','2 раб. дня'],['Приоритетная помощь в работе','—'],['Личные консультации и рекомендации','—']] },
                      optimal: { title: 'Pro', price: '60 000 ₽/мес', feats: [['Развертывание проекта на сервере','✓'],['Хостинг+SSL','✓'],['Отчёт посещаемости','✓'],['Часы работы','25 ч/мес'],['Создание резервных копий','2×/мес'],['Обновление зависимостей/библиотек','2×/мес'],['Реакция на инциденты','4 раб. часа'],['Приоритетная помощь в работе','✓'],['Личные консультации и рекомендации','✓']] }
                    }
                    const current = flat[active] || flat.optimal
                    return (
                      <>
                        <PlanTabs>
                          <PlanTabButton $active={active==='none'} onClick={(e)=>{ e.stopPropagation(); setMobilePlan('none') }}>Без подписки</PlanTabButton>
                          <PlanTabButton $active={active==='basic'} onClick={(e)=>{ e.stopPropagation(); setMobilePlan('basic'); setServicesTier('basic') }}>Basic<span className="sub">30 000 ₽/мес</span></PlanTabButton>
                          <PlanTabButton $active={active==='optimal'} onClick={(e)=>{ e.stopPropagation(); setMobilePlan('optimal'); setServicesTier('optimal') }}>Pro<span className="sub">60 000 ₽/мес</span></PlanTabButton>
                        </PlanTabs>
                        <PlanCard>
                          <PlanHeader><span className="title">{current.title}</span>{current.price && <span className="price">{current.price}</span>}</PlanHeader>
                          <FeatureList>{current.feats.map(([label,val]) => (<FeatureItem key={label}><span className="label">{label}</span><span className="value">{val==='✓'?<span className="ok">✓</span>:(val==='—'?<span className="dash">—</span>:val)}</span></FeatureItem>))}</FeatureList>
                        </PlanCard>
                        <StickyCTABar>
                          <div className="inner">
                            {active==='none' && (<PlanCTA $variant="white" type="button" onClick={(e)=>{ e.stopPropagation(); setSelectedSubscriptionLabel('Разовый проект'); const service=findServiceById(selectedServiceId); const baseDesc='Разовый проект (без подписки)'; const cat=categoryLabelByServiceId(selectedServiceId); setPrefill({step:'contact',description:`Выбор: ${baseDesc}\nУслуга: ${service?.title||'—'} (${cat||'—'})`,hideBack:true}); setIsProjectModalOpen(true); }}>Оставить заявку</PlanCTA>)}
                            {active==='basic' && (<PlanCTA type="button" onClick={(e)=>{ e.stopPropagation(); setSelectedSubscriptionLabel('Basic 30 000 ₽/мес'); const service=findServiceById(selectedServiceId); const baseDesc='Подписка Basic (30 000 ₽/мес)'; const cat=categoryLabelByServiceId(selectedServiceId); setPrefill({step:'contact',description:`Выбор: ${baseDesc}\nУслуга: ${service?.title||'—'} (${cat||'—'})`,hideBack:true}); setIsProjectModalOpen(true); }}>Оформить Basic</PlanCTA>)}
                            {active==='optimal' && (<PlanCTA $variant="contrast" type="button" onClick={(e)=>{ e.stopPropagation(); setSelectedSubscriptionLabel('Pro 60 000 ₽/мес'); const service=findServiceById(selectedServiceId); const baseDesc='Подписка Pro (60 000 ₽/мес)'; const cat=categoryLabelByServiceId(selectedServiceId); setPrefill({step:'contact',description:`Выбор: ${baseDesc}\nУслуга: ${service?.title||'—'} (${cat||'—'})`,hideBack:true}); setIsProjectModalOpen(true); }}>Оформить Pro</PlanCTA>)}
                            <div className="hint">Можно отменить в любой момент</div>
                          </div>
                        </StickyCTABar>
                      </>
                    )
                  })()}
                </MobilePlansWrap>
              </MobileOnly>
              <DesktopOnly>
                <ComparisonTable>
                  <table className="comp-table">
                    <thead>
                      <tr className="cta-row">
                        <th className="feat"></th>
                        <th><SelectButton className="select-cta" $variant="white" type="button" onClick={(e)=>{ e.stopPropagation(); setSelectedSubscriptionLabel('Разовый проект'); const service=findServiceById(selectedServiceId); const baseDesc='Разовый проект (без подписки)'; const cat=categoryLabelByServiceId(selectedServiceId); setPrefill({step:'contact',description:`Выбор: ${baseDesc}\nУслуга: ${service?.title||'—'} (${cat||'—'})`,hideBack:true}); setIsProjectModalOpen(true); }}><span className="btn-text">Выбрать</span></SelectButton></th>
                        <th><SelectButton className="select-cta" type="button" onClick={(e)=>{ e.stopPropagation(); setSelectedSubscriptionLabel('Basic 30 000 ₽/мес'); const service=findServiceById(selectedServiceId); const baseDesc='Подписка Basic (30 000 ₽/мес)'; const cat=categoryLabelByServiceId(selectedServiceId); setPrefill({step:'contact',description:`Выбор: ${baseDesc}\nУслуга: ${service?.title||'—'} (${cat||'—'})`,hideBack:true}); setIsProjectModalOpen(true); }}><span className="btn-text">Выбрать</span><span className="btn-subtext">30 000 ₽/мес</span></SelectButton></th>
                        <th><SelectButton className="select-cta" $variant="contrast" type="button" onClick={(e)=>{ e.stopPropagation(); setSelectedSubscriptionLabel('Pro 60 000 ₽/мес'); const service=findServiceById(selectedServiceId); const baseDesc='Подписка Pro (60 000 ₽/мес)'; const cat=categoryLabelByServiceId(selectedServiceId); setPrefill({step:'contact',description:`Выбор: ${baseDesc}\nУслуга: ${service?.title||'—'} (${cat||'—'})`,hideBack:true}); setIsProjectModalOpen(true); }}><span className="btn-text">Выбрать</span><span className="btn-subtext">60 000 ₽/мес</span></SelectButton></th>
                      </tr>
                      <tr className="header-row"><th className="feat">Преимущества</th><th><span className="plan-title">Без подписки</span></th><th><span className="plan-title">Basic</span></th><th><span className="plan-title">Pro</span></th></tr>
                    </thead>
                    <tbody>
                      {[
                        ['Развертывание проекта на сервере',['✓','✓','✓']],
                        ['Хостинг+SSL',['—','✓','✓']],
                        ['Отчёт посещаемости',['—','✓','✓']],
                        ['Часы работы (улучшения UX/UI, редактирования, изменения и т.д.)',['—','10','25']],
                        ['Создание резервных копий',['—','1 раз в месяц','2 раза в месяц']],
                        ['Обновление зависимостей/библиотек',['—','Раз в месяц','Два раза в месяц']],
                        ['Реакция на инциденты',['—','2 рабочих дня','4 рабочих часа']],
                        ['Приоритетная помощь в работе',['—','—','✓']],
                        ['Личные консультации и рекомендации',['—','—','✓']]
                      ].map(([feat,vals]) => (
                        <tr key={feat}>
                          <td className="feat">{feat}</td>
                          {vals.map((v,i)=>(<td key={i} className="val"><span className={v==='✓'?'check':(v==='—'?'dash':'check')}>{v}</span></td>))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </ComparisonTable>
              </DesktopOnly>
            </div>
          </SubscriptionSplit>
        </>
      )}
    </ServicesModalWrap>
  )
  } catch (err) {
    // Fallback minimal UI instead of crashing whole MenuPage
    console.error('ServicesContent render error', err)
    return (
      <div style={{padding:24,color:'#fff'}}>Ошибка загрузки контента услуг.</div>
    )
  }
}

export default ServicesContent
