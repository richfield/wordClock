import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.scss';
import Login from './Login/Login';
import Settings from './Settings/Settings';
import { CookiesProvider } from 'react-cookie';
import {
  createBrowserRouter,
  RouterProvider } from 'react-router-dom';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { UserLabel } from './UserLabel/UserLabel';

const routes = [
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/settings',
    element: <Settings />,
  }
];
const router = createBrowserRouter( routes );

ReactDOM.createRoot( document.getElementById( 'root' ) as HTMLElement ).render(
  <React.StrictMode >
  <CookiesProvider>
    {document.location.pathname !== '/' &&
      <Navbar fixed="top" bg="dark" variant="dark">
        <Container>
          <Navbar.Brand href="/">KlokMenu</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="/settings">Instellingen</Nav.Link>
          </Nav>
          <UserLabel />
        </Container>
      </Navbar>
    }
    <RouterProvider router={router} />
  </CookiesProvider>
  </React.StrictMode >
);