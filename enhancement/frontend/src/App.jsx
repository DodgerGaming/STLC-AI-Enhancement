import { Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Enhancement App</h1>
      <p>React frontend is ready.</p>
      <Link to="/about">Go to About</Link>
    </div>
  )
}

function About() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>About</h1>
      <p>This is a fresh React setup for the enhancement project.</p>
      <Link to="/">Back Home</Link>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
    </Routes>
  )
}
