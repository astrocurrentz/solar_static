export const SITE_COPY = {
  brand: {
    name: 'SOLAR STATIC',
    shortMark: 'SS',
    studioVersion: 'CREATIVE_STUDIO // V.2026',
    ethosLabel: '////// SOLAR_STATIC_ETHOS:',
  },
  navItems: [
    { label: 'DESTINY', href: '#hero' },
    { label: 'KARMA', href: '#gallery' },
    { label: 'RITUALS', href: '#audio' },
    { label: 'CONNECT', href: '#contact' },
  ],
  artworks: [
    {
      id: 'fire_1',
      title: 'THE_APEX_ARC',
      description: 'Sever the noise. Lethal focus.',
      imageUrl: 'assets/images/fire_series-01.png',
      type: 'graphic',
      year: '2026',
    },
    {
      id: 'fire_2',
      title: 'THE_CORE_CRUCIBLE',
      description: 'Pain into fuel. Internal combustion.',
      imageUrl: 'assets/images/fire_series-02.png',
      type: 'motion',
      year: '2026',
    },
    {
      id: 'fire_3',
      title: 'PROTOCOL_WILDFILRE',
      description: 'Total release. Uncontained energy.',
      imageUrl: 'assets/images/fire_series-03.png',
      type: 'graphic',
      year: '2026',
    },
  ],
  landing: {
    loopingWords: [
      'MUSIC',
      'GRAPHICS',
      'SOFTWARE',
      'SOUND',
      'VISUAL',
      'APPS',
      'AUDIO',
      'ILLUSION',
      'WEB',
      'MEDIA',
      'DESIGN',
      'CODE',
      'SYSTEMS',
      'DIGITAL',
      'GENERATIVE',
      'SOLAR STATIC',
    ],
    selectedWorksLabel: 'SELECTED WORKS',
    transmitRequestLabel: 'TRANSMIT REQUEST',
    ethosParagraphs: [
      'As living beings in the universe, we constantly receive countless signals — light, radiation, sound, and invisible transmissions. What we see, hear, and feel are fragments of these signals, absorbed and interpreted through our own perception.',
      'As inhabitants orbiting the sun, we exist within a unique field of energy, noise, and static. Solar Static emerges from this condition. Our work captures, transforms, and reshapes these signals into creative forms — design, sound, visuals, and software.',
      'Through this process, the ordinary becomes something else. Familiar objects and everyday interactions are reimagined as playful encounters with the signals surrounding us — small moments of curiosity, discovery, and quiet reflection.',
      'Everything we create is a reflection of the signals we receive from the universe.',
    ],
  },
  titles: {
    notFound: '404 NOT FOUND',
    root: '// SOLAT STATIC // /',
    tools: 'TOOLS',
    textToImagePost: 'SOLAR STATIC // TEXT_TO_IMG_POST',
    selectedWorks: 'SOLAR STATIC // SELECTED WORKS',
    bazi: 'SOLAR STATIC // 八字·BĀZÌ',
    latent: 'SOLAR STATIC // LATENT 27',
    freewill: 'SOLAR STATIC // THE FREEWILL',
    request: 'SOLAR STATIC // TRANSMIT REQUEST',
    thanks: 'SOLAR STATIC // SIGNAL RECEIVED',
    initialDocument: 'SOLAR STATIC // CALCULATING DESTINY',
    external: 'External',
    baziExternal: 'BaZi External',
    baziPrivacy: 'BaZi Privacy Policy',
  },
  request: {
    endpoint: '/api/request',
    labels: {
      node: 'NODE // REQUEST',
      console: 'TRANSMISSION_CONSOLE',
      emailChannel: 'Email_Channel',
      emailSr: 'Email',
      emailPlaceholder: 'YOUR EMAIL',
      route: '[ route ] uplink://solar-static',
      mode: '[ mode ] human_input',
      requestBuffer: 'Request_Buffer',
      requestSr: 'Request',
      requestPlaceholder: 'TRANSMIT YOUR REQUEST',
      warning: '[ warning ]',
      input: '[ input ]',
      textStream: '[ text_stream ]',
      protocol: '[ protocol ] solar-static uplink / encrypted static / single dispatch',
      transmitting: 'TRANSMITTING',
      missing: 'DATA MISSING',
      retry: 'RETRY TRANSMISSION',
      dispatch: 'DISPATCH SIGNAL',
      stateWarning: 'warning',
      stateTransmitting: 'transmitting',
      stateRetry: 'retry_required',
      stateReady: 'ready',
    },
    validation: {
      emailRequired: 'EMAIL CHANNEL REQUIRED',
      emailInvalid: 'EMAIL CHANNEL FORMAT INVALID',
      messageRequired: 'REQUEST BUFFER EMPTY',
      submissionFailed: 'Request submission failed',
    },
    telemetry: {
      actions: ['build', 'route', 'trace', 'sync', 'cache', 'link', 'queue', 'emit', 'compile', 'index', 'relay', 'signal'],
      subjects: ['mesh', 'uplink', 'node', 'buffer', 'stack', 'graph', 'asset', 'signal', 'frame', 'kernel', 'vector', 'field'],
      states: ['warm', 'stable', 'active', 'ready', 'sealed', 'hot', 'open', 'mapped', 'latched', 'linked', 'queued', 'live'],
    },
  },
  thanks: {
    sentences: [
      'signal received.',
      'your request is now\nin the static.',
      'we will transmit\na return signal soon.',
    ],
  },
  tools: {
    textToImageEndpoint: '/api/tools/text-to-img-post/render',
    popupTitle: 'Save Images',
    popupPreparing: 'Preparing images…',
    popupHeading: 'Save To Photos',
    popupInstructions: 'Long press each image, then tap "Save to Photos" or "Add to Photos".',
    popupImageLabel: 'Image',
    encodeImageError: 'Unable to encode image.',
    tooLongTemplate: (pageCount) => `Text is too long for this tool. Maximum output is ${pageCount} pages including title.`,
    maxOutputTemplate: (pageCount) => `Max output: ${pageCount} pages total (includes title page).`,
  },
  navigation: {
    backHome: 'Back to Solar Static home',
    backTools: 'Back to tools',
  },
  audioVisualizer: {
    title: 'Audio Processor Unit',
    active: 'SYSTEM_ACTIVE',
    idle: 'SYSTEM_IDLE',
    description: 'Click visualizations to toggle audio simulation processing.',
    pause: 'PAUSE',
    initiate: 'INITIATE',
  },
  notFound: {
    heading: '404 NOT FOUND',
    browserTitle: '404 Not Found',
  },
  selectedWorks: {
    indexItems: [
      { label: 'BāZì', ariaLabel: 'Open BāZì project', route: '/selected-works/bazi' },
      { label: 'Latent 27', ariaLabel: 'Open Latent 27 project', route: '/selected-works/latent-27' },
      { label: 'FCMS', ariaLabel: 'Open FCMS project website', href: 'https://www.fuzzchorus.org/' },
      { label: 'The Freewill', ariaLabel: 'Open The Freewill project', route: '/freewill' },
    ],
    backShortLabel: 'SW',
    backToSelectedWorksLabel: 'Back to Selected Works',
    freewillAriaLabel: 'The Freewill infinite artwork grid',
    closeWipTemplate: (title) => `Close ${title} WIP popup`,
    wipAltTemplate: (title) => `${title} WIP`,
  },
  external: {
    backLabel: 'Back',
    externalLinksLabel: 'External links',
    baziLinksLabel: 'BaZi external links',
    languageButtonLabel: 'Switch language',
    loadingHans: '载入中…',
    loadingHant: '載入中…',
    loadFailedHans: '内容载入失败。',
    loadFailedHant: '內容載入失敗。',
    switchToHans: 'Switch to Simplified Chinese',
    switchToHant: 'Switch to Traditional Chinese',
    scriptHansButton: '简',
    scriptHantButton: '繁',
    links: {
      bazi: 'BaZi',
      privacy: 'Privacy Policy',
    },
    referencePages: [
      { slug: 'SMTH', titleHans: '三命通会', titleHant: '三命通會', contentHans: '/external/bazi/content/SMTH.cn.md', contentHant: '/external/bazi/content/SMTH.cnt.md' },
      { slug: 'YHZP', titleHans: '渊海子平', titleHant: '淵海子平', contentHans: '/external/bazi/content/YHZP.cn.md', contentHant: '/external/bazi/content/YHZP.cnt.md' },
      { slug: 'ZPZQ', titleHans: '子平真诠', titleHant: '子平真詮', contentHans: '/external/bazi/content/ZPZQ.cn.md', contentHant: '/external/bazi/content/ZPZQ.cnt.md' },
      { slug: 'WXJJ', titleHans: '五行精纪', titleHant: '五行精紀', contentHans: '/external/bazi/content/WXJJ.cn.md', contentHant: '/external/bazi/content/WXJJ.cnt.md' },
    ],
    privacyHtml: `
      <h2>🇨🇳 隐私政策（简体中文）</h2>
      <p>本应用无需注册账号。</p>
      <p>默认情况下，用户在应用中输入的数据（如出生信息、地点信息与保存的命盘记录）仅保存在本地设备中。</p>
      <p>如用户主动启用云端备份功能并使用 Sign in with Apple 登录，应用会将 Apple 提供的账号标识信息，以及用户选择备份的保存记录上传至 Supabase，用于跨设备备份与恢复。</p>
      <p>本应用不使用跟踪、分析或广告 SDK，也不会出售用户数据。</p>
      <p>如有任何问题，请联系： <a href="mailto:signal@solarstatic.xyz">signal@solarstatic.xyz</a></p>
      <hr />
      <h2>🇨🇳 隱私政策（繁體中文）</h2>
      <p>本應用無需註冊帳號。</p>
      <p>預設情況下，使用者在應用中輸入的資料（如出生資訊、地點資訊與儲存的命盤記錄）僅儲存在本地裝置中。</p>
      <p>若使用者主動啟用雲端備份功能並使用 Sign in with Apple 登入，應用會將 Apple 提供的帳號識別資訊，以及使用者選擇備份的儲存記錄上傳至 Supabase，用於跨裝置備份與還原。</p>
      <p>本應用不使用追蹤、分析或廣告 SDK，也不會出售使用者資料。</p>
      <p>如有任何問題，請聯絡： <a href="mailto:signal@solarstatic.xyz">signal@solarstatic.xyz</a></p>
      <hr />
      <h2>🇬🇧 Privacy Policy (English)</h2>
      <p>BaZi does not require user accounts.</p>
      <p>By default, data entered in the app, including birth information, location details, and saved chart records, stays on the user’s device.</p>
      <p>If the user chooses to enable Cloud Backup and signs in with Apple, the app sends Apple-provided account identifiers and the saved records selected for backup to Supabase so the user can restore them across devices.</p>
      <p>The app does not use tracking, analytics, or advertising SDKs, and we do not sell user data.</p>
      <p>If you have any questions, please contact: <a href="mailto:signal@solarstatic.xyz">signal@solarstatic.xyz</a></p>
    `,
  },
};
