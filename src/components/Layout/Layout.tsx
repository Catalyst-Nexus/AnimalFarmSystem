import React from 'react'
import Sidebar from '../Sidebar/Sidebar'
import Header from '../Header/Header'
import './Layout.css'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <div className="layout-sidebar">
        <Sidebar />
      </div>
      <div className="layout-main">
        <Header />
        <div className="layout-content">{children}</div>
      </div>
    </div>
  )
}

export default Layout
