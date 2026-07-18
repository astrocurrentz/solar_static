export type Locale = 'en' | 'zh';

export type PageMeta = {
  title: string;
  description: string;
};

export type Capability = {
  title: string;
  body: string;
};

export type Reason = {
  title: string;
  body: string;
};

export type NavigationItem = {
  label: string;
  href: string;
};

export type ErrorPageContent = {
  code: number;
  status: string;
  meta: PageMeta;
};

export type HomeHeroContent = {
  headline: string;
  supportingCopy: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  footerMetadata: string[];
};

export type SimplePageContent = {
  meta: PageMeta;
  heading: string;
  body: string;
};

export type LocaleContent = {
  htmlLang: string;
  dir: 'ltr';
  path: string;
  navigationLabel: string;
  primaryNavigation: NavigationItem[];
  loadingLabel: string;
  loadingPreview: {
    title: string;
    meta: PageMeta;
  };
  meta: PageMeta;
  home: {
    meta: PageMeta;
    hero: HomeHeroContent;
  };
  document: {
    title: string;
    subtitle: string;
  };
  about: {
    heading: string;
    paragraphs: string[];
  };
  work: SimplePageContent;
  capabilities: {
    heading: string;
    items: Capability[];
  };
  reasons: {
    heading: string;
    items: Reason[];
  };
  closing: {
    title: string;
    body: string;
    label: string;
    href: string;
  };
  contact: {
    meta: PageMeta;
    heading: string;
    body: string;
    label: string;
  };
};

const email = 'signal@solarstatic.xyz';
const publicLocales = ['en'] as const satisfies readonly Locale[];

export const errorPages = {
  notFound: {
    code: 404,
    status: 'Not Found',
    meta: {
      title: '404 - Not Found',
      description: 'The requested Solar Static Studio page could not be found.',
    },
  },
  serverError: {
    code: 500,
    status: 'Internal Server Error',
    meta: {
      title: '500 - Internal Server Error',
      description:
        'Solar Static Studio is temporarily unable to load this page.',
    },
  },
} satisfies Record<string, ErrorPageContent>;

