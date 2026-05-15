function useTheme() {
  const [theme, setTheme] = React.useState("light");
  
  React.useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);
  
  return [theme, setTheme];
}

// Header Component
function Header() {
  return (
    <header style={{ padding: "20px", borderBottom: "2px solid #ccc" }}>
      <h1>Baltazar Dela Cruz</h1>
      <p>Frontend Developer & React Enthusiast</p>
    </header>
  );
}

// About Component with visit counter
function About() {
  const [visits, setVisits] = React.useState(0);
  
  return (
    <section style={{ padding: "20px" }}>
     <h2>About</h2>
        <p>
          I'm a passionate frontend developer with 5+ years of experience building 
          scalable web applications. I specialize in React, TypeScript, and modern 
          web technologies, with a keen eye for user experience and performance optimization.
        </p>
        <p>
          When I'm not coding, you'll find me contributing to open source projects, 
          mentoring junior developers, or exploring the latest in web development trends.
        </p>
      <p>Profile views: {visits}</p>
      <button onClick={() => setVisits(v => v + 1)}>
        👁️ View Profile
      </button>
    </section>
  );
}

// Projects Component with filtering
function Projects() {
  const [filter, setFilter] = React.useState("All");
  const [projects] = React.useState([
    { id: 1, name: "Portfolio Website", type: "React" },
    { id: 2, name: "Weather App", type: "React" },
    { id: 3, name: "Landing Page", type: "HTML" },
    { id: 4, name: "Task Tracker", type: "React" }
  ]);

  const visibleProjects = filter === "All"
    ? projects
    : projects.filter(p => p.type === filter);

  return (
    <section style={{ padding: "20px" }}>
      <h2>Projects ({visibleProjects.length})</h2>
      
      <div style={{ marginBottom: "15px" }}>
        <button onClick={() => setFilter("All")}>All</button>
        <button onClick={() => setFilter("React")}>React</button>
        <button onClick={() => setFilter("HTML")}>HTML</button>
      </div>
      
      <ul>
        {visibleProjects.map(project => (
          <li key={project.id}>
            <strong>{project.name}</strong> - {project.type}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Contact() {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const emailRef = React.useRef(null);

  return (
    <section style={{ padding: "20px" }}>
      <h2>Contact</h2>
      
      <button onClick={() => setOpen(!open)}>
        {open ? "Hide Form ✕" : "Show Form ✉️"}
      </button>
      
      {open && (
        <div style={{ marginTop: "15px" }}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ display: "block", marginBottom: "10px", padding: "8px" }}
          />
          
          <input
            ref={emailRef}
            placeholder="Your email"
            type="email"
            style={{ display: "block", marginBottom: "10px", padding: "8px" }}
          />
          
          <button onClick={() => emailRef.current.focus()}>
            Focus Email
          </button>
          
          <p>Hello, {name || "Guest"}!</p>
        </div>
      )}
    </section>
  );
}

// Main App Component
function App() {
  const [theme, setTheme] = useTheme();
  const [tab, setTab] = React.useState("About");

  const isDark = theme === "dark";

  return (
    <main style={{
      background: isDark ? "#1a1a1a" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
      minHeight: "100vh",
      transition: "all 0.3s"
    }}>
      {/* Theme Toggle */}
      <div style={{ padding: "10px", textAlign: "right" }}>
        <button onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>

      {/* Header */}
      <Header />

      {/* Tab Navigation */}
      <nav style={{
        padding: "15px",
        borderBottom: `2px solid ${isDark ? "#444" : "#ddd"}`
      }}>
        <button onClick={() => setTab("About")}>About</button>
        <button onClick={() => setTab("Projects")}>Projects</button>
        <button onClick={() => setTab("Contact")}>Contact</button>
      </nav>

      {/* Content Sections */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {tab === "About" && <About />}
        {tab === "Projects" && <Projects />}
        {tab === "Contact" && <Contact />}
      </div>

      {/* Footer */}
      <footer style={{
        padding: "20px",
        textAlign: "center",
        borderTop: `2px solid ${isDark ? "#444" : "#ddd"}`,
        marginTop: "40px"
      }}>
        <p>© 2024 Baltazar Dela Cruz. Built with React & Reacture 🚀</p>
      </footer>
    </main>
  );
}