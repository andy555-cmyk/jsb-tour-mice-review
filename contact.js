'use strict';
(() => {
  const english = document.documentElement.lang === 'en';
  const t = (ko, en) => english ? en : ko;
  const form = document.getElementById('inquiry-form');
  const result = document.getElementById('inquiry-result');
  const preview = document.getElementById('inquiry-preview');
  const status = document.getElementById('form-status');
  const product = document.getElementById('product');
  const emailLink = document.getElementById('email-inquiry');
  const sendButton = document.getElementById('send-inquiry');
  const consent = document.getElementById('delivery-consent');
  const deliveryState = document.getElementById('result-delivery-state');
  const ticketDeliveryState = document.getElementById('ticket-delivery-state');
  let preparedText = '';
  let sent = false;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateField = document.getElementById('date');
  dateField.min = today;
  // Product values stay Korean (stable IDs for JSB); English visitors see English names.
  const productNamesEn = {
    '울산·부산 블레저 힐링 투어':'Ulsan & Busan Bleisure Journey',
    '경상북도 역사·문화 투어':'Gyeongbuk Heritage Journey',
    '경상북도 드라마 촬영지 투어':'Gyeongbuk K-Drama Locations',
    '하모나이즈 투어':'Harmonize Journey'
  };
  const requestedProduct = new URLSearchParams(window.location.search).get('product');
  if (requestedProduct && requestedProduct.trim()) {
    const value = requestedProduct.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160);
    if (value) {
      if (!Array.from(product.options).some(option => option.value === value)) {
        product.add(new Option(english && productNamesEn[value] ? productNamesEn[value] : value, value));
      }
      product.value = value;
    }
  }
  const productPages = {
    '울산·부산 블레저 힐링 투어':'ulsan-busan',
    '경상북도 역사·문화 투어':'gyeongbuk-heritage',
    '경상북도 드라마 촬영지 투어':'gyeongbuk-drama',
    '하모나이즈 투어':'harmonize'
  };
  function updateProductContext() {
    const id = productPages[product.value];
    document.getElementById('inquiry-context').hidden = !id;
    if(id){
      document.getElementById('inquiry-context-label').textContent = t('선택한 여행: ', 'Selected journey: ') + product.options[product.selectedIndex].text;
      document.getElementById('return-to-product').href = 'travel/' + id + '.html';
    }
  }
  product.addEventListener('change', updateProductContext);
  updateProductContext();
  const messageField = document.getElementById('message');
  const questionStatus = document.getElementById('question-status');
  function updateCounter(){document.getElementById('message-counter').textContent = messageField.value.length.toLocaleString() + t(' / 5,000자', ' / 5,000 characters');}
  messageField.addEventListener('input', updateCounter);
  updateCounter();
  document.querySelectorAll('[data-question]').forEach(button => button.addEventListener('click', () => {
    const sentence = button.dataset.question;
    if(messageField.value.includes(sentence)){questionStatus.textContent=t('이미 추가한 항목입니다', 'This question is already included');return;}
    const next = messageField.value + (messageField.value.trim() ? '\n' : '') + sentence;
    if(next.length > messageField.maxLength){questionStatus.textContent=t('5,000자를 넘을 수 없습니다. 내용을 줄인 후 추가해 주세요', 'The message is limited to 5,000 characters. Please shorten it first');return;}
    messageField.value = next;
    messageField.dispatchEvent(new Event('input', {bubbles:true}));
    questionStatus.textContent=button.textContent + t(' 문의 문장을 추가했습니다. 필요에 맞게 수정해 주세요', ' added to your message. Edit it to suit your needs');
    messageField.focus();
  }));
  form.querySelector('[type="submit"]').disabled = false;
  function validate() {
    let firstInvalid = null;
    for (const id of ['name', 'email', 'date', 'people', 'message']) {
      const field = document.getElementById(id);
      let error = '';
      if (field.required && !field.value.trim()) error = t('필수 항목을 입력해 주세요', 'Please complete this required field');
      else if (id === 'email' && !field.validity.valid) error = t('이메일 주소를 확인해 주세요', 'Please check your email address');
      else if (id === 'date' && field.value && (field.value < today || !field.validity.valid)) error = t('오늘 이후 날짜를 선택해 주세요', 'Please choose today or a later date');
      else if (id === 'people' && !field.validity.valid) error = t('인원은 1명 이상 100,000명 이하의 정수로 적어 주세요', 'Enter a whole number between 1 and 100,000');
      document.getElementById(`${id}-error`).textContent = error;
      if (error) {
        field.setAttribute('aria-invalid', 'true');
        firstInvalid ||= field;
      } else field.removeAttribute('aria-invalid');
    }
    if (firstInvalid) {
      status.textContent = t('표시된 항목을 확인해 주세요. 문의는 전송되지 않았습니다', 'Please check the marked fields. Your inquiry has not been sent');
      firstInvalid.focus();
      return false;
    }
    return true;
  }
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!validate()) return;
    if (sent) {
      status.textContent = t('이미 전송 요청을 마쳤습니다. 내용을 바꾸면 새 문의를 작성할 수 있습니다', 'This inquiry was already submitted. Edit the details to prepare a new inquiry');
      return;
    }
    const values = new FormData(form);
    const value = key => String(values.get(key) || '').trim();
    const choice = product.options[product.selectedIndex]?.text || t('미정', 'To be discussed');
    preparedText = [
      t('[JSB TOUR & MICE 문의]', '[JSB TOUR & MICE Inquiry]'),
      `${t('이름', 'Name')}: ${value('name')}`,
      `${t('회사·단체', 'Company / Group')}: ${value('company') || t('미기재', 'Not provided')}`,
      `${t('연락 이메일', 'Email')}: ${value('email')}`,
      `${t('관심 상품·서비스', 'Interested in')}: ${value('product') ? choice : t('미정', 'To be discussed')}`,
      `${t('희망 출발일·행사일', 'Preferred travel / event date')}: ${value('date') || t('미정', 'To be discussed')}`,
      `${t('예상 인원', 'Estimated group size')}: ${value('people') ? value('people') + t('명', ' people') : t('미정', 'To be discussed')}`,
      '', t('문의 내용:', 'Message:'), value('message'),
    ].join('\n');
    preview.value = preparedText;
    const ticketValues = {name:value('name'),company:value('company')||t('미기재','Not provided'),date:value('date')||t('미정','To be discussed'),people:value('people')?value('people')+t('명',' people'):t('미정','To be discussed'),email:value('email'),product:value('product')?choice:t('여행·행사 상담','Travel / event inquiry'),message:value('message')};
    document.querySelectorAll('[data-ticket]').forEach(field=>{field.textContent=ticketValues[field.dataset.ticket]||'';});
    // Very long mailto links are not portable. The full memo always remains copyable.
    const mailFits = encodeURIComponent(preparedText).length <= 1800;
    const mailBody = mailFits ? preparedText : t('안녕하세요. JSB TOUR & MICE에 문의드립니다.\n\n[웹페이지에서 복사한 문의 내용을 여기에 붙여 넣어 주세요.]', 'Hello JSB TOUR & MICE,\n\n[Please paste the inquiry you copied from the website here.]');
    emailLink.href = 'mailto:jsbmaster@jsbtour.com?subject=' + encodeURIComponent(t('[홈페이지 문의] ', '[Website inquiry] ') + (value('product') ? choice : t('여행·행사 상담','Travel / event inquiry'))) + '&body=' + encodeURIComponent(mailBody);
    document.getElementById('email-help').textContent = mailFits
      ? t('메일 앱에서 수신 주소와 내용을 확인한 뒤 직접 보내 주세요. 버튼을 눌러도 자동 발송되지 않습니다', 'Check the address and message in your email app, then press Send. Nothing is sent automatically')
      : t('문의 내용이 길어 메일 앱에 자동으로 담지 않습니다. 먼저 내용을 복사하고, 메일 앱에서 붙여 넣은 뒤 직접 보내 주세요', 'Your message is too long to place into an email automatically. Copy it first, paste it into your email app, then send it yourself');
    result.hidden = false;
    sent = false;
    sendButton.disabled = false;
    sendButton.textContent = t('JSB로 문의 전송하기 ↗', 'Send inquiry to JSB ↗');
    deliveryState.textContent = t('아직 JSB에 전송되지 않았습니다', 'Your inquiry has not been sent to JSB');
    ticketDeliveryState.textContent = deliveryState.textContent;
    status.textContent = t('문의 내용을 정리했습니다. 실제 문의는 아직 전송되지 않았습니다', 'Your inquiry is ready. It has not been sent yet');
    document.getElementById('result-title').focus();
  });
  sendButton.addEventListener('click', async () => {
    if (!preparedText || result.hidden || sent || sendButton.disabled) return;
    if (!consent.checked) {
      status.textContent = t('정보 전달 동의를 확인해 주세요. 아직 전송되지 않았습니다', 'Please agree to the information transfer before sending. Nothing has been sent');
      consent.focus();
      return;
    }
    const values = new FormData(form);
    const field = key => String(values.get(key) || '').trim();
    // The email is read by JSB staff: Korean labels, empty fields left out, reply goes to the visitor.
    const topic = field('product') || '여행·행사 상담';
    const payload = new URLSearchParams();
    [['이름', field('name')], ['회사·단체', field('company')], ['연락 이메일', field('email')],
     ['관심 상품·서비스', field('product')], ['희망 날짜', field('date')],
     ['예상 인원', field('people') ? field('people') + '명' : ''], ['문의 내용', field('message')],
     ['작성 화면', english ? '영문 홈페이지' : '']]
      .forEach(([label, text]) => { if (text) payload.set(label, text); });
    payload.set('_replyto', field('email'));
    payload.set('_subject', '[JSB 홈페이지 문의] ' + topic + ' · ' + field('name') + (english ? ' (영문)' : ''));
    payload.set('_template', 'table');
    payload.set('_honey', form.querySelector('[name="_honey"]')?.value || '');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    sendButton.disabled = true;
    sendButton.textContent = t('전송 중…', 'Sending…');
    status.textContent = t('문의 전송을 요청하고 있습니다', 'Sending your inquiry');
    try {
      // FormSubmit alias for jsbmaster@jsbtour.com (activated 2026-09-29 for andy555-cmyk.github.io); keeps the inbox address out of the code.
      const response = await fetch('https://formsubmit.co/ajax/9ba6a8ee5fc295567910664e1297cf88', {
        method: 'POST', body: payload, signal: controller.signal, credentials: 'omit'
      });
      const data = await response.json();
      if (!response.ok || String(data.success).toLowerCase() !== 'true') throw new Error('Submission was not accepted');
      sent = true;
      sendButton.textContent = t('전송 요청 완료', 'Submission request accepted');
      deliveryState.textContent = t('전송 서비스가 문의를 받았습니다. JSB 메일 수신은 확인 중입니다', 'The delivery service accepted your inquiry. JSB email delivery is being verified');
      ticketDeliveryState.textContent = deliveryState.textContent;
      status.textContent = t('전송 요청이 처리되었습니다. JSB 메일 수신은 확인 중입니다. 급한 문의는 전화 또는 메일 앱으로도 연락해 주세요', 'Your submission request was accepted. JSB email delivery is being verified. For urgent inquiries, please call or email us directly');
    } catch {
      sendButton.disabled = false;
      sendButton.textContent = t('다시 전송하기 ↗', 'Try sending again ↗');
      status.textContent = t('전송을 확인하지 못했습니다. 아직 접수됐다고 볼 수 없습니다. 아래 메일 앱 버튼을 이용하거나 다시 시도해 주세요', 'We could not confirm submission. Please try again or use the email app link below');
    } finally {
      window.clearTimeout(timeout);
    }
  });
  form.addEventListener('input', () => {
    if (!result.hidden) {
      result.hidden = true;
      preparedText = '';
      sent = false;
      consent.checked = false;
      preview.value = '';
      document.querySelectorAll('[data-ticket]').forEach(field=>{field.textContent='';});
      emailLink.removeAttribute('href');
      status.textContent = t('내용이 바뀌었습니다. 문의 내용 확인하기를 다시 눌러 주세요', 'Your details changed. Please review the inquiry again');
    }
  });
  document.getElementById('print-inquiry').addEventListener('click',()=>{
    if(!preparedText||result.hidden)return;
    document.body.classList.add('ticket-print-mode');
    try{window.print();}finally{document.body.classList.remove('ticket-print-mode');}
  });
  document.getElementById('copy-inquiry').addEventListener('click', async () => {
    if (!preparedText) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(preparedText);
      status.textContent = sent ? t('문의 내용을 복사했습니다. 전송 요청 상태는 위에서 확인해 주세요', 'Inquiry copied. Check the submission status above') : t('문의 내용을 복사했습니다. 아직 전송되지 않았습니다', 'Inquiry copied. It has not been sent');
    } catch {
      preview.focus();
      preview.select();
      status.textContent = t('자동 복사를 사용할 수 없어 내용을 선택했습니다. 기기의 복사 기능으로 복사해 주세요', 'Automatic copying is unavailable. The text is selected for you to copy');
    }
  });
  document.getElementById('download-inquiry').addEventListener('click', () => {
    if (!preparedText) return;
    const blob = new Blob(['\uFEFF', preparedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `JSB-${english ? 'inquiry' : '문의메모'}-${today}.txt`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = sent ? t('메모 파일 내려받기를 시작했습니다. 전송 요청 상태는 위에서 확인해 주세요', 'Your note is downloading. Check the submission status above') : t('메모 파일 내려받기를 시작했습니다. 기기의 다운로드 목록을 확인해 주세요. 문의는 전송되지 않았습니다', 'Your note is downloading. The inquiry has not been sent');
  });
  emailLink.addEventListener('click', () => {
    status.textContent = t('메일 앱 열기를 요청했습니다. 앱이 열리지 않으면 내용을 복사해 jsbmaster@jsbtour.com으로 직접 보내 주세요. 자동으로 발송되지 않습니다', 'Your email app should open. If it does not, copy the inquiry and email jsbmaster@jsbtour.com directly. Nothing is sent automatically');
  });
  // This page has its own script so no shared demo submission handler can run.
  const burger = document.querySelector('.burger');
  const menu = document.getElementById('mm');
  const closeButton = menu.querySelector('.mobile-close');
  function closeMenu() {
    menu.classList.remove('open');
    menu.inert = true;
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    burger.focus();
  }
  burger.addEventListener('click', () => {
    menu.inert = false;
    menu.classList.add('open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    closeButton.focus();
  });
  closeButton.addEventListener('click', closeMenu);
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
    if (event.key !== 'Tab') return;
    const focusable = [...menu.querySelectorAll('a, button')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 1025px)').addEventListener('change', event => {
    if (event.matches && menu.classList.contains('open')) closeMenu();
  });
})();
