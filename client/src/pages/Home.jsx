/**
 * Index page: explains the MegaInfomatix concept in plain language.
 * Content lives in the arrays below, so wording can be changed without touching the layout.
 */
import Icon from '../components/Icon';
import '../styles/home.css';

const FLOW = [
  { icon: 'users', title: 'Creators', text: 'Upload their digital products and set a price.' },
  { icon: 'globe', title: 'MegaInfomatix', text: 'Hosts the products, takes the payment and delivers the files.', highlight: true },
  { icon: 'bag', title: 'Buyers', text: 'Find a product, pay once and download it instantly.' },
];

const STEPS = [
  { icon: 'upload', title: 'Upload', text: 'Add your digital product: a file, a course, a template or a tool.' },
  { icon: 'tag', title: 'Publish', text: 'Give it a name, a description and a price. Your product page is ready.' },
  { icon: 'wallet', title: 'Get paid', text: 'Buyers pay online and get instant access. You receive your earnings.' },
];

const CATEGORIES = [
  { icon: 'book', label: 'E-books & guides' },
  { icon: 'video', label: 'Online courses' },
  { icon: 'layout', label: 'Templates' },
  { icon: 'code', label: 'Software & plugins' },
  { icon: 'image', label: 'Graphics & design' },
  { icon: 'music', label: 'Audio & music' },
  { icon: 'file', label: 'Documents & reports' },
  { icon: 'chart', label: 'Data & tools' },
];

const ROADMAP = [
  {
    phase: 'Phase 1',
    status: 'Now',
    title: 'Our own products',
    text: 'We launch MegaInfomatix with our own digital products and build a store people trust.',
    current: true,
  },
  {
    phase: 'Phase 2',
    status: 'Next',
    title: 'Open to creators',
    text: 'Anyone can create an account, host their products and start selling on the platform.',
  },
  {
    phase: 'Phase 3',
    status: 'Future',
    title: 'Full marketplace',
    text: 'A complete marketplace with creator stores, reviews, sales insights and automatic payouts.',
  },
];

const BENEFITS = [
  { icon: 'zap', title: 'Simple', text: 'No website or technical skills needed. Upload, set a price, done.' },
  { icon: 'shield', title: 'Secure', text: 'Safe online payments and protected downloads for every purchase.' },
  { icon: 'globe', title: 'One place', text: 'Hosting, selling and delivery all happen on one platform.' },
  { icon: 'chart', title: 'Insights', text: 'Clear numbers on views and sales to help products grow.' },
];

function SectionHeader({ id, eyebrow, title, text }) {
  return (
    <header className="section__header">
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {text && <p className="section__lead">{text}</p>}
    </header>
  );
}

export default function Home() {
  return (
    <div className="home">
      {/* Hero */}
      <section className="hero" aria-labelledby="hero-title">
        <p className="hero__badge">Digital product marketplace · Launching soon</p>
        <h1 id="hero-title">
          One place to <span className="hero__accent">host and sell</span> digital products
        </h1>
        <p className="hero__lead">
          MegaInfomatix is an online platform where digital products are hosted, sold and delivered. We are starting
          with our own products, and soon anyone will be able to sell theirs here too.
        </p>
        <div className="hero__actions">
          <a href="#concept" className="button button--lg">
            See how it works <Icon name="arrow" size={18} />
          </a>
          <a href="#roadmap" className="button button--ghost button--lg">
            Our roadmap
          </a>
        </div>
      </section>

      {/* Concept */}
      <section id="concept" className="section" aria-labelledby="concept-title">
        <SectionHeader
          id="concept-title"
          eyebrow="The idea"
          title="What is MegaInfomatix?"
          text="Think of it as a shop for digital products. Creators bring the products, buyers bring the demand, and MegaInfomatix connects them and takes care of everything in between."
        />
        <ol className="flow">
          {FLOW.map((item) => (
            <li key={item.title} className={`flow__item${item.highlight ? ' flow__item--highlight' : ''}`}>
              <span className="flow__icon">
                <Icon name={item.icon} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* How it works */}
      <section id="how" className="section" aria-labelledby="how-title">
        <SectionHeader id="how-title" eyebrow="How it works" title="Selling takes three steps" />
        <ol className="steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="card step">
              <span className="step__number">{index + 1}</span>
              <span className="step__icon">
                <Icon name={step.icon} />
              </span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Categories */}
      <section id="products" className="section" aria-labelledby="products-title">
        <SectionHeader
          id="products-title"
          eyebrow="What you can sell"
          title="Any product that can be downloaded or accessed online"
        />
        <ul className="categories">
          {CATEGORIES.map((category) => (
            <li key={category.label} className="category">
              <Icon name={category.icon} />
              <span>{category.label}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="section" aria-labelledby="roadmap-title">
        <SectionHeader
          id="roadmap-title"
          eyebrow="Roadmap"
          title="Starting small, growing into a marketplace"
          text="We grow MegaInfomatix step by step, so every stage is solid before the next one opens."
        />
        <ol className="roadmap">
          {ROADMAP.map((item) => (
            <li key={item.phase} className={`card roadmap__item${item.current ? ' roadmap__item--current' : ''}`}>
              <div className="roadmap__meta">
                <span>{item.phase}</span>
                <span className="badge">{item.status}</span>
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Benefits */}
      <section id="why" className="section" aria-labelledby="why-title">
        <SectionHeader id="why-title" eyebrow="Why MegaInfomatix" title="Built to make selling digital products easy" />
        <ul className="benefits">
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className="benefit">
              <span className="benefit__icon">
                <Icon name={benefit.icon} />
              </span>
              <div>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Closing */}
      <section className="cta" aria-labelledby="cta-title">
        <h2 id="cta-title">The marketplace is on its way</h2>
        <p>
          Our first products launch soon. Opening the platform to creators is the next step. Thank you for being here
          early.
        </p>
      </section>
    </div>
  );
}
