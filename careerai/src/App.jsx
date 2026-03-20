import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar.jsx'
import Bienvenida from './pages/Bienvenida.jsx'
import Home from './pages/Home.jsx'
import CrearCV from './pages/CrearCV.jsx'
import SubirCV from './pages/SubirCV.jsx'
import Entrevista from './pages/Entrevista.jsx'
import Chat from './pages/Chat.jsx'
import Tips from './pages/Tips.jsx'
import Admin from './pages/Admin.jsx'
import Plantillas from './pages/Plantillas.jsx'

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Bienvenida />} />
      <Route path="/inicio" element={<Layout><Home /></Layout>} />
      <Route path="/crear-cv" element={<Layout><CrearCV /></Layout>} />
      <Route path="/subir-cv" element={<Layout><SubirCV /></Layout>} />
      <Route path="/entrevista" element={<Layout><Entrevista /></Layout>} />
      <Route path="/chat" element={<Layout><Chat /></Layout>} />
      <Route path="/tips" element={<Layout><Tips /></Layout>} />
      <Route path="/admin" element={<Layout><Admin /></Layout>} />
      <Route path="/plantillas" element={<Layout><Plantillas /></Layout>} />
    </Routes>
  )
}