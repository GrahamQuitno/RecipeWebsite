import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="Recipe Journal home">
          <span className="brand__mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="19" />
              <path d="M12 26c8-1 13-6 15-14-8 2-13 7-15 14Z" />
              <path d="M13 27c3-4 7-7 12-10" />
            </svg>
          </span>
          <span className="brand__copy">
            <span className="brand__name">Recipe Journal</span>
            <span className="brand__caption">A personal collection</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="site-nav">
          <Link className="site-nav__link" href="/">
            <span className="site-nav__dot" aria-hidden="true" />
            The recipes
          </Link>
        </nav>
      </div>
    </header>
  );
}
