const navItems = [
  { href: "#project", label: "项目" },
  { href: "#experience", label: "体验" },
  { href: "#roles", label: "边界" },
  { href: "#evaluation", label: "评测" },
  { href: "#about", label: "关于" },
];

export function PortfolioNav() {
  return (
    <nav aria-label="案例导航" className="portfolio-nav">
      <a className="portfolio-brand" href="#project">旅途</a>
      <div className="portfolio-nav-links">
        {navItems.map((item) => (
          <a href={item.href} key={item.href}>{item.label}</a>
        ))}
      </div>
    </nav>
  );
}