export const site = {
  name: 'Solar Static Studio',
  category: 'Independent Creative Product Studio',
  url: 'https://solarstatic.xyz',
  contactEmail: email,
  favicon: '/favicon.svg',
  ogImage: '/og-image.jpg',
  publicLocales,
  locales: {
    en: {
      htmlLang: 'en',
      dir: 'ltr',
      path: '/',
      navigationLabel: 'Primary navigation',
      primaryNavigation: [
        {
          label: 'Work',
          href: '/work/',
        },
        {
          label: 'About',
          href: '/about/',
        },
        {
          label: 'Contact',
          href: '/contact/',
        },
      ],
      loadingLabel: 'Loading Solar Static Studio',
      loadingPreview: {
        title: 'Loading animation preview',
        meta: {
          title: 'Solar Static Studio - Loading Preview',
          description:
            'A preview page for the Solar Static Studio brand loading animation.',
        },
      },
      meta: {
        title: 'Solar Static Studio - About',
        description:
          'Solar Static Studio is an independent creative product studio that transforms selected ideas into distinctive visual identities and fully realized digital products.',
      },
      home: {
        meta: {
          title: 'Solar Static - Creative Product Studio',
          description:
            'Solar Static Studio transforms selected ideas into distinctive visual identities, digital experiences, and launch-ready products.',
        },
        hero: {
          headline: 'From Idea to Digital Reality',
          supportingCopy:
            'We transform selected ideas into distinctive visual identities, digital experiences, and launch-ready products.',
          primaryCtaLabel: 'View Our Work',
          primaryCtaHref: '/work/',
          secondaryCtaLabel: 'Start a Project',
          secondaryCtaHref: '/start-a-project/',
          footerMetadata: [
            'INDEPENDENT CREATIVE PRODUCT STUDIO',
            'VANCOUVER, CANADA',
          ],
        },
      },
      document: {
        title: 'Solar Static Studio',
        subtitle:
          'An independent creative product studio turning selected ideas into distinctive visual identities and fully realized digital products.',
      },
      about: {
        heading: 'About the Studio',
        paragraphs: [
          'We work with founders, organizations, artists, and creative businesses that need one clear path from an early idea to a launch-ready outcome.',
          'Strategy, identity, design, and technical execution are developed as one connected system—not as disconnected deliverables.',
        ],
      },
      work: {
        meta: {
          title: 'Work - Solar Static Studio',
          description:
            'Selected Solar Static Studio work and case studies are coming soon.',
        },
        heading: 'Work',
        body: 'Selected work and case studies are coming soon.',
      },
      capabilities: {
        heading: 'What We Create',
        items: [
          {
            title: 'Visual Identity',
            body: 'Brand direction, identity systems, and visual languages built to make an idea recognizable and consistent.',
          },
          {
            title: 'Websites & Digital Experiences',
            body: 'Strategy, interface design, development, and deployment shaped around a clear objective.',
          },
          {
            title: 'Selected Digital Products',
            body: 'Product clarification, UI/UX, and carefully scoped MVP development for selected ideas.',
          },
          {
            title: 'Editorial & Publication Design',
            body: 'Books, publications, learning materials, and branded editorial systems.',
          },
        ],
      },
      reasons: {
        heading: 'Why Solar Static',
        items: [
          {
            title: 'One consistent direction',
            body: 'Strategy, design, and implementation work as one connected system.',
          },
          {
            title: 'Direct collaboration',
            body: 'Clients work directly with the person responsible for the thinking, design, and delivery.',
          },
          {
            title: 'Creative and technical depth',
            body: 'Distinctive visual judgment is combined with practical product and development capability.',
          },
        ],
      },
      closing: {
        title: 'Bring us the idea.',
        body: 'We will help define what it should become and build the right form for it.',
        label: 'Start a Project',
        href: '/start-a-project/',
      },
      contact: {
        meta: {
          title: 'Contact - Solar Static Studio',
          description:
            'Contact Solar Static Studio for selected ideas, collaborations, and digital product work.',
        },
        heading: 'Contact',
        body: 'For selected ideas, collaborations, and digital product work, write to us directly.',
        label: 'Email',
      },
    },
    zh: {
      htmlLang: 'zh-CN',
      dir: 'ltr',
      path: '/cn/',
      navigationLabel: '主导航',
      primaryNavigation: [
        {
          label: 'Work',
          href: '/work/',
        },
        {
          label: 'About',
          href: '/about/',
        },
        {
          label: 'Contact',
          href: '/contact/',
        },
      ],
      loadingLabel: '正在加载 Solar Static Studio',
      loadingPreview: {
        title: '加载动画预览',
        meta: {
          title: 'Solar Static Studio - 加载预览',
          description: 'Solar Static Studio 品牌加载动画预览页面。',
        },
      },
      meta: {
        title: 'Solar Static Studio - 公司简介',
        description:
          'Solar Static Studio 是一家独立创意产品工作室，负责将经过选择的创意转化为具有辨识度的视觉系统与真正完成落地的数字产品。',
      },
      home: {
        meta: {
          title: 'Solar Static - Creative Product Studio',
          description:
            'Solar Static Studio transforms selected ideas into distinctive visual identities, digital experiences, and launch-ready products.',
        },
        hero: {
          headline: 'From Idea to Digital Reality',
          supportingCopy:
            'We transform selected ideas into distinctive visual identities, digital experiences, and launch-ready products.',
          primaryCtaLabel: 'View Our Work',
          primaryCtaHref: '/work/',
          secondaryCtaLabel: 'Start a Project',
          secondaryCtaHref: '/contact/',
          footerMetadata: [
            'INDEPENDENT CREATIVE PRODUCT STUDIO',
            'VANCOUVER, CANADA',
          ],
        },
      },
      document: {
        title: 'Solar Static Studio',
        subtitle:
          '一家独立创意产品工作室，将精选创意转化为具有辨识度的视觉识别与完整落地的数字产品。',
      },
      about: {
        heading: '关于工作室',
        paragraphs: [
          '我们与需要从早期创意走向可发布成果的创始人、机构、艺术家和创意企业合作，为项目建立一条清晰路径。',
          '策略、品牌识别、设计与技术实现被作为一个相互连接的系统共同开发，而非彼此割裂的交付物。',
        ],
      },
      work: {
        meta: {
          title: 'Work - Solar Static Studio',
          description:
            'Selected Solar Static Studio work and case studies are coming soon.',
        },
        heading: 'Work',
        body: 'Selected work and case studies are coming soon.',
      },
      capabilities: {
        heading: '我们提供什么',
        items: [
          {
            title: '视觉识别系统',
            body: '品牌方向、品牌识别、视觉语言，以及让创意形成统一辨识度所需的应用资产。',
          },
          {
            title: '网站与数字体验',
            body: '网站策略、界面设计、开发、部署，以及经过选择的互动数字体验。',
          },
          {
            title: '精选数字产品',
            body: '产品梳理、用户体验与界面设计、范围明确的移动端最小可行产品开发、测试与上线支持。',
          },
          {
            title: '编辑与出版设计',
            body: '书籍、杂志、教育材料、文化出版物，以及其他具有品牌一致性的编辑系统。',
          },
        ],
      },
      reasons: {
        heading: '为什么选择 Solar Static',
        items: [
          {
            title: '统一的创意方向',
            body: '策略、视觉识别、设计和实现并非分别完成，而是共同构成一个系统。',
          },
          {
            title: '直接合作',
            body: '客户直接与真正负责思考、设计和交付的人沟通。',
          },
          {
            title: '兼具创意与技术',
            body: '鲜明的视觉判断与实际的产品和开发能力相结合。',
          },
        ],
      },
      closing: {
        title: '把创意带给我们。',
        body: '我们将帮助你明确它应该成为什么，并为它构建正确的形式。',
        label: '开始项目',
        href: '/start-a-project/',
      },
      contact: {
        meta: {
          title: 'Contact - Solar Static Studio',
          description:
            'Contact Solar Static Studio for selected ideas, collaborations, and digital product work.',
        },
        heading: '联系',
        body: '如果你正在推进一个经过认真选择的创意、合作或数字产品项目，可以直接写信给我们。',
        label: '邮箱',
      },
    },
  },
} satisfies {
  name: string;
  category: string;
  url: string;
  contactEmail: string;
  favicon: string;
  ogImage: string;
  publicLocales: readonly Locale[];
  locales: Record<Locale, LocaleContent>;
};

export function getLocaleContent(locale: Locale): LocaleContent {
  return site.locales[locale];
}
