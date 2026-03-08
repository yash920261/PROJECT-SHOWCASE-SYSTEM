import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <h3>Innovation Platform</h3>
          <p>Empowering student projects through academic collaboration.</p>
        </div>
        <div className="footer-links">
          <p>© {new Date().getFullYear()} College Innovation Platform.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
