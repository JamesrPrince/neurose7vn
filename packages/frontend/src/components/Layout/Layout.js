import React from "react";
import { Link, navigate } from "gatsby";
import styled from "@emotion/styled";
import { useAuth } from "../../context/AuthContext";
import GlobalStyles from "../../styles/GlobalStyles";

const Header = styled.header`
  background-color: white;
  border-bottom: 1px solid #eaeaea;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #0070f3;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled(Link)`
  color: #666;
  text-decoration: none;
  transition: color 0.2s;

  &:hover {
    color: #0070f3;
    text-decoration: none;
  }

  &.active {
    color: #0070f3;
  }
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;

  ${(props) =>
    props.primary
      ? `
    background-color: #0070f3;
    color: white;
    border: none;

    &:hover {
      background-color: #0051cc;
    }
  `
      : `
    background-color: transparent;
    color: #666;
    border: 1px solid #eaeaea;

    &:hover {
      border-color: #0070f3;
      color: #0070f3;
    }
  `}
`;

const Main = styled.main`
  max-width: 1200px;
  margin: 72px auto 0; /* Account for fixed header */
  padding: 2rem;
  min-height: calc(100vh - 72px);
`;

const UserMenu = styled.div`
  position: relative;
  display: inline-block;
`;

const UserButton = styled(Button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const UserMenuDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;

  button {
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #f8f9fa;
      color: #0070f3;
    }
  }

  hr {
    margin: 0.5rem 0;
    border: none;
    border-top: 1px solid #eaeaea;
  }
`;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <>
      <GlobalStyles />
      <Header>
        <Nav>
          <Logo to="/">TechFreelance</Logo>
          <NavLinks>
            {user ? (
              <>
                <NavLink to="/projects" activeClassName="active">
                  Browse Projects
                </NavLink>
                {user.role === "client" ? (
                  <NavLink to="/dashboard/client" activeClassName="active">
                    My Dashboard
                  </NavLink>
                ) : (
                  <NavLink to="/dashboard/provider" activeClassName="active">
                    My Dashboard
                  </NavLink>
                )}
                <UserMenu>
                  <UserButton onClick={() => setMenuOpen(!menuOpen)}>
                    {user.firstName || user.username}
                    <span>▼</span>
                  </UserButton>
                  {menuOpen && (
                    <UserMenuDropdown>
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          navigate("/profile");
                        }}
                      >
                        Profile Settings
                      </button>
                      {user.role === "client" && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            navigate("/projects/new");
                          }}
                        >
                          Post New Project
                        </button>
                      )}
                      <hr />
                      <button onClick={handleLogout}>Log Out</button>
                    </UserMenuDropdown>
                  )}
                </UserMenu>
              </>
            ) : (
              <>
                <NavLink to="/projects" activeClassName="active">
                  Browse Projects
                </NavLink>
                <Button onClick={() => navigate("/login")}>Log In</Button>
                <Button primary onClick={() => navigate("/register")}>
                  Sign Up
                </Button>
              </>
            )}
          </NavLinks>
        </Nav>
      </Header>
      <Main>{children}</Main>
    </>
  );
};

export default Layout;
