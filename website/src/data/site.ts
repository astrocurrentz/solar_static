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
    coreLine: string;
  };
  about: {
    heading: string;
    paragraphs: string[];
    highlight: {
      title: string;
      body: string;
    };
  };
  work: SimplePageContent;
  audience: {
    heading: string;
    intro: string;
    items: string[];
  };
  capabilities: {
    heading: string;
    items: Capability[];
  };
  reasons: {
    heading: string;
    items: Reason[];
  };
  not: {
    heading: string;
    body: string;
  };
  closing: {
    title: string;
    body: string;
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
          secondaryCtaHref: '/contact/',
          footerMetadata: [
            'INDEPENDENT CREATIVE PRODUCT STUDIO',
            'VANCOUVER, CANADA',
          ],
        },
      },
      document: {
        title: 'Solar Static Studio',
        subtitle: 'Who we serve, what we create, and why the studio exists',
        coreLine: 'From Idea to Digital Reality.',
      },
      about: {
        heading: 'About the Studio',
        paragraphs: [
          'Solar Static Studio is an independent creative product studio that transforms selected ideas into distinctive visual identities and fully realized digital products.',
          'We work across strategy, identity, design, and technical execution. The goal is not to sell disconnected deliverables. It is to give a strong idea one coherent direction and carry it through to a clear, launch-ready result.',
        ],
        highlight: {
          title: 'Industry-flexible. Project-selective.',
          body: 'We are defined by the quality of the idea and the value of the outcome, not by a single industry.',
        },
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
      audience: {
        heading: 'Who We Serve',
        intro:
          'We work best with founders, organizations, artists, and creative businesses that:',
        items: [
          'Have a meaningful idea but need help defining and realizing it.',
          'Value distinctive visual direction rather than generic templates.',
          'Need branding, design, and digital execution to work as one system.',
          'Want one accountable studio to move the project from early concept to launch.',
          'Have a clear decision-maker, a realistic budget, and commitment to the work.',
        ],
      },
      capabilities: {
        heading: 'What We Create',
        items: [
          {
            title: 'Visual Identity',
            body: 'Brand direction, identity systems, visual language, and the assets required to make an idea recognizable and consistent.',
          },
          {
            title: 'Websites & Digital Experiences',
            body: 'Website strategy, interface design, development, deployment, and selected interactive experiences.',
          },
          {
            title: 'Selected Digital Products',
            body: 'Product clarification, UI/UX, selected mobile MVP development, testing, and launch support for clearly scoped ideas.',
          },
          {
            title: 'Editorial & Publication Design',
            body: 'Books, magazines, educational materials, cultural publications, and other branded editorial systems.',
          },
        ],
      },
      reasons: {
        heading: 'Why SSS',
        items: [
          {
            title: 'One consistent direction',
            body: 'strategy, visual identity, design, and implementation are developed as one connected system.',
          },
          {
            title: 'Direct collaboration',
            body: 'clients work with the person responsible for the actual thinking, design, and delivery.',
          },
          {
            title: 'From ambiguity to launch',
            body: 'we help clarify the idea before producing the final form.',
          },
          {
            title: 'Built for the project',
            body: 'the solution is selected around the real objective, rather than forced into a preset template.',
          },
          {
            title: 'Creative and technical depth',
            body: 'visual judgment is combined with practical product and development capability.',
          },
        ],
      },
      not: {
        heading: 'What We Are Not',
        body: 'Solar Static Studio is not a low-cost template provider, a general-purpose agency that accepts every kind of work, or an enterprise software contractor. We select projects where the objective, scope, decision-making, and standard of work can be clearly established.',
      },
      closing: {
        title: 'Bring us the idea.',
        body: 'We will help define what it should become, how it should look, and how it can exist in the digital world.',
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
        subtitle: '我们服务谁、创造什么，以及工作室为何存在',
        coreLine: '从创意到数字现实',
      },
      about: {
        heading: '关于工作室',
        paragraphs: [
          'Solar Static Studio 是一家独立创意产品工作室，负责将经过选择的创意，转化为具有辨识度的视觉系统与真正完成落地的数字产品。',
          '我们的工作横跨策略梳理、品牌识别、视觉设计与技术实现。我们并不出售彼此割裂的单项成果，而是为一个有价值的创意建立统一方向，并将它推进到清晰、完整、可以正式上线的状态。',
        ],
        highlight: {
          title: '行业开放，项目精选。',
          body: '我们不被单一行业定义，而以创意质量、合作适配度与最终成果的价值来选择项目。',
        },
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
      audience: {
        heading: '我们服务谁',
        intro: '我们最适合与以下创始人、机构、艺术家及创意型企业合作：',
        items: [
          '已经拥有有意义的创意，但需要进一步梳理、定义和落地。',
          '重视独特的视觉方向，不希望采用缺乏个性的通用模板。',
          '需要品牌、设计与数字实现共同形成一个完整系统。',
          '希望由一个负责到底的工作室，将项目从早期概念推进至正式上线。',
          '拥有明确的决策人、合理预算，并愿意认真投入项目。',
        ],
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
        heading: '为什么选择 SSS',
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
            title: '从模糊到上线',
            body: '我们先帮助客户把创意梳理清楚，再决定最终应当采用的形式。',
          },
          {
            title: '根据项目定制',
            body: '解决方案围绕真实目标建立，而不是强行套用固定套餐或模板。',
          },
          {
            title: '兼具创意与技术',
            body: '视觉判断、产品思维和实际开发能力被结合在同一个工作流程中。',
          },
        ],
      },
      not: {
        heading: '我们不是什么',
        body: 'Solar Static Studio 不是低价模板供应商，不是什么项目都接的综合型代理公司，也不是承接大型企业级软件工程的技术外包商。我们只选择目标、范围、决策方式与质量标准能够被清晰建立的项目。',
      },
      closing: {
        title: '把创意带给我们。',
        body: '我们将帮助你明确它应当成为什么、应当呈现怎样的视觉，以及应当如何真正存在于数字世界中。',
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
