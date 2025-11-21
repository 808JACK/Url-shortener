import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <>
      <header>
        <div className="container">
          <Link to="/" style={{ textDecoration: 'none', color: 'white' }}>
            <h1>🔗 TinyLink</h1>
          </Link>
        </div>
      </header>
      <main className="container">
        {children}
      </main>
    </>
  );
}

export default Layout;
