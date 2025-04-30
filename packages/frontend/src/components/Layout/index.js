import React from "react";
import { navigate } from "gatsby";
import styled from "@emotion/styled";
import { useAuth } from "../../context/AuthContext";
import GlobalStyles from "../../styles/GlobalStyles";

const Header = styled.header`
  background-color: white;
  border-bottom: 1px solid #ddd;
  padding: 1rem 0;
`;

const Nav = styled.nav`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.h1`
  margin: 0;
  font-size: 1.5rem;
  color: #0070f3;
  cursor: pointer;
`;

const NavLinks = styled.div`
  display: flex;
  gap: 2rem;
  align-items: center;
`;

const NavLink = styled.button`
  background: none;
  border: none;
  padding: 0;
  font: inherit;
  color: #333;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: #0070f3;
  }
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  padding: 0.5rem;
  font: inherit;
  color: #333;
  cursor: pointer;

  img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-width: 200px;
  z-index: 1000;

  button {
    display: block;
    width: 100%;
    padding: 0.75rem 1rem;
    text-align: left;
    background: none;
    border: none;
    font: inherit;
    color: #333;
    cursor: pointer;

    &:hover {
      background-color: #f8f9fa;
    }
  }
`;

const Main = styled.main`
  min-height: calc(100vh - 73px); // Account for header height
  background-color: #f8f9fa;
`;

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = React.useState(false);

  const handleDashboardClick = () => {
    const route =
      user.role === "client" ? "/dashboard/client" : "/dashboard/provider";
    navigate(route);
  };

  return (
    <>
      <GlobalStyles />
      <Header>
        <Nav>
          <Logo onClick={() => navigate("/")}>TechFreelance</Logo>
          <NavLinks>
            {user ? (
              <>
                <NavLink onClick={handleDashboardClick}>Dashboard</NavLink>
                <UserMenu>
                  <UserButton onClick={() => setShowDropdown(!showDropdown)}>
                    <img
                      src={
                        user.profileImage || "https://via.placeholder.com/32"
                      }
                      alt={user.username}
                    />
                    {user.username}
                  </UserButton>
                  {showDropdown && (
                    <Dropdown>
                      <button onClick={() => navigate("/profile")}>
                        Profile
                      </button>
                      <button onClick={logout}>Logout</button>
                    </Dropdown>
                  )}
                </UserMenu>
              </>
            ) : (
              <>
                <NavLink onClick={() => navigate("/login")}>Login</NavLink>
                <NavLink onClick={() => navigate("/register")}>
                  Register
                </NavLink>
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
